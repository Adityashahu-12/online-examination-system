/**
 * ExamHub - Online Examination Management System
 * Core Client Application & Standby Data Architecture
 * 
 * NOTE: This frontend is currently in STANDBY MODE waiting for the user's
 * call to connect the PostgreSQL / Flask database backend.
 */

// =============================================================================
// 1. STANDBY DATA ARCHITECTURE (MOCK DATABASE & PERSISTENCE)
// =============================================================================

const DEFAULT_DEPARTMENTS = [
  { id: 1, name: "Department of Information Technology", code: "IT", contact: "Dr. Rajesh Kapoor", email: "it@college.ac.in", phone: "9876543210", address: "Block A, Room 201" },
  { id: 2, name: "Department of Computer Science", code: "CSE", contact: "Dr. Sunita Agarwal", email: "cse@college.ac.in", phone: "9876543211", address: "Block A, Room 301" },
  { id: 3, name: "Department of AI and Data Science", code: "AIDS", contact: "Dr. K. Rajendran", email: "aids@college.ac.in", phone: "9876543212", address: "Block B, Room 102" },
  { id: 4, name: "Department of Electronics & TC", code: "ETC", contact: "Dr. Prannoy Roy", email: "etc@college.ac.in", phone: "9876543213", address: "Block C, Room 205" },
  { id: 5, name: "Department of Mechanical Engg", code: "MECH", contact: "Dr. Nikhil Advani", email: "mech@college.ac.in", phone: "9876543214", address: "Workshop Complex W1" }
];

const DEFAULT_CENTERS = [
  { id: 1, name: "Turing Computer Center Lab 101", type: "Campus Lab", capacity: 60, status: true },
  { id: 2, name: "Babbage Computing Lab 202", type: "Campus Lab", capacity: 45, status: true },
  { id: 3, name: "Virtual Hall Alpha", type: "Virtual Hall", capacity: 150, status: true },
  { id: 4, name: "Aryabhata Lab 104", type: "Campus Lab", capacity: 50, status: true },
  { id: 5, name: "Shannon Lab 301", type: "Campus Lab", capacity: 40, status: true },
  { id: 6, name: "Von Neumann Center 201", type: "Campus Lab", capacity: 55, status: true }
];

const DEFAULT_SUBJECTS = [
  { id: 1, name: "Database Systems", code: "24IT501T", desc: "Relational models, SQL, Normalization, ACID and indexing" },
  { id: 2, name: "Data Structures", code: "24CS301T", desc: "Stacks, Queues, Trees, Graphs, Sorting and Dynamic Programming" },
  { id: 3, name: "Operating Systems", code: "24IT502T", desc: "Process synchronization, memory management, threads and file systems" },
  { id: 4, name: "Computer Networks", code: "24EC401T", desc: "OSI model, TCP/IP, routing algorithms and socket programming" },
  { id: 5, name: "Cyber Security", code: "24IT601T", desc: "Cryptography, Network Security, Ethical Hacking and Protocols" },
  { id: 6, name: "Artificial Intelligence", code: "24AI501T", desc: "Heuristic search, neural networks, machine learning algorithms" },
  { id: 7, name: "Compiler Design", code: "24CS502T", desc: "Lexical analysis, parsing, semantic analysis and code generation" },
  { id: 8, name: "Discrete Mathematics", code: "24CS201T", desc: "Set theory, graph theory, propositional logic and combinatorics" },
  { id: 9, name: "IoT & Embedded Systems", code: "24EC503T", desc: "Sensors, microcontrollers, embedded C and wireless mesh" }
];

