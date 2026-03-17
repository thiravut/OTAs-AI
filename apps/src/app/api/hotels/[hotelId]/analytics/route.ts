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
  const periodParam = url.searchParams.get("period") ?? "30d";
  const days = parseInt(periodParam.replace("d", "")) || 30;

  const now = new Date();
  const afterStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const beforeStart = new Date(afterStart.getTime() - days * 24 * 60 * 60 * 1000);

  const hotel = await prisma.hotel.findFirst({
    where: { id: hotelId, deletedAt: null },
  });
  const totalRooms = hotel?.totalRooms || 50;

  // Revenue comparison
  const [afterRevenue, beforeRevenue] = await Promise.all([
    prisma.booking.aggregate({
      where: { hotelId, status: "CONFIRMED", checkIn: { gte: afterStart } },
      _sum: { totalPrice: true },
    }),
    prisma.booking.aggregate({
      where: {
        hotelId,
        status: "CONFIRMED",
        checkIn: { gte: beforeStart, lt: afterStart },
      },
      _sum: { totalPrice: true },
    }),
  ]);

  const afterTotal = satangToBaht(afterRevenue._sum.totalPrice ?? 0);
  const beforeTotal = satangToBaht(beforeRevenue._sum.totalPrice ?? 0);
  const daysElapsed = Math.ceil((now.getTime() - afterStart.getTime()) / (24 * 60 * 60 * 1000));
  const afterAvgDaily = daysElapsed > 0 ? Math.round(afterTotal / daysElapsed) : 0;
  const beforeAvgDaily = days > 0 ? Math.round(beforeTotal / days) : 0;
  const projected = Math.round(afterAvgDaily * days);
  const changePercent = beforeTotal > 0
    ? Math.round(((afterAvgDaily - beforeAvgDaily) / beforeAvgDaily) * 10000) / 100
    : 0;

  // Occupancy comparison
  const [afterBookings, beforeBookings] = await Promise.all([
    prisma.booking.count({
      where: { hotelId, status: "CONFIRMED", checkIn: { gte: afterStart } },
    }),
    prisma.booking.count({
      where: {
        hotelId,
        status: "CONFIRMED",
        checkIn: { gte: beforeStart, lt: afterStart },
      },
    }),
  ]);

  const afterOccupancy = Math.min(
    100,
    Math.round((afterBookings / (totalRooms * daysElapsed)) * 100)
  );
  const beforeOccupancy = Math.min(
    100,
    Math.round((beforeBookings / (totalRooms * days)) * 100)
  );
  const occupancyChange = beforeOccupancy > 0
    ? Math.round(((afterOccupancy - beforeOccupancy) / beforeOccupancy) * 10000) / 100
    : 0;

  // AI performance
  const [totalRecs, approved, rejected, expired] = await Promise.all([
    prisma.recommendation.count({
      where: { hotelId, createdAt: { gte: afterStart } },
    }),
    prisma.recommendation.count({
      where: { hotelId, status: "APPROVED", createdAt: { gte: afterStart } },
    }),
    prisma.recommendation.count({
      where: { hotelId, status: "REJECTED", createdAt: { gte: afterStart } },
    }),
    prisma.recommendation.count({
      where: { hotelId, status: "EXPIRED", createdAt: { gte: afterStart } },
    }),
  ]);

  const approvalRate = totalRecs > 0 ? Math.round((approved / totalRecs) * 100) : 0;

  const rejections = await prisma.recommendation.groupBy({
    by: ["rejectionReason"],
    where: { hotelId, status: "REJECTED", createdAt: { gte: afterStart } },
    _count: true,
    orderBy: { _count: { rejectionReason: "desc" } },
  });

  const reasonLabels: Record<string, string> = {
    LOCAL_EVENT: "มี local event",
    PRICE_TOO_HIGH: "ราคาสูงเกินไป",
    PRICE_TOO_LOW: "ราคาต่ำเกินไป",
    MARKET_KNOWLEDGE: "มีข้อมูลตลาดที่ AI ไม่รู้",
    OTHER: "อื่นๆ",
  };

  return NextResponse.json({
    period: periodParam,
    revenue: {
      before: {
        period: `${beforeStart.toISOString().split("T")[0]} to ${afterStart.toISOString().split("T")[0]}`,
        total: beforeTotal,
        avgDaily: beforeAvgDaily,
      },
      after: {
        period: `${afterStart.toISOString().split("T")[0]} to ${now.toISOString().split("T")[0]}`,
        total: afterTotal,
        avgDaily: afterAvgDaily,
        projected,
      },
      changePercent,
      changeDirection: afterAvgDaily >= beforeAvgDaily ? "up" : "down",
    },
    occupancy: {
      before: { average: beforeOccupancy },
      after: { average: afterOccupancy },
      changePercent: occupancyChange,
    },
    aiPerformance: {
      totalRecommendations: totalRecs,
      approved,
      rejected,
      expired,
      approvalRate,
      topRejectionReasons: rejections
        .filter((r) => r.rejectionReason)
        .map((r) => ({
          reason: r.rejectionReason!.toLowerCase(),
          label: reasonLabels[r.rejectionReason!] ?? r.rejectionReason,
          count: r._count,
        })),
    },
  });
}
