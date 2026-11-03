import { test, expect } from '@playwright/test';
import { ADMIN } from './env';

const SHOTS = '../docs/test-evidence/screenshots/live';

/** Visits every page as admin against the real backend and fails on any browser error. */
test('LIVE-00 every page loads without browser errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('response', r => { if (r.url().includes('/api/') && r.status() >= 500) errors.push(`HTTP ${r.status()} ${r.url()}`); });

  await page.goto('/login');
  await page.getByPlaceholder('Enter username').fill(ADMIN.username);
  await page.getByPlaceholder('Enter password').fill(ADMIN.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  for (const [nav, file] of [['Dashboard', 'dashboard'], ['Students', 'students'], ['Subjects', 'subjects'],
                             ['Marks Entry', 'marks'], ['Reports & Analytics', 'reports']] as const) {
    await page.getByRole('button', { name: nav, exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.spinner')).toHaveCount(0);
    if (file === 'dashboard' || file === 'reports') {
      // Wait until Recharts has finished animating the bars (not a fixed sleep)
      await expect.poll(() => page.locator('.recharts-bar-rectangle path').evaluateAll(
        els => Math.min(...els.map(el => (el as SVGGraphicsElement).getBBox().height))), { timeout: 10_000 }).toBeGreaterThan(100);
    }
    await page.screenshot({ path: `${SHOTS}/explore-${file}.png`, fullPage: true });
  }
  expect(errors).toEqual([]);
});
