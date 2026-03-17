import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/hotels/[hotelId]/push-price/route';
import { prisma } from '@/lib/db/prisma';

const mockPrisma = vi.mocked(prisma);

vi.mock('@/lib/auth/rbac', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    session: { user: { id: 'user-1', role: 'OWNER' } },
    error: null,
  }),
  requireHotelAccess: vi.fn().mockResolvedValue({
    access: { role: 'OWNER', hasAccess: true },
    error: null,
  }),
}));

vi.mock('@/lib/channex/push', () => ({
  pushPrice: vi.fn().mockResolvedValue({
    success: true,
    otaResults: [
      { otaName: 'Agoda', success: true },
      { otaName: 'Booking.com', success: true },
    ],
    logIds: ['log-1', 'log-2'],
  }),
}));

const params = Promise.resolve({ hotelId: 'hotel-1' });

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/hotels/hotel-1/push-price', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/hotels/[hotelId]/push-price', () => {
  beforeEach(() => vi.clearAllMocks());

  it('push ราคาสำเร็จ', async () => {
    mockPrisma.roomType.findFirst.mockResolvedValue({
      id: 'rt-1',
      hotelId: 'hotel-1',
      name: 'Deluxe',
      minPrice: 100000,
      maxPrice: 500000,
      maxDiscountPercent: 20,
    } as any);
    mockPrisma.auditLog.create.mockResolvedValue({} as any);

    const res = await POST(makeRequest({
      roomTypeId: 'rt-1',
      date: '2026-03-20',
      price: 2800,
    }), { params });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.otaResults).toHaveLength(2);
  });

  it('ราคาต่ำกว่าขั้นต่ำ → 400', async () => {
    mockPrisma.roomType.findFirst.mockResolvedValue({
      id: 'rt-1',
      hotelId: 'hotel-1',
      minPrice: 200000, // 2000 baht
      maxPrice: 500000,
    } as any);

    const res = await POST(makeRequest({
      roomTypeId: 'rt-1',
      date: '2026-03-20',
      price: 500, // 500 baht < 2000 min
    }), { params });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('PRICE_BELOW_MIN');
  });

  it('ราคาสูงกว่าขั้นสูง → 400', async () => {
    mockPrisma.roomType.findFirst.mockResolvedValue({
      id: 'rt-1',
      hotelId: 'hotel-1',
      minPrice: 100000,
      maxPrice: 500000, // 5000 baht
    } as any);

    const res = await POST(makeRequest({
      roomTypeId: 'rt-1',
      date: '2026-03-20',
      price: 6000, // 6000 baht > 5000 max
    }), { params });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('PRICE_ABOVE_MAX');
  });

  it('room type ไม่พบ → 404', async () => {
    mockPrisma.roomType.findFirst.mockResolvedValue(null);

    const res = await POST(makeRequest({
      roomTypeId: 'nonexistent',
      date: '2026-03-20',
      price: 2800,
    }), { params });

    expect(res.status).toBe(404);
  });

  it('ข้อมูลไม่ถูกต้อง → 400', async () => {
    const res = await POST(makeRequest({
      roomTypeId: '',
      date: 'invalid',
      price: -100,
    }), { params });

    expect(res.status).toBe(400);
  });
});
