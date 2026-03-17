import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

export interface ParityCheckResult {
  roomTypeId: string;
  roomTypeName: string;
  date: string;
  isParity: boolean;
  prices: { otaName: string; price: number }[];
  maxDiff: number; // percentage
  maxDiffAmount: number; // satang
}

/**
 * Check rate parity across OTAs for a hotel's room types on given dates.
 * Returns parity status per room type + date.
 */
export async function checkRateParity(
  hotelId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<ParityCheckResult[]> {
  const snapshots = await prisma.rateSnapshot.findMany({
    where: {
      hotelId,
      date: { gte: dateFrom, lte: dateTo },
    },
    include: {
      roomType: { select: { id: true, name: true } },
    },
    orderBy: [{ date: "asc" }, { roomType: { name: "asc" } }],
  });

  // Group by roomType + date
  const grouped = new Map<string, typeof snapshots>();
  for (const snap of snapshots) {
    const key = `${snap.roomTypeId}|${snap.date.toISOString().split("T")[0]}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(snap);
  }

  const results: ParityCheckResult[] = [];

  for (const [key, snaps] of grouped) {
    if (snaps.length < 2) continue; // Need at least 2 OTAs to compare

    const prices = snaps.map((s) => ({
      otaName: s.otaName,
      price: s.price,
    }));

    const minPrice = Math.min(...prices.map((p) => p.price));
    const maxPrice = Math.max(...prices.map((p) => p.price));
    const diff = maxPrice - minPrice;
    const diffPercent = minPrice > 0 ? (diff / minPrice) * 100 : 0;

    const [roomTypeId, date] = key.split("|");

    results.push({
      roomTypeId,
      roomTypeName: snaps[0].roomType.name,
      date,
      isParity: diffPercent < 1, // <1% difference = parity OK
      prices,
      maxDiff: Math.round(diffPercent * 100) / 100,
      maxDiffAmount: diff,
    });
  }

  const violations = results.filter((r) => !r.isParity);
  if (violations.length > 0) {
    logger.warn("Rate parity violations detected", {
      hotelId,
      violations: violations.length,
      total: results.length,
    });
  }

  return results;
}

/**
 * Get parity summary for a hotel.
 */
export async function getParitySummary(hotelId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  const results = await checkRateParity(hotelId, today, sevenDaysLater);
  const parityOk = results.filter((r) => r.isParity).length;
  const violations = results.filter((r) => !r.isParity).length;

  return {
    total: results.length,
    parityOk,
    violations,
    parityScore: results.length > 0 ? Math.round((parityOk / results.length) * 100) : 100,
    details: results,
  };
}
