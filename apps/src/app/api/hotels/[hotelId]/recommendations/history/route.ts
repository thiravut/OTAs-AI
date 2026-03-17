import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireHotelAccess } from "@/lib/auth/rbac";
import { satangToBaht } from "@/utils/currency";

export async function GET(
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

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const roomTypeId = url.searchParams.get("roomTypeId");
  const status = url.searchParams.get("status");
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = parseInt(url.searchParams.get("limit") ?? "50");

  const where: Record<string, unknown> = { hotelId };
  if (from) where.targetDate = { ...(where.targetDate as object ?? {}), gte: new Date(from) };
  if (to) where.targetDate = { ...(where.targetDate as object ?? {}), lte: new Date(to) };
  if (roomTypeId) where.roomTypeId = roomTypeId;
  if (status && status !== "all") where.status = status.toUpperCase();

  const [data, total] = await Promise.all([
    prisma.recommendation.findMany({
      where,
      include: {
        roomType: { select: { id: true, name: true } },
        decidedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.recommendation.count({ where }),
  ]);

  // Stats
  const [totalAll, approvedCount, rejectedCount, expiredCount] =
    await Promise.all([
      prisma.recommendation.count({ where: { hotelId } }),
      prisma.recommendation.count({ where: { hotelId, status: "APPROVED" } }),
      prisma.recommendation.count({ where: { hotelId, status: "REJECTED" } }),
      prisma.recommendation.count({ where: { hotelId, status: "EXPIRED" } }),
    ]);

  const approvalRate =
    totalAll > 0 ? Math.round((approvedCount / totalAll) * 100) : 0;

  return NextResponse.json({
    data: data.map((r) => ({
      id: r.id,
      roomType: r.roomType,
      targetDate: r.targetDate.toISOString().split("T")[0],
      currentPrice: satangToBaht(r.currentPrice),
      recommendedPrice: satangToBaht(r.recommendedPrice),
      changePercent: r.changePercent,
      reason: r.reason,
      status: r.status.toLowerCase(),
      rejectionReason: r.rejectionReason?.toLowerCase() ?? null,
      rejectionNote: r.rejectionNote,
      decidedAt: r.decidedAt,
      decidedBy: r.decidedBy,
      createdAt: r.createdAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    stats: {
      totalRecommendations: totalAll,
      approved: approvedCount,
      rejected: rejectedCount,
      expired: expiredCount,
      approvalRate,
    },
  });
}
