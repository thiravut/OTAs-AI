import { test, expect } from '@playwright/test';

test.describe('ลงทะเบียนและเข้าสู่ระบบ', () => {
  test('แสดงหน้าลงทะเบียน', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /ลงทะเบียน/ })).toBeVisible();
    await expect(page.getByLabel(/อีเมล/)).toBeVisible();
    await expect(page.getByLabel(/รหัสผ่าน/)).toBeVisible();
    await expect(page.getByLabel(/ชื่อ/)).toBeVisible();
  });

  test('แสดงหน้าเข้าสู่ระบบ', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /เข้าสู่ระบบ/ })).toBeVisible();
    await expect(page.getByLabel(/อีเมล/)).toBeVisible();
    await expect(page.getByLabel(/รหัสผ่าน/)).toBeVisible();
  });

  test('redirect ไปหน้า login เมื่อไม่ได้เข้าสู่ระบบ', async ({ page }) => {
    await page.goto('/overview');
    await expect(page).toHaveURL(/login/);
  });

  test('แสดง error เมื่อกรอกข้อมูลไม่ครบ', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: /ลงทะเบียน/ }).click();
    // Form validation should prevent submission or show error
    await expect(page.getByText(/กรุณา|ต้อง|ไม่ถูกต้อง/)).toBeVisible();
  });
});
