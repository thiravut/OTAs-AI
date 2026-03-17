import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as approve } from '@/app/api/hotels/[hotelId]/recommendations/[recommendationId]/approve/route';
import { POST as reject } from '@/app/api/hotels/[hotelId]/recommendations/[recommendationId]/reject/route';
import { prisma } from '@/lib/db/prisma';

const mockPrisma = vi.mocked(prisma);

vi.mock('@/lib/auth/rbac', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    session: { user: { id: 'user-1', role: 'OWNER' } },
    error: null,
  }),
  requireHotelAccess: vi.fn().mockResolvedValue({ access: { role: 'OWNER', hasAccess: true }, error: null }),
}));

const params = Promise.resolve({ hotelId: 'hotel-1', recommendationId: 'rec-1' });

describe('POST /approve', () => {
  beforeEach(() => vi.clearAllMocks());

  it('อนุมัติคำแนะนำสำเร็จ', async () => {
    mockPrisma.recommendation.findFirst.mockResolvedValue({
      id: 'rec-1',
      hotelId: 'hotel-1',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 86400000),
    } as any);
    mockPrisma.recommendation.update.mockResolvedValue({
      id: 'rec-1',
      status: 'APPROVED',
      decidedAt: new Date(),
      decidedBy: { id: 'user-1', name: 'Test' },
    } as any);
    mockPrisma.auditLog.create.mockResolvedValue({} as any);

    const res = await approve(new Request('http://localhost:3000', { method: 'POST' }), { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toBe('อนุมัติแล้ว');
  });

  it('คำแนะนำไม่พบ → 404', async () => {
    mockPrisma.recommendation.findFirst.mockResolvedValue(null);

    const res = await approve(new Request('http://localhost:3000', { method: 'POST' }), { params });
    expect(res.status).toBe(404);
  });

  it('คำแนะนำหมดอายุ → 400', async () => {
    mockPrisma.recommendation.findFirst.mockResolvedValue({
      id: 'rec-1',
      status: 'PENDING',
      expiresAt: new Date(Date.now() - 86400000), // expired yesterday
    } as any);
    mockPrisma.recommendation.update.mockResolvedValue({} as any);

    const res = await approve(new Request('http://localhost:3000', { method: 'POST' }), { params });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('RECOMMENDATION_EXPIRED');
  });

  it('คำแนะนำถูกดำเนินการแล้ว → 409', async () => {
    mockPrisma.recommendation.findFirst.mockResolvedValue({
      id: 'rec-1',
      status: 'APPROVED',
      expiresAt: new Date(Date.now() + 86400000),
    } as any);

    const res = await approve(new Request('http://localhost:3000', { method: 'POST' }), { params });
    expect(res.status).toBe(409);
  });
});

describe('POST /reject', () => {
  beforeEach(() => vi.clearAllMocks());

  it('ปฏิเสธคำแนะนำสำเร็จ', async () => {
    mockPrisma.recommendation.findFirst.mockResolvedValue({
      id: 'rec-1',
      hotelId: 'hotel-1',
      status: 'PENDING',
    } as any);
    mockPrisma.recommendation.update.mockResolvedValue({
      id: 'rec-1',
      status: 'REJECTED',
      rejectionReason: 'PRICE_TOO_HIGH',
      rejectionNote: null,
      decidedAt: new Date(),
      decidedBy: { id: 'user-1', name: 'Test' },
    } as any);
    mockPrisma.auditLog.create.mockResolvedValue({} as any);

    const req = new Request('http://localhost:3000', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejectionReason: 'PRICE_TOO_HIGH' }),
    });

    const res = await reject(req, { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toContain('ปฏิเสธแล้ว');
  });

  it('OTHER ต้องระบุ note → 400', async () => {
    const req = new Request('http://localhost:3000', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejectionReason: 'OTHER' }),
    });

    mockPrisma.recommendation.findFirst.mockResolvedValue({
      id: 'rec-1',
      status: 'PENDING',
    } as any);

    const res = await reject(req, { params });
    expect(res.status).toBe(400);
  });

  it('reason ไม่ถูกต้อง → 400', async () => {
    const req = new Request('http://localhost:3000', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejectionReason: 'INVALID_REASON' }),
    });

    const res = await reject(req, { params });
    expect(res.status).toBe(400);
  });
});
