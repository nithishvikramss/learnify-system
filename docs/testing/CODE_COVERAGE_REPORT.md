# Code Coverage Report — Learnify Student Management System

Every figure here was **measured by a tool** on 2026-11-03; none are estimates.

| Part | Tool | Report location |
|---|---|---|
| Backend (Java) | **JaCoCo 0.8.16** (Maven plugin, runs with `./mvnw test`) | HTML: [`docs/test-evidence/jacoco-html/index.html`](../test-evidence/jacoco-html/index.html) (copy of `server/target/site/jacoco/`). CSV: `jacoco-final.csv`, baseline `jacoco-baseline.csv` |
| Frontend utilities (TypeScript) | **Node.js built-in coverage** (`--experimental-test-coverage`) | Console table in `docs/test-evidence/frontend-final.log` |

> **Latest measurement (2026-11-04, 166 tests):** instructions 4225/4818 = **87.7 %**, branches 224/258 = **86.8 %**, lines 818/928 = **88.1 %**. The tables below are the 2026-11-03 QA run, kept as a record; `jacoco-final.csv` and `jacoco-html/` hold the latest.

## 1. Backend overall: before vs. after the QA work

"Before" is the 50 tests that existed after development; "after" is the final 124-test suite.

| Metric | Before (50 tests) | After (124 tests) |
|---|---|---|
| Instructions | 2213 / 3705 = **59.7 %** | 3257 / 3773 = **86.3 %** |
| Branches | 82 / 150 = **54.7 %** | 136 / 166 = **81.9 %** |
| Lines | 412 / 749 = **55.0 %** | 657 / 758 = **86.7 %** |
| Methods | 141 / 299 = **47.2 %** | 218 / 300 = **72.7 %** |

(The totals grew slightly between runs because the defect fixes added code.)

## 2. Backend by package

| Package | Lines before | Lines after | Branches before | Branches after |
|---|---|---|---|---|
| `service` | 42.1 % | **90.0 %** (261/290) | 43.9 % | **79.3 %** (65/82) |
| `security` | 88.3 % | **95.5 %** (64/67) | 77.8 % | 76.7 % (23/30)¹ |
| `controller` | 65.8 % | **80.0 %** (60/75) | 57.1 % | **88.9 %** (16/18) |
| `config` | 80.0 % | **98.9 %** (94/95) | 64.3 % | **85.7 %** (24/28) |
| `entity` | 87.8 % | 87.8 % (72/82) | 100 % | 100 % (4/4) |
| `exception` | 78.6 % | 82.1 % (23/28) | — | — |
| `dto` | 15.3 % | 69.5 % (82/118) | 50 % | 100 % (4/4) |

¹ The security branch percentage fell slightly because the DEF-02 fix added new branches (window expiry, purge). The new code's main paths are covered.

## 3. The three modules under test (final)

| Module | Classes | Line coverage | Branch coverage |
|---|---|---|---|
| **M1 Authentication** | AuthController, JwtService, JwtAuthenticationFilter, LoginAttemptService, SecurityConfig, UserSeeder | **147/151 = 97.4 %** | **36/42 = 85.7 %** |
| **M2 Student CRUD** | StudentController, StudentService, Student | **69/76 = 90.8 %** | **21/26 = 80.8 %** |
| **M3 Marks & Analytics** | MarksController, MarksService, Marks, AnalyticsController, AnalyticsService | **231/258 = 89.5 %** | **46/54 = 85.2 %** |

Class detail (final):

| Class | Lines | Branches |
|---|---|---|
| AuthController | 27/27 = 100 % | 6/6 = 100 % |
| UserSeeder | 18/18 = 100 % | 6/6 = 100 % |
| JwtAuthenticationFilter | 12/12 = 100 % | 3/4 = 75 % |
| SecurityConfig | 42/43 = 97.7 % | 5/8 = 62.5 % |
| LoginAttemptService | 24/25 = 96.0 % | 13/14 = 92.9 % |
| JwtService | 24/26 = 92.3 % | 3/4 = 75 % |
| StudentController | 15/16 = 93.8 % | 7/8 = 87.5 % |
| StudentService | 36/41 = 87.8 % | 14/18 = 77.8 % |
| AnalyticsService | 129/129 = 100 % | 24/30 = 80 % |
| MarksService | 61/79 = 77.2 % | 15/16 = 93.8 % |
| AnalyticsController | 7/11 = 63.6 % | 3/4 = 75 % |
| MarksController | 6/10 = 60 % | — |

## 4. Frontend utilities (Node coverage, final run)

| File | Lines | Branches | Functions | Uncovered |
|---|---|---|---|---|
| `src/auth/session.ts` | 100 % | 100 % | 100 % | — |
| `src/utils/validation.ts` | 100 % | 90 % | 100 % | — |
| `src/utils/csv.ts` | 62.5 % | 100 % | 75 % | lines 16–24 (`downloadCsv`: needs a real browser; the download button is not exercised by the UI tests) |
| **All measured files** | **90.91 %** | **95.24 %** | **90.91 %** | |

React components and pages are covered by **behaviour** in the Playwright UI tests (AUTOMATION_TEST_REPORT.md), but no line coverage is recorded for them.

## 5. What is not covered, and why
| Area | Reason |
|---|---|
| `MarksController` / `AnalyticsController` read endpoints (`/marks/raw`, `/marks/student/{id}`, `/analytics/subject-averages`, `/pass-fail`, `/below-threshold`) | One-line delegations to services that are covered directly; only the HTTP mapping is untested |
| `MarksService.getMarksByStudentWithDetails`, simple `get…` pass-throughs | Same mapping code as `getAllMarksWithDetails`, which is covered |
| `ServerApplication.main` | Application entry point |
| DTO getters/setters not used by tests | Plain data holders |
| Repository interfaces | Spring Data generates them at runtime. They are mocked in tests and need a real MongoDB to test (open item OPEN-02) |

## 6. How to regenerate
```bash
cd server && ./mvnw clean test              # → server/target/site/jacoco/index.html
cd client && npm run test:unit              # → coverage table printed at the end
```
