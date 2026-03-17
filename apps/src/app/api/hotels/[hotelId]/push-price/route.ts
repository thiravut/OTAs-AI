import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireHotelAccess } from "@/lib/auth/rbac";
import { logger } from "@/lib/logger";
import { bahtToSatang } from "@/utils/currency";
import { pushPrice } from "@/lib/channex/push";

const pushPriceSchema = z.object({
  roomTypeId: z.string().min(1, "กรุณาระบุ room type"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "วันที่ต้องเป็น YYYY-MM-DD"),
  price: z.number().positive("ราคาต้องมากกว่า 0"),
  triggeredBy: z.enum(["recommendation_approve", "manual", "rule"]).optional(),
  recommendationId: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { hotelId } = await params;

  const { error: accessError } = await requireHotelAccess(
    session!.user.id,
    hotelId,
    ["OWNER", "REVENUE_MANAGER"]
  );
  if (accessError) return accessError;

  try {
    const body = await request.json();
    const parsed = pushPriceSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
      return NextResponse.json(
        { error: firstError, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { roomTypeId, date, price, triggeredBy, recommendationId } = parsed.data;

    // Validate room type belongs to hotel
    const roomType = await prisma.roomType.findFirst({
      where: { id: roomTypeId, hotelId },
    });

    if (!roomType) {
      return NextResponse.json(
        { error: "ไม่พบประเภทห้องในโรงแรมนี้", code: "ROOM_TYPE_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Validate price is within boundaries
    const priceInSatang = bahtToSatang(price);

    if (roomType.minPrice && priceInSatang < roomType.minPrice) {
      return NextResponse.json(
        { error: `ราคาต่ำกว่าขั้นต่ำที่กำหนด (${roomType.minPrice / 100} บาท)`, code: "PRICE_BELOW_MIN" },
        { status: 400 }
      );
    }

    if (roomType.maxPrice && priceInSatang > roomType.maxPrice) {
      return NextResponse.json(
        { error: `ราคาสูงกว่าขั้นสูงที่กำหนด (${roomType.maxPrice / 100} บาท)`, code: "PRICE_ABOVE_MAX" },
        { status: 400 }
      );
    }

    // Execute push
    const result = await pushPrice({
      hotelId,
      roomTypeId,
      targetDate: date,
      newPrice: priceInSatang,
      triggeredBy: triggeredBy ?? "manual",
      recommendationId,
      userId: session!.user.id,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        hotelId,
        userId: session!.user.id,
        action: "price_pushed",
        entityType: "PriceUpdateLog",
        entityId: result.logIds[0] ?? "batch",
        details: {
          roomTypeId,
          date,
          price,
          otaResults: result.otaResults,
        },
      },
    });

    logger.info("Price push requested", {
      userId: session!.user.id,
      hotelId,
      roomTypeId,
      action: "push_price",
    });

    const statusCode = result.success ? 200 : 207; // 207 = Multi-Status for partial

    return NextResponse.json(
      {
        message: result.success
          ? "Push ราคาสำเร็จทุก OTA"
          : "Push ราคาสำเร็จบางส่วน",
        success: result.success,
        otaResults: result.otaResults,
        logIds: result.logIds,
      },
      { status: statusCode }
    );
  } catch (err) {
    logger.error("Push price failed", {
      userId: session!.user.id,
      hotelId,
      action: "push_price",
      error: String(err),
    });
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในระบบ", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
