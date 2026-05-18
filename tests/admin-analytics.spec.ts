import { test, expect } from '@playwright/test';

test.describe('Admin & Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Admin")');
    await expect(page).toHaveURL(/\/admin/);
  });

  test('should view admin dashboard stats', async ({ page }) => {
    await expect(page.locator('h1, h2, h3').first()).toContainText(/System Administration|System Overview/i);
    await expect(page.locator('text=Users').first()).toBeVisible();
    await expect(page.locator('text=Escalations').first()).toBeVisible();
  });

  test('should view audit logs', async ({ page }) => {
    await page.goto('/admin/audit');
    await expect(page.locator('h1').first()).toContainText('System Audit Trail');
    const emptyOrTable = page.locator('text=No audit logs recorded yet.').or(page.locator('text=Action Event'));
    await expect(emptyOrTable.first()).toBeVisible();
  });

  test('should navigate to analytics', async ({ page }) => {
    // Analytics is a shared page
    await page.goto('/analytics');
    await expect(page.locator('h1, h2, h3').first()).toContainText(/Analytics/i);
    
    // Check tabs
    await expect(page.locator('button:has-text("Overview")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Department Trends")').first()).toBeVisible();
    
    // Check charts
    await expect(page.locator('text=Quarterly Progress Trend').first()).toBeVisible();
  });

  test('should check responsiveness on mobile', async ({ page }) => {
    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Desktop sidebar should be hidden
    await expect(page.locator('aside')).not.toBeVisible();
    
    // Wait for hydration
    await page.waitForTimeout(1500);
    
    // Click mobile menu trigger
    const menuBtn = page.locator('header button:has(span:text-is("menu"))');
    await expect(menuBtn).toBeVisible({ timeout: 10000 });
    await menuBtn.click();
    
    // Sidebar should appear in a dialog/sheet
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('[role="dialog"]').locator('text=Dashboard').first()).toBeVisible();
  });
});
