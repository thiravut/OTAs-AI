import { describe, it, expect } from 'vitest';
import { bahtToSatang, satangToBaht } from '@/utils/currency';

describe('bahtToSatang', () => {
  it('แปลง 100 บาท → 10000 สตางค์', () => {
    expect(bahtToSatang(100)).toBe(10000);
  });

  it('แปลง 0 บาท → 0', () => {
    expect(bahtToSatang(0)).toBe(0);
  });

  it('ปัดเศษทศนิยม', () => {
    expect(bahtToSatang(99.999)).toBe(10000);
    expect(bahtToSatang(0.005)).toBe(1);
  });

  it('จำนวนทศนิยม 2 ตำแหน่ง', () => {
    expect(bahtToSatang(1500.50)).toBe(150050);
  });
});

describe('satangToBaht', () => {
  it('แปลง 10000 สตางค์ → 100 บาท', () => {
    expect(satangToBaht(10000)).toBe(100);
  });

  it('แปลง 0 → 0', () => {
    expect(satangToBaht(0)).toBe(0);
  });

  it('แปลง 1 สตางค์ → 0.01 บาท', () => {
    expect(satangToBaht(1)).toBe(0.01);
  });
});
