> **Superseded (2026-11-03):** most of this plan has since been implemented. Use [docs/agile/JIRA_CHANGE_PROPOSAL.md](docs/agile/JIRA_CHANGE_PROPOSAL.md), which reflects the actual project state. This file uses the placeholder key `SMS`; the real Jira project key is **`SCRUM`**.

# Jira Import Plan — Student Management System (SMS)

**Jira site:** https://kct-team-pbmyxxdq.atlassian.net
**Suggested project key:** `SMS` (if your project already uses another key, replace `SMS` throughout)
**Prepared:** 2026-11-03, based on the code audit in [PROJECT_AUDIT.md](PROJECT_AUDIT.md)

> **Status of this plan:** proposal only. No Jira issues were created or changed. This session has no Jira/Atlassian access. Before creating anything, check the existing Jira project for issues that already cover these stories, so you don't create duplicates.

## How to read this plan

- **Done** means the feature exists in the code today, with the Git commit as evidence. Create these issues and move them straight to *Done*, linking the commit. **Don't put them in a fake past sprint**; leave them outside sprints or note "Completed before Jira tracking started".
- **To Do** means work that remains. Story points use the Fibonacci scale (1, 2, 3, 5, 8). Assume roughly 1 point ≈ half a day for one student.
- **Assignees:** Nithish Vikram (backend lead), Keerthivarma (frontend lead), Nirandijan (QA / testing & documentation). Pick a Scrum Master and Product Owner among the three and record it in Jira.
- **Priority** uses Jira's default levels: Highest, High, Medium, Low.
- Bug IDs (B1, B2, …) refer to PROJECT_AUDIT.md §6.

---

## Epic

| Field | Value |
|---|---|
| Issue type | Epic |
| Summary | Student Management System |
| Description | Web application for managing students, subjects and marks, with analytics dashboards and reports. Stack: React + TypeScript (Vite) frontend, Spring Boot REST API, MongoDB Atlas. |
| Labels | `sms`, `review-2` |

All stories below are children of this epic.

---

## Backlog overview

| Key | Story | Status | Priority | SP | Sprint | Assignee |
|---|---|---|---|---|---|---|
| US-01 | Project setup (frontend + backend + DB) | Done | High | 3 | — (pre-Jira) | Commit author |
| US-02 | Manage student records | Done | High | 5 | — (pre-Jira) | Commit author |
| US-03 | Manage subjects (add / list / delete) | Done | High | 3 | — (pre-Jira) | Commit author |
| US-04 | Enter and maintain student marks | In Progress (bug B3) | Highest | 5 | Sprint 1 | Nithish Vikram |
| US-05 | Analytics dashboard | Done | Medium | 5 | — (pre-Jira) | Commit author |
| US-06 | Reports (overview, report card, weak students) | Done | Medium | 5 | — (pre-Jira) | Commit author |
| US-07 | Login screen prototype | Done (prototype) | Medium | 3 | — (pre-Jira) | Commit author |
| US-08 | Secure configuration and secrets | To Do | Highest | 2 | Sprint 1 | Nithish Vikram |
| US-09 | Server-side validation and error handling | To Do | High | 5 | Sprint 1 | Nithish Vikram |
| US-10 | Repository cleanup and README | To Do | High | 2 | Sprint 1 | Keerthivarma |
| US-11 | Frontend code quality and configurable API URL | To Do | Medium | 3 | Sprint 1 | Keerthivarma |
| US-12 | Real login with JWT authentication | To Do | High | 8 | Sprint 2 | Nithish Vikram |
| US-13 | Role-based access (Admin / Teacher) | To Do | High | 5 | Sprint 2 | Keerthivarma |
| US-14 | Edit subjects and safe subject deletion | To Do | Medium | 3 | Sprint 2 | Keerthivarma |
| US-15 | Student register number and unique fields | To Do | Medium | 3 | Sprint 2 | Nirandijan |
| US-16 | Consistent pass rule and subject max marks | To Do | Medium | 3 | Sprint 2 | Nirandijan |
| US-17 | Automated backend tests | To Do | High | 8 | Sprint 3 | Nirandijan |
| US-18 | Test plan, test cases and test report | To Do | High | 5 | Sprint 3 | Nirandijan |
| US-19 | Demo seed data and demo script | To Do | Medium | 2 | Sprint 3 | Nirandijan |
| US-20 | Print / export student report card | To Do | Low | 3 | Sprint 3 | Keerthivarma |
| US-21 | Student filters and pagination | To Do | Low | 3 | Sprint 3 | Keerthivarma |
| US-22 | Attendance module (stretch) | Backlog | Low | 8 | Unplanned | — |

