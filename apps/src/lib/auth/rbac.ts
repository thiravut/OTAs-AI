import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { authOptions } from "./options";
import { prisma } from "@/lib/db/prisma";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "ไม่ได้เข้าสู่ระบบ", code: "UNAUTHORIZED" },
        { status: 401 }
      ),
    };
  }
  return { session, error: null };
}

export async function requireRole(allowedRoles: Role[]) {
  const { session, error } = await requireAuth();
  if (error) return { session: null, error };

  if (!allowedRoles.includes(session!.user.role)) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึง", code: "FORBIDDEN" },
        { status: 403 }
      ),
    };
  }
  return { session: session!, error: null };
}

export async function checkHotelAccess(userId: string, hotelId: string) {
  // Check if user is system admin
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
  });
  if (user?.role === "SYSTEM_ADMIN") {
    return { role: "SYSTEM_ADMIN" as Role, hasAccess: true };
  }

  // Check if user is hotel owner
  const hotel = await prisma.hotel.findFirst({
    where: { id: hotelId, ownerId: userId, deletedAt: null },
  });
  if (hotel) {
    return { role: "OWNER" as Role, hasAccess: true };
  }

  // Check HotelUser table
  const hotelUser = await prisma.hotelUser.findUnique({
    where: { userId_hotelId: { userId, hotelId } },
  });
  if (hotelUser) {
    return { role: hotelUser.role, hasAccess: true };
  }

  return { role: null, hasAccess: false };
}

export async function requireHotelAccess(
  userId: string,
  hotelId: string,
  allowedRoles?: Role[]
) {
  const access = await checkHotelAccess(userId, hotelId);

  if (!access.hasAccess) {
    return {
      access: null,
      error: NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึงโรงแรมนี้", code: "FORBIDDEN" },
        { status: 403 }
      ),
    };
  }

  if (allowedRoles && access.role && !allowedRoles.includes(access.role)) {
    return {
      access: null,
      error: NextResponse.json(
        { error: "ไม่มีสิทธิ์ดำเนินการนี้", code: "FORBIDDEN" },
        { status: 403 }
      ),
    };
  }

  return { access, error: null };
}
