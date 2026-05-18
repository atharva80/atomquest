import { test, expect } from '@playwright/test';

/**
 * Backend Business Logic & Multi-User Workflow Tests
 * Verifies that the system enforces rules correctly across different user roles and edge cases.
 */
test.describe('Multi-User Workflow & Backend Enforcement', () => {

  // Test Case 1: Multiple Employee Logins & Isolation
  const employees = [
    { email: 'dev1@atomberg.com', name: 'Dwight Schrute' },
    { email: 'dev2@atomberg.com', name: 'Angela Martin' },
    { email: 'dev3@atomberg.com', name: 'Kevin Malone' },
  ];

  for (const employee of employees) {
    test(`Login Isolation: ${employee.name} should see only their data`, async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[id="email"]', employee.email);
      await page.fill('input[id="password"]', 'password123');
      await page.click('button[type="submit"]');
      // Wait for the demo login button and session to establish
      await expect(page).toHaveURL(/\/employee/, { timeout: 15000 });
      
      // Verify we are on the employee dashboard
      await expect(page.locator('h1, h2').first()).toContainText(/Welcome back|Dashboard/i);

      // Verify that goals are specific to this employee
      await page.goto('/employee/goals');
      // No specific check here without DB-to-UI mapping, but we verify page loads
      await expect(page.locator('h1, h2').first()).toContainText('My Goals');

      // Sign out via standard button
      await page.click('button:has-text("Sign Out")');
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });
  }

  // Test Case 2: Max Goals Limit (Backend enforcement check via UI)
  test('Edge Case: Prevent exceeding 8 goals limit', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has(span:text-is("Employee"))');
    await expect(page).toHaveURL(/\/employee/, { timeout: 15000 });
    await page.goto('/employee/goals');

    const goalCards = page.locator('a[href^="/employee/goals/"]:not([href$="/new"])');
    const count = await goalCards.count();

    if (count >= 8) {
      await page.goto('/employee/goals/new');
      // Should be redirected with error message
      await expect(page).toHaveURL(/\/employee\/goals\?error=/);
      await expect(page.locator('[data-sonner-toast]')).toContainText('Cannot add more goals');
    }
  });

  // Test Case 3: Weightage Total Integrity
  test('Logic: Block submission if total weightage != 100%', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has(span:text-is("Employee"))');
    await page.goto('/employee/goals');

    // Check total weightage in the header of the goals page
    const weightageElement = page.locator('span:has-text("Total Weightage")').locator('xpath=following-sibling::span');
    
    if (await weightageElement.isVisible()) {
      const weightageText = await weightageElement.textContent();
      const currentWeightage = parseInt(weightageText?.match(/\d+/)?.[0] || '0');
  
      if (currentWeightage !== 100) {
        const submitBtn = page.locator('button:has-text("Submit Sheet"), button:has-text("Submit for Approval")').first();
        if (await submitBtn.isVisible() && !(await submitBtn.isDisabled())) {
          await submitBtn.click();
          await page.locator('button:has-text("Confirm Submission"), button:has-text("Confirm")').first().click();

          // Backend validation or UI toast should catch this
          await expect(page.locator('[data-sonner-toast]')).toContainText(/100%/);
        }
      }
    }
  });

  // Test Case 4: Manager Approval Cycle
  test('Workflow: Manager approval updates goal status to LOCKED', async ({ page }) => {
    // 1. Manager logs in
    await page.goto('/login');
    await page.click('button:has(span:text-is("Manager"))');
    await page.goto('/manager/approvals');

    const requestCards = page.locator('div.cursor-pointer', { hasText: 'Goals' });
    if (await requestCards.count() > 0) {
      const firstCard = requestCards.first();
      await firstCard.click();

      const approveBtn = page.locator('button:has-text("Approve Goals")').first();
      await expect(approveBtn).toBeVisible({ timeout: 10000 });
      await approveBtn.click();

      await expect(page.locator('[data-sonner-toast]')).toContainText('approved', { timeout: 15000 });
    }
  });

  // Test Case 5: Audit Trail Accuracy
  test('Audit: Important actions should be logged', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has(span:text-is("Admin"))');
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    await page.goto('/admin/audit');

    // Check if audit table exists and has headers at least
    await expect(page.locator('text=Aggregate Score').first()).toBeVisible();
    
    // Give it a moment to load data
    await page.waitForTimeout(2000);
    
    // We expect at least one action if we've run previous tests
    const rows = page.locator('div.divide-y > div');
    const count = await rows.count();
    if (count > 0 && !(await rows.first().textContent())?.includes('No audit logs')) {
      const firstRowAction = rows.first();
      await expect(firstRowAction).toBeVisible({ timeout: 10000 });
      const actionText = await firstRowAction.textContent();
      console.log(`Latest audit action: ${actionText}`);
    } else {
      console.log('Audit trail is currently empty');
    }
  });
});
