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
  const dateFrom = url.searchParams.get("dateFrom") || new Date().toISOString().split("T")[0];
  const dateTo = url.searchParams.get("dateTo") || (() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  })();

  const roomTypes = await prisma.roomType.findMany({
    where: { hotelId },
    orderBy: { name: "asc" },
  });

  const snapshots = await prisma.rateSnapshot.findMany({
    where: {
      hotelId,
      date: { gte: new Date(dateFrom), lte: new Date(dateTo) },
    },
    orderBy: { date: "asc" },
  });

  const result = roomTypes.map((rt) => {
    const rtSnapshots = snapshots.filter((s) => s.roomTypeId === rt.id);

    // Group by date
    const dateMap = new Map<string, Record<string, { price: number; syncedAt: Date }>>();
    for (const s of rtSnapshots) {
      const dateStr = s.date.toISOString().split("T")[0];
      if (!dateMap.has(dateStr)) dateMap.set(dateStr, {});
      dateMap.get(dateStr)![s.otaName] = {
        price: satangToBaht(s.price),
        syncedAt: s.syncedAt,
      };
    }

    const prices = Array.from(dateMap.entries()).map(([date, otas]) => {
      const priceValues = Object.values(otas).map((o) => o.price);
      const hasDiff = priceValues.length > 1 && new Set(priceValues).size > 1;
      return { date, otas, hasPriceDifference: hasDiff };
    });

    return { id: rt.id, name: rt.name, prices };
  });

  return NextResponse.json({
    dateRange: { from: dateFrom, to: dateTo },
    roomTypes: result,
  });
}
