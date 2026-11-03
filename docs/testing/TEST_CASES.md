# Test Cases — Learnify Student Management System

**Type codes:** P = positive · N = negative · B = boundary · E = edge case
**Result** is the result of the **final** run on 2026-11-03. Cases that failed on the first run are marked ❌→✅, with their defect ID (see DEFECT_LOG.md).
Every case is automated. The "Automated test" column gives the test class and method (backend: `server/src/test/java/com/learnify/server/...`; frontend: `client/tests/...`).

---

## M1 — Authentication and access control

| ID | Type | Description | Input / steps | Expected result | Automated test | Result |
|---|---|---|---|---|---|---|
| AUTH-P-01 | P | Login with correct credentials | `POST /api/auth/login` `{" Admin ", correct password}` | 200; token is valid; username normalised to `admin`; role `ADMIN` | `AuthControllerTest.correctCredentialsReturnValidToken` | ✅ |
| AUTH-P-02 | P | Current user profile | `GET /api/auth/me` with admin token | 200, `fullName = Administrator` | `AuthControllerTest.meReturnsCurrentUser` | ✅ |
| AUTH-P-03 | P | Token round trip | Generate a token for a teacher, then verify it | Username `teacher`, role `TEACHER` | `JwtServiceTest.tokenRoundTripKeepsUsernameAndRole` | ✅ |
| AUTH-P-04 | P | Teacher can read data | `GET /api/students` with teacher token | 200 | `SecurityRulesTest.teacherCanReadStudents` | ✅ |
| AUTH-P-05 | P | Admin may delete a subject; teacher may delete marks | `DELETE /api/subjects/sub1` (admin), `DELETE /api/marks/m1` (teacher) | 200 for both | `SecurityRulesTest.adminCanDeleteSubject`, `teacherCanDeleteMarks` | ✅ |
| AUTH-P-06 | P | Initial accounts created with hashed passwords | Seed with `Admin#2026` / `Teach#2026` | 2 users saved; username lower-cased; stored hash ≠ password; BCrypt verifies | `UserSeederTest.createsBothAccountsWithHashedPasswords` | ✅ |
| AUTH-P-07 | P | Seeder never overwrites accounts | Users already exist | Nothing saved | `UserSeederTest.existingAccountsAreNotOverwritten` | ✅ |
| AUTH-P-08 | P | Successful login resets the failure counter | 4 failures, 1 success, 4 failures | Not locked | `LoginAttemptServiceTest.successResetsFailureCount` | ✅ |
| AUTH-N-01 | N | Wrong password vs. unknown user | `admin/wrong`, `nobody/wrong` | Both 401 with **identical** message "Invalid username or password." | `AuthControllerTest.wrongPasswordAndUnknownUserGiveSameMessage` | ✅ |
| AUTH-N-02 | N | Blank login fields | `{"", ""}` | 400, `fieldErrors.username = "Username is required"` | `AuthControllerTest.blankFieldsAreRejected` | ✅ |
| AUTH-N-03 | N | Malformed login body | `{` | 400 | `AuthControllerTest.malformedLoginBodyIsRejected` | ✅ |
| AUTH-N-04 | N | No token | `GET /api/students`, `GET /api/auth/me`, `GET /api/analytics/summary` without header | 401 JSON "Please log in to continue." | `SecurityRulesTest.requestWithoutTokenIsRejectedWith401`, `AuthControllerTest.meWithoutTokenIsRejected`, `AnalyticsControllerTest.analyticsRequireLogin` | ✅ |
| AUTH-N-05 | N | Tampered token | Valid token with one extra character | 401 | `SecurityRulesTest.tamperedTokenIsRejectedWith401` | ✅ |
| AUTH-N-06 | N | Teacher attempts admin-only actions | Teacher `POST /api/students`, `DELETE /api/subjects/sub1` | 403 JSON "You do not have permission…" | `SecurityRulesTest.teacherCannotCreateStudent`, `teacherCannotDeleteSubject` | ✅ |
| AUTH-N-07 | N | Anonymous write | `DELETE /api/marks/m1` without token | 401 | `SecurityRulesTest.anonymousCannotWriteMarks` | ✅ |
| AUTH-N-08 | N | Token signed with a different key | Token from another secret | Rejected | `JwtServiceTest.tokenSignedWithAnotherKeyIsRejected` | ✅ |
| AUTH-N-09 | N | Expired token | Token with expiry in the past | Rejected | `JwtServiceTest.expiredTokenIsRejected` | ✅ |
| AUTH-N-10 | N | Garbage, empty or null token | `"not-a-jwt"`, `""`, `null` | Rejected, no exception | `JwtServiceTest.garbageIsRejected`, `emptyOrNullTokenIsRejected` | ✅ |
| AUTH-N-11 | N | Password hash never leaked | Successful login response | No `passwordHash` field | `AuthControllerTest.passwordHashIsNeverReturned` | ✅ |
| AUTH-N-12 | N | Seeder without passwords | Empty / null passwords | No accounts created | `UserSeederTest.missingPasswordsCreateNoAccounts` | ✅ |
| AUTH-B-01 | B | Failures just below the lock limit | 4 failures | Not locked | `LoginAttemptServiceTest.fourFailuresDoNotLock` | ✅ |
| AUTH-B-02 | B | Failures at the lock limit | 5 failures; then the correct password | Locked; login returns 429 even with the correct password | `LoginAttemptServiceTest.fifthFailureLocks`, `AuthControllerTest.accountIsLockedAfterFiveFailures` | ✅ |
| AUTH-B-03 | B | Lock is per username | `admin` locked | `teacher` not locked | `LoginAttemptServiceTest.lockIsPerUsername` | ✅ |
| AUTH-B-04 | B | Lock at exactly 15:00 | Lock, then advance the clock 15 min | Still locked | `LoginAttemptServiceTest.stillLockedJustBeforeFifteenMinutes` | ✅ |
| AUTH-B-05 | B | Lock at 15:01 | Lock, then advance the clock 15 min 1 s, then 1 more failure | Unlocked; counter restarted | `LoginAttemptServiceTest.unlockedAfterFifteenMinutesAndCounterReset` | ✅ |
| AUTH-B-06 | B | Failures outside the 15-minute window | 4 failures, wait 16 min, 1 failure | **Not** locked (R3) | `LoginAttemptServiceTest.failuresOlderThanTheWindowAreForgotten` | ❌→✅ DEF-02 |
| AUTH-B-07 | B | Seed password length | 8 chars (admin) and 7 chars (teacher) | Admin created, teacher skipped | `UserSeederTest.passwordOf8CharsAcceptedAnd7Skipped` | ✅ |
| AUTH-B-08 | B | JWT secret length | 32-byte secret; 31-byte secret | 32 bytes used as the key; 31 bytes falls back to a random key | `JwtServiceTest.secretOfExactly32BytesIsUsedAsIs`, `secretOf31BytesFallsBackToRandomKey` | ✅ |
| AUTH-B-09 | B | Username length | 51 characters | 400 "Username is too long" | `AuthControllerTest.usernameLongerThan50CharsIsRejected` | ✅ |
| FE-AUTH-P-01 | P | Session kept while valid | Session expiring in 5 min | Returned; `isAdmin` true | `tests/unit/session.test.ts` | ✅ |
| FE-AUTH-P-02 | P | Teacher role / logout | Teacher session; `clearSession()` | Not admin; session gone | `tests/unit/session.test.ts` | ✅ |
| FE-AUTH-N-01 | N | Expired session | Expiry 1 min in the past | Treated as logged out and storage cleared | `tests/unit/session.test.ts` | ✅ |
| FE-AUTH-N-02 | N | Corrupted session storage | `{not json` | `null`, no crash | `tests/unit/session.test.ts` | ✅ |
| UI-01 | N | Protected page without login | Open `/students` | Redirect to `/login` | `tests/e2e/student-workflow.spec.ts` | ✅ |
| UI-02 | N | Wrong password in the browser | `admin` / `wrong-password` | Error shown, stays on login | `student-workflow.spec.ts` | ✅ |
| UI-05 | P | Teacher read-only UI | Log in as teacher → Students | Rows visible; no Add/Delete buttons; chip "Teacher:" | `student-workflow.spec.ts` | ✅ |
| UI-06 | P | Logout | Logout, then open `/dashboard` | Redirected to `/login` | `student-workflow.spec.ts` | ✅ |