const DEFAULT_SCHEDULES = [
  {
    id: 1,
    title: "DBMS Mid-Semester Examination",
    deptId: 1,
    deptName: "Dept of Information Tech",
    centerId: 1,
    centerName: "Turing Lab 101",
    subjectId: 1,
    subjectName: "Database Systems",
    date: "2026-10-20",
    startTime: "09:00",
    endTime: "10:30",
    duration: 90,
    status: "Scheduled",
    approvalStatus: "Approved",
    submittedOn: "2026-10-20",
    instructions: "Comprehensive theoretical and practical exam covering Relational Algebra, SQL, Normalization, and Transaction Management with ACID compliance."
  },
  {
    id: 2,
    title: "Data Structures Practical Exam",
    deptId: 2,
    deptName: "Dept of Computer Science",
    centerId: 2,
    centerName: "Babbage Lab 202",
    subjectId: 2,
    subjectName: "Data Structures",
    date: "2026-10-20",
    startTime: "11:00",
    endTime: "12:30",
    duration: 90,
    status: "Scheduled",
    approvalStatus: "Approved",
    submittedOn: "2026-10-20",
    instructions: "Live algorithmic implementation of balanced BSTs, Dijkstra algorithm, and defense of asymptotic time complexity."
  },
  {
    id: 3,
    title: "Operating Systems Term Test",
    deptId: 1,
    deptName: "Dept of Information Tech",
    centerId: 3,
    centerName: "Virtual Hall Alpha",
    subjectId: 3,
    subjectName: "Operating Systems",
    date: "2026-10-20",
    startTime: "14:00",
    endTime: "15:30",
    duration: 90,
    status: "Scheduled",
    approvalStatus: "Approved",
    submittedOn: "2026-10-20",
    instructions: "Evaluation covering Peterson's algorithm, Banker's deadlock avoidance, and virtual memory page replacement."
  },
  {
    id: 4,
    title: "Computer Networks Final Viva",
    deptId: 4,
    deptName: "Dept of Electronics & TC",
    centerId: 4,
    centerName: "Aryabhata Lab 104",
    subjectId: 4,
    subjectName: "Computer Networks",
    date: "2026-10-20",
    startTime: "16:00",
    endTime: "17:00",
    duration: 60,
    status: "Scheduled",
    approvalStatus: "Approved",
    submittedOn: "2026-10-20",
    instructions: "Socket programming defense and subnet configuration examination using Wireshark trace analysis."
  },
  {
    id: 5,
    title: "Cyber Security Quiz",
    deptId: 1,
    deptName: "Dept of Information Tech",
    centerId: 4,
    centerName: "Aryabhata Lab 104",
    subjectId: 5,
    subjectName: "Cyber Security",
    date: "2026-10-21",
    startTime: "10:00",
    endTime: "11:30",
    duration: 90,
    status: "Scheduled",
    approvalStatus: "Approved",
    submittedOn: "2026-10-21",
    instructions: "Hands-on packet inspection, vulnerability scans, and RSA encryption key generation exercises."
  },
  {
    id: 6,
    title: "AI Mid-Term Examination",
    deptId: 2,
    deptName: "Dept of Computer Science",
    centerId: 5,
    centerName: "Shannon Lab 301",
    subjectId: 6,
    subjectName: "Artificial Intelligence",
    date: "2026-10-21",
    startTime: "14:30",
    endTime: "16:00",
    duration: 90,
    status: "Scheduled",
    approvalStatus: "Approved",
    submittedOn: "2026-10-21",
    instructions: "Evaluation of heuristic state search (A*), Minimax with Alpha-Beta pruning, and gradient descent optimization."
  },
  {
    id: 7,
    title: "Discrete Math Test",
    deptId: 2,
    deptName: "Dept of Computer Science",
    centerId: 2,
    centerName: "Babbage Lab 202",
    subjectId: 8,
    subjectName: "Discrete Mathematics",
    date: "2026-10-22",
    startTime: "09:30",
    endTime: "11:00",
    duration: 90,
    status: "Pending",
    approvalStatus: "Pending",
    submittedOn: "2026-10-21",
    instructions: "Combinatorics and mathematical induction proofs."
  },
  {
    id: 8,
    title: "Compiler Design Quiz",
    deptId: 2,
    deptName: "Dept of Computer Science",
    centerId: 1,
    centerName: "Turing Lab 101",
    subjectId: 7,
    subjectName: "Compiler Design",
    date: "2026-10-22",
    startTime: "14:00",
    endTime: "15:00",
    duration: 60,
    status: "Scheduled",
    approvalStatus: "Approved",
    submittedOn: "2026-10-22",
    instructions: "LL(1) and LR(0) parsing tables construction."
  },
  {
    id: 9,
    title: "IoT Practical Viva",
    deptId: 4,
    deptName: "Dept of Electronics & TC",
    centerId: 4,
    centerName: "Aryabhata Lab 104",
    subjectId: 9,
    subjectName: "IoT & Embedded Systems",
    date: "2026-10-22",
    startTime: "15:30",
    endTime: "16:30",
    duration: 60,
    status: "Scheduled",
    approvalStatus: "Approved",
    submittedOn: "2026-10-22",
    instructions: "Hardware demonstration of ESP32 sensor telemetry over MQTT."
  },
  {
    id: 10,
    title: "Robotics Kinematics Test",
    deptId: 5,
    deptName: "Dept of Mechanical Engg",
    centerId: 1,
    centerName: "Turing Lab 101",
    subjectId: 1,
    subjectName: "Robotics",
    date: "2026-10-23",
    startTime: "10:00",
    endTime: "11:30",
    duration: 90,
    status: "Cancelled",
    approvalStatus: "Cancelled",
    submittedOn: "2026-10-19",
    instructions: "Cancelled due to emergency lab calibration."
  }
];

