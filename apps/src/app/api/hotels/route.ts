import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireRole } from "@/lib/auth/rbac";
import { logger } from "@/lib/logger";

const MAX_HOTELS_PER_OWNER = 5;

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const userId = session!.user.id;
  const role = session!.user.role;

  let hotels;

  if (role === "SYSTEM_ADMIN") {
    // System admin sees all hotels
    hotels = await prisma.hotel.findMany({
      where: { deletedAt: null },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } else {
    // Get owned hotels
    const ownedHotels = await prisma.hotel.findMany({
      where: { ownerId: userId, deletedAt: null },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true } },
      },
    });

    // Get hotels with access via HotelUser
    const hotelAccess = await prisma.hotelUser.findMany({
      where: { userId },
      include: {
        hotel: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            _count: { select: { members: true } },
          },
        },
      },
    });

    const accessedHotels = hotelAccess
      .map((hu) => hu.hotel)
      .filter((h) => !h.deletedAt);

    // Merge and deduplicate
    const hotelMap = new Map<string, typeof ownedHotels[0]>();
    for (const h of ownedHotels) hotelMap.set(h.id, h);
    for (const h of accessedHotels) {
      if (!hotelMap.has(h.id)) hotelMap.set(h.id, h);
    }

    hotels = Array.from(hotelMap.values());
  }

  const data = hotels.map((h) => ({
    id: h.id,
    name: h.name,
    location: h.location,
    totalRooms: h.totalRooms,
    role: h.ownerId === userId ? "OWNER" : "MEMBER",
    memberCount: h._count.members,
    createdAt: h.createdAt,
  }));

  return NextResponse.json({ data });
}

const createHotelSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อโรงแรม"),
  location: z.string().optional(),
  totalRooms: z.number().int().min(1, "จำนวนห้องต้องมากกว่า 0").optional(),
});

export async function POST(request: Request) {
  const { session, error } = await requireRole(["OWNER", "SYSTEM_ADMIN"]);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = createHotelSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
      return NextResponse.json(
        { error: firstError, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const userId = session!.user.id;

    // Check hotel limit
    const hotelCount = await prisma.hotel.count({
      where: { ownerId: userId, deletedAt: null },
    });

    if (hotelCount >= MAX_HOTELS_PER_OWNER) {
      return NextResponse.json(
        {
          error: "จำนวนโรงแรมเกินจำนวนที่แพ็คเกจอนุญาต",
          code: "HOTEL_LIMIT_EXCEEDED",
        },
        { status: 403 }
      );
    }

    const { name, location, totalRooms } = parsed.data;

    const hotel = await prisma.hotel.create({
      data: {
        name,
        location: location ?? null,
        totalRooms: totalRooms ?? 0,
        ownerId: userId,
      },
    });

    // Create HotelUser record for owner
    await prisma.hotelUser.create({
      data: {
        userId,
        hotelId: hotel.id,
        role: "OWNER",
      },
    });

    logger.info("Hotel created", {
      userId,
      hotelId: hotel.id,
      action: "create_hotel",
    });

    return NextResponse.json(
      {
        message: "เพิ่มโรงแรมสำเร็จ",
        hotel: {
          id: hotel.id,
          name: hotel.name,
          location: hotel.location,
          totalRooms: hotel.totalRooms,
          ownerId: hotel.ownerId,
          createdAt: hotel.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    logger.error("Hotel creation failed", {
      userId: session!.user.id,
      action: "create_hotel",
      error: String(err),
    });
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในระบบ", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