## M2 — Student registration and CRUD

| ID | Type | Description | Input / steps | Expected result | Automated test | Result |
|---|---|---|---|---|---|---|
| STU-P-01 | P | Create a valid student | Admin `POST /api/students` (valid JSON) | 201 with id | `StudentControllerTest.createValidStudentReturns201` | ✅ |
| STU-P-02 | P | List students | `GET /api/students` | 200, 2 records | `StudentControllerCrudTest.listReturnsAllStudents` | ✅ |
| STU-P-03 | P | Search by name or register number | `?search=asha`; service gets `"  21cs "` | Search used; query trimmed; matches name OR register number | `StudentControllerCrudTest.searchParameterUsesSearch`, `StudentServiceTest.searchTrimsQueryAndMatchesNameOrRegisterNumber` | ✅ |
| STU-P-04 | P | Filter by department | `?department=Civil` | Filtered list | `StudentControllerCrudTest.departmentFilterIsApplied` | ✅ |
| STU-P-05 | P | Get by id | `GET /api/students/s1` | 200 | `StudentControllerCrudTest.getByIdReturnsStudent` | ✅ |
| STU-P-06 | P | Create normalises input and ignores client id | `" 21cs001 "`, `" Arun@Example.COM "`, `id` set | `21CS001`, `arun@example.com`, id cleared | `StudentServiceTest.createNormalizesAndIgnoresClientId` | ✅ |
| STU-P-07 | P | Update keeping own register number | Same register number, blank email | Saved; email becomes null | `StudentServiceTest.updateKeepingOwnRegisterNumberIsAllowed` | ✅ |
| STU-P-08 | P | Delete removes the student's marks | Delete `s1` | Marks and student deleted; 200 message | `StudentServiceTest.deleteRemovesStudentsMarks`, `StudentControllerCrudTest.deleteReturnsMessage` | ✅ |
| STU-P-09 | P | Count | `GET /api/students/count` | `{"count": 42}` | `StudentControllerCrudTest.countEndpointWorks` | ✅ |
| STU-N-01 | N | Invalid fields | Empty name and department, register number `#1`, semester 12, email `not-an-email` | 400 with a message for each field; service not called | `StudentControllerTest.createInvalidStudentReturns400WithFieldErrors` | ✅ |
| STU-N-02 | N | Malformed body / wrong type | `{bad json`; `"semester":"three"` | 400 (not 500) | `StudentControllerTest.malformedJsonReturns400`, `StudentControllerCrudTest.semesterAsTextReturns400NotServerError` | ✅ |
| STU-N-03 | N | Unknown id | `GET /api/students/nope` | 404 JSON "Student not found" | `StudentControllerCrudTest.getUnknownIdReturns404Json` | ✅ |
| STU-N-04 | N | Update unknown id | `PUT /api/students/missing` | 404 | `StudentControllerTest.updateMissingStudentReturns404` | ✅ |
| STU-N-05 | N | Update unknown id whose register number is taken | `updateStudent("missing", 21CS001)` | 404 (not 409) | `StudentServiceTest.updateOfMissingStudentReturnsNotFoundEvenIfRegisterNumberIsTaken` | ❌→✅ DEF-03 |
| STU-N-06 | N | Duplicate register number | Existing `21CS001` | 409 "Register number 21CS001 is already in use." | `StudentServiceTest.duplicateRegisterNumberIsRejected`, `StudentControllerCrudTest.duplicateRegisterNumberReturns409` | ✅ |
| STU-N-07 | N | Duplicate email | Existing email | 409 | `StudentServiceTest.duplicateEmailIsRejected` | ✅ |
| STU-N-08 | N | Update to another student's register number | `s1` → `21CS002` (taken) | 409; nothing saved | `StudentServiceTest.updateToAnotherStudentsRegisterNumberIsRejected` | ✅ |
| STU-N-09 | N | Delete unknown id | `DELETE /api/students/nope` | 404; marks untouched | `StudentServiceTest.deleteMissingStudentReturnsNotFound`, `StudentControllerCrudTest.deleteUnknownReturns404` | ✅ |
| STU-E-01 | E | Whitespace-only search | `?search=   ` | Full list (search not called) | `StudentControllerCrudTest.blankSearchFallsBackToFullList` | ✅ |
| STU-B-01 | B | Semester at bounds | 1, 8 | Valid | `StudentValidationTest.semesterLowerAndUpperBoundsAccepted` (2 runs) | ✅ |
| STU-B-02 | B | Semester outside bounds | 0, 9, -1 | Only `semester` invalid | `StudentValidationTest.semesterOutsideBoundsRejected` (3 runs) | ✅ |
| STU-B-03 | B | Name length | 100 chars; 101 chars | Valid; invalid | `StudentValidationTest.nameOf100CharsAcceptedAnd101Rejected` | ✅ |
| STU-B-04 | B | Blank name | `""`, `"   "` | Invalid | `StudentValidationTest.blankNameRejected` (2 runs) | ✅ |
| STU-B-05 | B | Register number at bounds | 3 chars, 7 chars, 20 chars | Valid | `StudentValidationTest.registerNumberLengths3To20Accepted` (3 runs) | ✅ |
| STU-B-06 | B | Register number outside bounds or bad characters | 2 chars, 21 chars, `21-CS-001`, `21 CS`, `""`, `<script>` | Invalid | `StudentValidationTest.invalidRegisterNumbersRejected` (6 runs) | ✅ |
| STU-B-07 | B | Email optional | `null`; `not-an-email` | Valid; invalid | `StudentValidationTest.emailIsOptionalButMustBeValidWhenGiven` | ✅ |
| FE-STU-P-01 | P | Browser validation, valid student | Valid form | No errors | `tests/unit/validation.test.ts` | ✅ |
| FE-STU-B-01..03 | B | Browser validation boundaries | Semester 0/1/8/9; name 100/101/blank; register number 2/3/20/21/symbols | Same limits as the server | `tests/unit/validation.test.ts` | ✅ |
| FE-STU-N-01 | N | Browser email check | `x@y`, `''`, `a@b.co` | Invalid, valid, valid | `tests/unit/validation.test.ts` | ✅ |
| FE-SUB-B-01/02 | B | Subject form limits | Max marks 0/1/200/201/NaN; code 1/2/15/16 chars/space | Same limits as the server | `tests/unit/validation.test.ts` | ✅ |
| FE-CSV-P/N/E | P/N/E | Report-card CSV export | Commas, quotes, newlines, `=SUM(A1)`, `+1+1`, `@cmd`, `-2+3`, `-5`, null | Correct quoting; formulas neutralised with `'`; numbers kept | `tests/unit/csv.test.ts` (4 tests) | ✅ |
| UI-03 | P | Admin adds a student in the browser | Login → Dashboard → Students → Add → submit empty → fill valid → Save | Dashboard figures and chart bars render; 3 field errors on empty submit; success message; new row with upper-cased `23SMS002` | `student-workflow.spec.ts` | ✅ |
| UI-04 | N | Duplicate register number in the browser | Add student with existing `23SMS001` | Server message shown | `student-workflow.spec.ts` | ✅ |
| UI-07 | E | Phone layout (390 × 844) | Menu → Students | Navigation works; **page does not scroll sideways** | `student-workflow.spec.ts` | ❌→✅ DEF-04 |

