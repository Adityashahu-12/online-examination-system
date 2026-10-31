/**
 * ExamHub - Student Portal Controller
 */

let currentStudent = null;

async function initStudentPortal() {
  currentStudent = await checkUserSession();
  if (!currentStudent || currentStudent.role !== 'Student') {
    window.location.href = '/login.html';
    return;
  }

  // Update sidebar profile
  const nameEls = document.querySelectorAll('.student-name');
  const idEls = document.querySelectorAll('.student-id');
  const deptEls = document.querySelectorAll('.student-dept');
  const semEls = document.querySelectorAll('.student-sem');

  nameEls.forEach(el => el.textContent = currentStudent.name);
  idEls.forEach(el => el.textContent = currentStudent.student_id || 'N/A');
  deptEls.forEach(el => el.textContent = currentStudent.department_name || 'Department');
  semEls.forEach(el => el.textContent = `Semester ${currentStudent.semester || '5'}`);

  // Load specific page data
  if (document.getElementById('student-dashboard-view')) {
    loadStudentDashboard();
  } else if (document.getElementById('available-exams-view')) {
    loadAvailableExams();
  } else if (document.getElementById('student-results-view')) {
    loadStudentResults();
  } else if (document.getElementById('student-profile-view')) {
    loadStudentProfile();
  }
}

