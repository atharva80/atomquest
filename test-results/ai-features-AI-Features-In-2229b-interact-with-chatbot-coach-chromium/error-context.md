# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ai-features.spec.ts >> AI Features Integration >> should load AI progress summary and interact with chatbot coach
- Location: tests/ai-features.spec.ts:4:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/employee/
Received string:  "http://localhost:3005/login"
Timeout: 15000ms

Call log:
  - Expect "toHaveURL" with timeout 15000ms
    11 × unexpected value "http://localhost:3005/login"
    - waiting for" http://localhost:3005/employee" navigation to finish...

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
  - text: dev1@atomberg.com
- text: Password
- link "Forgot password?":
  - /url: "#"
- img
- textbox "Password": password123
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
- region "Notifications alt+T":
  - list:
    - listitem:
      - img
      - text: Logged in successfully
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('AI Features Integration', () => {
  4  |   test('should load AI progress summary and interact with chatbot coach', async ({ page }) => {
  5  |     // 1. Login as Employee
  6  |     await page.goto('/login');
  7  |     await page.click('button:has-text("Employee")');
> 8  |     await expect(page).toHaveURL(/\/employee/, { timeout: 15000 });
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  9  | 
  10 |     // 2. Navigate to goals page to check Progress Summary
  11 |     await page.goto('/employee/goals');
  12 | 
  13 |     // Wait for the AI Performance Insights section to appear
  14 |     const aiSummaryTitle = page.locator('text=AI Performance Insights').first();
  15 |     await expect(aiSummaryTitle).toBeVisible({ timeout: 15000 });
  16 | 
  17 |     // Verify there is an AI dynamic summary text loaded
  18 |     const aiSummaryText = page.locator('p:has-text("progress")').or(page.locator('p:has-text("score")')).first();
  19 |     await expect(aiSummaryText).toBeVisible({ timeout: 15000 });
  20 | 
  21 |     // Verify simulation or live insights badge is present
  22 |     const aiBadge = page.locator('span:has-text("Simulated")').or(page.locator('span:has-text("Insights")')).first();
  23 |     await expect(aiBadge).toBeVisible();
  24 | 
  25 |     // 3. Verify the Floating Chatbot Trigger Button is visible on the page
  26 |     const chatbotTrigger = page.locator('button:has(svg)').last(); // Fixed trigger at bottom right
  27 |     await expect(chatbotTrigger).toBeVisible();
  28 | 
  29 |     // 4. Click the chatbot trigger to open the Coach Drawer
  30 |     await chatbotTrigger.click();
  31 | 
  32 |     // Verify that the Goal Coach panel opened
  33 |     const coachHeader = page.locator('text=Goal Coach').first();
  34 |     await expect(coachHeader).toBeVisible();
  35 | 
  36 |     // Verify suggestion chips are present
  37 |     const firstSuggestion = page.locator('button:has-text("How is my overall score calculated?")').first();
  38 |     await expect(firstSuggestion).toBeVisible();
  39 | 
  40 |     // 5. Click the suggestion chip to send a question
  41 |     await firstSuggestion.click();
  42 | 
  43 |     // Verify that the question got sent and rendered in a user bubble
  44 |     const userBubble = page.locator('div:has-text("How is my overall score calculated?")').first();
  45 |     await expect(userBubble).toBeVisible();
  46 | 
  47 |     // 6. Verify that the AI Coach streams back a response
  48 |     // Wait for the coach bubble to populate text containing "score" or "weightage"
  49 |     const coachBubble = page.locator('div:has-text("weighted")').or(page.locator('div:has-text("individual")')).first();
  50 |     await expect(coachBubble).toBeVisible({ timeout: 15000 });
  51 | 
  52 |     // 7. Test closing the chatbot panel
  53 |     const closeBtn = page.locator('button:has(svg)').nth(-2); // Closing 'X' button is next to last in header
  54 |     await chatbotTrigger.click(); // Standard trigger toggle can close it as well
  55 |     await expect(coachHeader).not.toBeVisible();
  56 |   });
  57 | });
  58 | 
```