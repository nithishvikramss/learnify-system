# Jira Change Proposal — Student Management System (project `SCRUM`)

**Status: PROPOSAL, awaiting approval. Nothing has been created, edited, moved or deleted in Jira.**
Revised 2026-11-03 after a read-only inspection of https://kct-team-pbmyxxdq.atlassian.net through the Atlassian MCP connector.
This revision replaces the earlier version that used the placeholder key `SMS`.

> **Superseded for execution by [JIRA_EXECUTION_PLAN.md](JIRA_EXECUTION_PLAN.md)** (your approval notes). Main differences: feature stories stay in the backlog (not Sprint 0); Sprint 0 holds only the remaining work (15 SP); nothing is set to Done; SCRUM-4 is untouched. The descriptions and acceptance criteria in §4.3 still apply.

---

## 1. Verified Jira facts (read-only inspection, 2026-11-03)

| Item | Value |
|---|---|
| Site / cloudId | `kct-team-pbmyxxdq.atlassian.net` / `6076ea68-9e9b-4bad-be8d-0713ff2aa904` |
| Projects visible | **1**: `SCRUM` "Team Astro" (team-managed software, project lead Keerthi Varma) |
| Issue types | Epic, Story, Task, Subtask. **There is no Bug type** |
| Board | "SCRUM board", id **1**. Columns: **To Do → In Progress → In Review → Done** |
| Estimation | "Story point estimate" (`customfield_10016`) |
| Sprints | **SCRUM Sprint 0**: active, 2026-11-02 07:56 UTC → 2026-11-16 07:56 UTC, **no goal set** · **SCRUM Sprint 1**: future, no dates |
| Filters / dashboards | No saved filters; "Default dashboard" only |
| Your permissions (Nithish vikram ss) | ✅ create issues · ✅ change status (all 4 transitions offered) · ❌ project administration |

### Team members (assignable users, verified account IDs)
| Jira display name | Account ID | Proposed role |
|---|---|---|
| **Nithish vikram ss** | `712020:6d191418-dd18-4183-85ee-4f3879fc3133` | Backend lead; repository owner |
| **Keerthi Varma** | `712020:eebbf220-6355-4ecd-846d-e8c42bf8cade` | Frontend lead; Jira project admin; Scrum Master (suggested) |
| **Nirandjan** | `712020:c10fbab1-7147-4759-9bf6-1f1e5425a7f8` | QA and documentation |

Jira Triage Agent, Jira Delivery Agent and Jira Coding Agent are Atlassian AI agents. **No work is assigned to them.**

### Existing issues, inspected individually
| Key | Type | Summary | Description | Status | Assignee | Sprint | Due | Other |
|---|---|---|---|---|---|---|---|---|
| SCRUM-1 | Task | "Task 1" | *(empty)* | To Do | — | Sprint 0 | 2026-11-07 | no sub-tasks, links or comments |
| SCRUM-2 | Story | "Task 2" | *(empty)* | In Progress | — | Sprint 0 | 2026-11-12 | **no sub-tasks**, no links or comments |
| SCRUM-3 | Task | "Task 3" | *(empty)* | In Progress | — | Backlog | — | no sub-tasks, links or comments |
| SCRUM-4 | Subtask | "Subtask 2.1" | *(empty)* | To Do | — | — | — | **no parent returned by Jira** (orphan sub-task) |

All four were created by Keerthi Varma on 2026-11-02 between 13:26:22 and 13:26:25 IST. They have **no content and duplicate nothing real**, so they are placeholders.

### Code state (from the repository)
- Commits: only 3, all by `nithishvikramsakthivel` on 2026-04-11 (`257c46e`, `7e6ec3d`, `0b4e635`).
- **94 changed files remain uncommitted.** That is all work in DEVELOPMENT_LOG.md (features 1–7 and the QA phase), produced with an AI assistant (Claude) in Nithish's workspace.
- Automated tests pass: 124 backend, 15 frontend unit, 7 UI. **Not yet done:** commits and PRs, peer review, a live run with a real database, rotation of the leaked database password.

**Status rule:** work that is coded and passes its automated tests, but is not committed, reviewed or live-verified, is **In Review**, never Done.

---

## 2. Decision needed: what to do with SCRUM-1 to SCRUM-4

