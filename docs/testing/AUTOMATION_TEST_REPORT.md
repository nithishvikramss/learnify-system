# UI Automation Test Report — Learnify Student Management System

| | |
|---|---|
| Framework | **Playwright** (`@playwright/test` 1.64.1, TypeScript) |
| Browser | **Microsoft Edge** (installed on the test PC, `channel: 'msedge'`), headless |
| Application | Real React frontend served by the Vite dev server (`npm run dev`, started automatically by Playwright) |
| Backend | **Simulated** in the browser with `page.route()`: `client/tests/e2e/fake-api.ts` |
| Test file | `client/tests/e2e/student-workflow.spec.ts` (7 tests) |
| Config | `client/playwright.config.ts` |
| Date / result | 2026-11-03 · **7 of 7 passed** in the final run (`docs/test-evidence/playwright-run5-final.log`) |

## 1. Why Playwright, and why a simulated backend
- Playwright drives a real browser like a user does (clicks, typing, navigation) and can wait for elements automatically. It can also reuse the Edge browser already on Windows, so no browser download was needed.
- **No MongoDB was reachable** in this environment (see TEST_PLAN.md §7). To still automate the UI, every `/api/...` request is answered by an in-memory fake that follows the **same JSON contracts and role rules** as the real Spring Boot API: the token is required, a teacher gets 403 on student create, and a duplicate register number gives 409. Those server rules are tested separately in the backend suite, so together the two suites cover both sides.
- What this does **not** prove: that the real backend and a real database work together through the UI. That run is still open (DEFECT_LOG OPEN-02).

## 2. Workflows automated

| ID | Workflow | Key steps and checks | Result | Screenshot |
|---|---|---|---|---|
| UI-01 | Route protection | Open `/students` without login → redirected to `/login`, login heading visible | ✅ | `UI-01-login-redirect.png` |
| UI-02 | Failed login | Wrong password → "Invalid username or password.", still on `/login` | ✅ | `UI-02-login-error.png` |
| UI-03 | **Main workflow: admin adds a student** | Login → dashboard shows 64.5% class average, and both chart bars are > 50 px high once animated → Students → Add Student → **Save on an empty form shows 3 field errors** → fill name, register number `23sms002`, department, email → Save → success message → new row shows **`23SMS002`** (upper-cased) and Mechanical | ✅ | `UI-03a-dashboard.png`, `UI-03b-validation-errors.png`, `UI-03c-student-added.png` |
| UI-04 | Duplicate register number | Add a student with existing `23SMS001` → server message "Register number 23SMS001 is already in use." | ✅ | `UI-04-duplicate-error.png` |
| UI-05 | Role-based UI | Login as teacher → Students list visible; **no Add Student and no Delete buttons**; chip shows "Teacher:" | ✅ | `UI-05-teacher-readonly.png` |
| UI-06 | Logout | Logout → `/login`; then open `/dashboard` → redirected to `/login` again | ✅ | — |
| UI-07 | Phone layout (390 × 844) | Menu button opens the drawer → Students → **page width equals screen width (no sideways scroll)** | ✅ (failed in run 4 → DEF-04 fixed) | `UI-07-mobile-students.png` |

Screenshots: [`docs/test-evidence/screenshots/`](../test-evidence/screenshots/). HTML report with every step and attachment: [`docs/test-evidence/playwright-report/index.html`](../test-evidence/playwright-report/index.html). Open it with `npx playwright show-report ../docs/test-evidence/playwright-report`.

## 3. Execution history (honest record)

| Run | Passed | Failed | Notes |
|---|---|---|---|
| 1 | 0 | 7 | Blank page in every test. **Cause: my test harness**. The route pattern `**/api/**` also caught the app's source file `/src/api/api.ts`, so React never loaded (TH-01) |
| 2 | 0 | 7 | Run after a wrong first diagnosis (Vite cold start). That change was reverted |
| 3 | 7 | 0 | Route matcher limited to paths starting with `/api/` |
| 4 | 6 | 1 | Stronger assertions added; **UI-07 found DEF-04** (182 px horizontal overflow on phones). The chart check showed the bars render after the animation (not a defect) |
| 5 (final) | **7** | **0** | DEF-04 fixed in `index.css`; all pass in 17.5 s |

## 4. How to run
```bash
cd client
npm install                 # installs @playwright/test (no browser download: Edge is used)
npm run test:e2e            # starts Vite on :5173 if not running, runs 7 tests headless
npx playwright test --headed          # watch the browser
npx playwright show-report ../docs/test-evidence/playwright-report
```
Requirement: Microsoft Edge installed (default on Windows). On a machine without Edge, run `npx playwright install chromium` and remove `channel: 'msedge'` from `playwright.config.ts`.
