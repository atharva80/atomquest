import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

// Fix for Node.js 20 without native WebSocket
if (typeof global.WebSocket === 'undefined') {
  (global as any).WebSocket = WebSocket;
}

function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env: Record<string, string> = {};
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        env[key] = val;
      }
    });
    return env;
  } catch (e) {
    return process.env;
  }
}

/**
 * Edge Case & Business Logic Tests
 * Focuses on backend-enforced constraints and role-based access.
 */
test.describe('Business Logic & Edge Cases', () => {

  test.beforeAll(async () => {
    const env = loadEnv();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // Get Dwight's profile ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'dev1@atomberg.com')
      .single();
      
    if (profile) {
      const profileId = profile.id;
      
      // Delete approvals and reset all goals to 'submitted'
      await supabase.from('approvals').delete().eq('profile_id', profileId);
      await supabase.from('goals').update({ status: 'submitted' }).eq('profile_id', profileId);
    }
  });

  test('Employee 1: Should enforce 100% weightage constraint for submission', async ({ page }) => {
    // Login as Dev User 1
    await page.goto('/login');
    await page.fill('input[id="email"]', 'dev1@atomberg.com');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/employee/);

    await page.goto('/employee/goals');

    // Check current weightage
    const weightageElement = page.locator('span:has-text("Total Weightage")').locator('xpath=following-sibling::span');
    const weightageText = await weightageElement.textContent();
    const currentWeightage = parseInt(weightageText?.match(/\d+/)?.[0] || '0');

    if (currentWeightage < 100) {
      // Try to submit when weightage is < 100%
      const submitBtn = page.locator('button:has-text("Submit Sheet")');
      if (await submitBtn.isVisible() && !(await submitBtn.isDisabled())) {
        await submitBtn.click();
        await page.click('button:has-text("Confirm Submission")');

        // Should show error toast about weightage
        await expect(page.locator('[data-sonner-toast]')).toContainText('Total weightage must be exactly 100%');
      }
    }
  });

  test('Employee 2: Should enforce max 8 goals limit', async ({ page }) => {
    // Login as Dev User 2
    await page.goto('/login');
    // Using manual login with proper wait
    await page.fill('input[id="email"]', 'dev2@atomberg.com');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to employee dashboard to ensure cookies are set
    await expect(page).toHaveURL(/\/employee/, { timeout: 15000 });

    await page.goto('/employee/goals');

    // Count existing goals
    const goalCards = page.locator('a[href^="/employee/goals/"]:not([href$="/new"])');
    const count = await goalCards.count();

    if (count >= 8) {
      // The "Add Goal" button should either be hidden or redirect with error
      const addBtn = page.locator('text=Add Goal, text=Create Goals').first();
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await expect(page).toHaveURL(/\/employee\/goals\?error=/);
        await expect(page.locator('[data-sonner-toast]')).toContainText('Cannot add more goals');
      }
    }
  });

  test('Security: Employee should not be able to access Manager Approvals', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has(span:text-is("Employee"))');
    await expect(page).toHaveURL(/\/employee/, { timeout: 15000 });

    // Attempt to force navigate to manager approvals
    await page.goto('/manager/approvals');

    // Should be redirected or show unauthorized (assuming middleware handles this)
    // In our current middleware, it redirects to / for role-based traffic copping
    await expect(page).not.toHaveURL(/\/manager\/approvals/);
    await expect(page).toHaveURL(/\/employee/);
  });

  test('Workflow: Manager should be able to "Return" a goal sheet', async ({ page }) => {
    // Login as Manager
    await page.goto('/login');
    await page.click('button:has(span:text-is("Manager"))');
    await expect(page).toHaveURL(/\/manager/, { timeout: 10000 });

    await page.goto('/manager/approvals');

    const approvalCards = page.locator('div.bg-white.border-zinc-200');
    if (await approvalCards.count() > 0) {
      const firstCard = approvalCards.first();
      // Expand the card first
      await firstCard.locator('.cursor-pointer').click();
      await firstCard.locator('button:has-text("Return")').click();

      // Should open a dialog for comment
      await expect(page.locator('text=Return for Rework').last()).toBeVisible();
      await page.fill('textarea', 'Test Return: Please adjust weightage.');
      await page.click('button:has-text("Send back to Employee")');

      await expect(page.locator('[data-sonner-toast]')).toContainText('returned');
    }
  });

  test('Integrity: Cannot edit a LOCKED goal', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has(span:text-is("Employee"))');
    await expect(page).toHaveURL(/\/employee/, { timeout: 15000 });

    await page.goto('/employee/goals');

    // Find a locked goal
    const lockedGoal = page.locator('a:has(div:has-text("LOCKED"))').first();
    const count = await lockedGoal.count();
    if (count > 0 && await lockedGoal.isVisible()) {
      await lockedGoal.click();

      // Should NOT see the "Edit Goal" button
      await expect(page.locator('button:has-text("Edit Goal")')).not.toBeVisible();

      // Attempting to force navigate to /edit
      const url = page.url();
      await page.goto(`${url}/edit`);

      // Should redirect back to detail view or goals list
      await expect(page).not.toHaveURL(/\/edit$/);
    }
  });
});
