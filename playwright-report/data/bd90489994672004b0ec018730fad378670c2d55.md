# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: comprehensive-workflow.spec.ts >> Comprehensive AtomQuest Workflow >> Golden Path: Goal Creation -> Approval -> Audit
- Location: tests/comprehensive-workflow.spec.ts:62:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/employee\/goals/
Received string:  "http://localhost:3005/login?next=%2Femployee%2Fgoals"
Timeout: 15000ms

Call log:
  - Expect "toHaveURL" with timeout 15000ms
    34 × unexpected value "http://localhost:3005/login?next=%2Femployee%2Fgoals"

```

```yaml
- img
- text: AtomQuest
- heading "Goal Setting & Tracking for Modern Teams" [level=1]
- paragraph: Align employee objectives with company goals, track quarterly progress, and foster a culture of high performance.
- text: © 2026 Atomberg Technologies •
- link "Privacy Policy":
  - /url: "#"
- text: •
- link "Terms of Service":
  - /url: "#"
- text: Welcome back Sign in to your AtomQuest account Email
- img
- textbox "Email":
  - /placeholder: name@atomberg.com
- text: Password
- link "Forgot password?":
  - /url: "#"
- img
- textbox "Password"
- button "Sign In"
- text: Quick Demo Login
- button "Employee":
  - img
  - text: Employee
- button "Manager":
  - img
  - text: Manager
