import { expect, test } from '@playwright/test';

test.describe('public pages', () => {
  test('landing page renders the value proposition', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Own your audience.' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Overview/i })).toBeVisible();
  });

  test('login page renders the sign-in form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create one' })).toBeVisible();
  });

  test('join landing page shows the follow CTA', async ({ page }) => {
    await page.goto('/join/demo-code');
    await expect(page.getByText('demo-code')).toBeVisible();
    await expect(page.getByRole('link', { name: /Follow|متابعة|עקוב/ })).toBeVisible();
  });
});

test.describe('auth gating', () => {
  test('unauthenticated dashboard access redirects to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });
});

test.describe('accessibility basics', () => {
  test('document declares language and direction', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('html')).toHaveAttribute('lang', /^(ar|he|en)$/);
    await expect(page.locator('html')).toHaveAttribute('dir', /^(ltr|rtl)$/);
  });

  test('form controls have programmatic labels', async ({ page }) => {
    await page.goto('/login');
    // getByLabel resolves only through a proper label→control association.
    await expect(page.getByLabel('Email')).toBeEditable();
    await expect(page.getByLabel('Password')).toBeEditable();
  });
});
