# Learnify — Student Management System

A web application for managing students, subjects and marks, with dashboards and reports on student performance.

**Team:** Nithish Vikram · Keerthivarma · Nirandijan

## Features

| Area | What you can do |
|---|---|
| Login | Secure sign-in (JWT). Passwords are BCrypt-hashed. Accounts lock for 15 minutes after 5 failed attempts. |
| Roles | **Administrator:** everything. **Teacher:** view data, enter and edit marks. |
| Students | Add, edit, delete and search (name or register number). Filter by department and semester. Register numbers and emails are unique. |
| Subjects | Add, edit and delete subjects with their own max marks. Deleting a subject that has marks needs a second confirmation. |
| Marks | Enter internal and external marks for several subjects at once. Edit or delete a single record. Totals cannot exceed the subject's max. |
| Dashboard | Class average, pass rate, top performers, weakest subject, charts and insights. |
| Reports | Subject overview, per-student report card (print or CSV export), weak-student list with an adjustable threshold. |

**Pass rule:** a subject is passed with at least 40% of its max marks. A student passes overall only if they pass **every** subject.

## Technology

| Layer | Stack |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router, Axios, Recharts |
| Backend | Java 17+, Spring Boot 4 (Web MVC, Data MongoDB, Security, Validation), JJWT |
| Database | MongoDB (local or MongoDB Atlas) |
| Tests | JUnit 5, Mockito, Spring MockMvc, Spring Security Test |

```
client/   React frontend  (http://localhost:5173, proxies /api to the backend)
server/   Spring Boot API (http://localhost:8080)
```

## Running locally

### 1. Prerequisites
- Java 17 or newer, Node.js 20 or newer
- A MongoDB database: either [MongoDB Community Server](https://www.mongodb.com/try/download/community) running locally on port 27017 (recommended for the demo: `MONGODB_URI=mongodb://localhost:27017/learnify_db`), or a MongoDB Atlas cluster

### 2. Configure the backend
```bash
cd server
cp .env.example .env      # Windows: copy .env.example .env
```
Edit `server/.env`:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Database connection string, e.g. `mongodb://localhost:27017/learnify_db` |
| `JWT_SECRET` | Random string of 32+ characters used to sign login tokens |
| `APP_ADMIN_PASSWORD`, `APP_TEACHER_PASSWORD` | Passwords for the `admin` and `teacher` accounts created on first start (8+ characters) |
| `DEMO_DATA` | `true` loads 20 sample students, 5 subjects and their marks into an **empty** database |

`server/.env` is git-ignored. **Never commit real credentials.**

### 3. Start the backend
```bash
cd server
./mvnw spring-boot:run     # Windows: mvnw.cmd spring-boot:run
```

### 4. Start the frontend
```bash
cd client
npm install
npm run dev
```
Open http://localhost:5173 and sign in with the admin or teacher account from `server/.env`.

## Tests and quality checks
```bash
cd server && ./mvnw clean test  # 124 backend tests + JaCoCo report (server/target/site/jacoco/index.html); no database needed
cd client && npm run test:unit  # 15 frontend unit tests with coverage
cd client && npm run test:e2e   # 7 Playwright UI workflow tests in Microsoft Edge (simulated API)
cd client && npm run test:live  # 8 live UI tests: real backend + real MongoDB (start the backend first)
cd server && python scripts/live_api_check.py   # 23 live API checks verified directly in MongoDB (needs: pip install pymongo)
cd client && npm run lint       # ESLint
cd client && npm run build      # type-check + production build
```
Test documentation: [docs/testing/](docs/testing/) (plan, cases, execution report, defect log, coverage, complexity, automation). Evidence (logs, screenshots, HTML reports): [docs/test-evidence/](docs/test-evidence/).

## API overview
All endpoints except login need `Authorization: Bearer <token>`.

| Method | Endpoint | Who |
|---|---|---|
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Logged in |
| GET | `/api/students`, `/api/students/{id}` (`?search=`, `?department=`) | Logged in |
| POST / PUT / DELETE | `/api/students`, `/api/students/{id}` | Admin |
| GET | `/api/subjects`, `/api/subjects/{id}` | Logged in |
| POST / PUT / DELETE | `/api/subjects`, `/api/subjects/{id}` (`?cascade=true`) | Admin |
| GET | `/api/marks`, `/api/marks/student/{id}` | Logged in |
| POST / PUT / DELETE | `/api/marks`, `/api/marks/{id}` | Admin, Teacher |
| GET | `/api/analytics/summary`, `/subject-averages`, `/top-students`, `/pass-fail`, `/class-average`, `/below-threshold` | Logged in |

Errors are returned as JSON: `{ status, error, message, path, fieldErrors }`.

## Project documents
- [PROJECT_AUDIT.md](PROJECT_AUDIT.md): audit of the original code, bugs found, roadmap
- [JIRA_IMPORT_PLAN.md](JIRA_IMPORT_PLAN.md): epic, user stories, acceptance criteria, sprint plan
- [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md): what was changed, how it was tested, commit messages
