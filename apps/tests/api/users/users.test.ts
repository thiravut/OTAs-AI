import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT } from '@/app/api/users/me/route';
import { prisma } from '@/lib/db/prisma';

const mockPrisma = vi.mocked(prisma);

vi.mock('@/lib/auth/rbac', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    session: { user: { id: 'user-1', role: 'OWNER' } },
    error: null,
  }),
}));

describe('GET /api/users/me', () => {
  beforeEach(() => vi.clearAllMocks());

  it('แสดงข้อมูลผู้ใช้', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'OWNER',
      notificationChannel: null,
      lineUserId: null,
      telegramChatId: null,
      createdAt: new Date(),
    } as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.email).toBe('test@example.com');
  });

  it('ไม่พบผู้ใช้ → 404', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/users/me', () => {
  beforeEach(() => vi.clearAllMocks());

  it('อัปเดตชื่อสำเร็จ', async () => {
    mockPrisma.user.update.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'New Name',
      role: 'OWNER',
      notificationChannel: null,
      lineUserId: null,
      telegramChatId: null,
      createdAt: new Date(),
    } as any);

    const req = new Request('http://localhost:3000', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name' }),
    });

    const res = await PUT(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.name).toBe('New Name');
  });

  it('ข้อมูลไม่ถูกต้อง → 400', async () => {
    const req = new Request('http://localhost:3000', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });

    const res = await PUT(req);
    expect(res.status).toBe(400);
  });
});
