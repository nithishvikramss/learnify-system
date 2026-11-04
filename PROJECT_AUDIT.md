# Project Audit — Student Management System (Learnify)

**Audit date:** 2026-11-03
**Branch audited:** `backend.setup` (commit `a4ae3bf`)
**Repository:** https://github.com/nithishvikramss/learnify-system
**Scope:** Read-only audit and planning. No application code was changed.

> In the code the app is called **"Learnify Analytics — Student Performance Analytics System"**. For the review it is presented as the **Student Management System (SMS)**. Pick one name and use it everywhere (UI title, README, Jira and slides).

---

## 1. Project overview (plain-language summary)

Learnify is a web application that lets a college admin or teacher:

1. Keep a list of **students** (add, view, search, edit and delete).
2. Keep a list of **subjects** (add, view and delete).
3. Enter **marks** for each student in each subject (internal + external).
4. See a **dashboard** with charts: class average, pass/fail percentage, top students and the weakest subject.
5. Open **reports**: a class overview, a per-student report card and a list of students below a chosen pass mark.

It has two halves:

- A **frontend** (what you see in the browser), built with React.
- A **backend** (the server that stores and calculates data), built with Java Spring Boot.

The backend stores data in a cloud **MongoDB** database (MongoDB Atlas).

```
Browser (React, port 5173)  ──HTTP/JSON──►  Spring Boot API (port 8080)  ──►  MongoDB Atlas (cloud)
```

---

## 2. Technology stack

| Layer | Technology | Version (from config) | What it does |
|---|---|---|---|
| Frontend language | TypeScript | ~6.0 | JavaScript with type checking |
| Frontend framework | React | 19.2 | Builds the user interface |
| Build tool | Vite | 8.0 | Dev server and production build |
| Routing | react-router-dom | 7.14 | Page navigation (`/dashboard`, `/students`, …) |
| HTTP client | axios | 1.15 | Calls the backend API |
| Charts | recharts | 3.8 | Bar and pie charts |
| Icons | lucide-react | 1.8 | Icons |
| Backend language | Java | 17 (target); JDK 25 installed on this machine | |
| Backend framework | Spring Boot | 4.0.5 | REST API server |
| Backend modules | spring-boot-starter-webmvc, spring-boot-starter-data-mongodb | | Web endpoints and the database layer |
| Database | MongoDB Atlas (cloud) | | Collections: `students`, `subjects`, `marks` |
| Build (backend) | Maven (via `mvnw` wrapper) | | Compiles and packages the server |
| Testing | JUnit 5 (spring-boot-starter-test) | | Only one placeholder test exists |

**Recommendation:** keep this stack. It is modern, it builds, and changing it now would throw away working code.

---

## 3. Folder structure

```
learnify-system/
├── client/                      ← FRONTEND (React + Vite)
│   ├── src/
│   │   ├── api/api.ts           ← all calls to the backend
│   │   ├── components/          ← Sidebar, MetricCard, Charts
│   │   ├── pages/               ← Login, Dashboard, StudentManagement, Subjects, MarksEntry, Reports
│   │   ├── types/index.ts       ← TypeScript data shapes
│   │   ├── App.tsx              ← routes + login guard
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── server/                      ← BACKEND (Spring Boot) ← the REAL backend
│   ├── pom.xml
│   └── src/main/java/com/learnify/server/
│       ├── controller/          ← REST endpoints (Student, Subject, Marks, Analytics)
│       ├── service/             ← business logic
│       ├── repository/          ← MongoDB access
│       ├── entity/              ← Student, Subject, Marks
│       ├── dto/                 ← response objects for analytics
│       └── config/CorsConfig.java
│
├── src/, pom.xml, mvnw, mvnw.cmd, .mvn/, HELP.md   ← ⚠ DUPLICATE COPY of the backend
└── server.zip                                      ← ⚠ old zipped starter project
```

**Problem:** the backend exists **twice**: once in `server/` and once at the repository root (`src/`, `pom.xml`). The Java source is identical. Only `pom.xml` differs: the root copy has no test dependency. This confuses anyone who clones the repo ("which one do I run?"). Decide on `server/` and delete the root copy (see roadmap, Sprint 1).

---

## 4. Implemented modules (what already works in code)

### 4.1 Backend REST API

