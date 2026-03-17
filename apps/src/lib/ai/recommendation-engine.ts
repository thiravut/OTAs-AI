import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { bahtToSatang, satangToBaht } from "@/utils/currency";
import { withRetry } from "@/utils/retry";
import { buildPricingPrompt } from "./prompts";
import type { PricingContext, AIRecommendation } from "./types";

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
  return new Anthropic({ apiKey });
}

async function gatherContext(
  hotelId: string,
  roomTypeId: string
): Promise<PricingContext | null> {
  const hotel = await prisma.hotel.findFirst({
    where: { id: hotelId, deletedAt: null },
  });
  if (!hotel) return null;

  const roomType = await prisma.roomType.findFirst({
    where: { id: roomTypeId, hotelId },
  });
  if (!roomType) return null;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Recent rates
  const recentRates = await prisma.rateSnapshot.findMany({
    where: { roomTypeId, hotelId, date: { gte: sevenDaysAgo } },
    orderBy: { date: "desc" },
    take: 21,
  });

  // Booking pace
  const bookings7d = await prisma.booking.count({
    where: { hotelId, checkIn: { gte: sevenDaysAgo }, status: "CONFIRMED" },
  });
  const bookings14d = await prisma.booking.count({
    where: { hotelId, checkIn: { gte: fourteenDaysAgo }, status: "CONFIRMED" },
  });

  // Occupancy estimate
  const totalRooms = hotel.totalRooms || 50;
  const occupancyRate = Math.min(
    100,
    Math.round((bookings7d / (totalRooms * 7)) * 100)
  );

  // Recent rejection feedback
  const recentFeedback = await prisma.recommendation.findMany({
    where: {
      hotelId,
      roomTypeId,
      status: "REJECTED",
      createdAt: { gte: fourteenDaysAgo },
    },
    select: {
      rejectionReason: true,
      rejectionNote: true,
      createdAt: true,
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return {
    hotelName: hotel.name,
    roomTypeName: roomType.name,
    currentPrice: recentRates[0]
      ? satangToBaht(recentRates[0].price)
      : 2500,
    pricingBoundaries: {
      minPrice: roomType.minPrice ? satangToBaht(roomType.minPrice) : null,
      maxPrice: roomType.maxPrice ? satangToBaht(roomType.maxPrice) : null,
      maxDiscountPercent: roomType.maxDiscountPercent,
    },
    recentRates: recentRates.map((r) => ({
      date: r.date.toISOString().split("T")[0],
      price: satangToBaht(r.price),
      otaName: r.otaName,
    })),
    bookingPace: {
      totalBookings7Days: bookings7d,
      totalBookings14Days: bookings14d,
      occupancyRate,
    },
    recentFeedback: recentFeedback.map((f) => ({
      reason: f.rejectionReason ?? "unknown",
      note: f.rejectionNote,
      createdAt: f.createdAt.toISOString(),
    })),
  };
}

async function callClaudeAPI(
  prompt: string
): Promise<AIRecommendation[]> {
  const client = getAnthropicClient();

  const response = await withRetry(
    async () => {
      const msg = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      });

      const textBlock = msg.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text response from Claude");
      }
      return textBlock.text;
    },
    { context: "claude_api", maxRetries: 3 }
  );

  // Parse JSON response
  const cleaned = response.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleaned) as {
    roomTypeName: string;
    targetDate: string;
    recommendedPrice: number;
    reason: string;
  }[];

  return parsed.map((p) => ({
    roomTypeId: "", // will be filled by caller
    roomTypeName: p.roomTypeName,
    targetDate: p.targetDate,
    currentPrice: 0, // will be filled by caller
    recommendedPrice: p.recommendedPrice,
    changePercent: 0, // will be calculated
    changeDirection: "none" as const,
    reason: p.reason,
  }));
}

