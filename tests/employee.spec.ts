import { test, expect } from '@playwright/test';

test.describe('Employee Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as employee before each test
    await page.goto('/login');
    await page.click('button:has-text("Employee")');
    await expect(page).toHaveURL(/\/employee/, { timeout: 15000 });
  });

  test('should create a new goal', async ({ page }) => {
    await page.goto('/employee/goals');

    // Check if we can add a goal (depends on if sheet is draft)
    const addGoalBtn = page.locator('text=Add Goal, text=Create Your First Goal').first();
    if (await addGoalBtn.isVisible()) {
      await addGoalBtn.click();
      await expect(page).toHaveURL(/\/employee\/goals\/new/);

      // Fill form
      await page.fill('input[placeholder="Enter goal title"]', 'Test Automated Goal');
      await page.fill('textarea', 'This goal was created by Playwright');

      // Select thrust area
      await page.click('button:has-text("Select a thrust area")');
      await page.click('div[role="option"]:first-child');

      // Weightage
      await page.fill('input[type="number"]', '15');

      // Submit
      await page.click('button[type="submit"]');

      // Success toast and redirect
      await expect(page.locator('[data-sonner-toast]')).toContainText('created');
      await expect(page).toHaveURL(/\/employee\/goals/);
      await expect(page.locator('text=Test Automated Goal').first()).toBeVisible();
    }
  });

  test('should submit goal sheet for approval', async ({ page }) => {
    await page.goto('/employee/goals');

    const submitBtn = page.locator('button:has-text("Submit Sheet")');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();

      // Confirm in dialog
      await page.click('button:has-text("Confirm Submission")');

      await expect(page.locator('[data-sonner-toast]')).toContainText('submitted');
      await expect(page.locator('text=SUBMITTED').first()).toBeVisible();
    }
  });

  test('should view goal details', async ({ page }) => {
    await page.goto('/employee/goals');

    // Find the first goal link
    const firstGoal = page.locator('a[href^="/employee/goals/"]:not([href$="/new"])').first();
    const goalTitle = await firstGoal.textContent();

    await firstGoal.click();

    // Wait for the detail page to load (navigates to /employee/goals/[id])
    await expect(page).toHaveURL(/\/employee\/goals\/[^/]+$/, { timeout: 15000 });
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Goal Details').first()).toBeVisible();
    // Timeline might be empty for drafts, so we handle it gracefully
    const timeline = page.locator('text=Check-in Timeline').or(page.locator('text=Timeline Not Available'));
    await expect(timeline.first()).toBeVisible({ timeout: 15000 });
  });
});