**Totals:** Done 24 SP · Sprint 1 17 SP · Sprint 2 22 SP · Sprint 3 21 SP · Stretch 8 SP

---

## Stories already implemented (log as Done)

### US-01 — Project setup
*As a developer, I want a working frontend, backend and database skeleton so that the team can build features on it.*
**Evidence:** commits `7e6ec3d` (Spring Boot + MongoDB) and `0b4e635` (React client).
**Acceptance criteria**
- [x] Spring Boot project with MongoDB dependency builds with Maven.
- [x] React + TypeScript + Vite client builds with `npm run build`.
- [x] Backend allows CORS requests from the dev frontend (`localhost:5173`).

**Subtasks:** Create Spring Boot project · Configure MongoDB connection · Create React/Vite client · Configure CORS.

### US-02 — Manage student records
*As an admin, I want to add, view, search, edit and delete students so that the student list stays accurate.*
**Evidence:** `StudentController`, `StudentService`, `client/src/pages/StudentManagement.tsx`.
**Acceptance criteria**
- [x] I can add a student with name, email, department and semester.
- [x] I can see all students in a table.
- [x] I can search students by name (case-insensitive).
- [x] I can edit a student's details.
- [x] Deleting a student asks for confirmation and also deletes that student's marks.

**Subtasks:** Student entity + repository · CRUD REST endpoints · Student table UI · Add/Edit modal · Search · Delete with confirm.

### US-03 — Manage subjects
*As an admin, I want to add, view and delete subjects so that marks can be recorded per subject.*
**Evidence:** `SubjectController`, `client/src/pages/Subjects.tsx`.
**Acceptance criteria**
- [x] I can add a subject with name, code and max marks.
- [x] I can see all subjects in a table.
- [x] I can delete a subject after confirming.

*Editing subjects isn't done yet; that's US-14.*

### US-05 — Analytics dashboard
*As a teacher, I want a dashboard with key numbers and charts so that I can see class performance at a glance.*
**Evidence:** `AnalyticsService`, `AnalyticsController`, `Dashboard.tsx`, `Charts.tsx`, `MetricCard.tsx`.
**Acceptance criteria**
- [x] Shows total students, total subjects, class average and pass percentage.
- [x] Shows average marks per subject as a bar chart.
- [x] Shows pass vs. fail as a chart.
- [x] Lists the top 5 students.
- [x] Shows auto-generated text insights (e.g. weakest subject).

### US-06 — Reports
*As a teacher, I want class reports, per-student report cards and a weak-student list so that I can take action.*
**Evidence:** `Reports.tsx`, `/api/analytics/*`, `/api/marks/student/{id}`.
**Acceptance criteria**
- [x] Overview tab shows subject averages and the top 10 students.
- [x] Report Card tab shows one student's marks per subject with totals and pass/fail.
- [x] Weak Students tab lists students below an adjustable threshold (default 40).

### US-07 — Login screen prototype
*As a user, I want a login screen so that only staff use the system.*
**Evidence:** `Login.tsx`, `AuthGuard` in `App.tsx`, logout in `Sidebar.tsx`.
**Acceptance criteria**
- [x] Login page with username/password and show/hide password.
- [x] Pages other than login redirect to `/login` when not logged in.
- [x] Logout returns to the login page.

