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
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const recommendations = await prisma.recommendation.findMany({
    where: { hotelId, createdAt: { gte: since } },
    include: {
      roomType: { select: { name: true } },
    },
    orderBy: { targetDate: "asc" },
  });

  const BOM = "\uFEFF";
  const header = "วันที่,Room Type,ราคาปัจจุบัน,AI แนะนำ,% เปลี่ยนแปลง,สถานะ,เหตุผล";
  const rows = recommendations.map((r) => {
    const date = r.targetDate.toISOString().split("T")[0];
    const current = satangToBaht(r.currentPrice);
    const recommended = satangToBaht(r.recommendedPrice);
    const status = r.status.toLowerCase();
    const reason = r.reason.replace(/,/g, ";").replace(/\n/g, " ");
    return `${date},${r.roomType.name},${current},${recommended},${r.changePercent},${status},"${reason}"`;
  });

  const csv = BOM + header + "\n" + rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rategenie-export-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
