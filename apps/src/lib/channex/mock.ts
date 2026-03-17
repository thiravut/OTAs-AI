import type {
  ChannexProperty,
  ChannexRoomType,
  ChannexRate,
  ChannexBooking,
  ChannexRateUpdate,
  ChannexRateUpdateResult,
} from "./types";
import { logger } from "@/lib/logger";

export function getMockProperties(): ChannexProperty[] {
  return [
    {
      id: "mock-prop-001",
      title: "โรงแรมทดสอบ Mock",
      currency: "THB",
      country: "TH",
    },
  ];
}

export function getMockRoomTypes(_propertyId: string): ChannexRoomType[] {
  return [
    {
      id: "mock-rt-deluxe",
      propertyId: _propertyId,
      title: "Deluxe Room",
      occupancy: 2,
    },
    {
      id: "mock-rt-superior",
      propertyId: _propertyId,
      title: "Superior Room",
      occupancy: 2,
    },
    {
      id: "mock-rt-suite",
      propertyId: _propertyId,
      title: "Suite",
      occupancy: 3,
    },
  ];
}

export function getMockRates(
  _propertyId: string,
  dateFrom: string,
  dateTo: string
): ChannexRate[] {
  const rates: ChannexRate[] = [];
  const roomTypes = ["mock-rt-deluxe", "mock-rt-superior", "mock-rt-suite"];
  const basePrices: Record<string, number> = {
    "mock-rt-deluxe": 2800,
    "mock-rt-superior": 2200,
    "mock-rt-suite": 4500,
  };

  const start = new Date(dateFrom);
  const end = new Date(dateTo);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

    for (const rtId of roomTypes) {
      const base = basePrices[rtId] ?? 2500;
      // Weekend markup + random variation
      const variation = Math.floor(Math.random() * 400) - 200;
      const weekendMarkup = isWeekend ? Math.floor(base * 0.15) : 0;
      const price = base + weekendMarkup + variation;

      rates.push({
        roomTypeId: rtId,
        date: dateStr,
        rate: Math.max(price, 1000),
        currency: "THB",
      });
    }
  }

  return rates;
}

export function getMockBookings(_propertyId: string): ChannexBooking[] {
  const today = new Date();
  const bookings: ChannexBooking[] = [];

  for (let i = 0; i < 8; i++) {
    const checkIn = new Date(today);
    checkIn.setDate(checkIn.getDate() + Math.floor(Math.random() * 14));
    const nights = Math.floor(Math.random() * 3) + 1;
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + nights);

    const otaNames = ["agoda", "booking"];
    const otaName = otaNames[Math.floor(Math.random() * otaNames.length)];
    const roomTypes = ["mock-rt-deluxe", "mock-rt-superior", "mock-rt-suite"];
    const roomTypeId =
      roomTypes[Math.floor(Math.random() * roomTypes.length)];

    bookings.push({
      id: `mock-booking-${i + 1}`,
      propertyId: _propertyId,
      roomTypeId,
      otaName,
      guestName: `Guest ${i + 1}`,
      checkIn: checkIn.toISOString().split("T")[0],
      checkOut: checkOut.toISOString().split("T")[0],
      status: "new",
      totalPrice: (2000 + Math.floor(Math.random() * 3000)) * nights,
      currency: "THB",
    });
  }

  return bookings;
}

export function mockUpdateRates(
  updates: ChannexRateUpdate[]
): ChannexRateUpdateResult[] {
  logger.info("[DEMO] Channex rate push skipped (mock mode)", {
    action: "mock_rate_push",
    count: updates.length,
  });

  return updates.map((u) => ({
    success: true,
    roomTypeId: u.roomTypeId,
    date: u.date,
  }));
}
