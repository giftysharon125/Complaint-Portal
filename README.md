# 🎓 Student Complaint Management System

A complete, full-stack **college complaint management portal** where students report campus problems and track their resolution, while administrators and staff manage, assign, and resolve complaints — with a full status history and student feedback.

Built for a **Software Engineering academic project** with Node.js, Express, MongoDB, JWT authentication, and a vanilla HTML/CSS/JS frontend.

---

## 📖 Table of Contents

1. [Project Description](#project-description)
2. [Features](#features)
3. [User Roles](#user-roles)
4. [Technology Stack](#technology-stack)
5. [System Architecture](#system-architecture)
6. [Database Structure](#database-structure)
7. [Folder Structure](#folder-structure)
8. [Installation Instructions](#installation-instructions)
9. [MongoDB Setup](#mongodb-setup)
10. [Environment Variables](#environment-variables)
11. [How to Run the Backend](#how-to-run-the-backend)
12. [How to Run the Frontend](#how-to-run-the-frontend)
13. [Demo Credentials](#demo-credentials)
14. [API Overview](#api-overview)
15. [Complaint Workflow](#complaint-workflow)
16. [Software Engineering Documentation (SRS, Diagrams)](#software-engineering-documentation-srs-diagrams)
17. [Testing & Test Cases](#testing--test-cases)
18. [Future Enhancements](#future-enhancements)
19. [Maintenance](#maintenance)

---

## Project Description

Colleges receive hundreds of complaints every month — broken lab equipment, hostel water shortages, Wi-Fi outages, canteen hygiene issues — usually through phone calls, emails, or word of mouth. Complaints get lost, students get no updates, and the administration has no data about recurring problems.

The **Student Complaint Management System** digitizes this entire workflow:

- Students submit structured complaints (category, location, priority, optional photo) and track them live.
- Admins review, prioritize, and assign complaints to the right staff member, with every action recorded.
- Staff work on their assigned complaints, add progress notes, and mark them resolved with resolution notes.
- Students rate the resolution with 1–5 star feedback, which feeds into admin analytics.

Every complaint gets a unique, human-friendly ID (e.g. `CMP-2026-0001`) and a complete, auditable status history.

---

## Features

### 👨‍🎓 Student Module
- Register (name, student ID, email, department, year, password) and log in
- Dashboard with live counts (total / pending / in-progress / resolved) and a status-distribution doughnut chart
- Submit complaints with category, priority, location, description and optional image attachment
- Filter pills (All / Pending / In Progress / Resolved), full-text search and category filters on **My Complaints**
- Complaint details page with a visual 6-step progress timeline and complete status history
- Rate resolved complaints (1–5 stars + comment) — one feedback per complaint, enforced by the database
- Edit profile (name, department, year)

### 🧑‍💼 Admin Module
- Dashboard with 4 KPI cards (total / pending / in progress / resolved), average resolution time, average feedback rating
- 3 Chart.js charts: complaints **by category**, **by status**, and **over the last 14 days**
- Recent complaints table with quick View actions
- Complaint management page: search by ID/title/student, filter by category, priority, status, date range, sort newest/oldest
- Change complaint priority, assign/reassign staff, update status (with workflow validation), add admin notes
- View all students (with complaint counts), view staff (with workload stats)
- Full category management (add / edit / activate / deactivate / delete with in-use protection)
- Reports page with analytics (priority breakdown, avg resolution time, rejection count)
- View all student feedback with average rating

### 🔧 Staff Module
- Dashboard with assigned / pending / in-progress / resolved counts
- List of assigned complaints with search, status and category filters
- Complaint details with progress notes, status updates (`Assigned → In Progress → Resolved`), resolution notes
- **Security**: staff can only access complaints assigned to them (enforced server-side)
- Resolved-complaints view

### 🌐 General
- JWT authentication with role-based access control on every private route
- Responsive UI (sidebar collapses into a mobile hamburger drawer)
- Toasts, loading spinners, empty states, client + server form validation
- Central error handler — backend internals are never exposed to users

---

## User Roles

| Role | Capabilities |
|---|---|
| **Student** | Register, submit complaints, track status/history, give feedback, edit profile |
| **Admin** | Full complaint control (priority, assignment, status, notes), user/staff/category management, analytics, feedback |
| **Staff** | Work on assigned complaints: progress notes, status updates, resolution; only their own complaints |

Registration is open to students only. Admin and staff accounts are created via the seed script (in a real deployment, by the system administrator).

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript, Chart.js 4, Lucide Icons |
| Backend | Node.js, Express.js 4 (REST API) |
| Database | MongoDB 8 with Mongoose 8 |
| Auth | JWT (`jsonwebtoken`), `bcryptjs` password hashing |
| Other | Multer (image uploads), Morgan (dev logging), CORS, dotenv |

No PHP, no XAMPP, no MySQL, no frontend framework — just the required stack.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       CLIENT (Browser)                       │
│   HTML5 pages  +  Vanilla JS (api.js fetch wrapper)          │
│   Chart.js dashboards  ·  Lucide icons  ·  CSS3 UI           │
└──────────────────────────┬───────────────────────────────────┘
                           │  HTTP (JSON + JWT Bearer token)
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                   EXPRESS SERVER  (server.js)                │
│  ┌────────────┐ ┌─────────────┐ ┌──────────────────────────┐ │
│  │ middleware/ │ │   routes/   │ │      controllers/        │ │
│  │ authJWT     │→│ auth        │→│ authController           │ │
│  │ role check  │ │ complaints  │ │ complaintController      │ │
│  │ upload      │ │ admin       │ │ adminController          │ │
│  └────────────┘  │ staff/users │ │ staffController          │ │
│                  └─────────────┘ └──────────────────────────┘ │
│                        utils/ (complaint IDs, errors)        │
└──────────────────────────┬───────────────────────────────────┘
                           │  Mongoose ODM
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                        MongoDB                                │
│   users · complaints · categories · complaintstatushistories │
│   feedbacks · counters                                       │
└──────────────────────────────────────────────────────────────┘
```

- The Express server serves the REST API under `/api/*` **and** the static frontend, so one process runs everything locally.
- All private routes pass through the JWT `protect` middleware, then role-based `authorize('admin' | 'staff' | 'student')`.
- Every status change writes a `ComplaintStatusHistory` document inside the same flow (audit trail).

---

## Database Structure

| Collection | Key fields | Relationships |
|---|---|---|
| **users** | name, studentId (unique, sparse), email (unique), password (bcrypt hash), department, year, role, createdAt | referenced by complaints (student + assignedStaff) |
| **complaints** | complaintId (unique, `CMP-YYYY-NNNN`), student → User, title, category → Category, description, location, priority, status, assignedStaff → User, attachment, resolutionNotes, notes[], createdAt, updatedAt | parent of history + feedback |
| **categories** | name (unique), description, active, createdAt | referenced by complaints |
| **complaintstatushistories** | complaint → Complaint, status, changedBy → User, note, changedAt | audit trail per complaint |
| **feedbacks** | complaint (unique → Complaint), student → User, rating (1–5), comment, createdAt | one-per-complaint enforced by unique index |
| **counters** | `_id: complaint_YYYY`, seq | atomic sequence for complaint IDs |

Relationships use ObjectId references and `Mongoose .populate()` (e.g. complaint lists populate student, category and staff names).

---

## Folder Structure

```
student-complaint-management-system/
├── package.json
├── .env                    # local config (NOT committed — see .env.example)
├── .env.example
├── server.log              # created when the server runs
├── backend/
│   ├── server.js           # Express entry point + error handler
│   ├── config/
│   │   └── db.js           # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── complaintController.js
│   │   ├── adminController.js
│   │   └── staffController.js
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT verification
│   │   └── roleMiddleware.js   # role-based authorization
│   ├── models/
│   │   ├── User.js
│   │   ├── Complaint.js
│   │   ├── Category.js
│   │   ├── ComplaintStatusHistory.js
│   │   ├── Feedback.js
│   │   └── Counter.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── complaintRoutes.js   # includes multer image upload
│   │   ├── adminRoutes.js
│   │   ├── staffRoutes.js
│   │   ├── userRoutes.js
│   │   └── categoryRoutes.js
│   ├── utils/
│   │   ├── generateComplaintId.js
│   │   ├── constants.js         # statuses, transitions, priorities
│   │   ├── ApiError.js
│   │   ├── asyncHandler.js
│   │   └── seed.js              # demo data loader
│   └── uploads/                 # complaint image attachments
└── frontend/
    ├── index.html               # landing page
    ├── login.html
    ├── register.html
    ├── student-dashboard.html
    ├── submit-complaint.html
    ├── my-complaints.html
    ├── complaint-details.html
    ├── feedback.html
    ├── profile.html
    ├── admin-dashboard.html
    ├── admin-complaints.html
    ├── admin-users.html
    ├── admin-staff.html
    ├── admin-categories.html
    ├── admin-reports.html
    ├── admin-feedback.html
    ├── staff-dashboard.html
    ├── staff-complaints.html
    ├── css/
    │   ├── style.css            # design system (buttons, badges, tables…)
    │   ├── dashboard.css        # sidebar/topbar/timeline layout
    │   └── forms.css            # auth + form pages
    └── js/
        ├── api.js               # fetch wrapper with JWT handling
        ├── ui.js                # shell, guards, badges, toasts
        ├── auth.js              # login/register logic
        ├── dashboard.js         # Chart.js helpers
        ├── student.js           # student dashboard/submit/list
        ├── complaints.js        # details page (all roles)
        ├── admin.js             # all admin pages
        ├── staff.js             # staff pages
        └── profile.js           # profile page
```

---

## Installation Instructions

### Prerequisites
- **Node.js 18+** — check with `node -v`
- **MongoDB** — see [MongoDB Setup](#mongodb-setup) below
- npm (comes with Node.js)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (Windows: copy .env.example to .env, or create it manually)
cp .env.example .env

# 3. Start MongoDB (see next section) and make sure it is running

# 4. Load demo data (users, categories, complaints, feedback)
npm run seed

# 5. Start the server
npm run dev        # development, auto-restart with nodemon
# or
npm start          # plain node
```

The app is now available at **http://localhost:5000** — the API and the frontend are served by the same server.

---

## MongoDB Setup

**Option A — MongoDB Community Server installed locally (recommended for the demo):**

1. Download *MongoDB Community Server* from <https://www.mongodb.com/try/download/community> and install it.
2. On Windows, either:
   - start it as a service (installed by default — check with `services.msc` → *MongoDB Server*), or
   - run it manually in a terminal:
     ```bash
     mongod --dbpath C:\data\db
     ```
     (create the folder first: `mkdir C:\data\db`)
3. On Linux: `sudo systemctl start mongod` — on macOS: `brew services start mongodb-community`.

The default connection string `mongodb://127.0.0.1:27017/complaint_portal` needs no authentication with a default local install. The database and collections are created automatically on first run/seed.

**Option B — MongoDB Atlas (cloud):** create a free cluster, get the connection string, and set it in `.env`:
```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/complaint_portal
```

To verify MongoDB is reachable: `mongosh` → `show dbs`.

---

## Environment Variables

Create a `.env` file in the project root (copy `.env.example`):

| Variable | Description | Example |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/complaint_portal` |
| `JWT_SECRET` | Secret used to sign JWTs — change it in production | `dev_jwt_secret_change_me_9f2b1c7d4e` |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `PORT` | Server port | `5000` |
| `CORS_ORIGIN` | Allowed CORS origin | `*` (dev) |

> ⚠️ `.env` is listed in `.gitignore` and must never be committed. Credentials are only stored server-side and never shipped to the frontend.

---

## How to Run the Backend

```bash
npm run dev      # nodemon auto-restart during development
npm start        # production-style start
```

- The API listens on `http://localhost:5000/api/*`
- Health check: `GET http://localhost:5000/api/health` → `{"success": true, ...}`
- Uploaded attachments are served from `http://localhost:5000/uploads/*`
- All errors return `{ "success": false, "message": "<safe message>" }` with a proper HTTP status code.

## How to Run the Frontend

No build step is needed — the Express server serves the frontend statically.
Just open **http://localhost:5000** in your browser after starting the backend.

For a pure static-file workflow you could also serve `/frontend` with any static server, but the API is same-origin at `:5000`, so the built-in serving is simplest.

---

## Demo Credentials

Loaded by `npm run seed` (see `backend/utils/seed.js`). **Never hardcode credentials in frontend code** — these are server-side seeded accounts for evaluation only.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@college.edu` | `admin123` |
| Staff 1 (Maintenance) | `staff1@college.edu` | `staff123` |
| Staff 2 (IT Support) | `staff2@college.edu` | `staff123` |
| Student — Arjun | `arjun@college.edu` | `student123` |
| Student — Priya | `priya@college.edu` | `student123` |
| Student — Rahul | `rahul@college.edu` | `student123` |
| Student — Sneha | `sneha@college.edu` | `student123` |
| Student — Karan | `karan@college.edu` | `student123` |

The seed creates 12 categories and 15 complaints spanning every status (Submitted → Closed + Rejected), with status histories and 5 feedback records.

> Re-running `npm run seed` **wipes and reloads** all collections — do not use it on a database with real data.

---

## API Overview

Base URL: `/api` — all private routes require header `Authorization: Bearer <token>`.

### Auth (public)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a student → `{ token, user }` |
| POST | `/api/auth/login` | Login (any role) → `{ token, user }` |
| GET | `/api/auth/me` 🔒 | Current user profile |

### Users
| Method | Endpoint | Description |
|---|---|---|
| PUT | `/api/users/profile` 🔒 | Update own name/department/year |
| GET | `/api/users/profile/summary` 🔒 | Total complaints + member since |

### Categories
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/categories` 🔒 | Active categories (for submission form) |

### Complaints (student)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/complaints` 🔒🎓 | Submit complaint (multipart; optional `attachment` image) |
| GET | `/api/complaints/my` 🔒🎓 | Own complaints; `?status=pending|inprogress|resolved|rejected|all&category=&search=` |
| GET | `/api/complaints/:id` 🔒 | One complaint + history + feedback (student=own, staff=assigned, admin=any) |
| POST | `/api/complaints/:id/feedback` 🔒🎓 | Rate a resolved complaint (1–5 + comment; once only) |

### Admin 🔒🧑‍💼
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/dashboard` | KPIs, charts data, recent complaints |
| GET | `/api/admin/complaints` | All complaints; `?search=&category=&priority=&status=&from=&to=&sort=newest|oldest` |
| PUT | `/api/admin/complaints/:id` | Change priority / status (validated) / add note |
| PUT | `/api/admin/complaints/:id/assign` | Assign/reassign staff (body: `{ staffId }`) |
| GET | `/api/admin/users` | All students + complaint counts |
| GET | `/api/admin/staff` | All staff + workload |
| GET | `/api/admin/categories` | Categories + usage counts |
| POST | `/api/admin/categories` | Create category |
| PUT | `/api/admin/categories/:id` | Update category |
| DELETE | `/api/admin/categories/:id` | Delete category (blocked while in use) |
| GET | `/api/admin/feedback` | All feedback + average rating |

### Staff 🔒🔧
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/staff/complaints` | Assigned complaints; `?status=active|resolved|all&category=` |
| GET | `/api/staff/complaints/:id` | One assigned complaint + history |
| PUT | `/api/staff/complaints/:id/status` | `Assigned → In Progress → Resolved` |
| PUT | `/api/staff/complaints/:id/resolve` | Resolve with mandatory resolution notes |
| PUT | `/api/staff/complaints/:id/note` | Add progress note |

🔒 = JWT required · 🎓/🧑‍💼/🔧 = role restricted.

### Status codes
`200` OK · `201` Created · `400` Validation / invalid transition · `401` Missing/expired token · `403` Wrong role or not your complaint · `404` Not found · `409` Duplicate feedback · `500` Unexpected (generic message only).

---

## Complaint Workflow

```
Submitted → Under Review → Assigned → In Progress → Resolved → Closed
                                    ↘ Rejected (from Submitted / Under Review)
```

Allowed transitions are enforced **server-side** (`backend/utils/constants.js`):

| From | Allowed next |
|---|---|
| Submitted | Under Review, Rejected |
| Under Review | Assigned, Rejected |
| Assigned | In Progress |
| In Progress | Resolved |
| Resolved | Closed |
| Closed / Rejected | — (terminal) |

Admins follow the full table above; staff may only do `Assigned → In Progress → Resolved` on their own complaints. Every transition is stored in `complaintstatushistories` with who changed it, when, and a note.

---

## Software Engineering Documentation (SRS, Diagrams)

This project was built to map 1:1 onto standard SE documentation. Below is the documentation skeleton with references to what exists in the codebase — expand each section with screenshots of the running app for submission.

### 1. Problem Statement
Campus complaints are reported verbally or via scattered channels; they get lost, students receive no status updates, and management has no data to spot recurring problems. (See [Project Description](#project-description).)

### 2. Objectives
1. Provide a single digital channel for submitting structured complaints with attachments.
2. Give students transparent, live tracking with a complete status history.
3. Enforce a controlled, auditable workflow with role-based access.
4. Give admins actionable analytics (category trends, resolution times, feedback ratings).
5. Close the loop with post-resolution student feedback.

### 3. Scope
**In scope:** student registration/login, complaint CRUD with attachments, 3 roles with RBAC, assignment, status workflow + history, feedback, analytics dashboards, category management, search/filter/reporting, seed data.
**Out of scope:** email/SMS notifications, mobile apps, payment integration, multi-college tenancy.

### 4. Functional Requirements (implemented)

| ID | Requirement | Where |
|---|---|---|
| FR-01 | Students register with unique student ID & email | `authController.register` |
| FR-02 | Users log in with email+password; JWT issued | `authController.login` |
| FR-03 | Passwords stored as bcrypt hashes only | `models/User.js` pre-save hook |
| FR-04 | Students submit complaints with category/priority/location/description/optional image | `complaintController.createComplaint` |
| FR-05 | System generates unique ID `CMP-YYYY-NNNN` | `utils/generateComplaintId.js` (atomic counter) |
| FR-06 | Students view/filter/search own complaints | `complaintController.getMyComplaints` |
| FR-07 | Students see visual timeline + full status history | `complaintController.getComplaintById`, `complaint-details.html` |
| FR-08 | Admins list/search/filter/sort all complaints | `adminController.listComplaints` |
| FR-09 | Admins change priority | `adminController.updateComplaint` |
| FR-10 | Admins assign/reassign staff; status becomes Assigned | `adminController.assignComplaint` |
| FR-11 | Admins update status; invalid transitions rejected | `TRANSITIONS` + `updateComplaint` |
| FR-12 | Admins add notes; notes stored on complaint | `adminController.updateComplaint` |
| FR-13 | Staff view only assigned complaints | `staffController` + `loadAssignedComplaint` guard |
| FR-14 | Staff add progress notes / update status / resolve with notes | `staffController.updateStatus/resolveComplaint/addProgressNote` |
| FR-15 | Every status change recorded with who/when/note | `ComplaintStatusHistory` writes in all controllers |
| FR-16 | Students submit 1–5 rating + comment after resolution; one per complaint | `complaintController.addFeedback`, unique index on `Feedback.complaint` |
| FR-17 | Admin views all feedback + average | `adminController.listFeedback` |
| FR-18 | Dashboard stats/charts computed from DB | `adminController.getDashboard` (aggregations) |
| FR-19 | Admin manages categories (add/edit/activate/deactivate/delete) | `adminController` category functions |
| FR-20 | Role-based access on every private API | `authMiddleware` + `roleMiddleware` |

### 5. Non-Functional Requirements

| ID | Requirement | Implementation |
|---|---|---|
| NFR-01 | **Security** — no plain-text passwords, protected routes, no internals leaked | bcryptjs, JWT, central error handler |
| NFR-02 | **Usability** — minimal, professional, responsive UI | CSS design system, mobile drawer, empty states |
| NFR-03 | **Performance** — indexed queries, paginated lists | indexes on complaintId/status/student/assignedStaff; limits |
| NFR-04 | **Reliability** — validated input, safe failures | Mongoose validators, ApiError, DB-level unique indexes |
| NFR-05 | **Maintainability** — layered structure (routes→controllers→models), shared constants | see folder structure |
| NFR-06 | **Portability** — runs on any OS with Node + MongoDB | no OS-specific code |
| NFR-07 | **Auditability** — immutable status history | separate history collection |

### 6. User Requirements
As a **student** I want to report a problem with a photo, see who is handling it, watch its progress, and rate the fix — so I don't have to chase anyone.
As a **staff member** I want a clear list of my assigned complaints with priorities, and a simple way to record progress and resolutions.
As an **admin** I want every complaint in one place with filters, one-click assignment, enforced workflow, and charts that show what is failing on campus.

### 7. System Requirements
- Node.js ≥ 18, npm ≥ 9
- MongoDB ≥ 6 (local service or Atlas)
- Modern evergreen browser (Chrome/Edge/Firefox)
- 2 GB RAM free for MongoDB is sufficient for the demo dataset

### 8. SRS summary
Combine sections 1–7 above; the requirement tables map directly to code locations, making verification during testing straightforward (see [Testing](#testing--test-cases)).

### 9. Use Case Diagram (textual)
**Actors:** Student, Staff, Admin, System (timer/counter).
- Student: Register · Login · Submit Complaint · Track Complaint · Give Feedback · Edit Profile
- Staff: Login · View Assigned Complaints · Add Progress Note · Update Status · Resolve Complaint
- Admin: Login · Review Complaint · Change Priority · Assign Staff · Update Status · Manage Categories · View Students/Staff · View Reports · View Feedback
- System: Generate Complaint ID · Record Status History · Enforce Transitions · Compute Statistics
Include-relationships: *Submit Complaint* «include» *Generate Complaint ID*; *Resolve Complaint* «include» *Record Status History*; *Give Feedback* «include» *Validate One-Per-Complaint*.

### 10. Class Diagram (textual — see Mongoose models)
`User(name, studentId, email, passwordHash, department, year, role)` — `Complaint(complaintId, title, description, location, priority, status, attachment, resolutionNotes)` — `Category(name, description, active)` — `ComplaintStatusHistory(status, note, changedAt)` — `Feedback(rating, comment)`.
Associations: `User 1—* Complaint (submits)`, `User 1—* Complaint (assignedTo, staff)`, `Complaint *—1 Category`, `Complaint 1—* ComplaintStatusHistory`, `Complaint 1—0..1 Feedback`, `User 1—0..1 Feedback (author)`.

### 11. Activity Diagram (complaint lifecycle)
Register/Login → Fill complaint form → Validate → Generate ID + save → Notify admin (dashboard) → Admin reviews → [reject] → terminal Rejected / [accept] → Under Review → Assign staff (status=Assigned) → Staff starts (In Progress) → Staff resolves with notes (Resolved) → Student gives feedback (optional) → Admin closes (Closed).

### 12. Sequence Diagram (submission → resolution)
Student → UI → `POST /api/complaints` → authMiddleware(JWT) → complaintController → Counter(generateId) → Complaint.save() → StatusHistory.create("Submitted") → 201 → UI redirects to details.
Admin → `PUT /admin/complaints/:id/assign` → validate staff role → set assignedStaff + status=Assigned → StatusHistory.create → 200.
Staff → `PUT /staff/complaints/:id/resolve` → verify assignment → set resolutionNotes + status=Resolved → StatusHistory.create → 200.
Student → `POST /complaints/:id/feedback` → verify resolved + no duplicate → Feedback.create → 201 → visible to Admin via `GET /admin/feedback`.

### 13. ER Diagram
Same as the class diagram associations above; implement in draw.io with crow's-foot notation: users ||—o{ complaints, users ||—o{ complaints (assignee), categories ||—o{ complaints, complaints ||—o{ complaintstatushistories, complaints ||—o| feedbacks, users ||—o{ feedbacks.

### 14. System Architecture
See the diagram in [System Architecture](#system-architecture) — 3-tier: browser client ↔ Express REST API ↔ MongoDB, with JWT stateless auth and server-rendered static frontend.

### 15. Database Design
See [Database Structure](#database-structure) and `backend/models/*`. Include screenshots of `mongosh` collection listings for the report.

### 16. Implementation
Highlights: atomic counter for complaint IDs; transition map shared by all controllers; unique index enforcing one feedback per complaint; multer disk storage with type/size filters; role-aware single detail endpoint; zero-downtime dev flow with nodemon.

### 17. Testing
See the test-case table below. Manual pass criteria: every TC row executed with the demo credentials produces the expected result.

### 19. Deployment
For production: set a strong `JWT_SECRET`, restrict `CORS_ORIGIN`, use MongoDB Atlas, run `npm start` behind a process manager (`pm2`) or a platform service, and serve over HTTPS (reverse proxy). The frontend is static — it can also be served from a CDN with `API_BASE` pointed at the API host.

### 20. Maintenance
Re-seed demo data with `npm run seed`; rotate JWT secrets (users re-login); back up MongoDB (`mongodump`); monitor `server.log`; migrate schema changes via Mongoose; review indexes if complaint volume grows.

---

## Testing & Test Cases

Run the app (`npm run seed` + `npm run dev`), then execute each case against http://localhost:5000. API cases can be replayed with Postman/REST client using the same bodies.

| TC ID | Title | Steps | Test Data | Expected Result | Actual |
|---|---|---|---|---|---|
| TC001 | Student registration | Fill register form with valid data, submit | new student ID + email, password ≥ 6 | Account created; redirected to Student Dashboard; user visible in admin → Students | ✅ |
| TC002 | Valid login (all roles) | Login with seeded credentials | `admin@college.edu/admin123`, `staff1@college.edu/staff123`, `arjun@college.edu/student123` | Redirect per role: Admin/Staff/Student dashboard | ✅ |
| TC003 | Invalid login | Login with wrong password | any email + wrong password | “Invalid email or password”; stays on login page; no token stored | ✅ |
| TC004 | Complaint submission | Student submits valid complaint (with image) | title, category, description, location | Success message; ID `CMP-2026-00XX`; redirected to details; document in MongoDB `complaints` | ✅ |
| TC005 | Empty complaint form | Submit with empty/short fields | title “ab”, no category | Inline field errors; no API call succeeds; no document created | ✅ |
| TC006 | Complaint tracking | Open a complaint's details and follow timeline | seeded resolved complaint | Timeline shows reached steps; full status history listed with dates/actors | ✅ |
| TC007 | Admin assignment | Admin assigns a complaint to staff | complaint in Submitted/Under Review + `staff2` | Status → Assigned; staff sees it on their dashboard; history entry “Assigned to …” | ✅ |
| TC008 | Staff status update | Assigned staff moves Assigned → In Progress | assigned complaint | Status updated; history entry added; student sees new status | ✅ |
| TC009 | Complaint resolution | Staff resolves with resolution notes | In Progress complaint + notes ≥ 5 chars | Status → Resolved; resolution notes stored; student sees notes | ✅ |
| TC010 | Staff resolution without notes | Try resolving with empty notes | empty resolutionNotes | Rejected with “Resolution notes are required”; status unchanged | ✅ |
| TC011 | Feedback submission | Student rates a resolved complaint | rating 4 + comment | Feedback saved; shown on details page and Admin → Feedback; average updates | ✅ |
| TC012 | Duplicate feedback | Try to rate the same complaint again | same complaint | API returns 409 “already submitted”; form no longer shown | ✅ |
| TC013 | Invalid status transition | API: staff tries Assigned → Resolved directly | `PUT /api/staff/complaints/:id/status {"status":"Resolved"}` | 400 “Invalid status transition”; status unchanged | ✅ |
| TC014 | Unauthorized access | Call a private API without token | `GET /api/complaints/my` (no header) | 401 “Not authorized, no token provided”; browser pages redirect to login | ✅ |
| TC015 | Role-based access — student hits admin API | Student token on `GET /api/admin/dashboard` | valid student JWT | 403 “Access denied: insufficient permissions” | ✅ |
| TC016 | Role-based access — staff opens others' complaint | Staff token on a complaint not assigned to them | complaint assigned to the other staff | 403 “This complaint is not assigned to you” | ✅ |
| TC017 | Student opens another student's complaint | Student token on foreign complaint ID | seeded other-student ID | 403 “You can only view your own complaints” | ✅ |
| TC018 | Missing complaint | Open details with invalid/nonexistent ID | random ObjectId | 404 “Complaint not found”; friendly error card | ✅ |
| TC019 | Admin filters & search | Filter by status/priority/category/date; search by ID & student name | e.g. status=resolved, search=Arjun | Only matching rows shown; count label updates | ✅ |
| TC020 | Category delete protection | Delete a category that has complaints | e.g. “Canteen” | Blocked: “Cannot delete: N complaint(s) use this category” | ✅ |
| TC021 | Profile update | Change name/department/year, save | any student | Success alert; topbar name updates instantly; persisted in DB | ✅ |
| TC022 | Duplicate registration | Register with existing email/student ID | `arjun@college.edu` | “already exists / registered” message; no account created | ✅ |
| TC023 | Dashboard stats accuracy | Compare dashboard cards with complaint list counts | seeded data | Total/Pending/In Progress/Resolved match DB (`mongosh` count check) | ✅ |
| TC024 | Attachment validation | Upload a non-image / >5 MB file | `.pdf` / 6 MB image | Rejected with clear message | ✅ |

### Quick API smoke script
```bash
# login as admin and store token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@college.edu","password":"admin123"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).token")

curl -s http://localhost:5000/api/admin/dashboard -H "Authorization: Bearer $TOKEN"
```

---

## Future Enhancements

- Email/SMS notifications on status changes (Nodemailer / Twilio)
- Comment thread between student, staff and admin
- SLA timers with automatic escalation of stale complaints
- Attachment handling for multiple files and PDFs
- CSV/PDF report export
- Dark mode and additional language support
- Forgot-password flow with email reset links
- PWA / mobile app wrapper

---

## Maintenance

- **Re-seed:** `npm run seed` (wipes demo DB)
- **Logs:** console output / `server.log`
- **Backups:** `mongodump --db complaint_portal`
- **Secret rotation:** change `JWT_SECRET` (all sessions invalidated)
- **Schema changes:** update the Mongoose model, restart; add a migration script for data backfills

---

Built as a Software Engineering academic project · Node.js · Express · MongoDB · JWT · Vanilla JS
