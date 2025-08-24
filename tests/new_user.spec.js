// @ts-check
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('https://localhost:3000/sign');
});

test.describe('New Todo', () => {
  test('should allow me to add todo items', async ({ page }) => {

  })
})
