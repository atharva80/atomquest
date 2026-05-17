import { test, expect } from '@playwright/test';

test.describe('AI Features Integration', () => {
  test('should load AI progress summary and interact with chatbot coach', async ({ page }) => {
    // 1. Login as Employee
    await page.goto('/login');
    await page.click('button:has-text("Employee")');
    await expect(page).toHaveURL(/\/employee/, { timeout: 15000 });

    // 2. Navigate to goals page to check Progress Summary
    await page.goto('/employee/goals');

    // Wait for the AI Performance Insights section to appear
    const aiSummaryTitle = page.locator('text=AI Performance Insights').first();
    await expect(aiSummaryTitle).toBeVisible({ timeout: 15000 });

    // Verify there is an AI dynamic summary text loaded
    const aiSummaryText = page.locator('p:has-text("progress")').or(page.locator('p:has-text("score")')).first();
    await expect(aiSummaryText).toBeVisible({ timeout: 15000 });

    // Verify simulation or live insights badge is present
    const aiBadge = page.locator('span:has-text("Simulated")').or(page.locator('span:has-text("Insights")')).first();
    await expect(aiBadge).toBeVisible();

    // 3. Verify the Floating Chatbot Trigger Button is visible on the page
    const chatbotTrigger = page.locator('button:has(svg)').last(); // Fixed trigger at bottom right
    await expect(chatbotTrigger).toBeVisible();

    // 4. Click the chatbot trigger to open the Coach Drawer
    await chatbotTrigger.click();

    // Verify that the Goal Coach panel opened
    const coachHeader = page.locator('text=Goal Coach').first();
    await expect(coachHeader).toBeVisible();

    // Verify suggestion chips are present
    const firstSuggestion = page.locator('button:has-text("How is my overall score calculated?")').first();
    await expect(firstSuggestion).toBeVisible();

    // 5. Click the suggestion chip to send a question
    await firstSuggestion.click();

    // Verify that the question got sent and rendered in a user bubble
    const userBubble = page.locator('div:has-text("How is my overall score calculated?")').first();
    await expect(userBubble).toBeVisible();

    // 6. Verify that the AI Coach streams back a response
    // Wait for the coach bubble to populate text containing "score" or "weightage"
    const coachBubble = page.locator('div:has-text("weighted")').or(page.locator('div:has-text("individual")')).first();
    await expect(coachBubble).toBeVisible({ timeout: 15000 });

    // 7. Test closing the chatbot panel
    const closeBtn = page.locator('button:has(svg)').nth(-2); // Closing 'X' button is next to last in header
    await chatbotTrigger.click(); // Standard trigger toggle can close it as well
    await expect(coachHeader).not.toBeVisible();
  });
});
