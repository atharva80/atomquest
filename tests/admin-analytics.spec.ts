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
    await expect(page.locator('h1, h2, h3').first()).toContainText(/Audit|Goal/i);
    await expect(page.locator('text=Aggregate Score').first()).toBeVisible();
    await expect(page.locator('text=Active Goals').first()).toBeVisible();
  });

  test('should navigate to analytics', async ({ page }) => {
    // Analytics is a shared page
    await page.goto('/analytics');
    await expect(page.locator('h1, h2, h3').first()).toContainText(/Analytics/i);
    
    // Check tabs
    await expect(page.locator('button:has-text("Overview")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Distribution")').first()).toBeVisible();
    
    // Check charts
    await expect(page.locator('text=Achievement Trend')).toBeVisible();
  });

  test('should check responsiveness on mobile', async ({ page }) => {
    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Desktop sidebar should be hidden
    await expect(page.locator('aside, .w-64').filter({ hasNot: page.locator('[role="dialog"]') })).not.toBeVisible();
    
    // Wait for hydration
    await page.waitForTimeout(1500);

    // Mobile menu button should be visible in Topbar
    const menuBtn = page.locator('header button:has(svg.lucide-menu)');
    await expect(menuBtn).toBeVisible();
    
    // Open menu
    await menuBtn.click();
    
    // Sidebar should appear in a dialog/sheet
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('[role="dialog"]').locator('text=Dashboard')).toBeVisible();
  });
});
