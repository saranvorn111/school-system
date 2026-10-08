# Testing Guide — School System MVP

This guide walks you through testing every feature of the MVP by hand, in the order a real school would use it. Each test says **what to do**, **what you should see**, and **which files make it work**, so you can open the code while you test and learn how each piece fits.

---

## Contents

1. [Before you start](#1-before-you-start)
2. [Test accounts](#2-test-accounts)
3. [How the code is organized](#3-how-the-code-is-organized)
4. [Test A — Login and account security](#test-a--login-and-account-security)
5. [Test B — Permissions (who can see what)](#test-b--permissions-who-can-see-what)
6. [Test C — Admin: set up the school](#test-c--admin-set-up-the-school)
7. [Test D — Admin: sections and enrollment](#test-d--admin-sections-and-enrollment)
8. [Test E — Teacher: attendance](#test-e--teacher-attendance)
9. [Test F — Teacher: grades](#test-f--teacher-grades)
10. [Test G — Admin: grade review workflow](#test-g--admin-grade-review-workflow)
11. [Test H — Student portal](#test-h--student-portal)
12. [Test I — Audit log](#test-i--audit-log)
13. [Test J — Testing the API directly with curl](#test-j--testing-the-api-directly-with-curl)
14. [Test K — Automated checks](#test-k--automated-checks)
15. [File reference](#file-reference)
16. [Troubleshooting](#troubleshooting)
17. [Final checklist](#final-checklist)

---

## 1. Before you start

### Start from a clean database

Tests work best from fresh demo data. From the `school-system/school-system` folder:

```bash
docker compose down -v
```
```bash
docker compose up -d
```
```bash
bun run db:migrate
```
```bash
bun run db:seed --demo
```
```bash
bun run dev
```

Open http://localhost:3000.

> `docker compose down -v` **deletes all data** in the database volume. Only do this on your development machine.

| Command | File it runs | What it does |
| --- | --- | --- |
| `bun run db:migrate` | `db/migrate.ts` | Creates the 20 tables from `db/migrations/*.sql` |
| `bun run db:seed --demo` | `db/seed.ts` | Adds roles, permissions, the admin, and demo data |
| `bun run dev` | `next dev` | Starts the web app and the API on port 3000 |

### What the demo data contains

| Thing | Values |
| --- | --- |
| Term | 2026-2027 · Semester 1 (current), 1 Sep 2026 – 31 Jan 2027 |
| Departments | CS (Computer Science), MATH (Mathematics) |
| Courses | CS101 (3 credits), CS102 (3 credits), MATH101 (4 credits) |
| Sections | CS101-A Mon 08:00–09:30, teacher T0001 · CS102-A Wed 10:00–11:30, teacher T0001 · MATH101-A Tue 13:00–15:00, teacher T0002 |
| Students | S2026001 … S2026005, enrolled in all three sections |

**Tip:** Use two different browsers (or one normal window and one private window) so you can be logged in as admin and as a teacher at the same time.

---

## 2. Test accounts

| Role | Username | Password is in |
| --- | --- | --- |
| Admin | `admin` (or the email in `.env`) | `.env` → `SEED_ADMIN_PASSWORD` |
| Teacher (Sok Dara) | `T0001` | `db/seed.ts` → `DEMO_TEACHER_PASSWORD` |
| Teacher (Chan Sophea) | `T0002` | `db/seed.ts` → `DEMO_TEACHER_PASSWORD` |
| Students | `S2026001` … `S2026005` | `db/seed.ts` → `DEMO_STUDENT_PASSWORD` |

You can log in with the **username/ID or the email**.

---

## 3. How the code is organized

Every action follows the same path. Understanding it makes every test below easy to follow:

```
Browser page (view.tsx)          ← what you see and click (shadcn/ui)
     │  fetch("/api/...")          via hooks/use-api.ts
     ▼
API route (app/api/.../route.ts)  ← checks login, validates input (Zod)
     │
     ▼
Service (lib/services/*.ts)       ← checks permission + scope, business rules, audit
     │
     ▼
Database (db/schema.ts, MySQL)
```

| Layer | Folder | Job |
| --- | --- | --- |
| Pages | `app/admin`, `app/teacher`, `app/student`, `app/account`, `app/login` | `page.tsx` sets the title; `view.tsx` draws the page and calls the API |
| UI components | `components/`, `components/ui/` | shadcn/ui building blocks and shared pieces |
| API | `app/api/**/route.ts` | Thin REST endpoints |
| API helpers | `lib/api/handler.ts`, `lib/api/errors.ts`, `lib/api/client.ts` | Login check, JSON errors, CSRF check, browser fetch |
| Business logic | `lib/services/*.ts` | The real rules |
| Validation | `lib/validation/*.ts` | Zod rules used by **both** the browser form and the API |
| Auth | `lib/auth/*.ts` | Sessions, password hashing, permissions |
| Database | `db/schema.ts`, `db/seed.ts` | Tables and starting data |

---

## Test A — Login and account security

### A1. Empty form shows field errors
1. Go to http://localhost:3000/login.
2. Click **Log in** without typing anything.

**Expected:** red messages under both fields ("Enter your email, student ID or employee ID." / "Enter your password."). No request is sent to the server.

**Files:** `app/login/login-form.tsx` (form), `lib/validation/auth.ts` → `loginSchema` (rules), `components/form-fields.tsx` (shows the error under the field).

### A2. Wrong password
1. Enter `T0001` and any wrong password.

**Expected:** "Invalid login details." The message is the same for a wrong username and a wrong password, so attackers can't find out which usernames exist.

**Files:** `lib/services/auth.ts` → `login()`, `app/api/auth/login/route.ts`.

### A3. Account lockout after 5 failures
1. Enter a wrong password for `T0002` **5 times**.

**Expected:** on the 5th try: "Too many failed attempts. The account is locked for 15 minutes." Logging in with the **correct** password now also fails with "temporarily locked".
2. As admin, open **Users → Chan Sophea**. You see a yellow **locked** badge and an **Unlock account** button. Click it, and T0002 can log in again.

**Files:** `lib/services/auth.ts` (`MAX_FAILED_LOGINS`, `LOCK_MINUTES`), `lib/services/users.ts` → `unlockUser()`, `app/admin/users/[id]/view.tsx`.

### A4. Rate limit
Try more than 10 logins within one minute from the same browser.

**Expected:** "Too many attempts. Try again in N seconds." (HTTP 429).

**Files:** `lib/rate-limit.ts`, used in `lib/services/auth.ts`.

### A5. Successful login goes to the right portal
| Log in as | You land on |
| --- | --- |
| admin | `/admin` |
| T0001 | `/teacher` |
| S2026001 | `/student` |

**Files:** `lib/auth/authz.ts` → `homePathFor()`.

### A6. Pages need a login
1. Log out, then open http://localhost:3000/admin/users directly.

**Expected:** redirected to `/login?next=/admin/users`. After logging in as admin you return to the Users page.

**Files:** `proxy.ts` (redirects visitors with no session cookie), `app/login/login-form.tsx` → `safeNext()` (only allows returning to pages inside this app).

### A7. Temporary password must be changed
1. As admin, create a new student (see Test C5). Copy the temporary password shown.
2. Log in as that student.

**Expected:** you land on **My account** and a yellow banner says "You are using a temporary password".
3. Change the password (at least 8 characters with a letter and a number).

**Expected:** "Password changed…" toast; the banner disappears.

Also try: a new password without a number (field error), and a confirmation that doesn't match (field error).

**Files:** `app/account/view.tsx`, `lib/validation/auth.ts` → `changePasswordSchema`, `lib/services/auth.ts` → `changePassword()`, `components/portal-layout.tsx` (banner).

### A8. Signed-in devices
1. Log in as the same user in two browsers.
2. In browser 1 open **My account → Signed-in devices**. You see two rows, one marked **This device**.
3. Click **Sign out** on the other row, then refresh browser 2.

**Expected:** browser 2 is sent back to the login page.
4. Try **Log out all devices**. Both browsers are logged out.

**Files:** `lib/auth/session.ts` (sessions stored in the `sessions` table; only a SHA-256 hash of the cookie token is saved), `app/api/auth/sessions/`, `app/api/auth/logout-all/route.ts`.

---

## Test B — Permissions (who can see what)

This is the most important test group. Each role holds permissions with a **scope**:

| Scope | Meaning | Example |
| --- | --- | --- |
| `global` | every record | admin |
| `assigned` | records linked to you | teacher → only their own sections |
| `own` | your own records | student → only their own grades |

The matrix lives in `lib/auth/permissions.ts` → `ROLE_PERMISSIONS`. The checks live in `lib/auth/authz.ts` → `authorize()` and `authorizeSection()`.

| # | Logged in as | Open this URL | Expected |
| --- | --- | --- | --- |
| B1 | T0001 | `/admin/users` | Red "Access denied" box (the API returned 403) |
| B2 | T0001 | `/teacher/sections/3` (MATH101, belongs to T0002) | "Access denied" |
| B3 | T0001 | `/teacher/sections/1` (own class) | Class page loads |
| B4 | S2026001 | `/teacher/sections/2/grades` | "Access denied" (students can't see classmates' grades) |
| B5 | S2026001 | `/admin/sections/2` | "Access denied" |
| B6 | S2026001 | `/student/grades` | Loads: only their own published grades |
| B7 | T0001 | the sidebar | Only "Dashboard" and "My classes"; no admin links |

**Note:** hiding a menu link is only cosmetic (`components/app-sidebar.tsx`). The real protection is in the services, which is why B1–B5 still fail when you type the URL directly.

Every denied attempt is recorded. As admin, open **Audit log** and filter the action `access.denied`.

---

## Test C — Admin: set up the school

Log in as **admin**.

### C1. Dashboard
Open `/admin`.

**Expected:** stat cards (active students 5, teachers 2, sections this term 3, grades awaiting review 0), recent activity and failed logins (including your tests from Test A).

**Files:** `app/admin/view.tsx`, `app/api/dashboard/admin/route.ts`, `lib/services/dashboards.ts` → `adminDashboard()`.

### C2. Departments and programs
Open **Departments & programs**.
1. Click **Add department** (a popup opens), enter `ENG` / `English` and save. It appears in the list.
2. Add it again with the same code.

**Expected:** error toast "A department with that code already exists." (HTTP 409).
3. Add a program with a code like `BAENG` in the English department.
4. Try a code with a space, e.g. `BA ENG`. **Expected:** field error "2–20 letters, numbers or dashes."

**Files:** `app/admin/organization/view.tsx`, `lib/validation/academics.ts`, `lib/services/academics.ts`.

### C3. Academic years and terms
Open **Years & terms**.
1. Add year `2027-2028` with start 2027-09-01 and end 2028-08-31.
2. Try a year named `2027` → field error "Use the format 2026-2027."
3. Add a term whose end date is **before** its start date → field error "End date must be after the start date."
4. Add a valid term "Semester 1" for 2027-2028, then click **Make current**.

**Expected:** the green **Current** badge moves to that term. Switch it back to 2026-2027 Semester 1 before continuing, because the other tests use it.

**Files:** `app/admin/academics/view.tsx`, `lib/services/academics.ts` → `setCurrentTerm()` (runs in a transaction so only one term is ever current).

### C4. Courses
Open **Courses**. Add `CS201` "Data Structures", 3 credits.

Try credits `20` → field error "0–12".

**Files:** `app/admin/courses/view.tsx`, `lib/validation/academics.ts` → `courseSchema`.

### C5. Users
Open **Users**.
1. Search "Sok". Only Sok Dara appears. Change the role filter to **Student**; only students appear. The filters are stored in the URL, so you can bookmark them.
2. Click **New user** → **Student**. Fill in name, email and a student ID like `S2026100`, then create.

**Expected:** a green box shows the username and a **temporary password** (shown only once).
3. Create another user with the **same email or ID** → toast "That email, username or ID is already in use."
4. Switch to **Teacher** and create a teacher (employee ID e.g. `T0003`). The form fields change with the role.
5. Open a user → try **Reset password** (confirm dialog, new temporary password shown), **Disable account** (the user can no longer log in and is signed out everywhere), then **Enable account**.
6. Open **your own** admin account. The **Disable** button is not shown, and the API also refuses (`409`) if you try.

**Files:** `app/admin/users/view.tsx`, `app/admin/users/new/view.tsx`, `app/admin/users/[id]/view.tsx`, `lib/validation/users.ts` → `createUserSchema`, `lib/services/users.ts`, `lib/auth/password.ts` → `generateTempPassword()`.

---

## Test D — Admin: sections and enrollment

Open **Sections & enrollment**. All "create" forms open as popups: click **New section** to open the form.

### D1. Timetable clash: teacher
Create a section: course CS102, code `B`, teacher **Sok Dara**, **Monday 08:30–10:00**.

**Expected:** error "This teacher already has CS101-A at Mon 08:00–09:30." Sok Dara already teaches then.

### D2. Timetable clash: room
Create a section on **Tuesday 14:00–15:00** in room `B201`, without a teacher.

**Expected:** "Room B201 already has MATH101-A at Tue 13:00–15:00."

### D3. Valid section
Create CS102 code `B`, teacher Sok Dara, **Thursday 08:30–09:30**, capacity `2`.

**Expected:** "Section created." It appears in the list with 0/2 seats.

**Files (D1–D3):** `app/admin/sections/view.tsx`, `lib/validation/sections.ts` → `sectionSchema` (start must be before end), `lib/services/sections.ts` → `createSection()` and `findClash()`, `lib/schedule.ts` → `slotsOverlap()`.

### D4. Enrollment and capacity
Open the new section (click **CS102-B**).
1. Click **Enroll student** (a popup opens), choose S2026001 and enroll. Repeat for S2026002. Seats become 2/2.

**Expected:** the **Enroll student** button is disabled and the card says "This section is full." The API also blocks a third enrollment (409), even if two admins click at the same moment, because the section row is locked during enrollment.
2. **Drop** one student (confirm dialog). A seat is free again.

**Files:** `app/admin/sections/[id]/view.tsx`, `lib/services/sections.ts` → `enrollStudent()` (capacity, duplicate, student status and timetable checks) and `dropEnrollment()`.

### D5. Student timetable clash
Create a section of CS101, code `B`, **Wednesday 10:30–11:30** (overlapping CS102-A), then try to enroll **S2026003**.

**Expected:** "Pisey Kim already has CS102-A at Wed 10:00–11:30."

### D6. Assign a teacher
In any section, choose a teacher in the **Teacher** card and click **Save teacher**. The same clash rule applies.

---

## Test E — Teacher: attendance

Log in as **T0001** (a second browser is easiest).

### E1. Dashboard
**Expected:** "My classes 3" (or 4 if you did D3), student count, and **Today's classes** for the current weekday.

**Files:** `app/teacher/view.tsx`, `lib/services/dashboards.ts` → `teacherDashboard()`.

### E2. Take attendance
1. **My classes → Attendance** on CS101-A.
2. Click **Mark the rest present**, then change one student to **Absent** and write a note.
3. **Save attendance** → "Attendance saved."

**Expected:** the session appears in **Past sessions** with the counts.

Rules to check:
- **Save** stays disabled until every student is marked.
- The date picker can't select a future date (the API also rejects it with 422).

### E3. Edit attendance (audited)
Change one student from Absent to Late and save → "Attendance updated (1 change(s))."

As admin, open **Audit log** and filter `attendance`. You see `attendance.taken` and `attendance.edited`, with the **before** (red) and **after** (green) values.

**Files:** `app/teacher/sections/[id]/attendance/view.tsx`, `app/api/sections/[id]/attendance/route.ts`, `lib/services/attendance.ts` → `saveAttendance()` (editing requires the `attendance:edit` permission and is written to the audit log).

---

## Test F — Teacher: grades

Still logged in as **T0001**, open CS101-A → **Grades**.

1. Type scores. The **Grade** column updates as you type (letter preview).
2. Type `105` → "?" appears and **Save** is disabled.
3. Enter valid scores for **some** students and **Save scores**.
4. **Submit grades** stays disabled and the page says "N student(s) still have no saved score."
5. Fill in every score, save, then **Submit grades** → confirm.

**Expected:** status becomes **Grades: Submitted** and the inputs lock.

Check the grading scale on the right (in `lib/grading.ts`):

| Score | Letter | Points |
| --- | --- | --- |
| 85–100 | A | 4.0 |
| 80–84.99 | B+ | 3.5 |
| 70–79.99 | B | 3.0 |
| 65–69.99 | C+ | 2.5 |
| 50–64.99 | C | 2.0 |
| 45–49.99 | D | 1.5 |
| 40–44.99 | E | 1.0 |
| 0–39.99 | F | 0.0 |

**Files:** `app/teacher/sections/[id]/grades/view.tsx`, `lib/services/grades.ts` → `saveGrades()` and `submitGrades()`, `lib/grading.ts` → `scoreToGrade()`.

---

## Test G — Admin: grade review workflow

The workflow (in `lib/services/grades.ts`):

```
draft ──submit──▶ submitted ──approve──▶ approved ──publish──▶ published
  ▲                   │                     │
  └──────reject───────┴─────────────────────┘
```

### G1. Send back to the teacher
1. As admin: **Grade approvals**. CS101-A is listed. Open it.
2. In **Grade review**, write a note such as "Check Pisey's score" and click **Return to draft**.

**Expected:** status becomes draft.
3. As T0001: the dashboard shows a yellow alert with your note. The grades page shows "Sent back for changes" and the scores are editable again.
4. Fix a score, save and submit again.

### G2. Approve and publish
1. As admin: open the section → **Approve grades** → status **Approved**.
2. **Publish to students** → confirm → status **Published**.

**Expected:** "Grades are published and visible to students."

### G3. Locked after submission
While grades are submitted/approved/published:
- the teacher can't edit scores (inputs disabled; the API returns 409 if forced), and
- the admin can't enroll or drop students in that section ("Enrollment is closed…").

**Files:** `components/grade-review.tsx`, `app/admin/grades/view.tsx`, `app/api/sections/[id]/grades/[action]/route.ts`, `lib/services/grades.ts` → `transition()`. It only changes the status if it is still the old value, so two people clicking at once can't skip a step.

---

## Test H — Student portal

Log in as **S2026001**.

| Page | Expected |
| --- | --- |
| **Dashboard** | Courses this term, cumulative GPA, attendance %, today's classes, latest grades |
| **Timetable** | One card per weekday with the classes, room and teacher |
| **Attendance** | Rate per course (present + late count as attended; below 80% shows in red) and recent classes with badges |
| **Grades** | **Only published** grades, grouped by term with the term GPA and cumulative GPA |

Important checks:
1. **Before** Test G2, the Grades page says "No published grades yet", even though the teacher entered scores.
2. **After** publishing, the grades appear and the GPA is credit-weighted. Example: A (4.0) in a 3-credit course plus C (2.0) in a 4-credit course → (12 + 8) ÷ 7 = **2.86**.

**Files:** `app/student/*/view.tsx`, `app/api/me/*`, `lib/services/student-portal.ts` (the student ID always comes from the login session, never from the URL), `lib/student-data.ts`, `lib/grading.ts` → `computeGpa()`.

---

## Test I — Audit log

As admin, open **Audit log**.

| Filter the action by | You should find |
| --- | --- |
| `user.` | `user.created`, `user.disabled`, `user.enabled`, `user.password_reset`, `user.unlocked`, `user.locked` |
| `section.` | `section.created`, `section.teacher_assigned` |
| `enrollment.` | `enrollment.created`, `enrollment.dropped` |
| `attendance.` | `attendance.taken`, `attendance.edited` |
| `grade.` | `grade.saved`, `grade.submitted`, `grade.rejected` (with the note), `grade.approved`, `grade.published` |
| `access.denied` | Every blocked attempt from Test B, marked **failed** |

Each row shows **who**, **when**, the **IP**, the record, and the before/after values.

**Files:** `app/admin/audit/view.tsx`, `lib/audit.ts` (writes the rows, often inside the same transaction as the change), `lib/services/dashboards.ts` → `auditLog()`.

---

## Test J — Testing the API directly with curl

The API can be used without the website, for example by a future mobile app. Run these in **Git Bash** while `bun run dev` is running. Replace `PASSWORD` with the value from the file listed in [Test accounts](#2-test-accounts).

Log in as the teacher and save the session cookie to a file:
```bash
curl -i -c teacher.txt -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"identifier":"T0001","password":"PASSWORD"}'
```

Who am I?
```bash
curl -b teacher.txt http://localhost:3000/api/auth/me
```

My sections (current term):
```bash
curl -b teacher.txt http://localhost:3000/api/sections
```

Another teacher's grades → expect **403**:
```bash
curl -i -b teacher.txt http://localhost:3000/api/sections/3/grades
```

No cookie → expect **401**:
```bash
curl -i http://localhost:3000/api/auth/me
```

Invalid input → expect **422** with `fieldErrors`:
```bash
curl -i -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"identifier":""}'
```

A request pretending to come from another website → expect **403** "Cross-site request blocked.":
```bash
curl -i -b teacher.txt -X POST http://localhost:3000/api/auth/logout-all -H "Origin: https://evil.example"
```

### Status codes you should see

| Code | Meaning | Where it's produced |
| --- | --- | --- |
| 200 / 201 / 204 | OK / created / done with no body | `lib/api/handler.ts` |
| 401 | Not logged in | `lib/auth/authz.ts` → `currentUserOrThrow()` |
| 403 | No permission, or cross-site request | `authorize()`, `authorizeSection()`, `assertSameOrigin()` |
| 404 | Record doesn't exist | services |
| 409 | Conflict: duplicate, full section, clash, locked grades | services |
| 422 | Invalid fields (`fieldErrors`) | `readBody()` + `lib/validation/*` |
| 423 | Account locked | `lib/services/auth.ts` |
| 429 | Too many login attempts | `lib/rate-limit.ts` |

The full endpoint list is in the project `README.md` → **API reference**.

---

## Test K — Automated checks

Run these before every commit:

```bash
bun test
```
```bash
bun run typecheck
```
```bash
bun run lint
```

| Command | Checks | File |
| --- | --- | --- |
| `bun test` | 10 unit tests: grade boundaries, invalid scores, GPA, timetable overlaps, time ranges, permission matrix (teachers/students can't approve grades or manage users), password hashing | `tests/rules.test.ts` |
| `bun run typecheck` | TypeScript across the whole app, including the API response types used by pages (`ApiData<>` in `lib/api/client.ts`) | `tsconfig.json` |
| `bun run lint` | ESLint rules for Next.js and React | `eslint.config.mjs` |

Expected: `10 pass, 0 fail`, and no output from the type check or lint.

---

## File reference

### Database — `db/`
| File | Purpose |
| --- | --- |
| `schema.ts` | All 20 tables: users, sessions, login history, roles, permissions, departments, programs, teachers, students, years, terms, courses, sections, enrollments, attendance, grades, audit logs |
| `index.ts` | MySQL connection pool and `isDuplicateKeyError()` |
| `migrate.ts` / `migrations/` | Applies the SQL generated by `bun run db:generate` |
| `seed.ts` | Roles, permissions, the admin account, and `--demo` data |

### Auth and permissions — `lib/auth/`
| File | Purpose |
| --- | --- |
| `permissions.ts` | List of permissions and the role → permission → scope matrix |
| `authz.ts` | `authorize()`, `authorizeSection()`, `requireUser()`, `homePathFor()` |
| `current-user.ts` | Loads the logged-in user with roles and permissions (once per request) |
| `session.ts` | Create, read and revoke sessions; sets the `httpOnly` cookie |
| `password.ts` | scrypt hashing, temporary passwords |

### API — `app/api/` and `lib/api/`
| File | Purpose |
| --- | --- |
| `lib/api/handler.ts` | `route()` / `publicRoute()` wrappers: login check, CSRF check, JSON errors, `readBody()`, `readQuery()`, `idParam()` |
| `lib/api/errors.ts` | `ApiError` and helpers: `forbidden()`, `conflict()`, `invalid()`… |
| `lib/api/client.ts` | Browser `api()` fetch helper; redirects to login on 401 |
| `app/api/**/route.ts` | One file per endpoint (35 files) |

### Business logic — `lib/services/`
| File | Covers |
| --- | --- |
| `auth.ts` | Login and lockout, logout, me, sessions, change password |
| `users.ts` | List, create, edit, disable, reset password, unlock |
| `academics.ts` | Departments, programs, years, terms, courses |
| `sections.ts` | Sections, clash checks, teacher assignment, enrollment |
| `attendance.ts` | Attendance sheet, save and edit |
| `grades.ts` | Grade sheet, save, submit/approve/reject/publish |
| `dashboards.ts` | Admin and teacher dashboards, audit log |
| `student-portal.ts` | Student dashboard, timetable, attendance, grades |

### Shared rules — `lib/`
| File | Purpose |
| --- | --- |
| `validation/*.ts` | Zod schemas shared by forms and the API |
| `grading.ts` | Grade scale and GPA |
| `schedule.ts` | Time validation and overlap check |
| `queries.ts`, `student-data.ts`, `scoped.ts` | Reusable database queries |
| `audit.ts` | Writes audit log rows |
| `rate-limit.ts` | In-memory login rate limiter |
| `format.ts` | Dates and times (Asia/Phnom_Penh), weekdays |
| `constants.ts` | Status lists shared by the database and the browser |

### Frontend — `components/`, `hooks/`, `app/`
| File | Purpose |
| --- | --- |
| `components/ui/*` | shadcn/ui components (Button, Card, Table, Select, Dialog, Sidebar…) |
| `components/portal-layout.tsx` | Sidebar shell used by every portal |
| `components/app-sidebar.tsx` | Menu per portal, user menu, logout |
| `components/page.tsx` | `PageHeader`, `Section`, `StatCard`, `QueryView` (loading / error / data) |
| `components/form-fields.tsx` | `TextField`, `SelectField`, `TextareaField` for react-hook-form |
| `components/confirm-button.tsx` | "Are you sure?" dialog |
| `components/grade-review.tsx` | Approve / publish / return to draft |
| `components/status-badges.tsx`, `term-select.tsx` | Colored badges, term picker |
| `hooks/use-api.ts` | `useApiQuery()` (load data) and `useApiMutation()` (save data, toast, refresh lists) |
| `components/providers.tsx` | TanStack Query, tooltips, toasts |
| `proxy.ts` | Sends visitors without a session to `/login` (pages only; the API answers 401 itself) |

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `ECONNREFUSED` / can't connect to database | `docker compose up -d`, then check `docker ps` shows `school_management_mysql` on port 3308 |
| Tables missing | `bun run db:migrate` |
| Can't log in as a demo user | Did you seed with `--demo`? Is the account locked (Test A3)? Unlock it as admin, or wait 15 minutes |
| "Too many attempts" | Wait 1 minute (rate limit), or restart `bun run dev` (the limiter is in memory) |
| First click on a page is slow | Normal in development: Next.js compiles each route the first time |
| Page shows "Access denied" | You are logged in as a role without that permission. Check the sidebar footer for the current user |
| Data looks wrong after many tests | Reset: see [Before you start](#1-before-you-start) |

---

## Final checklist

- [ ] A1–A8 Login, lockout, rate limit, temporary password, devices
- [ ] B1–B7 Permission boundaries (every blocked attempt appears in the audit log)
- [ ] C1–C5 Dashboard, departments, programs, years, terms, courses, users
- [ ] D1–D6 Section clashes (teacher, room, student), capacity, drop, assign teacher
- [ ] E1–E3 Take and edit attendance
- [ ] F Enter, validate, save and submit grades
- [ ] G1–G3 Reject with note, approve, publish, locking
- [ ] H Student sees only their own data and only published grades
- [ ] I Audit log shows every sensitive action
- [ ] J API responds with the right status codes
- [ ] K `bun test`, `bun run typecheck`, `bun run lint` all pass

---

## Test L — Notifications

The bell in the navbar shows a red count of unread notifications and refreshes every 30 seconds.

| Do this | Who gets a notification |
| --- | --- |
| Teacher submits grades (Test F) | Every admin: "Grades submitted: CS101-A" |
| Admin returns grades to draft with a note (Test G1) | The section's teacher: "Grades sent back", with the note |
| Admin approves grades | The teacher: "Grades approved" |
| Admin publishes grades (Test G2) | Every enrolled student: "Your grade is published" |
| Admin enrolls or drops a student (Test D4) | That student |
| Admin assigns a teacher (Test D6) | That teacher |
| Teacher marks a student absent or late (Test E2) | That student |

1. Click the bell. Unread items have a dot and bold title.
2. Click an item. It is marked read and opens the related page.
3. Click **Mark all as read**. The red count disappears.

A user only ever sees their own notifications.

**Files:** `lib/services/notifications.ts` (`notify()` and the inbox), `components/notification-bell.tsx`, `app/api/notifications/`, and the `notify(...)` calls in `lib/services/grades.ts`, `sections.ts` and `attendance.ts`.

## Test M — Reports

As admin, open **Reports**.

1. The stat cards show sections, enrollments and seats, the overall attendance rate, and how many sections have published grades.
2. The **Sections** table shows, per section: seats, attendance rate (red below 80%), grade status, average score and pass rate (score of 50 or more).
3. **Students needing attention** lists students whose attendance in a section is below 80%. Mark a student absent (Test E2) and they appear here.
4. Click **Export CSV**. A `.csv` file downloads and opens in Excel, including Khmer names. The export is recorded in the audit log as `report.exported`.
5. Change the term with the term picker.
6. As a teacher or student, opening `/admin/reports` shows "Access denied", and the export URL returns 403.

**Files:** `app/admin/reports/view.tsx`, `lib/services/reports.ts` (`termReport()`, `termReportCsv()`), `app/api/reports/term/`.

## Test N — Language and theme

1. Click the language button in the navbar and choose **ខ្មែរ**. The menu, breadcrumbs, page titles and the login page switch to Khmer. Refresh: the choice is kept (cookie `locale`).
2. Click the sun/moon button to switch between light and dark.

**Files:** `messages/en.json` and `messages/km.json` (all text), `lib/i18n/dictionaries.ts` (loader), `components/i18n-provider.tsx`, `components/language-menu.tsx`, `components/portal-header.tsx`.

## Test O — Edit and delete setup data

As admin, on **Departments & programs**, **Years & terms** and **Courses**, every row has a pencil (edit) and a bin (delete).

1. Click the pencil on a department. The popup opens with the current values. Change the name and click **Save changes**. The list updates and a toast confirms it.
2. Change a code to one that already exists. **Expected:** "A department with that code already exists."
3. Click the bin on a department that has programs, teachers or courses. **Expected:** after confirming, a toast says it is still used and lists what uses it. Nothing is deleted.
4. Add a new department, then delete it. **Expected:** it disappears from the list.
5. The same rules apply to the others: a program with students, a course or term with sections, and an academic year with terms cannot be deleted.
6. Open **Audit log** and filter `updated` or `deleted`. Each change shows the values before and after.
7. As a teacher or student, the API refuses both actions with 403.

**Files:** `components/row-actions.tsx` (the two buttons), `lib/services/academics.ts` (`updateRecord()`, `deleteRecord()` and the "still in use" check), `app/api/*/[id]/route.ts` (PATCH and DELETE).

## Test P — Reopen published grades

Published grades are locked. If a score is wrong, the admin reopens them:

1. As admin, open a section whose status is **Grades: Published**.
2. In **Grade review**, type a reason under **Reopen for correction** and click **Reopen grades**, then confirm.

**Expected:** the status becomes **Draft**. The teacher gets a notification with the reason and can edit scores again. Students get a notification and no longer see that grade (their GPA is recalculated without it).
3. The teacher corrects the score, saves and submits. The admin approves and publishes as usual, and the grade is visible to students again.

The button is disabled until a reason is typed. A teacher calling the API directly gets 403, and the action is recorded in the audit log as `grade.reopened` with the reason.

**Files:** `lib/services/grades.ts` → `reopenGrades()`, `components/grade-review.tsx`, `app/api/sections/[id]/grades/[action]/route.ts`.

## Test Q — Automatic student and teacher IDs

1. As admin, open **Users → New user → Student**. Leave **Student ID** empty, fill in name, email and admission year 2026, and create.
   **Expected:** the green box shows a generated ID such as `S2026006` (one more than the highest existing 2026 student).
2. Create another student with admission year 2027. **Expected:** `S2027001`. The number restarts each year.
3. Create a teacher with **Employee ID** empty. **Expected:** `T` + this year + number, e.g. `T2026001`.
4. Type your own ID (for example `OLD-778`). **Expected:** that ID is used as written.
5. Type an ID that already exists. **Expected:** "That username or ID is already in use."
6. Existing accounts (`T0001`, `S2026001`…) keep their IDs; only new accounts use the generator.

**Files:** `lib/login-id.ts` (the format and "next number" rule), `lib/services/users.ts` → `createUser()` and `generateLoginId()`, `app/admin/users/new/view.tsx`.
