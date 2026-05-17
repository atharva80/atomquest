import { test, expect } from '@playwright/test';

test.describe('Admin & Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Admin")');
    await expect(page).toHaveURL(/\/admin/);
  });

  test('should view admin dashboard stats', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('System Administration');
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Active Escalations')).toBeVisible();
  });

  test('should view audit logs', async ({ page }) => {
    await page.goto('/admin/audit');
    await expect(page.locator('h1')).toContainText('Audit Trail');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Action")')).toBeVisible();
  });

  test('should navigate to analytics', async ({ page }) => {
    // Analytics is a shared page
    await page.goto('/analytics');
    await expect(page.locator('h1')).toContainText('Enterprise Analytics');
    
    // Check tabs
    await expect(page.locator('button[role="tab"]:has-text("Overview")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Distribution")')).toBeVisible();
    
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
