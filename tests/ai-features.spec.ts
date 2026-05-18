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
    const aiSummaryText = page.locator('h4:has-text("AI Performance Insights")').locator('xpath=following-sibling::p').first();
    await expect(aiSummaryText).toBeVisible({ timeout: 15000 });

    // Verify simulation or live insights badge is present
    const aiBadge = page.locator('span:has-text("Simulated")').or(page.locator('span:has-text("Live")')).first();
    await expect(aiBadge).toBeVisible();

    // 3. Verify the Floating Chatbot Trigger Button is visible on the page
    const chatbotTrigger = page.locator('#chatbot-trigger');
    await expect(chatbotTrigger).toBeVisible();

    // 4. Click the chatbot trigger to open the Coach Drawer
    await chatbotTrigger.click();

    // Verify that the Goal Coach panel opened
    const coachHeader = page.locator('h3:has-text("Goal Coach"), text=Goal Coach').first();
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
    await chatbotTrigger.click(); // Standard trigger toggle can close it as well
    await expect(coachHeader).not.toBeVisible();
  });
});