| Option | What happens | Who can do it |
|---|---|---|
| **A (recommended): reuse the three useful placeholders, delete the orphan** | SCRUM-2 (Story, in Sprint 0) becomes **Authentication**; SCRUM-1 (Task, in Sprint 0, due Nov 7) becomes **Live end-to-end test**; SCRUM-3 (Task) becomes **Rotate the leaked DB password**. SCRUM-4 can't be reused because it has no parent; Keerthi deletes it, or it is left alone | Edits: Nithish (has permission). Deleting SCRUM-4: Keerthi |
| B: Keerthi deletes all four | Clean start; every item below is created new | Keerthi only |
| C: leave them untouched | They stay as noise on the board and in the Sprint 0 burndown | — |

Option A avoids deletions, keeps the issue history, and the placeholders' types and sprint placement already fit those items. **The rest of this document assumes Option A.**

---

## 3. Workflow
The board has To Do → In Progress → **In Review** → Done. "Testing" doesn't exist, and adding it needs Keerthi (see §8).

| Status | Meaning here |
|---|---|
| To Do | Not started |
| In Progress | Being coded or worked on |
| In Review | PR open (or awaiting one); reviewer is another member |
| *Testing* (after Keerthi adds it) | Merged; being verified on a running app with a real MongoDB |
| Done | Meets the Definition of Done (§6) |

Until "Testing" exists, keep live verification as a separate sub-task, so the parent story stays In Review until its "Live verification" sub-task is Done.

---

## 4. Proposed backlog

**Labels:** `review-2` (everything in Sprint 0) · `ai-assisted` (work produced with the AI assistant) · `bug` (defect fixes; there is no Bug type).
**Expected keys:** Jira numbers new issues sequentially from **SCRUM-5**. The keys below assume the items are created in this exact order with no other issues created in between, so **confirm the real keys after creation**.
**Story points** go on stories and tasks only. Sub-tasks don't carry points.

### 4.1 Epic
| Ref | Expected key | Summary | Description |
|---|---|---|---|
| E1 | **SCRUM-5** | Student Management System | Web application for college staff to manage students, subjects and marks, with role-based login (Admin/Teacher), dashboards and reports. Stack: React + TypeScript (Vite), Spring Boot 4, MongoDB. All stories and tasks below are children of this epic, including the reused SCRUM-1/2/3. |

### 4.2 Stories and tasks, overview
| Ref | Key | Type | Summary | Priority | SP | Assignee | Proposed status | Sprint |
|---|---|---|---|---|---|---|---|---|
| S1 | **SCRUM-2** (reuse) | Story | User authentication and role-based login | Highest | 8 | Nithish vikram ss | In Review | Sprint 0 (already) |
| S2 | SCRUM-6 | Story | Admin dashboard | Medium | 5 | Nithish vikram ss | **Done** (commit `0b4e635`) | none: completed before Jira tracking |
| S3 | SCRUM-7 | Story | Student registration | High | 5 | Keerthi Varma | In Review | Sprint 0 |
| S4 | SCRUM-8 | Story | View and search student information | Medium | 3 | Keerthi Varma | In Review | Sprint 0 |
| S5 | SCRUM-9 | Story | Update student information | Medium | 3 | Keerthi Varma | In Review | Sprint 0 |
| S6 | SCRUM-10 | Story | Delete student information | Medium | 2 | Keerthi Varma | In Review | Sprint 0 |
| S7 | SCRUM-11 | Story | Academic records: subjects and marks | High | 8 | Nithish vikram ss | In Review | Sprint 0 |
| S8 | SCRUM-12 | Story | Reports and analytics | Medium | 5 | Nirandjan | In Review | Sprint 0 |
| S9 | SCRUM-13 | Story | Application testing and quality reports | High | 8 | Nirandjan | In Review | Sprint 0 |
| S10 | SCRUM-14 | Story | Security hardening, bug fixing and optimization | Highest | 5 | Nithish vikram ss | In Review | Sprint 0 |
| T1 | **SCRUM-1** (reuse) | Task | Run the live end-to-end test with a real MongoDB | Highest | 3 | Nirandjan | To Do | Sprint 0 (already, due Nov 7) |
| T2 | **SCRUM-3** (reuse) | Task | Rotate the leaked MongoDB Atlas credentials | Highest | 1 | Nithish vikram ss | To Do *(currently In Progress)* | Sprint 0 (move from backlog) |
| T3 | SCRUM-15 | Task | Commit work per story, open PRs, connect GitHub for Jira | High | 2 | Nithish vikram ss | To Do | Sprint 0 |
| T4 | SCRUM-16 | Task | Prepare and rehearse the Review 2 demo | High | 3 | Keerthi Varma | To Do | Sprint 0 |
| F1 | SCRUM-17 | Story | Staff account management (create teacher accounts, change password) | Medium | 5 | Nithish vikram ss | To Do | Sprint 1 (proposed) |
| F2 | SCRUM-18 | Story | Pagination for student and marks lists | Medium | 3 | Keerthi Varma | To Do | Sprint 1 (proposed) |
| F3 | SCRUM-19 | Task | Continuous integration: run all tests on every PR (GitHub Actions) | Medium | 3 | Nirandjan | To Do | Sprint 1 (proposed) |
| F4 | SCRUM-20 | Story | Integration tests against a real MongoDB | Medium | 5 | Nirandjan | To Do | Sprint 1 (proposed) |
| F5 | SCRUM-21 | Story | Attendance management | Low (raise if the guide requires it) | 8 | — (decide in Sprint 1 planning) | To Do | Backlog |
| F6 | SCRUM-22 | Story | Deploy the application to a hosting service | Low | 5 | — | To Do | Backlog |