// 1. Load Student Dashboard Data
async function loadStudentDashboard() {
  try {
    const res = await fetch('/api/student/dashboard');
    const data = await res.json();
    if (!data.success) return;

    // Summary Metrics
    const elAssigned = document.getElementById('metric-assigned');
    const elCompleted = document.getElementById('metric-completed');
    const elPassed = document.getElementById('metric-passed');

    if (elAssigned) elAssigned.textContent = data.summary?.total_assigned || 0;
    if (elCompleted) elCompleted.textContent = data.summary?.total_completed || 0;
    if (elPassed) elPassed.textContent = data.summary?.total_passed || 0;

    // Assigned Exams Table
    const examsTableBody = document.getElementById('student-exams-body');
    if (examsTableBody) {
      if (!data.assigned_exams || data.assigned_exams.length === 0) {
        examsTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: #64748b;">No active examinations currently assigned to your semester.</td></tr>`;
      } else {
        examsTableBody.innerHTML = data.assigned_exams.map(exam => {
          let actionBtn = '';
          if (exam.attempt_status === 'Submitted') {
            actionBtn = `<span class="badge badge-completed">Submitted</span>`;
          } else if (exam.attempt_status === 'In Progress') {
            actionBtn = `<a href="/student/examination.html?exam_id=${exam.exam_id}" class="btn btn-warning btn-sm">Resume Exam</a>`;
          } else {
            actionBtn = `<a href="/student/examination.html?exam_id=${exam.exam_id}" class="btn btn-primary btn-sm">Start Exam</a>`;
          }

          return `
            <tr>
              <td>
                <strong>${escapeHtml(exam.title)}</strong>
                <div style="font-size: 0.8rem; color: #64748b;">${escapeHtml(exam.description || '')}</div>
              </td>
              <td>${escapeHtml(exam.subject_name)} (${escapeHtml(exam.subject_code)})</td>
              <td>${exam.duration_minutes} Mins</td>
              <td>${exam.total_marks} Marks</td>
              <td><span class="badge ${exam.attempt_status === 'Submitted' ? 'badge-completed' : (exam.attempt_status === 'In Progress' ? 'badge-scheduled' : 'badge-draft')}">${exam.attempt_status}</span></td>
              <td>${actionBtn}</td>
            </tr>
          `;
        }).join('');
      }
    }

    // Upcoming Schedules Table
    const upcomingTableBody = document.getElementById('student-upcoming-body');
    if (upcomingTableBody) {
      if (!data.upcoming_schedules || data.upcoming_schedules.length === 0) {
        upcomingTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem; color: #64748b;">No upcoming examination shifts scheduled for your courses.</td></tr>`;
      } else {
        upcomingTableBody.innerHTML = data.upcoming_schedules.map(sch => `
          <tr>
            <td><strong>${escapeHtml(sch.exam_title)}</strong></td>
            <td>${escapeHtml(sch.center_name)}</td>
            <td>${sch.exam_date}</td>
            <td><span style="font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${sch.start_time} - ${sch.end_time}</span></td>
            <td><span class="badge badge-scheduled">${sch.status}</span></td>
          </tr>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Error loading student dashboard:', err);
  }
}

// 2. Load Available Exams View
async function loadAvailableExams() {
  const container = document.getElementById('available-exams-list');
  if (!container) return;

  container.innerHTML = `<div style="text-align:center; padding: 3rem; color: #64748b;">Loading available examinations...</div>`;

  try {
    const res = await fetch('/api/student/available-exams');
    const data = await res.json();

    if (!data.success || data.exams.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding: 3rem; color: #64748b; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;">No published examinations are available for your profile right now.</div>`;
      return;
    }

    container.innerHTML = data.exams.map(exam => {
      let statusBadge = '<span class="badge badge-scheduled">Eligible</span>';
      let actionBtn = `<a href="/student/examination.html?exam_id=${exam.exam_id}" class="btn btn-primary">Start Examination</a>`;

      if (exam.attempt_status === 'Submitted') {
        statusBadge = `<span class="badge badge-completed">Completed (${exam.score} Marks)</span>`;
        actionBtn = `<a href="/student/results.html" class="btn btn-secondary">View Result</a>`;
      } else if (exam.attempt_status === 'In Progress') {
        statusBadge = '<span class="badge badge-draft">In Progress</span>';
        actionBtn = `<a href="/student/examination.html?exam_id=${exam.exam_id}" class="btn btn-warning">Resume Examination</a>`;
      }

      return `
        <div class="table-card" style="margin-bottom: 1.5rem; padding: 1.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.35rem;">
                <h3 style="font-size: 1.25rem; font-weight: 700; color: #0f172a;">${escapeHtml(exam.title)}</h3>
                ${statusBadge}
              </div>
              <p style="color: #64748b; font-size: 0.9rem;">${escapeHtml(exam.description)}</p>
            </div>
            <div>${actionBtn}</div>
          </div>
          <div style="display: flex; gap: 2rem; flex-wrap: wrap; font-size: 0.85rem; color: #475569; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
            <div><strong>Subject:</strong> ${escapeHtml(exam.subject_name)} (${escapeHtml(exam.subject_code)})</div>
            <div><strong>Department:</strong> ${escapeHtml(exam.department_name)}</div>
            <div><strong>Duration:</strong> ${exam.duration_minutes} Minutes</div>
            <div><strong>Total Marks:</strong> ${exam.total_marks}</div>
            <div><strong>Passing Marks:</strong> ${exam.passing_marks}</div>
            <div><strong>Negative Marking:</strong> ${exam.negative_marking > 0 ? `-${exam.negative_marking} marks` : 'None'}</div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div style="text-align:center; padding: 3rem; color: #ef4444;">Failed to load available examinations.</div>`;
  }
}

// 3. Load Student Results
async function loadStudentResults() {
  const tableBody = document.getElementById('results-table-body');
  if (!tableBody) return;

  try {
    const res = await fetch('/api/student/results');
    const data = await res.json();

    if (!data.success || data.results.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2.5rem; color: #64748b;">No published examination results available yet.</td></tr>`;
      return;
    }

    tableBody.innerHTML = data.results.map(r => `
      <tr>
        <td><strong>${escapeHtml(r.exam_title)}</strong></td>
        <td>${escapeHtml(r.subject_name)}</td>
        <td>${r.obtained_marks} / ${r.total_marks}</td>
        <td><strong>${r.percentage}%</strong></td>
        <td>
          <span class="badge ${r.is_passed ? 'badge-live' : 'badge-cancelled'}">
            ${r.is_passed ? 'PASSED' : 'FAILED'}
          </span>
        </td>
        <td>${r.submitted_at}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="viewResultScorecard(${r.attempt_id})">View Scorecard</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2.5rem; color: #ef4444;">Error loading results.</td></tr>`;
  }
}

// 4. View Scorecard Modal
async function viewResultScorecard(attemptId) {
  try {
    const res = await fetch(`/api/exams/result/${attemptId}`);
    const data = await res.json();
    if (!data.success) return alert(data.error || 'Scorecard not found.');

    const r = data.result;
    const modalBody = document.getElementById('scorecard-modal-body');
    if (modalBody) {
      modalBody.innerHTML = `
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <div style="font-size: 2.5rem; font-weight: 800; color: ${r.is_passed ? '#10b981' : '#ef4444'};">${r.percentage}%</div>
          <div style="font-size: 1.1rem; font-weight: 700; color: #0f172a;">${escapeHtml(r.exam_title)}</div>
          <div style="color: #64748b; font-size: 0.85rem;">${escapeHtml(r.department_name)} &bull; ${escapeHtml(r.subject_name)}</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; background: #f8fafc; padding: 1rem; border-radius: 8px;">
          <div><strong>Total Marks:</strong> ${r.total_marks}</div>
          <div><strong>Marks Obtained:</strong> ${r.obtained_marks}</div>
          <div><strong>Passing Marks:</strong> ${r.passing_marks}</div>
          <div><strong>Result Status:</strong> <span class="badge ${r.is_passed ? 'badge-live' : 'badge-cancelled'}">${r.is_passed ? 'PASSED' : 'FAILED'}</span></div>
          <div><strong>Time Taken:</strong> ${r.time_taken_minutes || 0} Minutes</div>
          <div><strong>Submitted:</strong> ${r.submitted_at}</div>
        </div>
      `;
      const modal = document.getElementById('scorecard-modal');
      if (modal) modal.classList.add('active');
    }
  } catch (err) {
    alert('Failed to load scorecard.');
  }
}

// 5. Load Student Academic Profile
async function loadStudentProfile() {
  try {
    const res = await fetch('/api/student/profile');
    const data = await res.json();
    if (!data.success) return;

    const p = data.profile;
    document.getElementById('prof-name').textContent = p.full_name;
    document.getElementById('prof-email').textContent = p.email;
    document.getElementById('prof-roll').textContent = p.roll_number;
    document.getElementById('prof-dept').textContent = p.department_name;
    document.getElementById('prof-sem').textContent = `Semester ${p.semester}`;
    document.getElementById('prof-year').textContent = p.academic_year;
    document.getElementById('prof-phone').textContent = p.phone || 'Not Provided';
  } catch (err) {
    console.error('Error loading profile:', err);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', initStudentPortal);
