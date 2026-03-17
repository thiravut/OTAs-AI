export interface ChannexProperty {
  id: string;
  title: string;
  currency: string;
  country: string;
}

export interface ChannexRoomType {
  id: string;
  propertyId: string;
  title: string;
  occupancy: number;
}

export interface ChannexRate {
  roomTypeId: string;
  date: string;
  rate: number;
  currency: string;
}

export interface ChannexBooking {
  id: string;
  propertyId: string;
  roomTypeId: string;
  otaName: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: "new" | "modified" | "cancelled";
  totalPrice: number;
  currency: string;
  rawData?: Record<string, unknown>;
}

export interface ChannexWebhookPayload {
  event: string;
  property_id: string;
  data: ChannexBooking | Record<string, unknown>;
}

export interface ChannexAvailability {
  roomTypeId: string;
  date: string;
  available: number;
  total: number;
}

export interface ChannexRateUpdate {
  roomTypeId: string;
  date: string;
  rate: number;
  currency: string;
}

export interface ChannexRateUpdateResult {
  success: boolean;
  roomTypeId: string;
  date: string;
  error?: string;
}
