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
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = parseInt(url.searchParams.get("limit") ?? "20");
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = { hotelId };
  if (status) {
    where.status = status.toUpperCase();
  }

  const [data, total] = await Promise.all([
    prisma.priceUpdateLog.findMany({
      where,
      include: {
        roomType: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.priceUpdateLog.count({ where }),
  ]);

  return NextResponse.json({
    data: data.map((log) => ({
      id: log.id,
      roomType: log.roomType,
      otaName: log.otaName,
      targetDate: log.targetDate.toISOString().split("T")[0],
      previousPrice: satangToBaht(log.previousPrice),
      newPrice: satangToBaht(log.newPrice),
      status: log.status.toLowerCase(),
      error: log.error,
      triggeredBy: log.triggeredBy,
      user: log.user,
      createdAt: log.createdAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