Excluded on purpose: **Faculty management.** The code has no faculty module; staff exist only as login accounts, covered by S1 and F1.

### 4.3 Story and task details, with sub-tasks

Sub-task status key: ✅ Done · 🔍 In Review · ⬜ To Do. **Implementation sub-tasks already finished are assigned to Nithish vikram ss with label `ai-assisted`**, because they were produced with the AI assistant in his workspace. Review and verification sub-tasks go to the members who will actually do them. **Nobody reviews their own work.**

#### S1 · SCRUM-2 (reuse) — User authentication and role-based login · Highest · 8 SP · Nithish vikram ss
**Description:** As a staff member, I want to log in securely so that only authorised people can see and change student data.
**Acceptance criteria:**
1. Correct credentials open the dashboard; wrong credentials show "Invalid username or password." (same message for unknown users).
2. Every page and API call requires login (401 otherwise); sessions expire after 2 hours.
3. Admin can manage students and subjects; Teacher can view data and manage marks; forbidden actions return 403 and are hidden in the UI.
4. 5 failed attempts within 15 minutes lock the account for 15 minutes.
5. Passwords are stored only as BCrypt hashes; no demo passwords in the code.

| Sub-task | Assignee | Status | Evidence |
|---|---|---|---|
| Login API with JWT and BCrypt users | Nithish vikram ss `ai-assisted` | ✅ | `AuthController`, `AuthControllerTest` 9/9 |
| Role-based access rules | Nithish vikram ss `ai-assisted` | ✅ | `SecurityRulesTest` 8/8 |
| Login lockout with 15-minute window | Nithish vikram ss `ai-assisted` | ✅ | `LoginAttemptServiceTest` 7/7 |
| Frontend login, session expiry, role-based UI | Nithish vikram ss `ai-assisted` | ✅ | UI-01, 02, 05, 06 |
| Bug: API had no authentication; demo passwords in the frontend (B2) `bug` | Nithish vikram ss `ai-assisted` | ✅ | `SecurityRulesTest` |
| Bug: failed-login counter never expired (DEF-02) `bug` | Nithish vikram ss `ai-assisted` | ✅ | `failuresOlderThanTheWindowAreForgotten` |
| Review and merge PR | **Keerthi Varma** | ⬜ | PR link |
| Live verification: admin, teacher, lockout | **Nirandjan** | ⬜ | screenshots |

#### S2 · SCRUM-6 — Admin dashboard · Medium · 5 SP · Nithish vikram ss · **Done**
**Description:** As an admin, I want a dashboard of key figures and charts so that I can see class performance at a glance.
**AC:** shows total students and subjects, class average, pass rate, top performers, weakest subject, subject-average chart, pass/fail chart and insights.
**Evidence:** committed in `0b4e635` (2026-04-11). Not placed in any sprint. Later changes are tracked in S7 and S10.
Sub-tasks: *Analytics summary API* ✅ · *Dashboard page and charts* ✅. Both Nithish vikram ss, from the commit, no `ai-assisted` label.

#### S3 · SCRUM-7 — Student registration · High · 5 SP · Keerthi Varma
**Description:** As an admin, I want to register a student with validated details so that records are complete and unique.
**AC:**
1. Name (1–100 chars), register number (3–20 letters/digits), department and semester (1–8) are required.
2. Email is optional but must be valid.
3. A duplicate register number or email is refused with a clear message.
4. Errors appear under the field; nothing is saved when input is invalid.

