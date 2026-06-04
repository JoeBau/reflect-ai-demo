import { test, expect } from '@playwright/test';

test('Version 1 - LoadVersion1 purchase flow', async ({ page }) => {
  // Open your app
  await page.goto('https://joebau.github.io/reflect-ai-demo/');

  // Click Shop (Version 1 UI)
  await page.getByRole('link', { name: 'Shop' }).click();

  // Enter email
  await page.getByPlaceholder('Enter email').fill('test@test.com');

  // Click Continue (Version 1 UI)
  await page.getByRole('button', { name: 'Continue' }).click();

  // Verify success message
  await expect(
    page.getByText('Purchase workflow started')
  ).toBeVisible();
});