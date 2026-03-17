import { NextResponse } from "next/server";
import { requireAuth, requireHotelAccess } from "@/lib/auth/rbac";
import { getParitySummary } from "@/lib/channex/parity";

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

  const summary = await getParitySummary(hotelId);

  return NextResponse.json(summary);
}
