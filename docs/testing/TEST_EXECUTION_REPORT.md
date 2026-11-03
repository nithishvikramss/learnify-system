# Test Execution Report — Learnify Student Management System

**Execution date:** 2026-11-03 · **Environment:** Windows 11, JDK 25.0.2, Maven Wrapper, Node 24.14.1, Microsoft Edge (see TEST_PLAN.md §4)
All numbers below come from the actual runs. The raw logs are in [`docs/test-evidence/`](../test-evidence/).

## 1. Summary (final run)

| Suite | Tool | Executed | Passed | Failed | Evidence |
|---|---|---|---|---|---|
| Backend unit + component tests | JUnit 5 / Mockito / MockMvc | **124** | **124** | 0 | `test-evidence/run2-after-fixes.log`; `server/target/surefire-reports/` |
| Frontend unit tests | Node test runner | **15** | **15** | 0 | `test-evidence/frontend-final.log` |
| UI workflow tests | Playwright (Edge) | **7** | **7** | 0 | `test-evidence/playwright-run5-final.log`; `test-evidence/playwright-report/index.html`; `test-evidence/screenshots/` |
| **Total** | | **146** | **146** | **0** | |

Defects found by these tests: **4** (all fixed and re-tested; see DEFECT_LOG.md).

## 2. Run history

| Run | Suite | Result | What happened |
|---|---|---|---|
| Baseline | Backend (50 pre-existing tests) | 50/50 passed | Coverage baseline taken (`jacoco-baseline.csv`) before new QA tests were added |
| Backend run 1 | Backend, 124 tests (74 new) | **121 passed, 3 failed** | Failures revealed **DEF-01**, **DEF-02**, **DEF-03** (`run1-before-fixes.log`) |
| Backend run 2 | Backend, 124 tests after fixes | **124 passed** | All three fixes confirmed (`run2-after-fixes.log`) |
| Frontend unit | 15 tests | 15 passed | First attempt passed a folder instead of a file pattern to `node --test` (command error, no tests ran); corrected command passed |
| UI run 1 | 7 tests | **0 passed, 7 failed** | Blank page. **Test-harness bug**: route pattern `**/api/**` also intercepted the app's own module `/src/api/api.ts` (see DEFECT_LOG TH-01) |
| UI run 2 | 7 tests | 0 passed, 7 failed | Run after a wrong first diagnosis (Vite cold start; that change was reverted). Same harness bug |
| UI run 3 | 7 tests | 7 passed | Route matcher fixed to paths starting with `/api/` |
| UI run 4 | 7 tests + stronger assertions | **6 passed, 1 failed** | New assertion found **DEF-04**: the page is 182 px wider than a 390 px phone screen. The chart assertion confirmed the bars render once Recharts' animation finishes (not a defect) |
| UI run 5 | 7 tests | **7 passed** | DEF-04 fix confirmed (`playwright-run5-final.log`) |
| Final frontend | `npm test` (unit + UI) | 15 + 7 passed | `frontend-final.log` |

## 3. Results by module (final run)

| Module | Backend tests | Frontend unit | UI | Pass rate | Defects found |
|---|---|---|---|---|---|
| M1 Authentication | 35 (AuthController 9, SecurityRules 8, JwtService 7, LoginAttemptService 7, UserSeeder 4) | 4 | 4 (UI-01, 02, 05, 06) | 100% | DEF-02 |
| M2 Student CRUD | 43 (StudentValidation 19, StudentControllerCrud 11, StudentService 9, StudentController 4) | 11 (validation + CSV) | 3 (UI-03, 04, 07) | 100% | DEF-03, DEF-04 |
| M3 Marks & Analytics | 38 (MarksService 8, MarksBoundary 12, MarksController 4, AnalyticsService 2, AnalyticsEdgeCase 7, AnalyticsController 5) | — | dashboard figures in UI-03 | 100% | DEF-01 |
| Supporting | 8 (SubjectService 5, DemoDataSeeder 2, contextLoads 1) | — | — | 100% | — |

35 + 43 + 38 + 8 = 124. Each test class is counted in exactly one module; some controller tests in M2/M3 also check authentication (e.g. `analyticsRequireLogin`).

## 4. Per-class results (final backend run, from Surefire)

| Test class | Tests | Result |
|---|---|---|
| `entity.StudentValidationTest` | 19 | ✅ |
| `service.MarksBoundaryTest` | 12 | ✅ |
| `controller.StudentControllerCrudTest` | 11 | ✅ |
| `controller.AuthControllerTest` | 9 | ✅ |
| `service.StudentServiceTest` | 9 | ✅ |
| `security.SecurityRulesTest` | 8 | ✅ |
| `service.MarksServiceTest` | 8 | ✅ |
| `security.JwtServiceTest` | 7 | ✅ |
| `security.LoginAttemptServiceTest` | 7 | ✅ |
| `service.AnalyticsEdgeCaseTest` | 7 | ✅ |
| `controller.AnalyticsControllerTest` | 5 | ✅ |
| `service.SubjectServiceTest` | 5 | ✅ |
| `config.UserSeederTest` | 4 | ✅ |
| `controller.MarksControllerTest` | 4 | ✅ |
| `controller.StudentControllerTest` | 4 | ✅ |
| `config.DemoDataSeederTest` | 2 | ✅ |
| `service.AnalyticsServiceTest` | 2 | ✅ |
| `ServerApplicationTests` | 1 | ✅ |
| **Total** | **124** | **124 passed** |

## 4b. Live run against a real MongoDB (2026-11-03, after the reports above)
MongoDB 8.2 was installed locally, so the open live test could be executed. Nothing in this run is simulated.

| Suite | Result | Evidence |
|---|---|---|
| Live API check: login, roles, student and marks CRUD verified **directly in MongoDB** | ✅ 23/23 | `test-evidence/final-live-api.log` |
| Live UI (Edge → real React app → real API → real MongoDB): LIVE-00 all pages without browser errors; LIVE-01 login; LIVE-02 dashboard = DB; LIVE-03 student CRUD persisted; LIVE-04 subjects, marks, filters, report card, CSV; LIVE-05 teacher restrictions; LIVE-06 deletes; LIVE-07 logout | ✅ 8/8 | `test-evidence/final-playwright-live.log`, `playwright-live-report/index.html`, `screenshots/live/` |
| Database state before and after | identical (20 / 5 / 100 / 2) | — |

This was executed AI-assisted on Nithish vikram ss's machine. SCRUM-1's acceptance criteria also ask a team member to repeat it on their own machine.

## 5. Not executed and limitations
- ~~No test ran against a real MongoDB.~~ **Resolved 2026-11-03:** see §4b. The original note follows for the record: The configured Atlas host does not resolve, and a local MongoDB could not be started in this environment. Repositories were mocked, and the UI tests used a simulated API that follows the real JSON contracts. A live end-to-end run with a database is still **open**.
- Coverage was not measured for UI tests (they test behaviour, not lines).

## 6. Screenshots (from the final UI run)
| File | Shows |
|---|---|
| `test-evidence/screenshots/UI-01-login-redirect.png` | Login page after redirect from a protected page |
| `UI-02-login-error.png` | "Invalid username or password." |
| `UI-03a-dashboard.png` | Dashboard with metric cards, bar and pie charts |
| `UI-03b-validation-errors.png` | Add Student form with field errors |
| `UI-03c-student-added.png` | Success message and the new row |
| `UI-04-duplicate-error.png` | Duplicate register number message |
| `UI-05-teacher-readonly.png` | Teacher view without Add/Edit/Delete |
| `UI-07-mobile-students.png` | Phone layout after the DEF-04 fix |
