# ExamHub — Online Examination Management System

An institutional web platform designed and built with **pure HTML5, CSS3, and JavaScript** exactly matching the architectural designs and mockup screenshots:
- **Figure 9.1:** ExamHub Home & Portal Landing Page
- **Figure 9.2:** Public Examination Timetable & Faculty Dashboard
- **Figure 9.3:** Schedule a New Examination Web Interface

---

## 🚀 Quick Start (Running the Website)

Since this website is built using **pure HTML, CSS, and JS** with zero external dependencies or build tools, you can open and run it immediately using any of the following methods:

### Method 1: Double-Click
Simply double-click `index.html` in your file explorer to open it directly in Google Chrome, Microsoft Edge, or any modern browser.

### Method 2: Python Simple HTTP Server
Open PowerShell in this directory and run:
```powershell
python -m http.server 5000
```
Then open [http://localhost:5000](http://localhost:5000) in your browser.

### Method 3: Node `npx serve`
```powershell
npx serve .
```

---

## 🎨 Visual Fidelity & Design Breakdown

### 1. Home / Landing Page (`Figure 9.1`)
- **Dark Theme Hero Banner (`#0F172A`):**
  - Eyebrow: `ONLINE EXAMINATION MANAGEMENT SYSTEM` (`#38BDF8`)
  - Headline: `Manage Your Examination Schedule with Absolute Precision`
  - Action buttons: `Schedule an Exam` (Primary Blue `#2563EB`) & `Register Department` (Outline)
  - `How It Works` card detailing the 4-step institutional lifecycle
- **Live Statistics Strip:**
  - `24` Registered Users, `18` Approved Exams, `12` Active Exam Centers
- **Feature Grid (3×2 Responsive Matrix):**
  - Exam Listings, Schedule Conflict Check, Approval Workflow, Public Live Schedule, Faculty Dashboard, and Secure Admin Portal

### 2. Public Timetable & Faculty Dashboard (`Figure 9.2`)
- **Interactive Timetable Filter Bar:**
  - Real-time search by title (`e.g. DBMS Mid-Sem`)
  - Subject filter dropdown
  - Center / Hall filter dropdown
  - Exam date picker (`2026-10-20`)
  - Sort by earliest, latest, title, or department
  - Clear Filters button
- **Timetable Table:**
  - Complete with badges (`Scheduled`, `Approved`, `Pending`, `Cancelled`) and click-to-view exam details modal
- **Faculty & Administration Dashboard:**
  - Greeting: `Welcome back, Aryan Kajne | Role: Examination Administrator (Exam Cell)`
  - 4 KPI Stat Cards: `TOTAL EXAMS (25)`, `APPROVED (23)`, `PENDING (1)`, `CANCELLED (1)`
  - Dual Side-by-Side Tables: `Upcoming Approved Exams` & `Recent Department Submissions`

### 3. Schedule a New Examination (`Figure 9.3`)
- **Validated Form:**
  - Examination Title, Instructions & Syllabus Covered
  - Academic Department & Subject dropdowns
  - Examination Center / Computer Lab dropdown
  - Duration, Scheduled Date, Start Time, and End Time
- **Dynamic PostgreSQL Conflict Notice Box:**
  - Updates dynamically in real-time as the user selects different halls, dates, or time slots.
- **Client-Side Exclusion Constraint Simulator:**
  - Real-time validation replicating PostgreSQL `btree_gist` exclusion constraint:
    `EXCLUDE USING gist (center_id WITH =, daterange(exam_date, exam_date, '[]') WITH &&)`
  - Automatically raises and displays the exact conflict error alert if overlapping hall times are booked!
  - Successfully submitted examinations automatically update the timetable and KPI counters.

---

## 🗄️ Database Standby Status

> [!IMPORTANT]
> **Standby Mode Active:** As requested, the website is currently decoupled and waiting for your call to connect the real database.
> - Current data operations are managed cleanly via `StandbyDatabaseManager` in `app.js` with `localStorage` persistence.
> - The tables `users`, `departments`, `subjects`, `exam_centers`, `exams`, and `schedules` are structured to map directly to PostgreSQL 16 schema.
> - When you are ready to add the database, simply issue your command and we will plug in PostgreSQL and the Flask/Express API layer seamlessly!