| Module | Endpoint | Method | Status |
|---|---|---|---|
| Students | `/api/students` | POST (create) | ✅ |
| | `/api/students` (`?search=`, `?department=`) | GET (list/search/filter) | ✅ |
| | `/api/students/{id}` | GET / PUT / DELETE | ✅ (delete also removes that student's marks) |
| | `/api/students/count` | GET | ✅ |
| Subjects | `/api/subjects` | POST / GET | ✅ |
| | `/api/subjects/{id}` | GET / DELETE | ✅ (no **update** endpoint) |
| Marks | `/api/marks` | POST (add or update) | ⚠ **has a bug**, see B3 |
| | `/api/marks`, `/api/marks/student/{id}`, `/api/marks/raw` | GET | ✅ |
| Analytics | `/api/analytics/summary`, `/subject-averages`, `/top-students`, `/pass-fail`, `/class-average`, `/below-threshold` | GET | ✅ |

### 4.2 Frontend pages

| Page | What it does | Status |
|---|---|---|
| Login | Username/password form | ⚠ **Fake login**: users are hard-coded in the browser (see B2) |
| Dashboard | Metric cards, subject bar chart, pass/fail chart, top students, auto-generated insights | ✅ |
| Student Management | Table, search, add/edit modal, delete with confirmation | ✅ |
| Subjects | Table, add modal, delete | ✅ (no edit) |
| Marks Entry | Pick a student, enter several subjects at once, see all marks with pass/fail | ⚠ Re-entering marks hits bug B3 |
| Reports & Analytics | Tabs: Overview, Report Card (per student), Weak Students (adjustable threshold) | ✅ |
| Logout | Clears local login flag | ✅ |

### 4.3 Frontend ↔ backend ↔ database connectivity

- The frontend calls `http://localhost:8080/api/...` (hard-coded in `client/src/api/api.ts`).
- The backend allows the browser origins `localhost:5173` and `localhost:3000` (CORS config).
- The backend connects to MongoDB Atlas using the URI in `server/src/main/resources/application.properties`.
- `vite.config.ts` also defines an `/api` proxy, but the frontend doesn't use it because it calls the full URL instead.

### 4.4 Login and authentication: does it work?

**Short answer: it works as a demo screen, but it is not real authentication.**

- The usernames and passwords (`admin/admin123`, `teacher/teacher123`) are written into `client/src/pages/Login.tsx` and printed on the login page.
- "Logged in" only means the browser stored `auth` in `localStorage`. Anyone can open DevTools, type `localStorage.setItem('auth','{}')` and skip the login screen.
- The **backend has no security at all**. Anyone who can reach port 8080 can read, change or delete every record without logging in.
- The "Administrator" and "Teacher" roles are only shown as a label. Both roles can do everything.

### 4.5 CRUD summary

| Entity | Create | Read | Update | Delete |
|---|---|---|---|---|
| Student | ✅ | ✅ | ✅ | ✅ |
| Subject | ✅ | ✅ | ❌ missing | ✅ (leaves orphan marks) |
| Marks | ✅ | ✅ | ⚠ broken (B3) | ❌ missing |

---

## 5. Can the project run?

| Check | Result |
|---|---|
| Backend compiles (`server/mvnw -o compile`) | ✅ Passed |
| Frontend type-check (`tsc -b`) | ✅ Passed, 0 errors |
| Frontend production build (`npm run build`) | ✅ Passed, with a warning that the JS bundle is larger than 500 kB |
| Frontend lint (`npm run lint`) | ❌ **Fails: 5 errors, 4 warnings** (details in B11) |
| Automated tests | ⚠ Only one test (`contextLoads`), and it needs a live connection to the cloud database |
| End-to-end run (backend + frontend + DB) | **Not run in this audit.** Starting the backend connects to your live Atlas database, so I didn't run it without your approval. Run it yourself as part of Sprint 1 (`cd server && ./mvnw spring-boot:run`, then `cd client && npm run dev`). |

---

## 6. Bugs, security issues and limitations

Severity: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low

| ID | Severity | Problem | Where | Plain-language explanation |
|---|---|---|---|---|
| **B1** | 🔴 | **Database username and password are committed to Git and pushed to GitHub** | `server/src/main/resources/application.properties`, root `src/main/resources/application.properties`, commit `a4ae3bf`, branch `origin/backend.setup` | Anyone who can see the repo can log in to your MongoDB Atlas cluster and read or delete all data. Deleting the line later does **not** remove it from Git history. **Action now:** change (rotate) the password in MongoDB Atlas, and restrict Atlas "Network Access" to your own IPs. |
| **B2** | 🟠 | Login is fake and the API has no authentication | `client/src/pages/Login.tsx`, `App.tsx`, all controllers | Explained in §4.4. Examiners often ask "how is the password stored?". Right now the answer is "in the JavaScript file". |
| **B3** | 🟠 | **Saving marks twice for the same student + subject creates duplicates, and the third save crashes** | `server/.../service/MarksService.java`, method `addOrUpdateMarks` | The code uses `.orElse(marksRepository.save(marks))`. In Java, the value inside `orElse(...)` is **always** calculated, even when a record already exists. So the second save updates the old record **and** inserts a new one. The third save finds two records and Spring throws an error (HTTP 500). Analytics also double-count those marks. Fix: use `.orElseGet(() -> marksRepository.save(marks))`. |
| **B4** | 🟡 | No server-side validation | Entities and controllers | The API accepts empty names, negative marks, marks above 100 and semester 99. The "max 50" limit only exists in the HTML input box, which is easy to bypass. |
| **B5** | 🟡 | Deleting a subject leaves its marks behind | `SubjectService.deleteSubject` | Orphaned marks show up with a blank or "Unknown" subject name and still affect averages. |
| **B6** | 🟡 | `Subject.maxMarks` is stored but ignored | `Marks.java`, `AnalyticsService` | Percentages always assume the subject is out of 100, even if the subject was created with max 50 or 150. |
| **B7** | 🟡 | Inconsistent "pass" rule | Backend `getPassFailStats` vs. frontend `Reports.tsx` | The dashboard says a student passed if their **average** is ≥ 40. The report card says they passed only if **every** subject is ≥ 40. The same student can be "Pass" on one screen and "Fail" on the other. |
| **B8** | 🟡 | No unique checks | Student email, subject code | You can create two students with the same email, or two subjects with code `MATH101`. Students also have no **register/roll number**, which a college SMS normally needs. |
| **B9** | 🟡 | Errors handled poorly | `StudentController.updateStudent` and `Reports.tsx` | Any error during update becomes "404 Not Found". Delete returns success even if the ID doesn't exist. Reports page errors only go to the browser console, so the user sees an empty page. |
| **B10** | 🟢 | API URL is hard-coded | `client/src/api/api.ts` | `http://localhost:8080` works only on your laptop. Use an environment variable (`VITE_API_URL`) or the existing Vite `/api` proxy. |
| **B11** | 🟢 | Lint fails (5 errors, 4 warnings) | `Charts.tsx` (tooltip components defined inside render, `any` types), `Reports.tsx` (setState inside effect), missing `useEffect` dependencies in 4 pages | Doesn't break the app, but CI or quality reports will show it failing. |
| **B12** | 🟢 | Repository hygiene | Root `src/`, `pom.xml`, `mvnw*`, `.mvn/`, `server.zip`, `.claude/settings.local.json`, `HELP.md` | Duplicate backend, an old zip file and local tool settings are committed. |
| **B13** | 🟢 | Analytics loads every record into memory on each request | `AnalyticsService` | Fine for a class-sized demo (hundreds of records). Mention it as a known scalability limitation; no need to fix it for the review. |
| **B15** | 🟠 | *(found during development)* The MongoDB URI property name is ignored by Spring Boot 4 | `application.properties` | Spring Boot 4 reads `spring.mongodb.uri`; the old `spring.data.mongodb.uri` is ignored, so the app was silently using `localhost:27017` instead of Atlas. Fixed in DEVELOPMENT_LOG Feature 1. |
| **B14** | 🟢 | No department/semester filter or pagination in the UI | `StudentManagement.tsx` | The backend already supports `?department=`, but the UI doesn't expose it. |

---

## 7. Missing documentation and configuration

| Missing item | Why it matters |
|---|---|
| Root `README.md` (project description, setup steps, screenshots, team) | First thing reviewers open on GitHub |
| `client/README.md` is the default Vite template | Should describe *your* frontend |
| `.env.example` / `application-example.properties` | Lets teammates run the project without real secrets |
| API documentation (endpoint list or Swagger/OpenAPI) | Needed for the testing and quality report |
| Test plan, test cases and test report | Required for Review 2, item 4 |
| Branching / commit convention (Jira keys in commits) | Required to show individual contributions, item 5 |
| Seed/demo data script | Gives you a predictable live demo |

---

## 8. Development recommendations (roadmap)

Ordered by importance for the Review 2 demo. Full details, subtasks and acceptance criteria are in [JIRA_IMPORT_PLAN.md](JIRA_IMPORT_PLAN.md).

### Step 0 — Do today (no code, ~15 minutes)
1. Rotate the MongoDB Atlas password and restrict Atlas Network Access (B1).

### Sprint 1 — Stabilise and secure (fix what's broken)
1. Move the DB URI to an environment variable (`MONGODB_URI`) and commit an example file instead (B1).
2. Fix the marks duplicate/crash bug (B3), and add **edit** and **delete** for individual marks.
3. Add server-side validation (`spring-boot-starter-validation`) and a global error handler that returns clear messages (B4, B9).
4. Clean up the repo: delete the root backend copy and `server.zip`, and write the root README (B12).
5. Fix the lint errors and make the API URL configurable (B10, B11).

### Sprint 2 — Real authentication and data quality
1. Add Spring Security with JWT login. Store users in a MongoDB `users` collection with BCrypt-hashed passwords (B2).
2. Add role-based access: Admin manages students and subjects, Teacher enters marks and views reports.
3. Add subject edit, and block or cascade subject delete when marks exist (B5).
4. Add a student register number, plus unique email and subject code (B8).
5. Agree one pass rule and use it everywhere. Respect `maxMarks` (B6, B7).

### Sprint 3 — Testing, quality reports and demo readiness
1. Backend unit tests (services, using Mockito) and controller tests (MockMvc) that don't need the live DB.
2. Write the test plan, test cases, test execution report and bug report.
3. Add a demo seed-data script and a demo script/checklist.
4. Nice-to-have: print/export the report card, add department/semester filters.

**Stretch (only if time allows):** Attendance module. It's a typical SMS feature, but don't start it until Sprints 1–3 are done.

**No stack change is recommended.** Everything above uses libraries that are part of Spring Boot or already installed.

---

## 9. Jira backlog plan (summary)

**Jira access:** No Atlassian/Jira integration is available in this session, so nothing was created or changed in `kct-team-pbmyxxdq.atlassian.net`. The full plan for manual creation or CSV import is in **[JIRA_IMPORT_PLAN.md](JIRA_IMPORT_PLAN.md)**.

- **Epic:** SMS — Student Management System
- **Stories:** 22 in total: 6 already implemented in code, 1 partially done (US-04, marks bug), 14 to do and 1 stretch.
- **Bugs:** 12 Jira Bug issues (B1–B12), each linked to the story that fixes it.
- **Status of existing work** is based **only** on code in commits `0964cf0` and `a4ae3bf`. Those stories should be logged in Jira as **Done** with the commit link as evidence. They should **not** be put into a fake past sprint.

| Status | Stories | Story points |
|---|---|---|
| Done (evidence in Git) | US-01, US-02, US-03, US-05, US-06, US-07 | 24 |
| Sprint 1 | US-04 (finish + bug fix), US-08, US-09, US-10, US-11 | 17 |
| Sprint 2 | US-12, US-13, US-14, US-15, US-16 | 22 |
| Sprint 3 | US-17, US-18, US-19, US-20, US-21 | 21 |
| Backlog (stretch) | US-22 Attendance | 8 |

---

## 10. Sprint recommendations

| Sprint | Goal | Length |
|---|---|---|
| Sprint 1 | "The app is safe, stable and runs from a clean clone." | 1 week |
| Sprint 2 | "Users log in for real, and each role sees only what it should." | 1 week |
| Sprint 3 | "The system is tested, documented and demo-ready." | 1 week |

Use 2-week sprints instead if your Review 2 date allows. Set real start and end dates in Jira when you start each sprint. **Don't backdate sprints.**

Run the Scrum ceremonies for real and record them in Jira or Confluence: sprint planning (goal + committed stories), daily stand-up notes, sprint review (demo) and retrospective. Reviewers check these.

---

## 11. Team contribution requirements

**Current Git evidence:** all three commits are by one author (`nithishvikramsakthivel`). No individual contributions from other members are recorded yet, and none should be invented.

To show genuine individual contributions from now on:

1. **Every member gets Jira issues assigned in their name.** The team is Nithish Vikram, Keerthivarma and Nirandijan (assignments below and in JIRA_IMPORT_PLAN.md).
2. **One branch per story:** `feature/SCRUM-2-jwt-login`, `bugfix/SCRUM-11-marks-duplicate` (Jira project key: `SCRUM`).
3. **Put the Jira key in every commit message**, e.g. `SCRUM-11 fix marks duplicate on update`. With the GitHub for Jira app installed, the commits appear on the Jira issue automatically.
4. **Use pull requests into `main`.** Each PR is reviewed by another member, which is evidence for both the author and the reviewer.
5. **Each member commits from their own GitHub account,** with `git config user.name/email` set to their own details.
6. **Suggested split** (adjust to real skills):

| Member | Main responsibility | Stories (SP) |
|---|---|---|
| Nithish Vikram | Backend lead | US-04, US-08, US-09, US-12 (20) |
| Keerthivarma | Frontend lead | US-10, US-11, US-13, US-14, US-20, US-21 (19) |
| Nirandijan | QA / testing and documentation | US-15, US-16, US-17, US-18, US-19 (21) |

Decide who acts as Scrum Master and Product Owner, and record it in Jira.

---

## 12. Open questions for you

1. Real names of the team members, and who plays Scrum Master and Product Owner.
2. Your Review 2 date. It decides 1-week vs. 2-week sprints.
3. Is the GitHub repo public or private? If public, treat the database as already compromised and rotate the password immediately.
4. Do you want to keep the name "Learnify" or rename the UI to "Student Management System"?
5. Is the Attendance module required by your guide, or optional?
