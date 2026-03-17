import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireHotelAccess } from "@/lib/auth/rbac";

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

  const since = new Date();
  since.setDate(since.getDate() - days);

  const where = { hotelId, createdAt: { gte: since } };

  const [total, approved, rejected, expired] = await Promise.all([
    prisma.recommendation.count({ where }),
    prisma.recommendation.count({ where: { ...where, status: "APPROVED" } }),
    prisma.recommendation.count({ where: { ...where, status: "REJECTED" } }),
    prisma.recommendation.count({ where: { ...where, status: "EXPIRED" } }),
  ]);

  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

  // Top rejection reasons
  const rejections = await prisma.recommendation.groupBy({
    by: ["rejectionReason"],
    where: { hotelId, status: "REJECTED", createdAt: { gte: since } },
    _count: true,
    orderBy: { _count: { rejectionReason: "desc" } },
  });

  const topRejectionReasons = rejections
    .filter((r) => r.rejectionReason !== null)
    .map((r) => ({
      reason: r.rejectionReason!.toLowerCase(),
      count: r._count,
    }));

  return NextResponse.json({
    period: periodParam,
    totalRecommendations: total,
    approved,
    rejected,
    expired,
    approvalRate,
    topRejectionReasons,
  });
}
