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
  const status = url.searchParams.get("status") ?? "pending";
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = parseInt(url.searchParams.get("limit") ?? "20");

  const where: Record<string, unknown> = { hotelId };
  if (status !== "all") {
    where.status = status.toUpperCase();
  }

  const [data, total] = await Promise.all([
    prisma.recommendation.findMany({
      where,
      include: {
        roomType: { select: { id: true, name: true } },
        decidedBy: { select: { id: true, name: true } },
      },
      orderBy: { targetDate: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.recommendation.count({ where }),
  ]);

  // Summary stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [pending, approvedToday, rejectedToday, totalAll] = await Promise.all([
    prisma.recommendation.count({
      where: { hotelId, status: "PENDING" },
    }),
    prisma.recommendation.count({
      where: {
        hotelId,
        status: "APPROVED",
        decidedAt: { gte: today, lt: tomorrow },
      },
    }),
    prisma.recommendation.count({
      where: {
        hotelId,
        status: "REJECTED",
        decidedAt: { gte: today, lt: tomorrow },
      },
    }),
    prisma.recommendation.count({ where: { hotelId } }),
  ]);

  const approved = await prisma.recommendation.count({
    where: { hotelId, status: "APPROVED" },
  });

  const approvalRate = totalAll > 0 ? Math.round((approved / totalAll) * 100) : 0;

  return NextResponse.json({
    data: data.map((r) => ({
      id: r.id,
      roomType: r.roomType,
      targetDate: r.targetDate.toISOString().split("T")[0],
      currentPrice: satangToBaht(r.currentPrice),
      recommendedPrice: satangToBaht(r.recommendedPrice),
      changePercent: r.changePercent,
      changeDirection: r.changeDirection,
      reason: r.reason,
      status: r.status.toLowerCase(),
      rejectionReason: r.rejectionReason?.toLowerCase() ?? null,
      rejectionNote: r.rejectionNote,
      createdAt: r.createdAt,
      expiresAt: r.expiresAt,
      decidedAt: r.decidedAt,
      decidedBy: r.decidedBy,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    summary: { pending, approvedToday, rejectedToday, approvalRate },
  });
}