| Sub-task | Assignee | Status | Evidence |
|---|---|---|---|
| Create-student API: validation, uniqueness, normalisation | Nithish vikram ss `ai-assisted` | ✅ | `StudentValidationTest` 19/19, `StudentServiceTest` |
| Registration form with field errors | Nithish vikram ss `ai-assisted` | ✅ | UI-03, UI-04 |
| Bug: POST with an existing id overwrote another record `bug` | Nithish vikram ss `ai-assisted` | ✅ | `createNormalizesAndIgnoresClientId` |
| Review and merge PR | **Keerthi Varma** | ⬜ | PR link |
| Live verification: valid, invalid, duplicate | **Keerthi Varma** | ⬜ | screenshots |

#### S4 · SCRUM-8 — View and search student information · Medium · 3 SP · Keerthi Varma
**Description:** As a staff member, I want to list, search and filter students so that I can find a record quickly.
**AC:** list shows register number, name, email, department and semester; search by name or register number; filter by department and semester; usable on a 390 px phone screen without sideways scrolling.

| Sub-task | Assignee | Status | Evidence |
|---|---|---|---|
| List, search and filter API | Nithish vikram ss `ai-assisted` | ✅ | `StudentControllerCrudTest` |
| Students table, filters, mobile layout | Nithish vikram ss `ai-assisted` | ✅ | UI-07 |
| Bug: page scrolled sideways on phones (DEF-04) `bug` | Nithish vikram ss `ai-assisted` | ✅ | UI-07 |
| Review and merge PR | **Keerthi Varma** | ⬜ | PR link |
| Live verification, including phone width | **Keerthi Varma** | ⬜ | screenshots |

#### S5 · SCRUM-9 — Update student information · Medium · 3 SP · Keerthi Varma
**Description:** As an admin, I want to edit a student's details so that records stay correct.
**AC:** edit form is pre-filled; same validation as registration; switching to another student's register number is refused (409); editing a missing student returns "Student not found" (404).

| Sub-task | Assignee | Status | Evidence |
|---|---|---|---|
| Update API and rules | Nithish vikram ss `ai-assisted` | ✅ | `StudentServiceTest` |
| Edit modal | Nithish vikram ss `ai-assisted` | ✅ | — |
| Bug: updating a missing student returned 409 instead of 404 (DEF-03) `bug` | Nithish vikram ss `ai-assisted` | ✅ | `updateOfMissingStudent…` |
| Review and merge PR | **Keerthi Varma** | ⬜ | PR link |
| Live verification | **Keerthi Varma** | ⬜ | screenshots |

#### S6 · SCRUM-10 — Delete student information · Medium · 2 SP · Keerthi Varma
**Description:** As an admin, I want to delete a student, with their marks, after confirming, so that no orphan data remains.
**AC:** confirmation dialog; the student's marks are deleted too; teachers cannot delete (403, button hidden); a missing id returns 404.

| Sub-task | Assignee | Status | Evidence |
|---|---|---|---|
| Delete API with marks clean-up | Nithish vikram ss `ai-assisted` | ✅ | `StudentServiceTest`, `StudentControllerCrudTest` |
| Delete button and confirmation | Nithish vikram ss `ai-assisted` | ✅ | — |
| Review and merge PR | **Keerthi Varma** | ⬜ | PR link |
| Live verification | **Nirandjan** | ⬜ | screenshots |

#### S7 · SCRUM-11 — Academic records: subjects and marks · High · 8 SP · Nithish vikram ss
**Description:** As a teacher, I want to manage subjects and record internal and external marks so that results are accurate.
**AC:**
1. Subjects have a unique code and a max mark (1–200), and can be edited. Deleting a subject that has marks needs a second confirmation and removes those marks.
2. Internal + external ≤ the subject's max; no negative marks.
3. Re-entering marks updates the existing record (no duplicates).
4. A single marks record can be edited or deleted.
5. Pass = at least 40% of the subject's max. Overall pass = every subject passed (same on the dashboard and the report card).