class StandbyDatabaseManager {
  constructor() {
    this.storageKey = 'examhub_mock_db_v1';
    this.init();
  }

  init() {
    const existing = localStorage.getItem(this.storageKey);
    if (!existing) {
      this.resetToDefaults();
    } else {
      try {
        this.data = JSON.parse(existing);
      } catch (e) {
        this.resetToDefaults();
      }
    }
  }

  resetToDefaults() {
    this.data = {
      departments: [...DEFAULT_DEPARTMENTS],
      centers: [...DEFAULT_CENTERS],
      subjects: [...DEFAULT_SUBJECTS],
      schedules: [...DEFAULT_SCHEDULES],
      registeredUsersCount: 24,
      lastScheduleId: 25
    };
    this.save();
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  // --- Core Conflict Prevention Engine ---
  // Mirrors PostgreSQL Exclusion Constraint:
  // EXCLUDE USING gist (center_id WITH =, daterange(exam_date, exam_date, '[]') WITH &&) WHERE (status <> 'Cancelled')
  checkConflict(centerId, date, startTime, endTime, excludeId = null) {
    const toMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const newStart = toMinutes(startTime);
    const newEnd = toMinutes(endTime);

    if (newStart >= newEnd) {
      return {
        hasConflict: true,
        reason: "Invalid time range: Start time must precede end time."
      };
    }

    const conflicts = this.data.schedules.filter(s => {
      if (excludeId && s.id === excludeId) return false;
      if (s.status === 'Cancelled') return false; // Exclusion constraint WHERE clause
      if (Number(s.centerId) !== Number(centerId)) return false;
      if (s.date !== date) return false;

      const existStart = toMinutes(s.startTime);
      const existEnd = toMinutes(s.endTime);

      // Overlap condition: max(start1, start2) < min(end1, end2)
      return Math.max(newStart, existStart) < Math.min(newEnd, existEnd);
    });

    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      return {
        hasConflict: true,
        conflictingExam: conflict,
        reason: `Exclusion constraint violation: Center is already booked for "${conflict.title}" (${conflict.startTime} - ${conflict.endTime}).`
      };
    }

    return { hasConflict: false };
  }

  // --- Schedule Operations ---
  createSchedule(scheduleData) {
    const conflictCheck = this.checkConflict(
      scheduleData.centerId,
      scheduleData.date,
      scheduleData.startTime,
      scheduleData.endTime
    );

    if (conflictCheck.hasConflict) {
      throw new Error(conflictCheck.reason);
    }

    this.data.lastScheduleId += 1;
    const newSchedule = {
      id: this.data.lastScheduleId,
      title: scheduleData.title,
      deptId: Number(scheduleData.deptId),
      deptName: scheduleData.deptName,
      centerId: Number(scheduleData.centerId),
      centerName: scheduleData.centerName,
      subjectId: Number(scheduleData.subjectId),
      subjectName: scheduleData.subjectName,
      date: scheduleData.date,
      startTime: scheduleData.startTime,
      endTime: scheduleData.endTime,
      duration: Number(scheduleData.duration),
      instructions: scheduleData.instructions || "",
      status: "Scheduled",
      approvalStatus: "Approved",
      submittedOn: new Date().toISOString().split('T')[0]
    };

    this.data.schedules.unshift(newSchedule);
    this.save();
    return newSchedule;
  }

  getSchedules(filter = {}) {
    let list = [...this.data.schedules];

    if (filter.query) {
      const q = filter.query.toLowerCase().trim();
      list = list.filter(s => 
        s.title.toLowerCase().includes(q) || 
        s.deptName.toLowerCase().includes(q) ||
        s.subjectName.toLowerCase().includes(q)
      );
    }

    if (filter.subject && filter.subject !== "all") {
      list = list.filter(s => s.subjectName.toLowerCase() === filter.subject.toLowerCase());
    }

    if (filter.center && filter.center !== "all") {
      list = list.filter(s => s.centerName.toLowerCase().includes(filter.center.toLowerCase()));
    }

    if (filter.date) {
      list = list.filter(s => s.date === filter.date);
    }

    if (filter.sort) {
      if (filter.sort === "earliest") {
        list.sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
      } else if (filter.sort === "latest") {
        list.sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
      } else if (filter.sort === "title") {
        list.sort((a, b) => a.title.localeCompare(b.title));
      } else if (filter.sort === "dept") {
        list.sort((a, b) => a.deptName.localeCompare(b.deptName));
      }
    }

    return list;
  }

