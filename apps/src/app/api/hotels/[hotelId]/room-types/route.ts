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

  const roomTypes = await prisma.roomType.findMany({
    where: { hotelId },
    include: {
      otaMappings: true,
      rateSnapshots: {
        where: { date: { gte: new Date() } },
        orderBy: { date: "asc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  const data = roomTypes.map((rt) => {
    const mappings: Record<string, { otaRoomTypeId: string; otaRoomName: string | null }> = {};
    for (const m of rt.otaMappings) {
      mappings[m.otaName] = {
        otaRoomTypeId: m.otaRoomTypeId,
        otaRoomName: m.otaRoomName,
      };
    }

    const currentPrices: Record<string, { price: number; currency: string; syncedAt: Date }> = {};
    for (const rs of rt.rateSnapshots) {
      currentPrices[rs.otaName] = {
        price: satangToBaht(rs.price),
        currency: rs.currency,
        syncedAt: rs.syncedAt,
      };
    }

    return {
      id: rt.id,
      name: rt.name,
      otaMappings: mappings,
      pricingBoundaries: {
        minPrice: rt.minPrice ? satangToBaht(rt.minPrice) : null,
        maxPrice: rt.maxPrice ? satangToBaht(rt.maxPrice) : null,
        maxDiscountPercent: rt.maxDiscountPercent,
      },
      currentPrices,
    };
  });

  return NextResponse.json({ data });
}
