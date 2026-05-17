import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/employee');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Check for toast error - Sonner uses 'data-sonner-toast'
    await expect(page.locator('[data-sonner-toast]')).toBeVisible();
    await expect(page.locator('[data-sonner-toast]')).toContainText('Invalid login credentials');
  });

  test('should login successfully as employee', async ({ page }) => {
    await page.goto('/login');
    
    // Use Quick Demo Login button - click the one with the 'Employee' text
    await page.click('button:has(span:text-is("Employee"))');
    
    // Increased timeout for redirect
    await expect(page).toHaveURL(/\/employee/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Welcome back');
  });

  test('should login successfully as manager', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has(span:text-is("Manager"))');
    
    await expect(page).toHaveURL(/\/manager/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Manager Overview');
  });

  test('should logout successfully', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Employee")');
    await expect(page).toHaveURL(/\/employee/);
    
    // Click sign out via sidebar form POST
    await page.locator('form[action="/api/auth/signout"] button').click();
    
    // Should be back at login
    await expect(page).toHaveURL(/\/login/);
  });
});