**Note for reviewers:** this is a **front-end-only prototype** with hard-coded demo users. Real authentication is US-12.

---

## Sprint 1 — "The app is safe, stable and runs from a clean clone"

### US-04 — Enter and maintain student marks · Highest · 5 SP · Nithish Vikram
*As a teacher, I want to enter, correct and remove a student's marks per subject so that results are accurate.*
**Already done:** entering marks for several subjects at once and the marks table (commit `0b4e635`).
**Remaining:** bug B3 (duplicate record or crash on re-entry), plus edit and delete of individual marks.
**Acceptance criteria**
- [ ] Saving marks for a student + subject that already has marks **updates** the record and doesn't create a new one.
- [ ] Saving marks for the same pair three or more times never returns an error.
- [ ] I can edit a single marks row from the Marks Entry table.
- [ ] I can delete a single marks row after confirmation.
- [ ] Dashboard averages don't change after re-saving identical marks.

**Subtasks**
- SMS-T: Replace `.orElse(save(...))` with `.orElseGet(...)` in `MarksService.addOrUpdateMarks`
- SMS-T: Add `PUT /api/marks/{id}` and `DELETE /api/marks/{id}`
- SMS-T: Add Edit/Delete buttons to the Marks Entry table
- SMS-T: Clean up existing duplicate marks documents in the database
- SMS-T: Unit test for update-not-duplicate (link to US-17)

### US-08 — Secure configuration and secrets · Highest · 2 SP · Nithish Vikram
*As the project owner, I want database credentials kept out of Git so that nobody else can access our data.*
**Acceptance criteria**
- [ ] The MongoDB Atlas password has been rotated (old password no longer works).
- [ ] Atlas Network Access is restricted (no `0.0.0.0/0` unless needed for the demo).
- [ ] `application.properties` reads `spring.data.mongodb.uri=${MONGODB_URI}`.
- [ ] An `application-example.properties` or `.env.example` documents the variable without real values.
- [ ] No file in the latest commit contains a password.

**Subtasks:** Rotate Atlas password · Restrict network access · Move URI to env variable · Add example config · Update README run steps.

### US-09 — Server-side validation and error handling · High · 5 SP · Nithish Vikram
*As a user, I want clear error messages when I enter invalid data so that bad data never gets saved.*
**Acceptance criteria**
- [ ] Student: name, department and email format are required; semester is 1–8. Invalid input returns HTTP 400 with field messages.
- [ ] Subject: name and code are required; maxMarks is 1–200.
- [ ] Marks: internal and external are each 0–50; student and subject must exist (else 400/404).
- [ ] Update or delete of a missing ID returns 404; unexpected errors return 500 with a generic message.
- [ ] The frontend shows the server's error message in the alert box.
- [ ] Reports page shows an error message instead of a blank screen when the API fails.

**Subtasks:** Add `spring-boot-starter-validation` · Add `@Valid` constraints to entities/DTOs · `@RestControllerAdvice` global handler · Custom `NotFoundException` · Frontend error display.

### US-10 — Repository cleanup and README · High · 2 SP · Keerthivarma
*As a new team member or reviewer, I want a clean repository with setup instructions so that I can run the project in 10 minutes.*
**Acceptance criteria**
- [ ] The duplicate root backend (`src/`, `pom.xml`, `mvnw*`, `.mvn/`, `HELP.md`) and `server.zip` are removed; `server/` is the only backend.
- [ ] `.claude/settings.local.json` is untracked and ignored.
- [ ] The root `README.md` has: description, tech stack, prerequisites, setup and run steps, environment variables, screenshots and the team list.
- [ ] `client/README.md` describes the frontend (not the Vite template).
- [ ] Branch and commit conventions (Jira key in commits) are documented.

