import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // === User ===
  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@rategenie.co" },
    update: {},
    create: {
      email: "demo@rategenie.co",
      name: "สมชาย เจ้าของโรงแรม",
      passwordHash,
      role: "OWNER",
      notificationChannel: "LINE",
    },
  });
  console.log(`User: ${user.email}`);

  // === Hotel ===
  const hotel = await prisma.hotel.upsert({
    where: { id: "demo-hotel-001" },
    update: {},
    create: {
      id: "demo-hotel-001",
      name: "โรงแรมภูเก็ตพาราไดซ์",
      location: "ภูเก็ต",
      totalRooms: 80,
      ownerId: user.id,
    },
  });

  await prisma.hotelUser.upsert({
    where: { userId_hotelId: { userId: user.id, hotelId: hotel.id } },
    update: {},
    create: { userId: user.id, hotelId: hotel.id, role: "OWNER" },
  });
  console.log(`Hotel: ${hotel.name}`);

  // === OTA Connections ===
  for (const ota of ["agoda", "booking"]) {
    await prisma.otaConnection.upsert({
      where: { hotelId_otaName: { hotelId: hotel.id, otaName: ota } },
      update: { status: "CONNECTED", lastSyncAt: new Date() },
      create: {
        hotelId: hotel.id,
        otaName: ota,
        channexPropertyId: "mock-prop-001",
        status: "CONNECTED",
        lastSyncAt: new Date(),
      },
    });
  }
  console.log("OTA connections: agoda + booking");

  // === Room Types ===
  const roomTypes = [
    { id: "rt-deluxe", name: "Deluxe Room", minPrice: 150000, maxPrice: 500000, maxDiscountPercent: 20 },
    { id: "rt-superior", name: "Superior Room", minPrice: 120000, maxPrice: 350000, maxDiscountPercent: 20 },
    { id: "rt-suite", name: "Suite", minPrice: 300000, maxPrice: 800000, maxDiscountPercent: 15 },
  ];

  for (const rt of roomTypes) {
    await prisma.roomType.upsert({
      where: { id: rt.id },
      update: {},
      create: { ...rt, hotelId: hotel.id },
    });

    // OTA mappings
    for (const ota of ["agoda", "booking"]) {
      await prisma.otaRoomMapping.upsert({
        where: { roomTypeId_otaName: { roomTypeId: rt.id, otaName: ota } },
        update: {},
        create: {
          roomTypeId: rt.id,
          otaName: ota,
          otaRoomTypeId: `${ota}-${rt.id}`,
          otaRoomName: `${rt.name} (${ota})`,
        },
      });
    }
  }
  console.log("Room types: 3 types + OTA mappings");

  // === Rate Snapshots (30 days) ===
  const basePrices: Record<string, Record<string, number>> = {
    "rt-deluxe": { agoda: 280000, booking: 290000 },
    "rt-superior": { agoda: 220000, booking: 225000 },
    "rt-suite": { agoda: 450000, booking: 460000 },
  };

  let rateCount = 0;
  for (let dayOffset = -14; dayOffset <= 14; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    for (const rt of roomTypes) {
      for (const ota of ["agoda", "booking"]) {
        const base = basePrices[rt.id][ota];
        const weekendMarkup = isWeekend ? Math.round(base * 0.15) : 0;
        const variation = Math.round((Math.random() - 0.5) * 40000);
        const price = base + weekendMarkup + variation;

        await prisma.rateSnapshot.upsert({
          where: {
            roomTypeId_otaName_date: { roomTypeId: rt.id, otaName: ota, date },
          },
          update: { price },
          create: {
            roomTypeId: rt.id,
            hotelId: hotel.id,
            otaName: ota,
            date,
            price: Math.max(price, rt.minPrice),
            currency: "THB",
          },
        });
        rateCount++;
      }
    }
  }
  console.log(`Rate snapshots: ${rateCount}`);

  // === Bookings (mix of past + future) ===
  const guestNames = [
    "John Smith", "Maria Garcia", "田中太郎", "Kim Min-jun",
    "สมศักดิ์ มากมี", "David Chen", "Anna Mueller", "Pierre Dupont",
  ];
  let bookingCount = 0;

  // Generate ~50-60 bookings per day for realistic occupancy (60-75%)
  for (let dayOffset = -30; dayOffset <= 14; dayOffset++) {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + dayOffset);
    checkIn.setHours(0, 0, 0, 0);
    const isWeekend = checkIn.getDay() === 0 || checkIn.getDay() === 6;

    // More bookings on weekends
    const dailyBookings = isWeekend
      ? Math.floor(Math.random() * 10) + 55 // 55-65 rooms
      : Math.floor(Math.random() * 15) + 40; // 40-55 rooms

    for (let b = 0; b < dailyBookings; b++) {
      const nights = Math.floor(Math.random() * 3) + 1;
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + nights);

      const ota = Math.random() > 0.45 ? "agoda" : "booking";
      const rt = roomTypes[Math.floor(Math.random() * roomTypes.length)];
      // Keep price in satang (matching basePrices unit)
      const totalPrice = basePrices[rt.id][ota] * nights;

      await prisma.booking.create({
        data: {
          hotelId: hotel.id,
          channexBookingId: `mock-bk-${dayOffset}-${b}-${Date.now()}`,
          otaName: ota,
          roomTypeId: rt.id,
          guestName: guestNames[Math.floor(Math.random() * guestNames.length)],
          checkIn,
          checkOut,
          status: Math.random() > 0.05 ? "CONFIRMED" : "CANCELLED",
          totalPrice,
          currency: "THB",
        },
      });
      bookingCount++;
    }
  }
  console.log(`Bookings: ${bookingCount}`);

  // === AI Recommendations ===
  const reasons = [
    "booking pace สูงกว่าปกติ 30% แนะนำขึ้นราคา",
    "occupancy ต่ำกว่าเป้า แนะนำลดราคาเล็กน้อยเพื่อกระตุ้นจอง",
    "วันหยุดสุดสัปดาห์ demand สูง แนะนำขึ้นราคา 15%",
    "คู่แข่ง 3 ใน 5 แห่งขึ้นราคาแล้ว แนะนำปรับตาม",
    "จองเข้ามาเร็ว อีก 5 วันเต็ม แนะนำขึ้นราคา +200 บาท",
    "ช่วง low season ลด 10% เพื่อรักษา occupancy",
  ];

  let recCount = 0;
  for (let dayOffset = -7; dayOffset <= 10; dayOffset++) {
    for (const rt of roomTypes) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + dayOffset);
      targetDate.setHours(0, 0, 0, 0);

      const currentPrice = basePrices[rt.id].agoda;
      const change = Math.round((Math.random() - 0.3) * 60000);
      const recommendedPrice = Math.max(rt.minPrice, Math.min(rt.maxPrice, currentPrice + change));
      const changePercent = Math.round(((recommendedPrice - currentPrice) / currentPrice) * 10000) / 100;
      const direction = recommendedPrice > currentPrice ? "up" : recommendedPrice < currentPrice ? "down" : "none";

      let status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
      let decidedAt: Date | null = null;
      let rejectionReason: "LOCAL_EVENT" | "PRICE_TOO_HIGH" | "PRICE_TOO_LOW" | "MARKET_KNOWLEDGE" | null = null;
      let rejectionNote: string | null = null;

      if (dayOffset < -2) {
        // Past: mix of approved/rejected/expired
        const rand = Math.random();
        if (rand < 0.6) {
          status = "APPROVED";
          decidedAt = new Date(targetDate.getTime() - 24 * 60 * 60 * 1000);
        } else if (rand < 0.85) {
          status = "REJECTED";
          decidedAt = new Date(targetDate.getTime() - 24 * 60 * 60 * 1000);
          const rejReasons: ("LOCAL_EVENT" | "PRICE_TOO_HIGH" | "PRICE_TOO_LOW" | "MARKET_KNOWLEDGE")[] = ["LOCAL_EVENT", "PRICE_TOO_HIGH", "PRICE_TOO_LOW", "MARKET_KNOWLEDGE"];
          rejectionReason = rejReasons[Math.floor(Math.random() * rejReasons.length)];
          if (rejectionReason === "LOCAL_EVENT") rejectionNote = "มีงาน Phuket Food Festival";
        } else {
          status = "EXPIRED";
        }
      } else if (dayOffset >= 0) {
        status = "PENDING";
      } else {
        status = Math.random() > 0.5 ? "APPROVED" : "PENDING";
        if (status === "APPROVED") decidedAt = new Date();
      }

      const expiresAt = new Date(targetDate);
      expiresAt.setHours(23, 59, 59, 999);

      await prisma.recommendation.create({
        data: {
          hotelId: hotel.id,
          roomTypeId: rt.id,
          targetDate,
          currentPrice: currentPrice,
          recommendedPrice,
          changePercent,
          changeDirection: direction,
          reason: reasons[Math.floor(Math.random() * reasons.length)],
          status,
          decidedAt,
          decidedById: decidedAt ? user.id : null,
          rejectionReason,
          rejectionNote,
          expiresAt,
        },
      });
      recCount++;
    }
  }
  console.log(`Recommendations: ${recCount}`);

  // === Sync Logs ===
  for (const ota of ["agoda", "booking"]) {
    await prisma.syncLog.create({
      data: {
        hotelId: hotel.id,
        otaName: ota,
        syncType: "full",
        status: "SUCCESS",
        itemCount: 42,
        completedAt: new Date(),
      },
    });
  }
  console.log("Sync logs: 2");

  // === Pricing Rules (MVP-1 Epic 8) ===
  await prisma.pricingRule.deleteMany({ where: { hotelId: hotel.id } });

  await prisma.pricingRule.create({
    data: {
      hotelId: hotel.id,
      name: "Occupancy สูง → ขึ้นราคา",
      description: "ถ้า occupancy สูงกว่า 80% → ขึ้นราคา 10%",
      enabled: true,
      priority: 10,
      roomTypeIds: [],
      conditions: [{ metric: "occupancy", operator: ">", value: 80 }],
      action: { type: "adjust_price", direction: "up", amount: 10, unit: "percent" },
      template: "high_occupancy_up",
    },
  });

  await prisma.pricingRule.create({
    data: {
      hotelId: hotel.id,
      name: "วันหยุด → ขึ้นราคา 15%",
      description: "วันเสาร์-อาทิตย์ → ขึ้นราคาอัตโนมัติ",
      enabled: true,
      priority: 5,
      roomTypeIds: [],
      conditions: [{ metric: "day_of_week", operator: "in", value: [0, 6] }],
      action: { type: "adjust_price", direction: "up", amount: 15, unit: "percent" },
      template: "weekend_up",
    },
  });

  await prisma.pricingRule.create({
    data: {
      hotelId: hotel.id,
      name: "Occupancy ต่ำ → ลดราคา",
      description: "ถ้า occupancy ต่ำกว่า 40% → ลดราคา 10%",
      enabled: false,
      priority: 3,
      roomTypeIds: [],
      conditions: [{ metric: "occupancy", operator: "<", value: 40 }],
      action: { type: "adjust_price", direction: "down", amount: 10, unit: "percent" },
      template: "low_occupancy_down",
    },
  });

  console.log("Pricing rules: 3");

  // === Competitors (MVP-1 Epic 9) ===
  await prisma.competitorRate.deleteMany();
  await prisma.competitor.deleteMany({ where: { hotelId: hotel.id } });

  const competitors = [
    { name: "The Royal Palm Resort", location: "ภูเก็ต", starRating: 4 },
    { name: "Andaman Breeze Hotel", location: "ภูเก็ต", starRating: 3 },
    { name: "Sea Pearl Boutique", location: "ภูเก็ต", starRating: 4 },
    { name: "Phuket Garden Inn", location: "ภูเก็ต", starRating: 3 },
    { name: "Sunset Beach Resort", location: "ภูเก็ต", starRating: 4 },
  ];

  for (const comp of competitors) {
    const competitor = await prisma.competitor.create({
      data: { hotelId: hotel.id, ...comp },
    });

    // Generate 14 days of rates
    for (let d = 0; d < 14; d++) {
      const date = new Date();
      date.setDate(date.getDate() + d);
      date.setHours(0, 0, 0, 0);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      for (const ota of ["Agoda", "Booking.com"]) {
        for (const roomType of ["Deluxe Room", "Superior Room", "Suite"]) {
          const base = roomType === "Suite" ? 450000 : roomType === "Deluxe Room" ? 280000 : 200000;
          const compFactor = comp.starRating === 4 ? 1.1 : 0.9;
          const weekendFactor = isWeekend ? 1.15 : 1;
          const variation = Math.round((Math.random() - 0.5) * 40000);
          const price = Math.round(base * compFactor * weekendFactor + variation);

          await prisma.competitorRate.create({
            data: {
              competitorId: competitor.id,
              otaName: ota,
              roomType,
              date,
              price,
            },
          });
        }
      }
    }
  }

  console.log("Competitors: 5 with 14 days of rates");

  console.log("\n✅ Seed complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Login: demo@rategenie.co / password123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
