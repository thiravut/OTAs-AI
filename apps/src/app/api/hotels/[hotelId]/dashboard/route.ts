import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireHotelAccess } from "@/lib/auth/rbac";
import { satangToBaht } from "@/utils/currency";

export async function GET(
  _request: Request,
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

  const hotel = await prisma.hotel.findFirst({
    where: { id: hotelId, deletedAt: null },
  });
  if (!hotel) {
    return NextResponse.json(
      { error: "ไม่พบโรงแรม", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // Occupancy: bookings for next 7 days
  const totalRooms = hotel.totalRooms || 50;
  const forecast7Days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const bookings = await prisma.booking.count({
      where: {
        hotelId,
        status: "CONFIRMED",
        checkIn: { lte: date },
        checkOut: { gt: date },
      },
    });

    forecast7Days.push({
      date: date.toISOString().split("T")[0],
      occupancy: Math.min(100, Math.round((bookings / totalRooms) * 100)),
    });
  }

  // Revenue this month vs last month
  const thisMonthBookings = await prisma.booking.aggregate({
    where: { hotelId, status: "CONFIRMED", checkIn: { gte: monthStart } },
    _sum: { totalPrice: true },
  });
  const lastMonthBookings = await prisma.booking.aggregate({
    where: {
      hotelId,
      status: "CONFIRMED",
      checkIn: { gte: lastMonthStart, lte: lastMonthEnd },
    },
    _sum: { totalPrice: true },
  });

  const thisMonth = satangToBaht(thisMonthBookings._sum.totalPrice ?? 0);
  const lastMonth = satangToBaht(lastMonthBookings._sum.totalPrice ?? 0);
  const revenueChange = lastMonth > 0
    ? Math.round(((thisMonth - lastMonth) / lastMonth) * 10000) / 100
    : 0;

  // Recommendations summary
  const [pending, approvedToday, totalRecs, approvedRecs] = await Promise.all([
    prisma.recommendation.count({ where: { hotelId, status: "PENDING" } }),
    prisma.recommendation.count({
      where: { hotelId, status: "APPROVED", decidedAt: { gte: today, lt: tomorrow } },
    }),
    prisma.recommendation.count({ where: { hotelId } }),
    prisma.recommendation.count({ where: { hotelId, status: "APPROVED" } }),
  ]);

  // Sync status
  const connections = await prisma.otaConnection.findMany({
    where: { hotelId, status: { not: "DISCONNECTED" } },
  });

  const hasError = connections.some((c) => c.status === "ERROR");

  return NextResponse.json({
    hotel: { id: hotel.id, name: hotel.name },
    occupancy: {
      today: forecast7Days[0]?.occupancy ?? 0,
      forecast7Days,
    },
    revenue: {
      thisMonth,
      lastMonth,
      changePercent: revenueChange,
      changeDirection: thisMonth >= lastMonth ? "up" : "down",
    },
    recommendations: {
      pending,
      approvedToday,
      approvalRate: totalRecs > 0 ? Math.round((approvedRecs / totalRecs) * 100) : 0,
    },
    syncStatus: {
      overallStatus: connections.length === 0 ? "no_connections" : hasError ? "degraded" : "healthy",
      connections: connections.map((c) => ({
        otaName: c.otaName,
        status: c.status,
        lastSyncAt: c.lastSyncAt,
      })),
    },
  });
}
