import { test, expect, type Page, type Locator } from '@playwright/test';
import { ADMIN, TEACHER } from './env';

/**
 * LIVE end-to-end workflows: real React app + real Spring Boot API + real MongoDB.
 * Each test only touches records it creates (register number LIVEUI01, subject code LIVE-UI)
 * and deletes them again through the UI.
 */
const SHOTS = '../docs/test-evidence/screenshots/live';
const REG = 'LIVEUI01';
const SUBJECT_CODE = 'LIVE-UI';
const STAFF_USER = 'liveui.staff';

test.describe.configure({ mode: 'serial' });

/** Selects the first <option> whose text contains `text` (selectOption has no partial-label match). */
async function selectContaining(select: Locator, text: string) {
  const value = await select.locator('option', { hasText: text }).first().getAttribute('value');
  expect(value, `option containing "${text}"`).toBeTruthy();
  await select.selectOption(value!);
}

/** Removes leftovers of an interrupted earlier run: only this test's own student and subject. */
test.beforeAll(async ({ request }) => {
  const login = await request.post('/api/auth/login', { data: ADMIN });
  const { token } = await login.json();
  const headers = { Authorization: `Bearer ${token}` };
  for (const s of await (await request.get(`/api/students?search=${REG}`, { headers })).json()) {
    if (s.registerNumber === REG) await request.delete(`/api/students/${s.id}`, { headers });
  }
  for (const u of await (await request.get('/api/users', { headers })).json()) {
    if (u.username === STAFF_USER) await request.delete(`/api/users/${u.id}`, { headers });
  }
  for (const s of await (await request.get('/api/subjects', { headers })).json()) {
    if (s.code === SUBJECT_CODE) await request.delete(`/api/subjects/${s.id}?cascade=true`, { headers });
  }
});

async function login(page: Page, user: { username: string; password: string }) {
  await page.goto('/login');
  await page.getByPlaceholder('Enter username').fill(user.username);
  await page.getByPlaceholder('Enter password').fill(user.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function go(page: Page, nav: string) {
  await page.getByRole('button', { name: nav, exact: true }).click();
  await expect(page.locator('.spinner')).toHaveCount(0);
}

/** Calls the real API with the browser's own session token (to read back what the UI saved). */
async function api<T>(page: Page, path: string): Promise<T> {
  const token = await page.evaluate(() => JSON.parse(sessionStorage.getItem('sms.session') || '{}').token);
  const res = await page.request.get(`/api${path}`, { headers: { Authorization: `Bearer ${token}` } });
  expect(res.ok()).toBeTruthy();
  return res.json() as Promise<T>;
}

test('LIVE-01 login rejects a wrong password and accepts the real admin', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder('Enter username').fill(ADMIN.username);
  await page.getByPlaceholder('Enter password').fill('definitely-wrong');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText('Invalid username or password.')).toBeVisible();
  await login(page, ADMIN);
  await expect(page.getByText('Administrator:')).toBeVisible();
});

test('LIVE-02 dashboard figures come from the database', async ({ page }) => {
  await login(page, ADMIN);
  const summary = await api<{ totalStudents: number; classAverage: number; topPerformerName: string }>(page, '/analytics/summary');
  const card = (label: string) => page.locator('.metric-card', { hasText: label });
  await expect(card('Total Students').locator('.metric-value')).toHaveText(String(summary.totalStudents));
  await expect(card('Class Average').locator('.metric-value')).toHaveText(`${summary.classAverage}%`);
  await expect(card('Top Performer').locator('.metric-value')).toHaveText(summary.topPerformerName);
  await page.mouse.move(0, 0);
  await expect.poll(() => page.locator('.recharts-bar-rectangle path').evaluateAll(
    els => Math.min(...els.map(el => (el as SVGGraphicsElement).getBBox().height))), { timeout: 10_000 }).toBeGreaterThan(100);
  await page.screenshot({ path: `${SHOTS}/LIVE-02-dashboard.png`, fullPage: true });
});