| Sub-task | Assignee | Status | Evidence |
|---|---|---|---|
| Subjects: edit, unique code, safe delete | Nithish vikram ss `ai-assisted` | ✅ | `SubjectServiceTest` 5/5 |
| Marks: entry fix, edit and delete, max-marks validation | Nithish vikram ss `ai-assisted` | ✅ | `MarksServiceTest` 8/8, `MarksBoundaryTest` 12/12 |
| Unified pass rule and percentages | Nithish vikram ss `ai-assisted` | ✅ | `AnalyticsServiceTest` |
| Bug: re-saving marks created duplicates, then a 500 error (B3) `bug` | Nithish vikram ss `ai-assisted` | ✅ | `reEntryUpdatesExistingRecord…` |
| Bug: deleting a subject left orphaned marks (B5) `bug` | Nithish vikram ss `ai-assisted` | ✅ | `deleteWithMarksIsBlocked…` |
| Bug: dashboard and report card used different pass rules (B7) `bug` | Nithish vikram ss `ai-assisted` | ✅ | `studentWithGoodAverage…` |
| Review and merge PR | **Nirandjan** | ⬜ | PR link |
| Live verification: subjects and marks for the demo class | **Nirandjan** | ⬜ | screenshots |

#### S8 · SCRUM-12 — Reports and analytics · Medium · 5 SP · Nirandjan
**Description:** As a teacher, I want subject reports, student report cards and a weak-student list so that I can act on results.
**AC:** subject averages and top 10 students; per-student report card that can be printed and exported to CSV (CSV is safe against formula injection); weak students below an adjustable percentage; invalid parameters return 400, never 500.

| Sub-task | Assignee | Status | Evidence |
|---|---|---|---|
| Report pages (original version) | Nithish vikram ss | ✅ | commit `0b4e635` |
| Percentages, print view, CSV export | Nithish vikram ss `ai-assisted` | ✅ | `csv.test.ts` |
| Bug: negative top-students limit returned 500 (DEF-01) `bug` | Nithish vikram ss `ai-assisted` | ✅ | `AnalyticsControllerTest` |
| Review and merge PR | **Nirandjan** | ⬜ | PR link |
| Live verification: print, and open the CSV in Excel | **Nirandjan** | ⬜ | screenshots |

#### S9 · SCRUM-13 — Application testing and quality reports · High · 8 SP · Nirandjan
**Description:** As the team, we want automated tests and test documentation so that we can prove the software works.
**AC:**
1. Test plan, cases, execution report, defect log, coverage, complexity and UI automation reports exist in `docs/testing/`.
2. All automated suites pass on a team member's own machine.
3. Results in the reports match the real logs.
4. The live end-to-end result (SCRUM-1) is added to the execution report.

| Sub-task | Assignee | Status | Evidence |
|---|---|---|---|
| Backend unit/API tests and JaCoCo coverage | Nithish vikram ss `ai-assisted` | ✅ | 124/124; 86.3% instructions |
| Frontend unit tests and Playwright UI tests | Nithish vikram ss `ai-assisted` | ✅ | 15/15, 7/7 |
| Test documentation (7 reports) | Nithish vikram ss `ai-assisted` | ✅ | `docs/testing/` |
| Re-run all suites on own machine and confirm the results | **Nirandjan** | ⬜ | own run log |
| Add the live end-to-end results (from SCRUM-1) to the execution report | **Nirandjan** | ⬜ | updated report |
| Review and merge PR | **Keerthi Varma** | ⬜ | PR link |

#### S10 · SCRUM-14 — Security hardening, bug fixing and optimization · Highest · 5 SP · Nithish vikram ss
**Description:** As the team, we want known defects and security issues fixed so that the system is safe to demonstrate.
**AC:**
1. No secrets in the repository; configuration comes from environment variables.
2. Consistent validation and JSON error responses.
3. Lint passes and the layout is responsive.
4. The duplicate backend copy is removed.
5. The leaked password is rotated (SCRUM-3).

| Sub-task | Assignee | Status | Evidence |
|---|---|---|---|
| Move secrets to `.env`; remove duplicate backend | Nithish vikram ss `ai-assisted` | ✅ | DEVELOPMENT_LOG feature 1 |
| Validation and global error handling | Nithish vikram ss `ai-assisted` | ✅ | `StudentControllerTest` |
| Lint fixes, responsive layout, configurable API URL | Nithish vikram ss `ai-assisted` | ✅ | `npm run lint` exit 0 |
| Bug: Spring Boot 4 ignored the MongoDB URI setting (B15) `bug` | Nithish vikram ss `ai-assisted` | ✅ | feature 1 check |
| Review and merge PR | **Keerthi Varma** | ⬜ | PR link |