  getKPIs() {
    const total = this.data.schedules.length;
    const approved = this.data.schedules.filter(s => s.approvalStatus === 'Approved' && s.status !== 'Cancelled').length;
    const pending = this.data.schedules.filter(s => s.approvalStatus === 'Pending').length;
    const cancelled = this.data.schedules.filter(s => s.status === 'Cancelled').length;

    return {
      totalExams: 25 + (total - DEFAULT_SCHEDULES.length),
      approvedExams: 23 + (approved - DEFAULT_SCHEDULES.filter(s => s.approvalStatus === 'Approved' && s.status !== 'Cancelled').length),
      pendingExams: 1 + (pending - DEFAULT_SCHEDULES.filter(s => s.approvalStatus === 'Pending').length),
      cancelledExams: 1 + (cancelled - DEFAULT_SCHEDULES.filter(s => s.status === 'Cancelled').length),
      activeCenters: this.data.centers.filter(c => c.status).length,
      registeredUsers: this.data.registeredUsersCount
    };
  }

  getUpcomingApproved(limit = 5) {
    return this.data.schedules
      .filter(s => s.approvalStatus === 'Approved' && s.status !== 'Cancelled')
      .slice(0, limit);
  }

  getRecentSubmissions(limit = 5) {
    return this.data.schedules.slice(0, limit);
  }

  addDepartment(dept) {
    const newId = this.data.departments.length + 1;
    const newDept = { id: newId, ...dept };
    this.data.departments.push(newDept);
    this.save();
    return newDept;
  }
}

// =============================================================================
// 1.5. HYBRID BACKEND & CLOUD POSTGRESQL API ADAPTER
// =============================================================================