## M3 — Marks and Analytics

| ID | Type | Description | Input / steps | Expected result | Automated test | Result |
|---|---|---|---|---|---|---|
| MRK-P-01 | P | First marks entry | 30 + 45, subject max 100 | One record saved; total 75; max 100 | `MarksServiceTest.firstEntryCreatesOneRecord` | ✅ |
| MRK-P-02 | P | Re-entry updates the existing record | Existing `m1`; enter 35 + 40 | `m1` updated; no new record | `MarksServiceTest.reEntryUpdatesExistingRecordInsteadOfInsertingDuplicate` | ✅ |
| MRK-P-03 | P | Old duplicates cleaned up | Two records for the same pair | Extra record deleted | `MarksServiceTest.reEntryRemovesDuplicatesLeftByOldBug` | ✅ |
| MRK-P-04 | P | Edit marks | `PUT /api/marks/m1` 30 + 40 (teacher) | 200, total 70 | `MarksControllerTest.updateMarksReturnsUpdatedRecord` | ✅ |
| MRK-P-05 | P | Delete marks | `DELETE /api/marks/m1` (teacher) | 200 message | `MarksControllerTest.deleteMarksReturnsMessage` | ✅ |
| MRK-P-06 | P | Marks list shows names | Marks + student + subject (max 50) | Name, register number, 50%, pass | `MarksBoundaryTest.detailsIncludeNamesAndHandleDeletedStudentOrSubject` | ✅ |
| MRK-N-01 | N | Total above max | 60 + 50 (max 100) | 400 "cannot exceed the maximum of 100"; nothing saved | `MarksServiceTest.totalAboveSubjectMaxIsRejected`, `MarksControllerTest.totalAboveMaxReturns400WithMessage` | ✅ |
| MRK-N-02 | N | Unknown student or subject | `ghost` ids | 404 | `MarksServiceTest.unknownStudentIsRejected`, `MarksBoundaryTest.unknownSubjectIsRejected` | ✅ |
| MRK-N-03 | N | Negative marks | internal −5 | 400, field error | `MarksControllerTest.negativeMarksAreRejected` | ✅ |
| MRK-N-04 | N | Edit above max | 70 + 40 | 400; nothing saved | `MarksServiceTest.updateMarksChecksSubjectMax` | ✅ |
| MRK-N-05 | N | Delete unknown marks | `nope` | 404 | `MarksServiceTest.deleteMissingMarksReturnsNotFound` | ✅ |
| MRK-B-01 | B | Totals from 0 up to exactly max | (100: 0+0, 40+60, 50.1+49.9), (50: 20+30), (1: 0+1), (200: 100+100) | All accepted | `MarksBoundaryTest.totalsUpToMaxAreAccepted` (6 runs) | ✅ |
| MRK-B-02 | B | Totals just above max | (100: 50+50.5), (50: 25+26), (1: 1+0.01) | All rejected | `MarksBoundaryTest.totalsAboveMaxAreRejected` (3 runs) | ✅ |
| MRK-B-03 | B | Pass boundary | 40/100; 39.99/100 | Pass; fail | `MarksBoundaryTest.passBoundaryIsExactly40Percent` | ✅ |
| MRK-E-01 | E | Percentage uses subject max; legacy records count as /100 | 20/50; 35 with no max | 40% pass; 35% fail | `MarksServiceTest.percentageUsesSubjectMaxMarks` | ✅ |
| MRK-E-02 | E | Marks of a deleted student or subject | Orphan record | Listed without crashing; name null; max 100 | `MarksBoundaryTest.detailsIncludeNamesAndHandleDeletedStudentOrSubject` | ✅ |
| ANA-P-01 | P | Overall pass = every subject passed | Bob 80 + 30 (avg 55) | Bob counted as failed; pass rate 50% | `AnalyticsServiceTest.studentWithGoodAverageButOneFailedSubjectCountsAsFailed` | ✅ |
| ANA-P-02 | P | Class average uses percentages | 25/50 and 70/100 | 60.0 | `AnalyticsServiceTest.classAverageUsesPercentageOfEachSubjectsMax` | ✅ |
| ANA-P-03 | P | Ranking | 3 students | Asha (85) #1, Bala #2 | `AnalyticsEdgeCaseTest.topStudentsAreRankedByAveragePercentage` | ✅ |
| ANA-P-04 | P | Subject averages ordered | Maths 60, Physics 50 | Highest first | `AnalyticsEdgeCaseTest.subjectAveragesSortedHighestFirst` | ✅ |
| ANA-P-05 | P | Dashboard summary | Sample class | Average 55.0; pass 33.33%; 1 below 40%; lowest Physics; top Asha; insights present | `AnalyticsEdgeCaseTest.summaryCombinesAllFigures` | ✅ |
| ANA-P-06 | P | Endpoint defaults | `top-students` without limit; `class-average` | limit 5; `{"classAverage":61.5}` | `AnalyticsControllerTest.topStudentsDefaultsToFive`, `classAverageEndpointWrapsValue` | ✅ |
| ANA-E-01 | E | Empty database | No marks | All zeros, empty lists, no exception | `AnalyticsEdgeCaseTest.emptyDatabaseGivesZeroSummaryWithoutErrors` | ✅ |
| ANA-B-01 | B | Ranking limit | 0; 100 (more than the class) | Empty; all 3 students | `AnalyticsEdgeCaseTest.topStudentsWithLimitZeroIsEmpty`, `topStudentsLimitLargerThanClassReturnsEveryone` | ✅ |
| ANA-B-02 | B | Below-threshold is strict | Threshold 45; Bala exactly 45 | Only Chitra (35) | `AnalyticsEdgeCaseTest.belowThresholdIsStrictlyBelow` | ✅ |
| ANA-N-01 | N | Negative ranking limit | `?limit=-1` | 400 (not 500) | `AnalyticsControllerTest.negativeLimitIsABadRequestNotAServerError` | ❌→✅ DEF-01 |
| ANA-N-02 | N | Non-numeric limit | `?limit=abc` | 400 "Invalid value for parameter 'limit'." | `AnalyticsControllerTest.nonNumericLimitIsABadRequest` | ✅ |

### Supporting tests (outside the three modules, run in the same suite)
`SubjectServiceTest` (5: unique code, safe delete, max-marks changes), `DemoDataSeederTest` (2), `ServerApplicationTests.contextLoads` (1: Spring context and all repository query definitions).