function clampPrice(
  price: number,
  currentPrice: number,
  boundaries: PricingContext["pricingBoundaries"]
): number {
  let clamped = price;

  if (boundaries.minPrice !== null) {
    clamped = Math.max(clamped, boundaries.minPrice);
  }
  if (boundaries.maxPrice !== null) {
    clamped = Math.min(clamped, boundaries.maxPrice);
  }

  // Enforce max discount
  const maxDiscount = boundaries.maxDiscountPercent ?? 20;
  const minAllowed = currentPrice * (1 - maxDiscount / 100);
  clamped = Math.max(clamped, minAllowed);

  return Math.round(clamped);
}

export async function generateRecommendations(hotelId: string) {
  const roomTypes = await prisma.roomType.findMany({
    where: { hotelId },
  });

  if (roomTypes.length === 0) {
    logger.info("No room types, skipping AI generation", {
      hotelId,
      action: "ai_skip",
    });
    return [];
  }

  // Gather context for all room types
  const contexts: (PricingContext & { roomTypeId: string })[] = [];
  for (const rt of roomTypes) {
    const ctx = await gatherContext(hotelId, rt.id);
    if (ctx) {
      contexts.push({ ...ctx, roomTypeId: rt.id });
    }
  }

  if (contexts.length === 0) return [];

  // Build prompt and call Claude
  const prompt = buildPricingPrompt(contexts);

  let aiResults: AIRecommendation[];
  try {
    aiResults = await callClaudeAPI(prompt);
  } catch (error) {
    logger.error("Claude API call failed", {
      hotelId,
      action: "ai_call_failed",
      error: String(error),
    });
    return [];
  }

  // Match results to room types and save
  const recommendations = [];

  for (const result of aiResults) {
    // Match by room type name
    const ctx = contexts.find(
      (c) =>
        c.roomTypeName === result.roomTypeName ||
        c.roomTypeName.toLowerCase().includes(
          (result.roomTypeName ?? "").toLowerCase()
        )
    );
    if (!ctx) continue;

    const currentPrice = ctx.currentPrice;
    const recPrice = clampPrice(
      result.recommendedPrice,
      currentPrice,
      ctx.pricingBoundaries
    );

    const changePercent =
      currentPrice > 0
        ? Math.round(((recPrice - currentPrice) / currentPrice) * 10000) / 100
        : 0;

    const changeDirection =
      recPrice > currentPrice
        ? "up"
        : recPrice < currentPrice
          ? "down"
          : "none";

    // Add boundary note if price was clamped
    let reason = result.reason;
    if (recPrice !== result.recommendedPrice) {
      reason += " (ปรับให้อยู่ในกรอบที่กำหนด)";
    }

    const targetDate = new Date(result.targetDate);
    const expiresAt = new Date(result.targetDate);
    expiresAt.setHours(23, 59, 59, 999);

    const rec = await prisma.recommendation.create({
      data: {
        hotelId,
        roomTypeId: ctx.roomTypeId,
        targetDate,
        currentPrice: bahtToSatang(currentPrice),
        recommendedPrice: bahtToSatang(recPrice),
        changePercent,
        changeDirection,
        reason,
        expiresAt,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        hotelId,
        action: "recommendation_created",
        entityType: "Recommendation",
        entityId: rec.id,
        details: JSON.parse(JSON.stringify({
          roomTypeId: ctx.roomTypeId,
          targetDate: result.targetDate,
          currentPrice,
          recommendedPrice: recPrice,
        })),
      },
    });

    recommendations.push(rec);
  }

  logger.info("AI recommendations generated", {
    hotelId,
    action: "ai_recommendations_generated",
    count: recommendations.length,
  });

  return recommendations;
}

/** Mark expired recommendations */
export async function expireOldRecommendations() {
  const result = await prisma.recommendation.updateMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: new Date() },
    },
    data: { status: "EXPIRED" },
  });

  if (result.count > 0) {
    logger.info(`Expired ${result.count} recommendations`, {
      action: "recommendations_expired",
    });
  }

  return result.count;
}
