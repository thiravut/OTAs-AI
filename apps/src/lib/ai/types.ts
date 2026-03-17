export interface PricingContext {
  hotelName: string;
  roomTypeName: string;
  currentPrice: number; // baht
  pricingBoundaries: {
    minPrice: number | null;
    maxPrice: number | null;
    maxDiscountPercent: number | null;
  };
  recentRates: { date: string; price: number; otaName: string }[];
  bookingPace: {
    totalBookings7Days: number;
    totalBookings14Days: number;
    occupancyRate: number;
  };
  recentFeedback: { reason: string; note: string | null; createdAt: string }[];
}

export interface AIRecommendation {
  roomTypeId: string;
  roomTypeName: string;
  targetDate: string;
  currentPrice: number; // baht
  recommendedPrice: number; // baht
  changePercent: number;
  changeDirection: "up" | "down" | "none";
  reason: string; // Thai
}