### US-11 — Frontend code quality and configurable API URL · Medium · 3 SP · Keerthivarma
*As a developer, I want the frontend to pass lint and use a configurable API URL so that it works outside my laptop.*
**Acceptance criteria**
- [ ] `npm run lint` passes with 0 errors.
- [ ] Chart tooltip components are defined outside render, with no `any` types.
- [ ] The API base URL comes from `VITE_API_URL` (default `/api` via the Vite proxy).
- [ ] `npm run build` still succeeds.

---

## Sprint 2 — "Users log in for real, and each role sees only what it should"

### US-12 — Real login with JWT authentication · High · 8 SP · Nithish Vikram
*As an admin, I want users to log in against the server so that only authorised staff can access student data.*
**Acceptance criteria**
- [ ] A `users` collection stores username, BCrypt-hashed password and role.
- [ ] `POST /api/auth/login` returns a JWT on correct credentials and 401 on wrong ones.
- [ ] All `/api/**` endpoints except login return 401 without a valid token.
- [ ] The frontend stores the token, sends it in the `Authorization` header, and redirects to login on 401 or when the token expires.
- [ ] Demo credentials are no longer hard-coded in the frontend or shown on the login page.
- [ ] One admin user is created on first start from environment variables.

**Subtasks:** Add Spring Security + JWT library · User entity/repository · Auth controller + JWT filter · Security config (stateless) · Seed admin user · Axios interceptor · Update Login page · Logout clears token.

### US-13 — Role-based access (Admin / Teacher) · High · 5 SP · Keerthivarma
*As an admin, I want teachers to have limited permissions so that only admins can change master data.*
**Acceptance criteria**
- [ ] ADMIN can create, update and delete students and subjects.
- [ ] TEACHER can view students and subjects, enter and edit marks, and view reports, but gets 403 on student/subject create/update/delete.
- [ ] The UI hides buttons the current role isn't allowed to use.
- [ ] The role shown in the top bar comes from the token, not from localStorage text.

### US-14 — Edit subjects and safe subject deletion · Medium · 3 SP · Keerthivarma
*As an admin, I want to edit subjects and be warned before deleting a subject with marks so that data stays consistent.*
**Acceptance criteria**
- [ ] `PUT /api/subjects/{id}` exists, and the Subjects page has an Edit button.
- [ ] Deleting a subject that has marks either is blocked with a clear message or deletes its marks after a second confirmation (team decides; document it).
- [ ] No marks reference a deleted subject.

### US-15 — Student register number and unique fields · Medium · 3 SP · Nirandijan
*As an admin, I want each student to have a unique register number so that students can be identified unambiguously.*
**Acceptance criteria**
- [ ] Student has a required `registerNumber` field, shown in the table and the forms.
- [ ] Register number and email are unique; duplicates return 409 with a clear message.
- [ ] Subject code is unique.
- [ ] Search works by name or register number.

### US-16 — Consistent pass rule and subject max marks · Medium · 3 SP · Nirandijan
*As a teacher, I want pass/fail and percentages calculated the same way everywhere so that reports don't contradict each other.*
**Acceptance criteria**
- [ ] The team agrees on and documents one rule (e.g. "pass = every subject ≥ 40%").
- [ ] The dashboard, report card and weak-student list all use that rule.
- [ ] The percentage uses the subject's `maxMarks`, not a fixed 100.
- [ ] Marks entry limits follow the subject's max marks.

---

## Sprint 3 — "The system is tested, documented and demo-ready"

### US-17 — Automated backend tests · High · 8 SP · Nirandijan
*As a developer, I want automated tests so that changes don't break existing features.*
**Acceptance criteria**
- [ ] Unit tests (JUnit 5 + Mockito) for `StudentService`, `SubjectService`, `MarksService` and `AnalyticsService`, covering the US-04 regression.
- [ ] Controller tests (`@WebMvcTest` + MockMvc) for each controller, covering success, validation error, 404 and 401/403.
- [ ] `./mvnw test` runs **without** the live Atlas database (mocks, or a test profile).
- [ ] The coverage report (JaCoCo) is generated, with a target of ≥ 60% line coverage on services.

