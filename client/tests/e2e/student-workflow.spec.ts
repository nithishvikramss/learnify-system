import { test, expect, type Page } from '@playwright/test';
import { installFakeApi } from './fake-api';

const SHOTS = '../docs/test-evidence/screenshots';

async function login(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.getByPlaceholder('Enter username').fill(username);
  await page.getByPlaceholder('Enter password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

test.beforeEach(async ({ page }) => {
  await installFakeApi(page);
});

test('UI-01 protected page redirects to login when not signed in', async ({ page }) => {
  await page.goto('/students');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Learnify Analytics' })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/UI-01-login-redirect.png` });
});

test('UI-02 wrong password shows an error and stays on login', async ({ page }) => {
  await login(page, 'admin', 'wrong-password');
  await expect(page.getByText('Invalid username or password.')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  await page.screenshot({ path: `${SHOTS}/UI-02-login-error.png` });
});

test('UI-03 admin logs in, sees dashboard, adds a student with validation', async ({ page }) => {
  await login(page, 'admin', 'Admin#2026');
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('Class Average')).toBeVisible();
  await expect(page.getByText('64.5%')).toBeVisible();
  await page.mouse.move(0, 0);          // no hover tooltip in the screenshot
  await page.waitForTimeout(2000);      // Recharts animates bars/pie in over ~1.5 s
  const barHeights = await page.locator('.recharts-bar-rectangle path').evaluateAll(
    els => els.map(e => (e as SVGGraphicsElement).getBBox().height));
  expect(barHeights.length).toBe(2);
  expect(Math.min(...barHeights)).toBeGreaterThan(50); // 59% and 70% bars in a ~175px-high chart
  await page.screenshot({ path: `${SHOTS}/UI-03a-dashboard.png`, fullPage: true });

  await page.getByRole('button', { name: 'Students' }).click();
  await expect(page.getByRole('cell', { name: '23SMS001' })).toBeVisible();
  await page.getByRole('button', { name: 'Add Student' }).click();

  // Submitting an empty form shows field errors and sends nothing
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Name is required')).toBeVisible();
  await expect(page.getByText('Register number is required')).toBeVisible();
  await expect(page.getByText('Department is required')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/UI-03b-validation-errors.png` });

  // Fill a valid student
  await page.getByPlaceholder('e.g. Arun Kumar').fill('Bala Murugan');
  await page.getByPlaceholder('e.g. 21CS001').fill('23sms002');
  await page.locator('select').filter({ hasText: 'Select department' }).selectOption('Mechanical');
  await page.getByPlaceholder('student@example.com').fill('bala@example.edu');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('Student added successfully')).toBeVisible();
  const row = page.getByRole('row', { name: /Bala Murugan/ });
  await expect(row).toContainText('23SMS002'); // register number upper-cased by the form
  await expect(row).toContainText('Mechanical');
  await page.screenshot({ path: `${SHOTS}/UI-03c-student-added.png`, fullPage: true });
});

test('UI-04 duplicate register number shows the server message', async ({ page }) => {
  await login(page, 'admin', 'Admin#2026');
  await page.getByRole('button', { name: 'Students' }).click();
  await page.getByRole('button', { name: 'Add Student' }).click();
  await page.getByPlaceholder('e.g. Arun Kumar').fill('Someone Else');
  await page.getByPlaceholder('e.g. 21CS001').fill('23SMS001');
  await page.locator('select').filter({ hasText: 'Select department' }).selectOption('Civil');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Register number 23SMS001 is already in use.')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/UI-04-duplicate-error.png` });
});

test('UI-05 teacher sees students read-only (no add/edit/delete)', async ({ page }) => {
  await login(page, 'teacher', 'Teach#2026');
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole('button', { name: 'Students' }).click();
  await expect(page.getByRole('cell', { name: '23SMS001' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add Student' })).toHaveCount(0);
  await expect(page.getByTitle('Delete')).toHaveCount(0);
  await expect(page.getByText('Teacher:')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/UI-05-teacher-readonly.png` });
});

test('UI-06 logout returns to login and protects pages again', async ({ page }) => {
  await login(page, 'admin', 'Admin#2026');
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});

test('UI-07 mobile layout: menu button opens the sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'admin', 'Admin#2026');
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'Students' }).click();
  await expect(page).toHaveURL(/\/students$/);
  await expect(page.getByRole('cell', { name: '23SMS001' })).toBeVisible();
  // The page itself must not scroll sideways on a phone (wide tables scroll inside their card)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.waitForTimeout(300); // let the drawer finish sliding closed before the screenshot
  await page.screenshot({ path: `${SHOTS}/UI-07-mobile-students.png`, fullPage: true });
});