#### T1 · SCRUM-1 (reuse) — Run the live end-to-end test with a real MongoDB · Highest · 3 SP · Nirandjan · Sprint 0, due 2026-11-07
**Description:** No test has yet run against a real database. Install MongoDB Community locally (or use a new Atlas cluster from SCRUM-3), start the backend with `DEMO_DATA=true`, and repeat the UI workflows UI-01 to UI-07 against the real backend.
**AC:** the app runs locally against a real database; UI-01 to UI-07 pass manually or with Playwright without the simulated API; screenshots are attached; results are added to TEST_EXECUTION_REPORT.md; any failure is logged as a `bug` sub-task.

#### T2 · SCRUM-3 (reuse) — Rotate the leaked MongoDB Atlas credentials · Highest · 1 SP · Nithish vikram ss · Sprint 0
**Description:** The old database password is in public Git history (commit `0b4e635`). The configured Atlas host no longer resolves.
**AC:** the old password no longer works, or the old cluster is confirmed deleted; any new cluster uses a new password stored only in `server/.env`; Atlas network access is restricted; result recorded in DEFECT_LOG (B1, OPEN-01).

#### T3 · SCRUM-15 — Commit the work per story, open PRs, connect GitHub for Jira · High · 2 SP · Nithish vikram ss
**Description:** The 94 uncommitted files must be committed and reviewed so the work is traceable.
**AC:** one branch and PR per story, named `feature/SCRUM-<key>-<slug>`; every commit message starts with its SCRUM key (see DEVELOPMENT_LOG); GitHub for Jira is installed (needs a site admin, §8) so each issue's Development panel shows its commits and PR; commits are authored by Nithish (the person committing), not under other members' names.

#### T4 · SCRUM-16 — Prepare and rehearse the Review 2 demo · High · 3 SP · Keerthi Varma
**Description:** A smooth live demo of the increment.
**AC:** demo database loaded (`DEMO_DATA=true`); a one-page click path covering login, dashboard, student CRUD, marks, report card and the teacher view; one rehearsal done; a backup screen recording saved.

#### Sprint 1 and backlog items (F1–F6): descriptions and acceptance criteria
| Ref | Description | Acceptance criteria |
|---|---|---|
| F1 Staff account management | Today accounts can only be created from `server/.env` at startup. Admins need to add teachers and users need to change passwords. | Admin can create, disable and list teacher accounts; a user can change their own password (current password required, minimum 8 chars); passwords stay BCrypt-hashed; endpoints restricted to ADMIN |
| F2 Pagination | Lists load every record at once. | Students and marks lists show 10/25/50 rows per page; server-side paging; filters keep working |
| F3 CI pipeline | Tests only run when someone remembers to. | A GitHub Actions workflow runs `./mvnw test`, `npm run lint`, `npm run build` and `npm run test:unit` on every PR; PRs show pass/fail |
| F4 Integration tests with real MongoDB | Repositories are only tested with mocks. | Repository queries (uniqueness, search, cascade delete) tested against a real MongoDB (e.g. Testcontainers or a CI service container) |
| F5 Attendance management | Not implemented. | Mark present/absent per date and subject; attendance % on the report card; flag below 75% |
| F6 Deployment | The app only runs locally. | Backend and frontend hosted with secrets in host environment variables; public demo URL |

### 4.4 Totals
| | Count |
|---|---|
| New issues | 1 epic + 9 stories (S2–S10) + 2 tasks (T3, T4) + 6 future items (F1–F6) = **18** |
| New sub-tasks | **53** (S1 8, S2 2, S3 5, S4 5, S5 5, S6 4, S7 8, S8 5, S9 6, S10 5): 35 already Done (✅), 18 To Do (⬜) |
| Reused issues edited | **3** (SCRUM-1, SCRUM-2, SCRUM-3) |
| Issues deleted | 0 by me. SCRUM-4 deletion is optional and done by Keerthi |

---

## 5. Sprints

### 5.1 Review of the active Sprint 0 (2026-11-02 → 2026-11-16)
- It already exists and is active, so **no new sprint is created and nothing is backdated.**
- 13 days remain from 2026-11-03. Team: 3 members.
- It currently contains SCRUM-1 and SCRUM-2 (placeholders), with **no goal**.

**Why the full increment fits:** the coding for S1 and S3–S10 is already finished. What's left in Sprint 0 is review, commits, live verification and the demo. Remaining-effort estimate in hours (not story points):

