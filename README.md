# ExamHub — Online Examination Management System

An institutional web platform designed and built with **pure HTML5, CSS3, and JavaScript**, paired with a **Python Flask backend** and **Render Blueprint with Cloud PostgreSQL 16**.

- **Figure 9.1:** ExamHub Home & Portal Landing Page
- **Figure 9.2:** Public Examination Timetable & Faculty Dashboard
- **Figure 9.3:** Schedule a New Examination Web Interface with Exclusion Constraints
- **Figure 9.4:** PostgreSQL 16 `psql` & Flask Backend Application

---

## ☁️ Deploying to Render via Blueprint (`render.yaml`)

This repository is fully configured for **Infrastructure-as-Code (IaC)** deployment on Render using the included `render.yaml`.

### Step 1: Push Code to GitHub

1. Create a new empty repository on [GitHub](https://github.com/new), for example named: `online-examination-system`.
2. In your terminal (PowerShell), link and push this repo:
```powershell
# Set your remote URL (replace <your-github-username> with your GitHub username)
git remote add origin https://github.com/<your-github-username>/online-examination-system.git

# Rename branch to main if needed & push
git branch -M main
git push -u origin main
```

---

### Step 2: One-Click Deploy on Render

1. Log into your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** at the top right and select **Blueprint**.
3. Connect your GitHub account and choose the `online-examination-system` repository.
4. Render will automatically parse [`render.yaml`](./render.yaml) and discover:
   - **Database:** `examhub-postgres` (PostgreSQL 16, free tier, region: Oregon).
   - **Web Service:** `examhub-online-exam-system` (Python 3.11 with Gunicorn).
   - **Environment Variable:** Automatic injection of `DATABASE_URL` linking the web service to the database.
5. Click **Apply**. Render will:
   1. Spin up the cloud PostgreSQL instance.
   2. Build the Python web service with `pip install -r requirements.txt`.
   3. Launch `gunicorn server:app`.
   4. Execute [`init_db.sql`](./init_db.sql) to activate `btree_gist`, create all 6 tables, and seed default records.
   5. Give you a public live URL: `https://examhub-online-exam-system.onrender.com`.

---

## 🚀 Local Execution (Two Modes)

### Mode A: Standalone Static Mode (Pure HTML/CSS/JS)
Double-click [`index.html`](./index.html) or run:
```powershell
python -m http.server 5000
```
Then visit [http://localhost:5000](http://localhost:5000). The frontend runs in client-side simulated mode with `localStorage` persistence.

### Mode B: Full-Stack Mode with Python & PostgreSQL
Set your `DATABASE_URL` and run:
```powershell
pip install -r requirements.txt
python server.py
```

---

## 📁 Repository Structure

| File | Purpose |
| :--- | :--- |
| [`render.yaml`](./render.yaml) | Render Blueprint defining the Web Service + Cloud PostgreSQL database |
| [`init_db.sql`](./init_db.sql) | PostgreSQL 16 DDL with `btree_gist` exclusion constraints & seed data |
| [`server.py`](./server.py) | Python Flask backend REST API with parameterized queries and error handling |
| [`requirements.txt`](./requirements.txt) | Python dependencies (`Flask`, `psycopg2-binary`, `gunicorn`, `python-dotenv`) |
| [`index.html`](./index.html) | Pixel-perfect frontend UI matching Figures 9.1, 9.2, and 9.3 |
| [`style.css`](./style.css) | Custom styling, color tokens, and responsive layout |
| [`app.js`](./app.js) | Dual-mode frontend controller (auto-detects PostgreSQL API or local store) |
| [`.gitignore`](./.gitignore) | Clean ignore rules for virtualenvs, caches, and temp files |
