import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/hotels/route';
import { prisma } from '@/lib/db/prisma';

const mockPrisma = vi.mocked(prisma);

// Mock RBAC
vi.mock('@/lib/auth/rbac', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    session: { user: { id: 'user-1', role: 'OWNER' } },
    error: null,
  }),
  requireRole: vi.fn().mockResolvedValue({
    session: { user: { id: 'user-1', role: 'OWNER' } },
    error: null,
  }),
}));

function makePostRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/hotels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/hotels', () => {
  beforeEach(() => vi.clearAllMocks());

  it('แสดงรายการโรงแรม', async () => {
    mockPrisma.hotel.findMany.mockResolvedValue([
      {
        id: 'h-1',
        name: 'โรงแรมทดสอบ',
        location: 'กรุงเทพ',
        totalRooms: 50,
        ownerId: 'user-1',
        owner: { id: 'user-1', name: 'Owner', email: 'o@e.com' },
        _count: { members: 2 },
        createdAt: new Date(),
        deletedAt: null,
      },
    ] as any);
    mockPrisma.hotelUser.findMany.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].name).toBe('โรงแรมทดสอบ');
  });
});

describe('POST /api/hotels', () => {
  beforeEach(() => vi.clearAllMocks());

  it('สร้างโรงแรมสำเร็จ', async () => {
    mockPrisma.hotel.count.mockResolvedValue(0);
    mockPrisma.hotel.create.mockResolvedValue({
      id: 'h-new',
      name: 'โรงแรมใหม่',
      location: 'เชียงใหม่',
      totalRooms: 30,
      ownerId: 'user-1',
      createdAt: new Date(),
    } as any);
    mockPrisma.hotelUser.create.mockResolvedValue({} as any);

    const res = await POST(makePostRequest({
      name: 'โรงแรมใหม่',
      location: 'เชียงใหม่',
      totalRooms: 30,
    }));

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.hotel.name).toBe('โรงแรมใหม่');
  });

  it('เกินจำนวนโรงแรมที่อนุญาต → 403', async () => {
    mockPrisma.hotel.count.mockResolvedValue(5);

    const res = await POST(makePostRequest({ name: 'โรงแรมที่ 6' }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe('HOTEL_LIMIT_EXCEEDED');
  });

  it('ข้อมูลไม่ถูกต้อง → 400', async () => {
    const res = await POST(makePostRequest({ name: '' }));
    expect(res.status).toBe(400);
  });
});
