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
    hotelId
  );
  if (accessError) return accessError;

  const hotel = await prisma.hotel.findFirst({
    where: { id: hotelId, deletedAt: null },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      },
    },
  });

  if (!hotel) {
    return NextResponse.json(
      { error: "ไม่พบโรงแรม", code: "HOTEL_NOT_FOUND" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: hotel.id,
    name: hotel.name,
    location: hotel.location,
    totalRooms: hotel.totalRooms,
    ownerId: hotel.ownerId,
    owner: hotel.owner,
    members: hotel.members.map((m) => ({
      id: m.id,
      user: m.user,
      role: m.role,
      createdAt: m.createdAt,
    })),
    createdAt: hotel.createdAt,
  });
}
