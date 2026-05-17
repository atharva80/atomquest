import { test, expect } from '@playwright/test';

test.describe('Manager Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Manager")');
    await expect(page).toHaveURL(/\/manager/);
  });

  test('should view team dashboard', async ({ page }) => {
    await expect(page.locator('h1, h2, h3').first()).toContainText(/Manager Overview|Team Dashboard/i);
  });

  test('should review pending approvals', async ({ page }) => {
    await page.goto('/manager/approvals');
    
    await expect(page.locator('h1, h2, h3').first()).toContainText(/Approvals/i);
    
    const approvalCards = page.locator('.rounded-xl'); // Assuming Card uses rounded-xl
    const count = await approvalCards.count();
    
    if (count > 0) {
      await expect(approvalCards.first()).toBeVisible();
    } else {
      await expect(page.locator('text=No pending')).toBeVisible();
    }
  });

  test('should view team check-ins', async ({ page }) => {
    await page.goto('/manager/check-ins');
    await expect(page.locator('h1, h2, h3').first()).toContainText(/Check-in/i);
    
    // Check if any check-ins are present
    const checkinCards = page.locator('.rounded-xl');
    if (await checkinCards.count() > 0) {
      await expect(checkinCards.first().locator('text=Status')).toBeVisible();
    }
  });
});