test('LIVE-03 student CRUD through the UI is persisted', async ({ page }) => {
  await login(page, ADMIN);
  await go(page, 'Students');
  const before = (await api<unknown[]>(page, '/students')).length;

  // Create: empty form shows validation errors, then a valid save
  await page.getByRole('button', { name: 'Add Student' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Register number is required')).toBeVisible();
  await page.getByPlaceholder('e.g. Arun Kumar').fill('Live UI Student');
  await page.getByPlaceholder('e.g. 21CS001').fill(REG.toLowerCase());
  await page.locator('select').filter({ hasText: 'Select department' }).selectOption('Civil');
  await page.getByPlaceholder('student@example.com').fill('live.ui@example.edu');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Student added successfully')).toBeVisible();
  expect((await api<unknown[]>(page, '/students')).length).toBe(before + 1);

  // Search by register number, then reload the page: the record is still there (stored in MongoDB)
  await page.reload();
  await page.getByPlaceholder('Search name or register no…').fill(REG);
  const row = page.getByRole('row', { name: /Live UI Student/ });
  await expect(row).toContainText(REG);

  // Update
  await row.getByTitle('Edit').click();
  await page.locator('.modal select').first().selectOption('Mechanical');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Student updated successfully')).toBeVisible();
  await expect(page.getByRole('row', { name: /Live UI Student/ })).toContainText('Mechanical');
  const saved = await api<{ registerNumber: string; department: string }[]>(page, `/students?search=${REG}`);
  expect(saved[0]).toMatchObject({ registerNumber: REG, department: 'Mechanical' });

  // View details
  await page.getByRole('row', { name: /Live UI Student/ }).getByTitle('View details').click();
  const dialog = page.getByRole('dialog', { name: 'Student details' });
  await expect(dialog).toContainText(REG);
  await expect(dialog).toContainText('No marks recorded for this student yet.');
  await page.screenshot({ path: `${SHOTS}/LIVE-03-student-details.png` });
  await dialog.getByRole('button', { name: 'Close' }).click();
});

test('LIVE-04 subjects and marks: create, filter, edit, report card, CSV', async ({ page }) => {
  await login(page, ADMIN);

  // Subject create + edit
  await go(page, 'Subjects');
  await page.getByRole('button', { name: 'Add Subject' }).click();
  await page.getByPlaceholder('e.g. Mathematics').fill('Live UI Subject');
  await page.getByPlaceholder('e.g. MATH101').fill(SUBJECT_CODE);
  await page.locator('.modal input[type=number]').fill('50');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Subject added')).toBeVisible();
  await expect(page.getByRole('row', { name: /Live UI Subject/ })).toContainText('50');

  // Marks entry for the test student: over-max is refused, then a valid entry
  await go(page, 'Marks Entry');
  await page.getByRole('button', { name: 'Enter Marks' }).click();
  await selectContaining(page.locator('.modal select').first(), REG);
  const row = page.locator('.marks-row').first();
  await row.locator('select').selectOption({ label: 'Live UI Subject (max 50)' });
  await row.getByPlaceholder('Int.').fill('30');
  await row.getByPlaceholder('Ext.').fill('25');
  await page.getByRole('button', { name: 'Save Marks' }).click();
  await expect(page.getByText('Total cannot exceed 50')).toBeVisible();
  await row.getByPlaceholder('Ext.').fill('10');
  await page.getByRole('button', { name: 'Save Marks' }).click();
  await expect(page.getByText('Marks saved for 1 subject(s)')).toBeVisible();

  // Filters
  await page.getByLabel('Search marks by student').fill('Live UI');
  await page.getByLabel('Filter by subject').selectOption({ label: 'Live UI Subject' });
  const marksRow = page.getByRole('row', { name: /Live UI Student/ });
  await expect(marksRow).toHaveCount(1);
  await expect(marksRow).toContainText('40 / 50');
  await page.getByLabel('Filter by result').selectOption('fail');
  await expect(page.getByText('No marks match your filters.')).toBeVisible();
  await page.getByLabel('Filter by result').selectOption('');

  // Edit the marks
  await marksRow.getByTitle('Edit').click();
  await page.locator('.modal input[type=number]').first().fill('35');
  await page.locator('.modal').getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(/Marks updated for Live UI Student/)).toBeVisible();
  await expect(page.getByRole('row', { name: /Live UI Student/ })).toContainText('45 / 50');
  await page.screenshot({ path: `${SHOTS}/LIVE-04-marks-filtered.png` });

  // Report card + CSV download
  await go(page, 'Reports & Analytics');
  await page.getByRole('button', { name: 'Student Report Card' }).click();
  await selectContaining(page.locator('select').first(), REG);
  await page.getByRole('button', { name: 'View Report' }).click();
  await expect(page.locator('.print-area')).toContainText('Live UI Subject');
  await expect(page.locator('.print-area')).toContainText('90%');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  expect((await download).suggestedFilename()).toBe(`report-card-${REG}.csv`);
  await expect(page.getByRole('button', { name: 'Print' })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/LIVE-04-report-card.png`, fullPage: true });

  // Weak students tab works with a threshold
  await page.getByRole('button', { name: 'Weak Students' }).click();
  await page.locator('input[type=number]').fill('50');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByText(/Students Below 50%/)).toBeVisible();
});

test('LIVE-05 teacher: read-only students, can view details, cannot see admin actions', async ({ page }) => {
  await login(page, TEACHER);
  await expect(page.getByText('Teacher:')).toBeVisible();
  await go(page, 'Students');
  await expect(page.getByRole('button', { name: 'Add Student' })).toHaveCount(0);
  await expect(page.getByTitle('Delete')).toHaveCount(0);
  await page.getByPlaceholder('Search name or register no…').fill(REG);
  await page.getByRole('row', { name: /Live UI Student/ }).getByTitle('View details').click();
  await expect(page.getByRole('dialog', { name: 'Student details' })).toContainText('Live UI Subject');
  await page.getByRole('button', { name: 'Close' }).click();
  await go(page, 'Subjects');
  await expect(page.getByRole('button', { name: 'Add Subject' })).toHaveCount(0);
  await go(page, 'Marks Entry');
  await expect(page.getByRole('button', { name: 'Enter Marks' })).toBeEnabled();
  await page.screenshot({ path: `${SHOTS}/LIVE-05-teacher-marks.png` });
});

test('LIVE-06 clean-up through the UI: delete marks, subject (cascade) and student', async ({ page }) => {
  await login(page, ADMIN);
  page.on('dialog', d => d.accept()); // confirm() prompts

  await go(page, 'Marks Entry');
  await page.getByLabel('Search marks by student').fill('Live UI');
  await page.getByRole('row', { name: /Live UI Student/ }).getByTitle('Delete').click();
  await expect(page.getByText('Marks deleted')).toBeVisible();

  await go(page, 'Subjects');
  await page.getByRole('row', { name: /Live UI Subject/ }).getByTitle('Delete').click();
  await expect(page.getByText('Live UI Subject deleted')).toBeVisible();

  await go(page, 'Students');
  await page.getByPlaceholder('Search name or register no…').fill(REG);
  await page.getByRole('row', { name: /Live UI Student/ }).getByTitle('Delete').click();
  await expect(page.getByText('Live UI Student deleted')).toBeVisible();
  expect(await api<unknown[]>(page, `/students?search=${REG}`)).toEqual([]);
});

test('LIVE-08 staff accounts: admin creates, disables and deletes a teacher', async ({ page }) => {
  await login(page, ADMIN);
  page.on('dialog', d => d.accept());
  await go(page, 'Staff');
  await expect(page.getByRole('row', { name: /admin/ })).toContainText('Administrator');

  await page.getByRole('button', { name: 'Add Teacher' }).click();
  await page.getByRole('button', { name: 'Create Account' }).click();
  await expect(page.getByText('Full name is required')).toBeVisible();
  await page.getByLabel('Full Name').fill('Live Staff');
  await page.getByLabel('Username').fill(STAFF_USER);
  await page.getByLabel('Initial Password').fill('StaffPass#2026');
  await page.getByRole('button', { name: 'Create Account' }).click();
  const row = page.getByRole('row', { name: /liveui\.staff/ });
  await expect(row).toContainText('Active');
  await page.screenshot({ path: `${SHOTS}/LIVE-08-staff.png` });

  await row.getByRole('button', { name: 'Disable' }).click();
  await expect(row).toContainText('Disabled');
  await row.getByRole('button', { name: 'Enable' }).click();
  await expect(row).toContainText('Active');
  await row.getByTitle('Delete').click();
  await expect(row).toHaveCount(0);
});

test('LIVE-09 teacher has no staff page; change-password form validates', async ({ page }) => {
  await login(page, TEACHER);
  await expect(page.getByRole('button', { name: 'Staff', exact: true })).toHaveCount(0);
  await page.goto('/staff');
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole('button', { name: 'Change Password' }).click();
  const dialog = page.getByRole('dialog', { name: 'Change password' });
  await dialog.getByLabel('Current Password').fill('wrong-current');
  await dialog.getByLabel('New Password', { exact: true }).fill('NewSecret#2026');
  await dialog.getByLabel('Confirm New Password').fill('different');
  await dialog.getByRole('button', { name: 'Change Password' }).click();
  await expect(dialog.getByText('Passwords do not match')).toBeVisible();
  await dialog.getByLabel('Confirm New Password').fill('NewSecret#2026');
  await dialog.getByRole('button', { name: 'Change Password' }).click();
  await expect(dialog.getByText('Current password is incorrect.')).toBeVisible();
});

test('LIVE-10 pagination on students and marks, with filters', async ({ page }) => {
  await login(page, ADMIN);
  await go(page, 'Students');
  const total = (await api<unknown[]>(page, '/students')).length;
  expect(total, 'demo data has more than one page').toBeGreaterThan(10);
  await expect(page.getByText(`Showing 1–10 of ${total}`)).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(10);
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByText(`Showing 11–${Math.min(20, total)} of ${total}`)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous page' })).toBeEnabled();

  await page.getByLabel('Rows per page').selectOption('25');
  await expect(page.getByText(`Showing 1–${Math.min(25, total)} of ${total}`)).toBeVisible();

  // A filter applies across all pages and resets to the first page
  await page.getByLabel('Filter by department').selectOption('Civil');
  const civil = (await api<unknown[]>(page, '/students?department=Civil')).length;
  await expect(page.getByText(`Showing 1–${civil} of ${civil}`)).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/LIVE-10-students-filtered.png` });

  await go(page, 'Marks Entry');
  await expect(page.locator('tbody tr')).toHaveCount(10);
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByText(/Showing 11–20 of/)).toBeVisible();
  await page.getByLabel('Filter by result').selectOption('fail');
  await expect(page.getByText(/Showing 1–/)).toBeVisible();
  await expect(page.locator('tbody .badge-danger').first()).toBeVisible();
  await expect(page.locator('tbody .badge-success')).toHaveCount(0);
  await page.screenshot({ path: `${SHOTS}/LIVE-10-marks-paged.png` });
});

test('LIVE-07 logout ends the session', async ({ page }) => {
  await login(page, ADMIN);
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/students');
  await expect(page).toHaveURL(/\/login$/);
});
