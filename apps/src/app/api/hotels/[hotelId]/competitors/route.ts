import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireHotelAccess } from "@/lib/auth/rbac";
import { satangToBaht } from "@/utils/currency";
import { generateMockCompetitors } from "@/lib/competitors/mock-data";

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

  // Check for real competitor data
  const realCompetitors = await prisma.competitor.findMany({
    where: { hotelId },
    include: {
      rates: {
        where: {
          date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
        orderBy: { date: "asc" },
        take: 200,
      },
    },
  });

  if (realCompetitors.length > 0) {
    return NextResponse.json({
      source: "provider",
      competitors: realCompetitors.map((c) => ({
        id: c.id,
        name: c.name,
        location: c.location,
        starRating: c.starRating,
        rates: c.rates.map((r) => ({
          otaName: r.otaName,
          roomType: r.roomType,
          date: r.date.toISOString().split("T")[0],
          price: satangToBaht(r.price),
        })),
      })),
    });
  }

  // Demo mode: use mock data
  const mockCompetitors = generateMockCompetitors();

  // Get our hotel's prices for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const twoWeeks = new Date(today);
  twoWeeks.setDate(twoWeeks.getDate() + 14);

  const ourRates = await prisma.rateSnapshot.findMany({
    where: {
      hotelId,
      date: { gte: today, lte: twoWeeks },
    },
    include: { roomType: { select: { name: true } } },
    orderBy: { date: "asc" },
  });

  const ourPrices: Record<string, Record<string, number>> = {};
  for (const rate of ourRates) {
    const dateKey = rate.date.toISOString().split("T")[0];
    if (!ourPrices[dateKey]) ourPrices[dateKey] = {};
    ourPrices[dateKey][rate.roomType.name] = satangToBaht(rate.price);
  }

  return NextResponse.json({
    source: "demo",
    competitors: mockCompetitors.map((c) => ({
      name: c.name,
      location: c.location,
      starRating: c.starRating,
      rates: c.rates.map((r) => {
        const date = new Date(today);
        date.setDate(date.getDate() + r.dateOffset);
        return {
          otaName: r.otaName,
          roomType: r.roomType,
          date: date.toISOString().split("T")[0],
          price: r.price,
        };
      }),
    })),
    ourPrices,
  });
}