- button "Admin":
  - img
  - text: Admin
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { createClient } from '@supabase/supabase-js';
  3   | import fs from 'fs';
  4   | import path from 'path';
  5   | import WebSocket from 'ws';
  6   | 
  7   | // Fix for Node.js 20 without native WebSocket
  8   | if (typeof global.WebSocket === 'undefined') {
  9   |   (global as any).WebSocket = WebSocket;
  10  | }
  11  | 
  12  | function loadEnv() {
  13  |   try {
  14  |     const envPath = path.resolve(process.cwd(), '.env.local');
  15  |     const envContent = fs.readFileSync(envPath, 'utf8');
  16  |     const env: Record<string, string> = {};
  17  |     envContent.split('\n').forEach(line => {
  18  |       const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  19  |       if (match) {
  20  |         const key = match[1];
  21  |         let val = match[2] || '';
  22  |         if (val.startsWith('"') && val.endsWith('"')) {
  23  |           val = val.substring(1, val.length - 1);
  24  |         }
  25  |         env[key] = val;
  26  |       }
  27  |     });
  28  |     return env;
  29  |   } catch (e) {
  30  |     return process.env;
  31  |   }
  32  | }
  33  | 
  34  | test.describe('Comprehensive AtomQuest Workflow', () => {
  35  | 
  36  |   const employee = { email: 'dev2@atomberg.com', name: 'Angela Martin' };
  37  |   const manager = { email: 'eng.lead@atomberg.com', name: 'Michael Scott' };
  38  |   const admin = { email: 'admin@atomberg.com', name: 'Sarah Connor' };
  39  | 
  40  |   test.beforeAll(async () => {
  41  |     const env = loadEnv();
  42  |     const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!);
  43  |     
  44  |     // 1. Get Angela Martin profile ID
  45  |     const { data: profile } = await supabase
  46  |       .from('profiles')
  47  |       .select('id')
  48  |       .eq('email', employee.email)
  49  |       .single();
  50  |       
  51  |     if (profile) {
  52  |       const profileId = profile.id;
  53  |       
  54  |       // 2. Delete approvals, check-ins, comments, and goals
  55  |       await supabase.from('approvals').delete().eq('profile_id', profileId);
  56  |       await supabase.from('quarterly_checkins').delete().eq('profile_id', profileId);
  57  |       await supabase.from('manager_comments').delete().eq('profile_id', profileId);
  58  |       await supabase.from('goals').delete().eq('profile_id', profileId);
  59  |     }
  60  |   });
  61  | 
  62  |   test('Golden Path: Goal Creation -> Approval -> Audit', async ({ page }) => {
  63  |     // 1. Employee Login & Goal Creation
  64  |     await page.goto('/login');
  65  |     await page.fill('input[id="email"]', employee.email);
  66  |     await page.fill('input[id="password"]', 'password123');
  67  |     await page.click('button[type="submit"]');
  68  | 
  69  |     // Wait for redirection to complete
  70  |     await expect(page).toHaveURL(/\/employee/, { timeout: 15000 });
  71  |     
  72  |     // Go to goals directly
  73  |     await page.goto('/employee/goals');
  74  |     
  75  |     // Wait for hydration
  76  |     await page.waitForTimeout(1500);
  77  |     
  78  |     const addGoalBtn = page.locator('a[href="/employee/goals/new"]').first();
  79  |     await addGoalBtn.click();
  80  |     
  81  |     // Wait for the form to appear
  82  |     await expect(page.locator('input[id="title"]')).toBeVisible({ timeout: 10000 });
  83  |     await page.fill('input[id="title"]', 'Test Automation Goal');
  84  |     await page.fill('textarea[id="description"]', 'A goal created by Playwright for testing purposes.');
  85  |     
  86  |     // Select thrust area and UOM
  87  |     await page.locator('button[role="combobox"]').first().click();
  88  |     await page.locator('div[role="option"]').first().click();
  89  |     
  90  |     await page.locator('button[role="combobox"]').nth(1).click();
  91  |     await page.locator('div[role="option"]').filter({ hasText: 'Numeric (Minimum)' }).click();
  92  |     
  93  |     await page.fill('input[id="target"]', '100');
  94  |     await page.fill('input[id="weightage"]', '100');
  95  |     
  96  |     await page.click('button[type="submit"]');
  97  |     // Wait for navigation away from the new goal form (router.push fires on success)
  98  |     await page.waitForURL(url => !url.pathname.includes('/goals/new'), { timeout: 20000 });
  99  |     // Explicitly navigate to goals (handles session refresh race with middleware)
  100 |     await page.goto('/employee/goals');
> 101 |     await expect(page).toHaveURL(/\/employee\/goals/, { timeout: 15000 });
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  102 | 
  103 |     // Submit the goal sheet
  104 |     await page.click('button:has-text("Submit for Approval")');
  105 |     await expect(page.locator('text=SUBMITTED').first()).toBeVisible({ timeout: 15000 });
  106 |     
  107 |     // Logout via sidebar form POST
  108 |     await page.locator('form[action="/api/auth/signout"] button').click();
  109 |     await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  110 | 
  111 |     // 2. Manager Approval
  112 |     await page.goto('/login');
  113 |     await page.fill('input[id="email"]', manager.email);
  114 |     await page.fill('input[id="password"]', 'password123');
  115 |     await page.click('button[type="submit"]');
  116 |     
  117 |     await expect(page).toHaveURL(/\/manager/, { timeout: 15000 });
  118 |     await page.goto('/manager/approvals');
  119 |     const angelaCard = page.locator('main .border-indigo-100', { hasText: employee.name });
  120 |     await expect(angelaCard).toBeVisible();
  121 |     
  122 |     // Expand the card first
  123 |     await angelaCard.locator('.cursor-pointer').click();
  124 |     await angelaCard.locator('button:has-text("Approve")').click();
  125 |     await page.click('button:has-text("Confirm")');
  126 |     await expect(page.locator('[data-sonner-toast]')).toContainText('approved');
  127 | 
  128 |     // Logout via sidebar form POST
  129 |     await page.locator('form[action="/api/auth/signout"] button').click();
  130 |     await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  131 | 
  132 |     // 3. Employee Verification
  133 |     await page.goto('/login');
  134 |     await page.fill('input[id="email"]', employee.email);
  135 |     await page.fill('input[id="password"]', 'password123');
  136 |     await page.click('button[type="submit"]');
  137 |     
  138 |     await expect(page).toHaveURL(/\/employee/, { timeout: 10000 });
  139 |     await page.goto('/employee/goals');
  140 |     // The goal should now show 'locked' status badge
  141 |     await expect(page.locator('span').filter({ hasText: 'locked' }).first()).toBeVisible();
  142 | 
  143 |     // Logout via sidebar form POST
  144 |     await page.locator('form[action="/api/auth/signout"] button').click();
  145 |     await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  146 | 
  147 |     // 4. Admin Audit Verification
  148 |     await page.goto('/login');
  149 |     await page.fill('input[id="email"]', admin.email);
  150 |     await page.fill('input[id="password"]', 'password123');
  151 |     await page.click('button[type="submit"]');
  152 |     
  153 |     await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
  154 |     await page.goto('/admin/audit');
  155 |     await expect(page.locator('table tbody tr').first()).toContainText('approved');
  156 |   });
  157 | });
  158 | 
```