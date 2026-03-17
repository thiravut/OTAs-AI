import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/register/route';
import { prisma } from '@/lib/db/prisma';

const mockPrisma = vi.mocked(prisma);

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ลงทะเบียนสำเร็จ', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashed',
      role: 'OWNER',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      notificationChannel: null,
      lineUserId: null,
      telegramChatId: null,
      verificationCode: null,
      verificationExpires: null,
    } as any);
    mockPrisma.invitation.findMany.mockResolvedValue([]);

    const res = await POST(makeRequest({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    }));

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.message).toBe('ลงทะเบียนสำเร็จ');
    expect(json.user.email).toBe('test@example.com');
  });

  it('อีเมลซ้ำ → 409', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' } as any);

    const res = await POST(makeRequest({
      email: 'existing@example.com',
      password: 'password123',
      name: 'Test',
    }));

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.code).toBe('EMAIL_EXISTS');
  });

  it('ข้อมูลไม่ถูกต้อง → 400', async () => {
    const res = await POST(makeRequest({
      email: 'not-an-email',
      password: '123',
      name: '',
    }));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('VALIDATION_ERROR');
  });

  it('รับ invitation ที่รอดำเนินการอัตโนมัติ', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-new',
      email: 'invited@example.com',
      name: 'Invited',
      passwordHash: 'hashed',
      role: 'OWNER',
    } as any);
    mockPrisma.invitation.findMany.mockResolvedValue([
      {
        id: 'inv-1',
        hotelId: 'hotel-1',
        role: 'REVENUE_MANAGER',
        email: 'invited@example.com',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000),
      },
    ] as any);
    mockPrisma.hotelUser.create.mockResolvedValue({} as any);
    mockPrisma.invitation.update.mockResolvedValue({} as any);

    const res = await POST(makeRequest({
      email: 'invited@example.com',
      password: 'password123',
      name: 'Invited',
    }));

    expect(res.status).toBe(201);
    expect(mockPrisma.hotelUser.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ hotelId: 'hotel-1' }),
      })
    );
  });
});
