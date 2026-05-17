# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-analytics.spec.ts >> Admin & Analytics >> should view audit logs
- Location: tests/admin-analytics.spec.ts:16:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1, h2, h3').first()
Expected pattern: /Audit|Goal/i
Received string:  "Sarah Connor"
Timeout: 15000ms

Call log:
  - Expect "toContainText" with timeout 15000ms
  - waiting for locator('h1, h2, h3').first()
    34 × locator resolved to <h2 class="font-page-title text-page-title font-semibold text-zinc-900 mb-1">…</h2>
       - unexpected value "Sarah Connor"

```

```yaml
- heading "Sarah Connor" [level=2]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Admin & Analytics', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/login');
  6  |     await page.click('button:has-text("Admin")');
  7  |     await expect(page).toHaveURL(/\/admin/);
  8  |   });
  9  | 
  10 |   test('should view admin dashboard stats', async ({ page }) => {
  11 |     await expect(page.locator('h1, h2, h3').first()).toContainText(/System Administration|System Overview/i);
  12 |     await expect(page.locator('text=Users').first()).toBeVisible();
  13 |     await expect(page.locator('text=Escalations').first()).toBeVisible();
  14 |   });
  15 | 
  16 |   test('should view audit logs', async ({ page }) => {
  17 |     await page.goto('/admin/audit');
> 18 |     await expect(page.locator('h1, h2, h3').first()).toContainText(/Audit|Goal/i);
     |                                                      ^ Error: expect(locator).toContainText(expected) failed
  19 |     await expect(page.locator('text=Aggregate Score').first()).toBeVisible();
  20 |     await expect(page.locator('text=Active Goals').first()).toBeVisible();
  21 |   });
  22 | 
  23 |   test('should navigate to analytics', async ({ page }) => {
  24 |     // Analytics is a shared page
  25 |     await page.goto('/analytics');
  26 |     await expect(page.locator('h1, h2, h3').first()).toContainText(/Analytics/i);
  27 |     
  28 |     // Check tabs
  29 |     await expect(page.locator('button:has-text("Overview")').first()).toBeVisible();
  30 |     await expect(page.locator('button:has-text("Distribution")').first()).toBeVisible();
  31 |     
  32 |     // Check charts
  33 |     await expect(page.locator('text=Achievement Trend')).toBeVisible();
  34 |   });
  35 | 
  36 |   test('should check responsiveness on mobile', async ({ page }) => {
  37 |     // Resize to mobile
  38 |     await page.setViewportSize({ width: 375, height: 667 });
  39 |     
  40 |     // Desktop sidebar should be hidden
  41 |     await expect(page.locator('aside, .w-64').filter({ hasNot: page.locator('[role="dialog"]') })).not.toBeVisible();
  42 |     
  43 |     // Wait for hydration
  44 |     await page.waitForTimeout(1500);
  45 | 
  46 |     // Mobile menu button should be visible in Topbar
  47 |     const menuBtn = page.locator('header button:has(svg.lucide-menu)');
  48 |     await expect(menuBtn).toBeVisible();
  49 |     
  50 |     // Open menu
  51 |     await menuBtn.click();
  52 |     
  53 |     // Sidebar should appear in a dialog/sheet
  54 |     await expect(page.locator('[role="dialog"]')).toBeVisible();
  55 |     await expect(page.locator('[role="dialog"]').locator('text=Dashboard')).toBeVisible();
  56 |   });
  57 | });
  58 | 
```