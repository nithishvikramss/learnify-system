# Test Plan — Learnify Student Management System

| | |
|---|---|
| Project | Learnify — Student Management System (React + Spring Boot + MongoDB) |
| Version under test | Branch `backend.setup`, working tree of 2026-11-03 |
| Prepared by | QA, on behalf of the team (Nithish Vikram, Keerthivarma, Nirandijan) |
| Date | 2026-11-03 |

## 1. Objectives
1. Verify the core modules behave correctly for valid input (positive tests), reject invalid input safely (negative tests), and behave correctly at the limits of each rule (boundary and edge tests).
2. Find defects, log them, fix them and confirm the fixes by re-running the tests.
3. Measure code coverage with a real tool and report the measured numbers.
4. Measure cyclomatic complexity and use it to choose basis-path tests.
5. Automate at least one end-to-end UI workflow in a real browser.

## 2. Modules in scope and requirements tested

The brief suggested an Attendance module. **The project has no Attendance feature**, so the third module is Marks & Analytics, the system's other core data module.

| # | Module | Main classes / files | Key requirements |
|---|---|---|---|
| M1 | **Authentication and access control** | `AuthController`, `JwtService`, `JwtAuthenticationFilter`, `LoginAttemptService`, `SecurityConfig`, `UserSeeder`; frontend `auth/session.ts` | R1 correct credentials return a signed token (2 h expiry). R2 wrong password and unknown user give the same message. R3 **5 failed attempts within 15 minutes lock the username for 15 minutes**; older failures are forgotten. R4 no or invalid token gives 401; teacher writing students/subjects gives 403. R5 password hashes are never returned. |
| M2 | **Student registration and CRUD** | `StudentController`, `StudentService`, `Student` (validation); frontend `utils/validation.ts`, Students page | R6 name 1–100 chars; register number 3–20 letters/digits (unique); semester 1–8; email optional but valid and unique. R7 create, read, search, filter, update and delete. Delete removes the student's marks. R8 missing ids give 404, duplicates give 409, bad input gives 400 with field messages. |
| M3 | **Marks and Analytics** | `MarksController`, `MarksService`, `Marks`, `AnalyticsController`, `AnalyticsService` | R9 internal + external ≤ subject max; marks ≥ 0. R10 re-entering marks updates (never duplicates). R11 pass = ≥ 40% of the subject max; overall pass = every subject passed. R12 analytics (averages, ranking, below-threshold) are correct, including with no data. R13 invalid query parameters give 400, not 500. |

Out of scope: performance and load testing, penetration testing, and integration against a live MongoDB (see §7, Risks).

## 3. Test levels and approach

| Level | What | Framework (why) |
|---|---|---|
| Unit | Services, entities, security helpers in isolation, with repositories **mocked** | **JUnit 5 + Mockito + AssertJ**: the standard Spring Boot test stack, already a project dependency |
| Component (web slice) | Controllers + validation + error handler + **real security filter chain** with real JWTs, through HTTP requests | **Spring `@WebMvcTest` + MockMvc + Spring Security Test** |
| Validation boundaries | Bean Validation rules on `Student` | **Jakarta Validator** with JUnit `@ParameterizedTest` |
| Frontend unit | Form validation, CSV export, session handling (TypeScript) | **Node.js built-in test runner** (`node:test`): no extra dependencies, runs TypeScript directly on Node 24, built-in coverage |
| UI workflow (E2E) | Real React app in a real browser: login, dashboard, add student, role restrictions, mobile layout | **Playwright** with installed **Microsoft Edge**; backend simulated with `page.route()` (see AUTOMATION_TEST_REPORT.md) |

Test design techniques: equivalence partitioning, boundary-value analysis (min-1, min, max, max+1), error guessing (malformed JSON, tampered tokens, CSV injection), state-based testing (lockout timeline with a controllable clock), basis-path testing from cyclomatic complexity (COMPLEXITY_REPORT.md).

## 4. Tools and environment

| Item | Version |
|---|---|
| OS | Windows 11 Home 10.0.26200 |
| JDK | Oracle JDK 25.0.2 (project targets Java 17) |
| Build | Maven Wrapper (`server/mvnw`) |
| Spring Boot | 4.0.5 |
| Coverage (Java) | JaCoCo 0.8.16 |
| Node.js | 24.14.1 |
| UI automation | @playwright/test 1.64.1, Microsoft Edge (installed) |
| Complexity | lizard 1.17.13 |

## 5. Entry and exit criteria
**Entry:** code compiles (`./mvnw compile`, `npm run build`); the test environment above is available.
**Exit:** every planned test executed; every failure analysed and either fixed (and re-tested) or logged as an open defect; coverage report generated; no open Critical/High defects in the three modules.

## 6. Deliverables
TEST_CASES.md · TEST_EXECUTION_REPORT.md · DEFECT_LOG.md · CODE_COVERAGE_REPORT.md · COMPLEXITY_REPORT.md · AUTOMATION_TEST_REPORT.md. Raw evidence is in [`docs/test-evidence/`](../test-evidence/).

## 7. Risks and limitations
| Risk | Impact | Mitigation |
|---|---|---|
| **No reachable MongoDB** (the Atlas host no longer resolves; a local MongoDB could not be started in this environment) | Repository queries are not tested against a real database. The UI tests use a simulated API. | Repositories are mocked in unit tests. `ServerApplicationTests.contextLoads` verifies that Spring accepts every repository query definition. A live end-to-end run is listed as an open action. |
| Simulated API in UI tests could drift from the real API | UI tests could pass while the real integration fails | The fake API follows the same JSON contracts and role rules, which are themselves covered by backend controller tests |

## 8. How to run all tests
```bash
# Backend: 124 tests + JaCoCo coverage report (no database needed)
cd server
./mvnw clean test                  # Windows: mvnw.cmd clean test
# report: server/target/site/jacoco/index.html

# Frontend unit tests with coverage (15 tests)
cd client
npm install
npm run test:unit

# UI workflow tests in Microsoft Edge (7 tests; starts the Vite dev server automatically)
npm run test:e2e
# report: docs/test-evidence/playwright-report/index.html  (npx playwright show-report ../docs/test-evidence/playwright-report)

# Both frontend suites
npm test

# Cyclomatic complexity
python -m pip install lizard==1.17.13
python -m lizard server/src/main/java client/src -l java -l typescript
```
