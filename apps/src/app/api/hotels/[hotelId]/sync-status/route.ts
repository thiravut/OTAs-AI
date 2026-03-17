import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireHotelAccess } from "@/lib/auth/rbac";

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
    ["OWNER", "REVENUE_MANAGER", "SYSTEM_ADMIN"]
  );
  if (accessError) return accessError;

  const connections = await prisma.otaConnection.findMany({
    where: { hotelId, status: { not: "DISCONNECTED" } },
  });

  const hasError = connections.some((c) => c.status === "ERROR");
  const overallStatus = connections.length === 0
    ? "no_connections"
    : hasError
      ? "degraded"
      : "healthy";

  return NextResponse.json({
    overallStatus,
    connections: connections.map((c) => ({
      otaName: c.otaName,
      status: c.status,
      lastSyncAt: c.lastSyncAt,
      nextSyncAt: c.lastSyncAt
        ? new Date(c.lastSyncAt.getTime() + 5 * 60 * 1000)
        : null,
      lastError: c.lastError,
      retryCount: c.retryCount,
    })),
  });
}
