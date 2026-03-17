import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  // These tests require authentication - skip in CI without auth setup
  test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium only');

  test('แสดงหน้าแรกของแอป', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/RateGenie/)).toBeVisible();
  });

  test('หน้า login มี link ไป register', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page.getByRole('link', { name: /ลงทะเบียน/ });
    await expect(registerLink).toBeVisible();
  });

  test('หน้า register มี link ไป login', async ({ page }) => {
    await page.goto('/register');
    const loginLink = page.getByRole('link', { name: /เข้าสู่ระบบ/ });
    await expect(loginLink).toBeVisible();
  });
});
