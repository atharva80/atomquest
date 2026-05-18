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

test.describe('Comprehensive AtomQuest Workflow', () => {

  const employee = { email: 'dev2@atomberg.com', name: 'Angela Martin' };
  const manager = { email: 'eng.lead@atomberg.com', name: 'Michael Scott' };
  const admin = { email: 'admin@atomberg.com', name: 'Sarah Connor' };

  test.beforeAll(async () => {
    const env = loadEnv();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // 1. Get Angela Martin profile ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', employee.email)
      .single();
      
    if (profile) {
      const profileId = profile.id;
      
      // 2. Delete approvals, check-ins, comments, and goals
      await supabase.from('approvals').delete().eq('profile_id', profileId);
      await supabase.from('quarterly_checkins').delete().eq('profile_id', profileId);
      await supabase.from('manager_comments').delete().eq('profile_id', profileId);
      await supabase.from('goals').delete().eq('profile_id', profileId);
    }
  });

  test('Golden Path: Goal Creation -> Approval -> Audit', async ({ page, context }) => {
    // 1. Employee Login & Goal Creation
    // Clear cookies first to ensure no stale sessions
    await context.clearCookies();
    await page.goto('/login');
    await page.fill('input[id="email"]', employee.email);
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirection to complete
    await expect(page).toHaveURL(/\/employee/, { timeout: 15000 });
    
    // Go to goals directly
    await page.goto('/employee/goals');
    
    // Wait for hydration
    await page.waitForTimeout(1500);
    
    const addGoalBtn = page.locator('a[href="/employee/goals/new"]').first();
    await addGoalBtn.click();
    
    // Wait for the form to appear
    await expect(page.locator('input[id="title"]')).toBeVisible({ timeout: 10000 });
    await page.fill('input[id="title"]', 'Test Automation Goal');
    await page.fill('textarea[id="description"]', 'A goal created by Playwright for testing purposes.');
    
    // Select thrust area and UOM
    await page.locator('button[role="combobox"]').first().click();
    await page.locator('div[role="option"]').first().click();
    
    await page.locator('button[role="combobox"]').nth(1).click();
    await page.locator('div[role="option"]').filter({ hasText: 'Numeric (Minimum)' }).click();
    
    await page.fill('input[id="target"]', '100');
    await page.fill('input[id="weightage"]', '100');
    
    await page.click('button[type="submit"]');
    // Wait for navigation away from the new goal form (router.push fires on success)
    await page.waitForURL(url => !url.pathname.includes('/goals/new'), { timeout: 20000 });
    // Explicitly navigate to goals (handles session refresh race with middleware)
    await page.goto('/employee/goals');
    await expect(page).toHaveURL(/\/employee\/goals/, { timeout: 15000 });

    // Submit the goal sheet
    await page.click('button:has-text("Submit for Approval")');
    await expect(page.locator('text=SUBMITTED').first()).toBeVisible({ timeout: 15000 });
    
    // Logout via standard sidebar button
    await page.click('button:has-text("Sign Out")');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // 2. Manager Approval
    await page.goto('/login');
    await page.fill('input[id="email"]', manager.email);
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/manager/, { timeout: 15000 });
    await page.goto('/manager/approvals');
    
    // Click on Angela Martin's pending approval card
    const requestCard = page.locator('div.cursor-pointer', { hasText: employee.name }).first();
    await expect(requestCard).toBeVisible({ timeout: 10000 });
    await requestCard.click();
    
    // Click on Approve Goals button directly in the detail view
    const approveBtn = page.locator('button:has-text("Approve Goals")').first();
    await expect(approveBtn).toBeVisible({ timeout: 10000 });
    await approveBtn.click();
    await expect(page.locator('[data-sonner-toast]')).toContainText('approved', { timeout: 15000 });

    // Logout via standard sidebar button
    await page.click('button:has-text("Sign Out")');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // 3. Employee Verification
    await page.goto('/login');
    await page.fill('input[id="email"]', employee.email);
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/employee/, { timeout: 10000 });
    await page.goto('/employee/goals');
    // The goal should now show 'locked' status badge
    await expect(page.locator('span').filter({ hasText: 'locked' }).first()).toBeVisible();

    // Logout via standard sidebar button
    await page.click('button:has-text("Sign Out")');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // 4. Admin Audit Verification
    await page.goto('/login');
    await page.fill('input[id="email"]', admin.email);
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
    await page.goto('/admin/audit');
    await expect(page.locator('table tbody tr').first()).toContainText('approved');
  });
});
