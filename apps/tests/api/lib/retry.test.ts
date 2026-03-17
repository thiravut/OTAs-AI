import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withRetry } from '@/utils/retry';

describe('withRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('สำเร็จในครั้งแรก', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn, { maxRetries: 3, baseDelayMs: 0 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retry แล้วสำเร็จ', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockResolvedValue('success');

    const result = await withRetry(fn, { maxRetries: 3, baseDelayMs: 0 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('ใช้ retry หมดแล้ว throw error', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fail'));

    await expect(
      withRetry(fn, { maxRetries: 2, baseDelayMs: 0 })
    ).rejects.toThrow('always fail');
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });
});