| Member | Remaining Sprint 0 work | Est. hours |
|---|---|---|
| Nithish vikram ss | T2 rotate credentials (1), T3 commits, PRs, GitHub for Jira (4), fix review comments (3) | ~8 |
| Keerthi Varma | Review PRs for S1, S3–S6, S9, S10 (7 × ~0.75 = 5), live checks S3–S5 (2), T4 demo (3) | ~10 |
| Nirandjan | T1 live end-to-end (4), review S7 and S8 (1.5), live checks S1, S6, S7, S8 (3), re-run suites and update report (2) | ~10.5 |

About 28 hours across 13 days for 3 people is realistic and **not an overload.**

**Honest caveat for reports:** Sprint 0 will carry **56 SP** (stories S1 and S3–S10: 47 + tasks T1–T4: 9). Most of that implementation effort happened **before** the sprint, with AI assistance, so Sprint 0's velocity **must not** be used to forecast future sprints. State this in the sprint report. Don't lower the story points to make the number look smaller.

**Recommended Sprint 0 scope**

| Include | Key | SP |
|---|---|---|
| S1, S3, S4, S5, S6, S7, S8, S9, S10 | SCRUM-2, 7–14 | 47 |
| T1, T2, T3, T4 | SCRUM-1, 3, 15, 16 | 9 |
| **Total** | | **56** |
| **Leave out:** S2 (already Done, outside sprints); F1–F6 (Sprint 1 or backlog) | | |

**If the team prefers a lighter Sprint 0**, move S8 (Reports) and S9's remaining sub-tasks to Sprint 1 (−13 SP). Not recommended: both are needed for Review 2.

**Proposed Sprint 0 goal** (Sprint 0 currently has none): *"Get the secure, tested Student Management System reviewed, merged and verified on a live database, and demonstrate it at Project Review 2."*
Setting the goal is a sprint **update**: the tool rewrites the whole sprint, so the current name and dates must be re-sent unchanged.

### 5.2 Sprint 1 (prepare only; do not start)
| Field | Proposal |
|---|---|
| Sprint | **SCRUM Sprint 1** (already exists as Future, no dates) |
| Goal | "Make the system maintainable and multi-user: staff account management, pagination, CI and real-database tests." |
| Dates | **Not set now.** Set when the team starts it, proposed 2026-11-17 → 2026-11-30 |
| Planned items | F1 (5), F2 (3), F3 (3), F4 (5) = **16 SP**. Sized lower than Sprint 0 because this will be new coding with no previous velocity data |
| Optional | F5 Attendance (8 SP) **only if** the guide requires it, which brings the sprint to 24 SP |
| Action now | Add F1–F4 to Sprint 1 **without starting it** |

---

## 6. Definition of Done (for the board description)
1. Code is on a branch named `feature/SCRUM-<key>-<slug>`, and every commit message starts with its SCRUM key.
2. The PR is reviewed and approved by **another** team member and merged into `main`.
3. `./mvnw test`, `npm run lint`, `npm run build` and `npm test` pass.
4. Acceptance criteria are verified on the running app with a real MongoDB, with a screenshot or log attached.
5. No secrets in code; all of the issue's sub-tasks are Done.

---

## 7. Complete list of proposed Jira changes (requires your approval)

Executed in this order. ✏️ = edit of an existing issue · ➕ = create · 🏃 = sprint change · ⛔ = not done by me.