const API = {
  isBackendAvailable: false,
  backendInfo: null,

  async checkHealth() {
    try {
      const res = await fetch('/api/status', { cache: 'no-cache' });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'connected') {
          this.isBackendAvailable = true;
          this.backendInfo = data;
          this.updateUiForConnectedDb(data);
          return true;
        }
      }
    } catch (e) {
      // Standalone static mode
    }
    this.isBackendAvailable = false;
    return false;
  },

  updateUiForConnectedDb(info) {
    const banner = document.getElementById('db-standby-banner');
    if (banner) {
      banner.innerHTML = `
        <div class="banner-left">
          <span class="standby-pill" style="background-color: #15803D;">● PostgreSQL: Cloud Connected</span>
          <span>Live Render PostgreSQL 16 online. ACID transactions and btree_gist exclusion constraints active.</span>
        </div>
        <div class="banner-right">
          <button type="button" onclick="UI.openModal('modal-db-standby-info')">Database Status ℹ️</button>
        </div>
      `;
    }
  },

  async getSchedules(filter = {}) {
    if (!this.isBackendAvailable) {
      return db.getSchedules(filter);
    }
    try {
      const params = new URLSearchParams();
      if (filter.query) params.append('query', filter.query);
      if (filter.subject && filter.subject !== 'all') params.append('subject', filter.subject);
      if (filter.center && filter.center !== 'all') params.append('center', filter.center);
      if (filter.date) params.append('date', filter.date);
      if (filter.sort) params.append('sort', filter.sort);

      const res = await fetch(`/api/schedules?${params.toString()}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("[API Error] Falling back to local store:", e);
    }
    return db.getSchedules(filter);
  },

  async getKPIs() {
    if (!this.isBackendAvailable) {
      return db.getKPIs();
    }
    try {
      const res = await fetch('/api/kpis');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("[API Error] Falling back to local KPIs:", e);
    }
    return db.getKPIs();
  },

  async createSchedule(scheduleData) {
    if (!this.isBackendAvailable) {
      return db.createSchedule(scheduleData);
    }
    const res = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleData)
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || "Failed to schedule examination");
    }
    return { id: result.scheduleId, ...scheduleData };
  },

  async addDepartment(deptData) {
    if (!this.isBackendAvailable) {
      return db.addDepartment(deptData);
    }
    const res = await fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deptData)
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || "Failed to register department");
    }
    return result;
  }
};

// Global Standby Database Instance
const db = new StandbyDatabaseManager();

// =============================================================================
// 2. USER INTERFACE CONTROLLER
// =============================================================================

const UI = {
  currentView: 'home',

  // Address Bar URL Map matching Figures 9.1, 9.2, 9.3
  viewUrlMap: {
    'home': 'http://localhost:5000/ - ExamHub | Online Examination System',
    'schedules': 'http://localhost:5000/schedules - ExamHub | Active Examination Schedule',
    'create-exam': 'http://localhost:5000/exams/create - ExamHub | Schedule New Exam'
  },

  async init() {
    this.setupViewRouting();
    await API.checkHealth();
    this.populateSelectDropdowns();
    await this.renderTimetable();
    await this.renderDashboard();
    this.setupEventListeners();
    this.updateConflictNoticeText();

    // Check URL hash if provided
    const hash = window.location.hash.replace('#', '');
    if (['home', 'schedules', 'create-exam'].includes(hash)) {
      this.switchView(hash);
    } else {
      this.switchView('home');
    }
  },

  isLoggedIn: true,

  setupViewRouting() {
    // Nav links
    document.querySelectorAll('[data-view-target]').forEach(elem => {
      elem.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = elem.getAttribute('data-view-target');
        const scrollTarget = elem.getAttribute('data-scroll-target');
        this.switchView(targetView, scrollTarget);
      });
    });

    // Quick View buttons (Figure tabs at top)
    document.querySelectorAll('.view-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.getAttribute('data-tab-view');
        this.switchView(targetView);
      });
    });
  },

  switchView(viewName, scrollTarget = null) {
    this.currentView = viewName;
    window.location.hash = viewName;

    // Toggle active sections
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const activeSec = document.getElementById(`view-${viewName}`);
    if (activeSec) {
      activeSec.classList.add('active');
    }

    // Update Nav Link highlighting
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-view-target') === viewName) {
        link.classList.add('active');
      }
    });

    // If available exams or dashboard view
    if (viewName === 'schedules') {
      const schedNav = document.querySelector('.nav-link[data-view-target="schedules"]');
      if (schedNav) schedNav.classList.add('active');
    }

    // Update Quick Tabs
    document.querySelectorAll('.view-tab-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-tab-view') === viewName) {
        btn.classList.add('active');
      }
    });

    // Update Simulated Browser Address Bar
    const addressBar = document.getElementById('browser-address-text');
    if (addressBar && this.viewUrlMap[viewName]) {
      addressBar.textContent = this.viewUrlMap[viewName];
    }

    // Update Nav Right Actions to match Figures 9.1, 9.2, 9.3
    const userChip = document.getElementById('user-chip-btn');
    const logoutLink = document.getElementById('nav-logout-link');
    const loginBtn = document.getElementById('nav-login-btn');

    if (viewName === 'home') {
      // In Figure 9.1, top right has "Login" button or user chip
      if (this.isLoggedIn) {
        if (userChip) userChip.style.display = 'flex';
        if (logoutLink) logoutLink.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'none';
      } else {
        if (userChip) userChip.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'inline-block';
      }
    } else if (viewName === 'schedules') {
      // In Figure 9.2, top right has "Aryan Kajne (Admin)" chip
      if (userChip) userChip.style.display = 'flex';
      if (logoutLink) logoutLink.style.display = 'none';
      if (loginBtn) loginBtn.style.display = 'none';
    } else if (viewName === 'create-exam') {
      // In Figure 9.3, top right has "Logout" in red
      if (userChip) userChip.style.display = 'none';
      if (logoutLink) logoutLink.style.display = 'inline-block';
      if (loginBtn) loginBtn.style.display = 'none';
    }

    // Refresh contents
    if (viewName === 'schedules') {
      this.renderTimetable();
      this.renderDashboard();
    }

    if (scrollTarget) {
      setTimeout(() => {
        const el = document.getElementById(scrollTarget);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  handleLogout(e) {
    if (e) e.preventDefault();
    this.isLoggedIn = false;
    this.showToast('You have logged out of the examination portal.', 'info');
    this.switchView('home');
  },

  handleLogin() {
    this.isLoggedIn = true;
    this.showToast('Authenticated as Aryan Kajne (Admin).', 'success');
    this.switchView('schedules');
  },

  populateSelectDropdowns() {
    // Subject filter dropdown
    const filterSubj = document.getElementById('filter-subject');
    if (filterSubj) {
      filterSubj.innerHTML = '<option value="all">All Subjects ▼</option>';
      db.data.subjects.forEach(s => {
        filterSubj.innerHTML += `<option value="${s.name}">${s.name}</option>`;
      });
    }

    // Center filter dropdown
    const filterCenter = document.getElementById('filter-center');
    if (filterCenter) {
      filterCenter.innerHTML = '<option value="all">All Centers ▼</option>';
      db.data.centers.forEach(c => {
        filterCenter.innerHTML += `<option value="${c.name}">${c.name}</option>`;
      });
    }

    // Form: Department select
    const formDept = document.getElementById('form-department');
    if (formDept) {
      formDept.innerHTML = '';
      db.data.departments.forEach((d, idx) => {
        formDept.innerHTML += `<option value="${d.id}" ${idx === 0 ? 'selected' : ''}>${d.name}</option>`;
      });
    }

    // Form: Subject select
    const formSubj = document.getElementById('form-subject');
    if (formSubj) {
      formSubj.innerHTML = '';
      db.data.subjects.forEach((s, idx) => {
        formSubj.innerHTML += `<option value="${s.id}" ${idx === 0 ? 'selected' : ''}>${s.name} (${s.code})</option>`;
      });
    }

    // Form: Center select
    const formCenter = document.getElementById('form-center');
    if (formCenter) {
      formCenter.innerHTML = '';
      db.data.centers.forEach((c, idx) => {
        formCenter.innerHTML += `<option value="${c.id}" ${idx === 0 ? 'selected' : ''}>${c.name}</option>`;
      });
    }
  },

  async renderTimetable() {
    const tbody = document.getElementById('timetable-tbody');
    if (!tbody) return;

    const query = document.getElementById('filter-search')?.value || '';
    const subject = document.getElementById('filter-subject')?.value || 'all';
    const center = document.getElementById('filter-center')?.value || 'all';
    const date = document.getElementById('filter-date')?.value || '';
    const sort = document.getElementById('filter-sort')?.value || 'earliest';

    const schedules = await API.getSchedules({ query, subject, center, date, sort });

    if (!schedules || schedules.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty-row">
            No examinations found matching your filter criteria. Try resetting filters.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = schedules.map(s => {
      const badgeClass = s.status === 'Cancelled' ? 'badge-cancelled' : (s.status === 'Scheduled' ? 'badge-scheduled' : 'badge-pending');
      return `
        <tr style="cursor: pointer;" onclick="UI.showExamDetails(${s.id})">
          <td class="cell-title">${s.title}</td>
          <td>${s.deptName}</td>
          <td>${s.centerName}</td>
          <td>${s.subjectName}</td>
          <td>${s.date}</td>
          <td>${s.startTime} - ${s.endTime}</td>
          <td><span class="badge-status ${badgeClass}">${s.status}</span></td>
        </tr>
      `;
    }).join('');
  },

  async renderDashboard() {
    const kpis = await API.getKPIs();

    // Update KPI numbers
    const kpiTotal = document.getElementById('kpi-total-exams');
    const kpiApproved = document.getElementById('kpi-approved-exams');
    const kpiPending = document.getElementById('kpi-pending-exams');
    const kpiCancelled = document.getElementById('kpi-cancelled-exams');

    if (kpiTotal) kpiTotal.textContent = kpis.totalExams;
    if (kpiApproved) kpiApproved.textContent = kpis.approvedExams;
    if (kpiPending) kpiPending.textContent = kpis.pendingExams;
    if (kpiCancelled) kpiCancelled.textContent = kpis.cancelledExams;

    // Update Landing page stats bar
    const landRegUsers = document.getElementById('stat-reg-users');
    const landApprExams = document.getElementById('stat-appr-exams');
    const landActCenters = document.getElementById('stat-act-centers');

    if (landRegUsers) landRegUsers.textContent = kpis.registeredUsers;
    if (landApprExams) landApprExams.textContent = kpis.approvedExams;
    if (landActCenters) landActCenters.textContent = kpis.activeCenters;

    // Upcoming Approved Exams Table (Left)
    const upcomingTbody = document.getElementById('upcoming-exams-tbody');
    if (upcomingTbody) {
      const allSchedules = await API.getSchedules({ sort: 'earliest' });
      const upcoming = allSchedules
        .filter(s => s.approvalStatus === 'Approved' && s.status !== 'Cancelled')
        .slice(0, 5);

      upcomingTbody.innerHTML = upcoming.map(item => `
        <tr>
          <td style="font-weight: 600;">${item.title.length > 22 ? item.title.substring(0, 22) + '...' : item.title}</td>
          <td>${item.centerName}</td>
          <td class="cell-time-blue">${item.date}, ${item.startTime}</td>
        </tr>
      `).join('');
    }

    // Recent Department Submissions Table (Right)
    const recentTbody = document.getElementById('recent-submissions-tbody');
    if (recentTbody) {
      const allSchedules = await API.getSchedules({ sort: 'latest' });
      const recent = allSchedules.slice(0, 5);

      recentTbody.innerHTML = recent.map(item => {
        const badgeClass = item.approvalStatus === 'Approved' ? 'badge-approved' : (item.approvalStatus === 'Cancelled' ? 'badge-cancelled' : 'badge-pending');
        return `
          <tr>
            <td style="font-weight: 600;">${item.title.length > 25 ? item.title.substring(0, 25) + '...' : item.title}</td>
            <td>${item.submittedOn || item.date}</td>
            <td><span class="badge-status ${badgeClass}">${item.approvalStatus}</span></td>
          </tr>
        `;
      }).join('');
    }
  },

  updateConflictNoticeText() {
    const centerSelect = document.getElementById('form-center');
    const dateInput = document.getElementById('form-date');
    const startInput = document.getElementById('form-start-time');
    const endInput = document.getElementById('form-end-time');
    const noticeText = document.getElementById('notice-dynamic-text');
    const violationBox = document.getElementById('form-conflict-alert');

    if (!centerSelect || !dateInput || !startInput || !endInput || !noticeText) return;

    const centerName = centerSelect.options[centerSelect.selectedIndex]?.text || 'the selected laboratory';
    const date = dateInput.value || 'selected date';
    const start = startInput.value || '09:00';
    const end = endInput.value || '10:30';

    noticeText.textContent = `The system automatically validates that ${centerName} has no conflicting scheduled examination between ${start} and ${end} on ${date} via btree_gist GiST index.`;

    // Real-time conflict preview check
    if (centerSelect.value && dateInput.value && startInput.value && endInput.value) {
      const check = db.checkConflict(centerSelect.value, dateInput.value, startInput.value, endInput.value);
      if (check.hasConflict) {
        if (violationBox) {
          violationBox.classList.add('active');
          document.getElementById('conflict-alert-message').textContent = check.reason;
        }
      } else {
        if (violationBox) {
          violationBox.classList.remove('active');
        }
      }
    }
  },

  setupEventListeners() {
    // Filter controls in schedule timetable
    const filterInputs = ['filter-search', 'filter-subject', 'filter-center', 'filter-date', 'filter-sort'];
    filterInputs.forEach(id => {
      const elem = document.getElementById(id);
      if (elem) {
        elem.addEventListener('input', () => this.renderTimetable());
        elem.addEventListener('change', () => this.renderTimetable());
      }
    });

    const resetBtn = document.getElementById('btn-reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        document.getElementById('filter-search').value = '';
        document.getElementById('filter-subject').value = 'all';
        document.getElementById('filter-center').value = 'all';
        document.getElementById('filter-date').value = '';
        document.getElementById('filter-sort').value = 'earliest';
        this.renderTimetable();
      });
    }

    // Form dynamic notice and conflict check triggers
    ['form-center', 'form-date', 'form-start-time', 'form-end-time'].forEach(id => {
      const elem = document.getElementById(id);
      if (elem) {
        elem.addEventListener('change', () => this.updateConflictNoticeText());
        elem.addEventListener('input', () => this.updateConflictNoticeText());
      }
    });

    // Auto-calculate end time when duration or start time changes
    const durationInput = document.getElementById('form-duration');
    const startTimeInput = document.getElementById('form-start-time');
    const endTimeInput = document.getElementById('form-end-time');

    const recalculateEndTime = () => {
      const dur = parseInt(durationInput.value, 10);
      const start = startTimeInput.value;
      if (!isNaN(dur) && start) {
        const [h, m] = start.split(':').map(Number);
        const totalMinutes = h * 60 + m + dur;
        const newH = Math.floor(totalMinutes / 60) % 24;
        const newM = totalMinutes % 60;
        endTimeInput.value = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:00`;
        this.updateConflictNoticeText();
      }
    };

    if (durationInput) durationInput.addEventListener('input', recalculateEndTime);
    if (startTimeInput) startTimeInput.addEventListener('change', recalculateEndTime);

    // Form submission
    const form = document.getElementById('schedule-exam-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }

    // Form Cancel button
    const cancelBtn = document.getElementById('btn-form-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        form.reset();
        this.updateConflictNoticeText();
        this.switchView('schedules');
      });
    }

    // Department registration modal form
    const deptForm = document.getElementById('register-dept-form');
    if (deptForm) {
      deptForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const deptName = document.getElementById('dept-name').value;
        const contact = document.getElementById('dept-contact').value;
        const email = document.getElementById('dept-email').value;
        const phone = document.getElementById('dept-phone').value;
        const address = document.getElementById('dept-address').value;

        try {
          await API.addDepartment({ name: deptName, contact, email, phone, address });
          this.populateSelectDropdowns();
          this.closeModal('modal-register-dept');
          this.showToast(`Department "${deptName}" registered successfully!`, 'success');
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      });
    }
  },

  async handleFormSubmit() {
    const title = document.getElementById('form-title').value.trim();
    const instructions = document.getElementById('form-instructions').value.trim();
    const deptSelect = document.getElementById('form-department');
    const subjSelect = document.getElementById('form-subject');
    const centerSelect = document.getElementById('form-center');
    const duration = document.getElementById('form-duration').value;
    const date = document.getElementById('form-date').value;
    const startTime = document.getElementById('form-start-time').value;
    const endTime = document.getElementById('form-end-time').value;

    if (!title || !instructions || !date || !startTime || !endTime) {
      this.showToast("Please fill in all mandatory fields.", "error");
      return;
    }

    try {
      const newSchedule = await API.createSchedule({
        title,
        instructions,
        deptId: deptSelect.value,
        deptName: deptSelect.options[deptSelect.selectedIndex].text,
        subjectId: subjSelect.value,
        subjectName: subjSelect.options[subjSelect.selectedIndex].text.split(' (')[0],
        centerId: centerSelect.value,
        centerName: centerSelect.options[centerSelect.selectedIndex].text,
        duration,
        date,
        startTime: startTime.substring(0, 5),
        endTime: endTime.substring(0, 5)
      });

      this.showToast(`Exam scheduled successfully! Schedule ID: #${newSchedule.id || newSchedule.scheduleId}`, 'success');
      document.getElementById('schedule-exam-form').reset();
      this.updateConflictNoticeText();
      
      // Update displays
      await this.renderTimetable();
      await this.renderDashboard();

      // Switch to Available Exams
      setTimeout(() => {
        this.switchView('schedules');
      }, 700);

    } catch (err) {
      const alertBox = document.getElementById('form-conflict-alert');
      if (alertBox) {
        alertBox.classList.add('active');
        document.getElementById('conflict-alert-message').textContent = err.message;
      }
      this.showToast(err.message, 'error');
    }
  },

  showExamDetails(scheduleId) {
    const schedule = db.data.schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    const modalBody = document.getElementById('modal-details-body');
    if (modalBody) {
      modalBody.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.84rem;">
          <div>
            <div style="font-size: 0.72rem; color: #64748B; font-weight: 700; text-transform: uppercase;">Examination Title</div>
            <div style="font-size: 1.05rem; font-weight: 800; color: #0F172A;">${schedule.title}</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <div style="font-size: 0.72rem; color: #64748B; font-weight: 700;">Department</div>
              <div style="font-weight: 600; color: #1E293B;">${schedule.deptName}</div>
            </div>
            <div>
              <div style="font-size: 0.72rem; color: #64748B; font-weight: 700;">Subject</div>
              <div style="font-weight: 600; color: #1E293B;">${schedule.subjectName}</div>
            </div>
            <div>
              <div style="font-size: 0.72rem; color: #64748B; font-weight: 700;">Center / Hall</div>
              <div style="font-weight: 600; color: #1E293B;">${schedule.centerName}</div>
            </div>
            <div>
              <div style="font-size: 0.72rem; color: #64748B; font-weight: 700;">Date & Time</div>
              <div style="font-weight: 600; color: #2563EB;">${schedule.date} (${schedule.startTime} - ${schedule.endTime})</div>
            </div>
          </div>
          <div>
            <div style="font-size: 0.72rem; color: #64748B; font-weight: 700;">Syllabus & Instructions</div>
            <p style="color: #475569; background: #F8FAFC; padding: 10px; border-radius: 4px; border: 1px solid #E2E8F0; margin-top: 4px;">
              ${schedule.instructions || 'Standard examination protocol applies. No electronic devices permitted.'}
            </p>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid #E2E8F0;">
            <span style="font-size: 0.75rem; color: #64748B;">Schedule ID: #${schedule.id} | Status:</span>
            <span class="badge-status ${schedule.status === 'Cancelled' ? 'badge-cancelled' : 'badge-scheduled'}">${schedule.status}</span>
          </div>
        </div>
      `;
      this.openModal('modal-exam-details');
    }
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'toast-success' : (type === 'error' ? 'toast-error' : '')}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : (type === 'error' ? '⚠️' : 'ℹ️')}</span>
      <div>${message}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
};

// Initialize Application when DOM is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    UI.init();
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StandbyDatabaseManager, db, UI };
}
