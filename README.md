# ExamHub — Online Examination Management System

An enterprise institutional examination platform built with **pure HTML5, CSS3, and Vanilla JavaScript**, paired with a **Node.js & Express.js backend** and **PostgreSQL 16** with `btree_gist` range exclusion constraints.

---

## 🏛️ System Features & Architectural Highlights

1. **Conflict-Free Examination Scheduling:**
   - Powered by PostgreSQL `btree_gist` exclusion constraint on `tsrange(start_timestamp, end_timestamp, '[)')`.
   - Permits multiple non-overlapping examination shifts in the same lab/center on the same date.
   - Mathematically blocks overlapping shifts in the same center, throwing error code `23P01`.
2. **Server-Synchronized Examination Room:**
   - Active countdown timer computed independently on the server (`remaining = duration - (current_time - start_time)`), surviving page reloads.
   - Question Palette tracking Answered (Green), Marked for Review (Orange), Unanswered (Grey), and Current Question (Blue).
   - Real-time autosave of student answers (`student_answers` table) on radio selection.
   - Confirmation submit modal with summary metrics and automated grading.
3. **Role-Based Authentication:**
   - Secure Bcrypt password hashing (`bcryptjs`).
   - Session-based authentication via HTTP-only cookies (`express-session`).
   - Student registration with duplicate email and Roll Number prevention.
   - Autonomous Admin Console restricted to administrators.
4. **Institutional Analytics & Reports:**
   - Busiest Examination Centers ranked by allocated shifts.
   - Department-wise student breakdown.
   - Official scorecards, percentage calculations, and publication controls.

---

## 🔑 Demo Institutional Accounts

| Role | Name | Email / Roll Number | Password | Portal URL |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | Aryan Kajne | `admin@examhub.local` | `Admin@123` | `/login.html?role=Admin` |
| **Student** | Aditya Shahu | `student@examhub.local` or UID: `24010024` | `Student@123` | `/login.html?role=Student` |

---

## 🛠️ Technology Stack

- **Frontend:** Pure HTML5, CSS3, Vanilla JavaScript (No React, Angular, Vue, Bootstrap, or Tailwind).
- **Backend:** Node.js, Express.js.
- **Database:** PostgreSQL 16 with `pg` connection pooling and `btree_gist` extension.
- **Security:** `bcryptjs`, `express-session`, parameterized SQL queries.
- **Deployment:** Render Blueprint (`render.yaml`).

---

## 🚀 Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env`)
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/online_examination_system_portal
SESSION_SECRET=examhub_super_secret_session_key_production_2026
ADMIN_EMAIL=admin@examhub.local
ADMIN_PASSWORD=Admin@123
```

### 3. Initialize Database & Seeds
```bash
npm run init-db
npm run seed
```

### 4. Run Automated Test Suite
```bash
npm test
```
*Executes all 14 unit and integration tests including exclusion conflict rejection, bcrypt verification, and grading engine.*

### 5. Start Server
```bash
npm start
```
Visit `http://localhost:3000` in your browser.

---

## ☁️ Deploying to Render via Blueprint (`render.yaml`)

This repository is configured for one-click deployment using Render's Infrastructure-as-Code Blueprint.

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "ExamHub: Complete Node.js + PostgreSQL institutional system"
   git push -u origin main
   ```
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** and select **Blueprint**.
4. Connect your GitHub repository.
5. Render will detect [`render.yaml`](./render.yaml) and automatically provision:
   - **Database:** `examhub-postgres` (PostgreSQL 16, free tier).
   - **Web Service:** `examhub-online-exam-system` (Node.js runtime).
   - Injected environment variables: `DATABASE_URL`, `NODE_ENV=production`, `SESSION_SECRET`.
6. Click **Apply**. On startup, the server automatically initializes tables, constraints, and initial institutional data.