| # | Action | Target | Details |
|---|---|---|---|
| 1 | ➕ Create epic | E1 → SCRUM-5 | "Student Management System" + description |
| 2 | ✏️ Edit | **SCRUM-2** | Summary "User authentication and role-based login"; description and AC (S1); assignee Nithish vikram ss; 8 SP; Highest; labels `review-2`, `ai-assisted`; parent SCRUM-5 |
| 3 | 🔀 Transition | SCRUM-2 | In Progress → **In Review** |
| 4 | ✏️ Edit | **SCRUM-1** | Summary "Run the live end-to-end test with a real MongoDB"; description and AC (T1); assignee **Nirandjan**; 3 SP; Highest; label `review-2`; parent SCRUM-5; due date 2026-11-07 kept |
| 5 | ✏️ Edit | **SCRUM-3** | Summary "Rotate the leaked MongoDB Atlas credentials"; description and AC (T2); assignee Nithish vikram ss; 1 SP; Highest; label `review-2`; parent SCRUM-5 |
| 6 | 🔀 Transition | SCRUM-3 | In Progress → **To Do** (work not started) |
| 7 | ➕ Create stories | S2–S10 → SCRUM-6…14 | Fields from §4.2/§4.3; parent SCRUM-5 |
| 8 | 🔀 Transition | SCRUM-6 (S2) | To Do → **Done** (evidence: commit `0b4e635`); stays outside sprints |
| 9 | 🔀 Transition | SCRUM-7…14 | To Do → **In Review** |
| 10 | ➕ Create tasks | T3, T4 → SCRUM-15, 16 | Status To Do |
| 11 | ➕ Create sub-tasks | 53 sub-tasks under SCRUM-2, 6…14 | Assignees and statuses as in §4.3 (✅ → transition to Done after creation) |
| 12 | 🏃 Add to Sprint 0 | SCRUM-3, 7–16 | SCRUM-1 and SCRUM-2 are already in it |
| 13 | 🏃 Update Sprint 0 | id 2 | Set the goal (§5.1); name and dates re-sent unchanged |
| 14 | ➕ Create future items | F1–F6 → SCRUM-17…22 | Status To Do |
| 15 | 🏃 Add to Sprint 1 (not started) | SCRUM-17…20 | Dates left empty; **not started** |
| ⛔ | Delete SCRUM-4, add Testing column, rename project, add Bug type, install GitHub for Jira | — | Need Keerthi Varma or a site admin (§8) |

**Totals:** 3 existing issues edited · 18 issues + 53 sub-tasks created · 46 status transitions (11 issues + 35 finished sub-tasks) · 2 sprint changes (Sprint 0 goal + scope; Sprint 1 scope only) · 0 deletions · 0 sprints created or started.

---

## 8. Actions requiring Keerthi Varma (project admin) or a site admin
| # | Action | Where in Jira | Why |
|---|---|---|---|
| A1 | **Add a "Testing" status and board column** between In Review and Done | Board → ⋯ → *Configure board* → *Columns and statuses* → *+ Add column* "Testing" (team-managed boards create the status with the column) | Requested workflow: To Do → In Progress → In Review → Testing → Done |
| A2 | *(Optional)* Rename the project "Team Astro" → **"Student Management System"** | Project settings → Details → Name. **Keep key SCRUM** (changing the key breaks links) | Makes the project recognisable at review |
| A3 | Delete the orphan sub-task **SCRUM-4** (Option A), or all four placeholders (Option B) | Issue → ⋯ → Delete | Empty placeholder with no parent |
| A4 | *(Optional)* Add a **Bug** work type | Project settings → Work types → *Add work type* → Bug | Defects can then be real Bug issues instead of `bug`-labelled sub-tasks |
| A5 | Install **GitHub for Jira** and connect `nithishvikramss/learnify-system` | Jira → Apps → Explore apps → "GitHub for Jira" (needs **Jira site admin**) | Commits and PRs appear on SCRUM issues (T3) |
| A6 | Confirm Nithish vikram ss and Nirandjan are **Members** (not Viewers) | Project settings → Access | Needed to edit issues and manage sprints (Sprint 0 goal, Sprint 1 later) |
| A7 | Paste the Definition of Done (§6) into the board/project description | Project settings → Details | Visible to the reviewer |

---

## 9. Final verification after changes (I'll run these read-only)
| Check | JQL / method | Expected |
|---|---|---|
| Every story has sub-tasks | `parent = <story key>` for each story | ≥ 1 each |
| No unassigned in-sprint items | `project = SCRUM AND sprint = 2 AND assignee is EMPTY` | 0 |
| No AI agents assigned | `project = SCRUM AND assignee in ("Jira Triage Agent","Jira Delivery Agent","Jira Coding Agent")` | 0 |
| Priorities set | `project = SCRUM AND priority is EMPTY` | 0 |
| Sprint 0 scope | `sprint = 2` | SCRUM-1, 2, 3, 7–16 |
| Sprint 1 not started | `listJiraBoardSprints` | state = future |
| GitHub linked | Development panel on Sprint 0 stories | ≥ 1 commit or PR (after T3 and A5) |
| Testing evidence | Attachments on SCRUM-1 and the "Live verification" sub-tasks | present before Done |

## 10. Decisions I need from you
1. Approve **Option A** (reuse SCRUM-1/2/3), or choose B or C.
2. Approve the backlog (§4) and the Sprint 0 scope (§5.1), or name changes.
3. Confirm Sprint 1 content (F1–F4), and whether Attendance (F5) is required by your guide.
4. Should implementation sub-tasks be assigned to Nithish vikram ss with the `ai-assisted` label, as proposed?