### US-18 — Test plan, test cases and test report · High · 5 SP · Nirandijan
*As the team, we want formal testing documents so that we can present software quality evidence at Review 2.*
**Acceptance criteria**
- [ ] Test plan: scope, approach, environment, entry/exit criteria.
- [ ] At least 30 manual test cases across login, students, subjects, marks and reports (ID, steps, expected, actual, status).
- [ ] Test execution report with **real** pass/fail results and dates.
- [ ] Bug report listing defects found, each linked to a Jira Bug issue.
- [ ] Automated test results and the coverage screenshot attached.

### US-19 — Demo seed data and demo script · Medium · 2 SP · Nirandijan
*As a presenter, I want predictable demo data and a script so that the live demo goes smoothly.*
**Acceptance criteria**
- [ ] A seed script or command loads about 20 students, 5 subjects and marks for all of them into a **separate** demo database.
- [ ] A one-page demo script lists the click path: login → add student → enter marks → dashboard → report card → weak students → role restriction.
- [ ] A backup screen recording of the demo exists.

### US-20 — Print / export student report card · Low · 3 SP · Keerthivarma
*As a teacher, I want to print or download a student's report card so that I can share it with parents.*
**Acceptance criteria**
- [ ] A "Print" button on the Report Card tab uses a print-friendly layout (no sidebar).
- [ ] An "Export CSV" button downloads the marks table for the selected student.

### US-21 — Student filters and pagination · Low · 3 SP · Keerthivarma
*As an admin, I want to filter students by department and semester so that I can find students quickly.*
**Acceptance criteria**
- [ ] Department and semester dropdown filters on the Students page.
- [ ] Shows 10/25/50 rows per page with page navigation.

---

## Backlog (stretch)

### US-22 — Attendance module · Low · 8 SP
*As a teacher, I want to record daily attendance per subject so that I can track student attendance percentage.*
**Acceptance criteria**
- [ ] I can mark Present/Absent for all students of a subject on a date.
- [ ] Each student's attendance % per subject is shown on the report card.
- [ ] Students below 75% are flagged.

Start only after Sprints 1–3 are complete, or if your guide requires it.

---

## Bugs to create as Jira "Bug" issues

Link each bug to the story that fixes it.

| Bug | Summary | Priority | Fixed by |
|---|---|---|---|
| B1 | MongoDB credentials committed to repository | Highest | US-08 |
| B2 | Login is client-side only; API has no authentication | High | US-12, US-13 |
| B3 | Re-saving marks creates duplicates, then a 500 error | Highest | US-04 |
| B4 | No server-side input validation | High | US-09 |
| B5 | Deleting a subject leaves orphaned marks | Medium | US-14 |
| B6 | Subject maxMarks ignored in percentage | Medium | US-16 |
| B7 | Pass/fail rule differs between dashboard and report card | Medium | US-16 |
| B8 | Duplicate student emails / subject codes allowed | Medium | US-15 |
| B9 | Wrong HTTP status codes and silent errors on Reports page | Medium | US-09 |
| B10 | API base URL hard-coded to localhost | Low | US-11 |
| B11 | `npm run lint` fails (5 errors) | Low | US-11 |
| B12 | Duplicate backend folder, zip and local settings committed | Low | US-10 |

---

## Sprint plan

| | Sprint 1 | Sprint 2 | Sprint 3 |
|---|---|---|---|
| **Goal** | Safe, stable, runs from a clean clone | Real login and role-based access | Tested, documented, demo-ready |
| **Stories** | US-04, US-08, US-09, US-10, US-11 | US-12, US-13, US-14, US-15, US-16 | US-17, US-18, US-19, US-20, US-21 |
| **Story points** | 17 | 22 | 21 |
| **Suggested length** | 1 week | 1 week | 1 week |

- Set real start and end dates when you press **Start sprint** in Jira. Don't create sprints with past dates.
- If the team finishes less than planned in Sprint 1, carry the leftover forward and plan Sprint 2 from that measured velocity, not from this estimate.
- Order of priority if time runs short: US-08 → US-04 → US-09 → US-12 → US-17/US-18 → everything else.

