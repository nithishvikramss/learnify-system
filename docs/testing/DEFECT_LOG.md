# Defect Log — Learnify Student Management System

**Severity:** Critical · High · Medium · Low. **Status:** Open · Fixed · Verified (fixed and re-tested).
Defects found by the QA tests on 2026-11-03 are DEF-01 to DEF-04. Defects found and fixed earlier during development (the audit's B1–B15) are summarised at the end.

## Summary
| ID | Title | Module | Severity | Found by | Status |
|---|---|---|---|---|---|
| DEF-01 | Negative `limit` on top-students returns 500 Internal Server Error | M3 Analytics | Medium | ANA-N-01 | ✅ Verified |
| DEF-02 | Failed-login counter never expires, so old typos eventually lock the account | M1 Authentication | Medium | AUTH-B-06 | ✅ Verified |
| DEF-03 | Updating a non-existent student can return 409 instead of 404 | M2 Student CRUD | Low | STU-N-05 | ✅ Verified |
| DEF-04 | On phones the whole page scrolls sideways (182 px overflow) | M2 UI / layout | Medium | UI-07 | ✅ Verified |
| DEF-05 | Live test HTML report recorded the local admin and teacher passwords and was pushed to the public repo (`36313e8`) | Test tooling / security | High | Secret scan of the zips inside reports, 2026-11-04 | ✅ Fixed going forward: report removed and no longer generated, both passwords changed and old ones verified rejected. Removed from all Git history on 2026-11-04 |

---

### DEF-01 — Negative `limit` on top-students returns 500
| | |
|---|---|
| Module / file | `server/.../controller/AnalyticsController.java` (`getTopStudents`) and `service/AnalyticsService.java` |
| Severity / priority | Medium / High: any logged-in user could trigger server errors; error logs get noisy |
| Steps to reproduce | `GET /api/analytics/top-students?limit=-1` with a valid token |
| Expected | 400 Bad Request with a clear message |
| Actual (run 1) | **500 Internal Server Error** ("Status expected:<400> but was:<500>"). Cause: `Stream.limit(-1)` throws `IllegalArgumentException` |
| Fix | The controller validates `0 ≤ limit ≤ 100` and throws `BadRequestException("limit must be between 0 and 100.")`. The upper bound also stops very large requests. |
| Verification | `AnalyticsControllerTest.negativeLimitIsABadRequestNotAServerError` passes (run 2). Related cases ANA-B-01 and ANA-N-02 pass. |

### DEF-02 — Failed-login counter never expires
| | |
|---|---|
| Module / file | `server/.../security/LoginAttemptService.java` |
| Severity / priority | Medium / High: a real user who mistypes once a day is locked out on day 5. The in-memory map also had no size limit. |
| Requirement | R3: lock after **5 failures within 15 minutes** (TEST_PLAN.md §2) |
| Steps to reproduce | 4 failed logins → wait 16 minutes → 1 failed login |
| Expected | Not locked |
| Actual (run 1) | **Locked** ("Expecting value to be false but was true") |
| Fix | Each username now tracks the start of its 15-minute window, and failures outside the window restart the count. When more than 10,000 usernames are tracked, stale entries are purged, so the map cannot grow without limit (memory-exhaustion hardening). |
| Verification | `LoginAttemptServiceTest.failuresOlderThanTheWindowAreForgotten` passes. All other lockout boundary tests (AUTH-B-01..05) and `AuthControllerTest.accountIsLockedAfterFiveFailures` still pass. |

### DEF-03 — Updating a non-existent student returns 409
| | |
|---|---|
| Module / file | `server/.../service/StudentService.java` (`updateStudent`) |
| Severity / priority | Low / Medium: misleading message ("already in use") for a record that does not exist |
| Steps to reproduce | `PUT /api/students/missing` with a register number another student already uses |
| Expected | 404 "Student not found" |
| Actual (run 1) | `ConflictException` (409), because duplicate checks ran before the existence check |
| Fix | The student is loaded first (404 if missing), then the duplicate checks run. This also removed a second database lookup. |
| Verification | `StudentServiceTest.updateOfMissingStudentReturnsNotFoundEvenIfRegisterNumberIsTaken` passes. STU-P-07 and STU-N-08 still pass. |

### DEF-04 — Page scrolls sideways on phones
| | |
|---|---|
| Module / file | `client/src/index.css` (`.main-content`) |
| Severity / priority | Medium / Medium: the mobile layout looks broken; headers and filters move off screen |
| Steps to reproduce | Open Students at 390 × 844 (iPhone 12/13 size) |
| Expected | Page width = screen width; the wide table scrolls inside its card |
| Actual (UI run 4) | `document.scrollWidth − innerWidth` = **182 px** |
| Root cause | `.main-content` is a flex item; its default `min-width: auto` grew to fit the table |
| Fix | `min-width: 0` on `.main-content` |
| Verification | UI-07 passes (run 5); screenshot `test-evidence/screenshots/UI-07-mobile-students.png` |

---

## Test-harness issues (not product defects)
| ID | Issue | Resolution |
|---|---|---|
| TH-01 | UI runs 1–2: every test saw a blank page. The Playwright route pattern `**/api/**` also intercepted the app's own source module `/src/api/api.ts` and answered it with a fake 404, so React never started. I first misdiagnosed it as a Vite cold start; that config change was **reverted**. | Route only URLs whose path **starts with** `/api/` (`tests/e2e/fake-api.ts`) |
| TH-02 | The first dashboard screenshot showed nearly empty charts | Not a defect: Recharts animates for about 1.5 s. The test now waits and **asserts** both bars are > 50 px high |
| TH-03 | First frontend unit run used `node --test tests/unit/` (a folder), so no tests ran | Use the file pattern `"tests/unit/*.test.ts"` (`npm run test:unit`) |

## Earlier defects (fixed during development; see PROJECT_AUDIT.md and DEVELOPMENT_LOG.md)
| ID | Title | Severity | Status | Regression test |
|---|---|---|---|---|
| B1 | Database password committed to the public repository (removed from all Git history on 2026-11-04) | Critical | Fixed in code; **password rotation still required** | — (secret scan) |
| B2 | No real authentication; demo passwords in the frontend | High | Verified | `SecurityRulesTest`, `AuthControllerTest` |
| B3 | Re-saving marks creates duplicates, then a 500 error | High | Verified | `MarksServiceTest.reEntryUpdatesExistingRecord…` |
| B4 / B9 | No server validation; wrong status codes | High / Medium | Verified | `StudentControllerTest`, `StudentValidationTest` |
| B5 | Deleting a subject left orphaned marks | Medium | Verified | `SubjectServiceTest.deleteWithMarksIsBlocked…` |
| B7 | Dashboard and report card used different pass rules | Medium | Verified | `AnalyticsServiceTest.studentWithGoodAverage…` |
| B15 | Spring Boot 4 ignored the Mongo URI property | High | Fixed | Config check in DEVELOPMENT_LOG Feature 1 |
| — | `POST` with an existing `id` overwrote another record | High | Verified | `StudentServiceTest.createNormalizesAndIgnoresClientId` |

## Open items
| ID | Item | Owner (suggested) |
|---|---|---|
| OPEN-01 | Rotate the leaked Atlas credentials (B1) | Nithish Vikram |
| OPEN-02 | Run the full app against a real MongoDB and repeat UI-01..07 without the simulated API | Nirandjan · **Executed 2026-11-03 (AI-assisted, local MongoDB): live API 23/23, live UI 8/8.** A re-run by Nirandjan on their own machine is still part of SCRUM-1 |