### Definition of Done (put this in the Jira board description)
1. Code is on a feature branch named with the Jira key and merged into `main` via a reviewed pull request.
2. Acceptance criteria are checked and demonstrated.
3. `./mvnw test` and `npm run lint && npm run build` pass.
4. No secrets are in the code.
5. The Jira issue is moved to Done, with the PR linked.

---

## Optional: CSV for Jira import (stories only)

Jira → *Project settings / System → External system import → CSV*. Map `Issue Type`, `Summary`, `Description`, `Priority`, `Story Points`, `Status` and `Epic Link` (or `Parent`). Create the Epic first and put its key in place of `SMS-EPIC`. Add subtasks manually after import, because CSV subtask import needs parent IDs.

```csv
Issue Type,Summary,Priority,Story Points,Status,Parent,Description
Story,US-01 Project setup (frontend + backend + DB),High,3,Done,SMS-EPIC,"Evidence: commits 7e6ec3d, 0b4e635"
Story,US-02 Manage student records,High,5,Done,SMS-EPIC,"Evidence: StudentController, StudentManagement.tsx"
Story,US-03 Manage subjects (add/list/delete),High,3,Done,SMS-EPIC,"Evidence: SubjectController, Subjects.tsx"
Story,US-04 Enter and maintain student marks,Highest,5,In Progress,SMS-EPIC,"Fix duplicate-on-update bug B3; add edit/delete marks"
Story,US-05 Analytics dashboard,Medium,5,Done,SMS-EPIC,"Evidence: AnalyticsService, Dashboard.tsx"
Story,US-06 Reports (overview / report card / weak students),Medium,5,Done,SMS-EPIC,"Evidence: Reports.tsx"
Story,US-07 Login screen prototype,Medium,3,Done,SMS-EPIC,"Frontend-only prototype; real auth in US-12"
Story,US-08 Secure configuration and secrets,Highest,2,To Do,SMS-EPIC,"Rotate Atlas password; MONGODB_URI env var"
Story,US-09 Server-side validation and error handling,High,5,To Do,SMS-EPIC,"Bean validation + global exception handler"
Story,US-10 Repository cleanup and README,High,2,To Do,SMS-EPIC,"Remove duplicate root backend and server.zip; write README"
Story,US-11 Frontend code quality and configurable API URL,Medium,3,To Do,SMS-EPIC,"Fix lint errors; VITE_API_URL"
Story,US-12 Real login with JWT authentication,High,8,To Do,SMS-EPIC,"Spring Security + JWT + BCrypt users"
Story,US-13 Role-based access (Admin / Teacher),High,5,To Do,SMS-EPIC,"Restrict endpoints and UI by role"
Story,US-14 Edit subjects and safe subject deletion,Medium,3,To Do,SMS-EPIC,"PUT subject; handle marks on delete"
Story,US-15 Student register number and unique fields,Medium,3,To Do,SMS-EPIC,"registerNumber; unique email/code"
Story,US-16 Consistent pass rule and subject max marks,Medium,3,To Do,SMS-EPIC,"One pass rule everywhere; use maxMarks"
Story,US-17 Automated backend tests,High,8,To Do,SMS-EPIC,"JUnit + Mockito + MockMvc; JaCoCo"
Story,US-18 Test plan / test cases / test report,High,5,To Do,SMS-EPIC,"Formal QA documents for Review 2"
Story,US-19 Demo seed data and demo script,Medium,2,To Do,SMS-EPIC,"Separate demo DB + click-path script"
Story,US-20 Print / export student report card,Low,3,To Do,SMS-EPIC,"Print CSS + CSV export"
Story,US-21 Student filters and pagination,Low,3,To Do,SMS-EPIC,"Department/semester filter; paging"
Story,US-22 Attendance module (stretch),Low,8,To Do,SMS-EPIC,"Only if time allows"
```
