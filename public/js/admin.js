/**
 * ExamHub - Administrator Console Controller
 */

let currentAdmin = null;

async function initAdminPortal() {
  currentAdmin = await checkUserSession();
  if (!currentAdmin || currentAdmin.role !== 'Admin') {
    window.location.href = '/login.html';
    return;
  }

  // Update admin user displays
  document.querySelectorAll('.admin-name').forEach(el => el.textContent = currentAdmin.name);
  document.querySelectorAll('.admin-email').forEach(el => el.textContent = currentAdmin.email);

  if (document.getElementById('admin-dashboard-view')) {
    loadAdminDashboard();
  } else if (document.getElementById('admin-schedules-view')) {
    loadAdminSchedulesView();
  } else if (document.getElementById('admin-examinations-view')) {
    loadAdminExamsView();
  } else if (document.getElementById('admin-create-exam-view')) {
    loadAdminCreateExamView();
  } else if (document.getElementById('admin-questions-view')) {
    loadAdminQuestionsView();
  } else if (document.getElementById('admin-students-view')) {
    loadAdminStudentsView();
  } else if (document.getElementById('admin-results-view')) {
    loadAdminResultsView();
  }
}

// --------------------------------------------------------------------------
// 1. Admin Dashboard View
// --------------------------------------------------------------------------
async function loadAdminDashboard() {
  try {
    const res = await fetch('/api/admin/stats');
    const data = await res.json();
    if (!data.success) return;

    const s = data.stats;

    // Metrics
    document.getElementById('stat-total-exams').textContent = s.exams.total || 0;
    document.getElementById('stat-approved-schedules').textContent = s.schedules.scheduled || 0;
    document.getElementById('stat-total-students').textContent = s.students || 0;
    document.getElementById('stat-active-centers').textContent = s.centers.active || 0;

    // Busiest Centers Table (Case Study Query)
    const busiestBody = document.getElementById('busiest-centers-body');
    if (busiestBody && s.busiest_centers) {
      busiestBody.innerHTML = s.busiest_centers.map(c => `
        <tr>
          <td><strong>${escapeHtml(c.center_name)}</strong></td>
          <td>${escapeHtml(c.center_type)}</td>
          <td>${c.capacity} Seats</td>
          <td><span class="badge badge-scheduled">${c.scheduled_count} Shifts</span></td>
        </tr>
      `).join('');
    }

    // Recent Registrations Table
    const recentBody = document.getElementById('recent-students-body');
    if (recentBody && s.recent_students) {
      recentBody.innerHTML = s.recent_students.map(u => `
        <tr>
          <td><strong>${escapeHtml(u.full_name)}</strong></td>
          <td>${escapeHtml(u.student_id)}</td>
          <td>${escapeHtml(u.department_name)}</td>
          <td>Sem ${u.semester}</td>
          <td>${u.registered_at}</td>
        </tr>
      `).join('');
    }

    // Upcoming Schedules
    const upcomingBody = document.getElementById('upcoming-schedules-body');
    if (upcomingBody && s.upcoming_schedules) {
      upcomingBody.innerHTML = s.upcoming_schedules.map(sch => `
        <tr>
          <td><strong>${escapeHtml(sch.exam_title)}</strong></td>
          <td>${escapeHtml(sch.subject_name)}</td>
          <td>${escapeHtml(sch.center_name)}</td>
          <td>${sch.exam_date}</td>
          <td><span style="font-family: monospace;">${sch.start_time} - ${sch.end_time}</span></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading admin dashboard stats:', err);
  }
}

// --------------------------------------------------------------------------
// 2. Schedule Management View (Figure 9.3 Exact Reproduction)
// --------------------------------------------------------------------------
async function loadAdminSchedulesView() {
  const examSelect = document.getElementById('schedule-exam');
  const centerSelect = document.getElementById('schedule-center');
  const schedulesBody = document.getElementById('schedules-table-body');

  try {
    const [examsRes, centersRes] = await Promise.all([
      fetch('/api/exams'),
      fetch('/api/public/centers')
    ]);

    const examsData = await examsRes.json();
    const centersData = await centersRes.json();

    if (examSelect && examsData.exams) {
      examSelect.innerHTML = '<option value="">-- Select Master Examination --</option>' +
        examsData.exams.map(e => `<option value="${e.exam_id}">${escapeHtml(e.title)} (${e.duration_minutes} Mins - ${e.status})</option>`).join('');
    }

    if (centerSelect && centersData.centers) {
      centerSelect.innerHTML = '<option value="">-- Select Examination Center --</option>' +
        centersData.centers.map(c => `<option value="${c.center_id}">${escapeHtml(c.center_name)} (${escapeHtml(c.center_type)} - Cap: ${c.capacity})</option>`).join('');
    }

    // Load Schedules List
    loadSchedulesList();

    // Attach Schedule Form Submit
    const form = document.getElementById('create-schedule-form');
    if (form) {
      form.addEventListener('submit', handleCreateSchedule);
    }
  } catch (err) {
    console.error('Failed to initialize scheduling view:', err);
  }
}

async function loadSchedulesList() {
  const tableBody = document.getElementById('schedules-table-body');
  if (!tableBody) return;

  try {
    const res = await fetch('/api/schedules');
    const data = await res.json();

    if (!data.success || data.schedules.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: #64748b;">No scheduled examination sessions found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = data.schedules.map(s => {
      let badgeClass = 'badge-scheduled';
      if (s.status === 'Cancelled') badgeClass = 'badge-cancelled';

      return `
        <tr>
          <td><strong>${escapeHtml(s.exam_title)}</strong></td>
          <td>${escapeHtml(s.subject_name)}</td>
          <td>${escapeHtml(s.center_name)} (${s.capacity} seats)</td>
          <td>${s.exam_date}</td>
          <td><span style="font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${s.start_time} - ${s.end_time}</span></td>
          <td><span class="badge ${badgeClass}">${s.status}</span></td>
          <td>
            ${s.status !== 'Cancelled' ? `<button class="btn btn-danger btn-sm" onclick="cancelSchedule(${s.schedule_id})">Cancel</button>` : '-'}
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: #ef4444;">Error loading schedules.</td></tr>`;
  }
}

async function handleCreateSchedule(e) {
  e.preventDefault();
  const form = e.target;
  const conflictBanner = document.getElementById('schedule-conflict-banner');
  const successBanner = document.getElementById('schedule-success-banner');
  const submitBtn = form.querySelector('button[type="submit"]');

  if (conflictBanner) conflictBanner.style.display = 'none';
  if (successBanner) successBanner.style.display = 'none';

  const payload = {
    exam_id: form.exam_id.value,
    center_id: form.center_id.value,
    exam_date: form.exam_date.value,
    start_time: form.start_time.value,
    end_time: form.end_time.value
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Enforcing Constraints & Booking...';

  try {
    const res = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      if (conflictBanner) {
        conflictBanner.textContent = data.error || 'Scheduling constraint violation.';
        conflictBanner.style.display = 'block';
        conflictBanner.scrollIntoView({ behavior: 'smooth' });
      }
      submitBtn.disabled = false;
      submitBtn.textContent = 'Schedule Examination';
      return;
    }

    // Success
    if (successBanner) {
      successBanner.textContent = data.message || 'Examination scheduled successfully!';
      successBanner.style.display = 'block';
    }
    form.reset();
    submitBtn.disabled = false;
    submitBtn.textContent = 'Schedule Examination';
    loadSchedulesList();
  } catch (err) {
    if (conflictBanner) {
      conflictBanner.textContent = 'Network or server error while scheduling.';
      conflictBanner.style.display = 'block';
    }
    submitBtn.disabled = false;
    submitBtn.textContent = 'Schedule Examination';
  }
}

async function cancelSchedule(scheduleId) {
  if (!confirm('Are you sure you wish to cancel this scheduled examination session?')) return;

  try {
    const res = await fetch(`/api/schedules/${scheduleId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      loadSchedulesList();
    } else {
      alert(data.error || 'Failed to cancel schedule.');
    }
  } catch (err) {
    alert('Error cancelling schedule.');
  }
}

// --------------------------------------------------------------------------
// 3. Master Examinations View
// --------------------------------------------------------------------------
async function loadAdminExamsView() {
  const tableBody = document.getElementById('admin-exams-table-body');
  if (!tableBody) return;

  try {
    const res = await fetch('/api/exams');
    const data = await res.json();

    if (!data.success || data.exams.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: #64748b;">No master examinations configured yet.</td></tr>`;
      return;
    }

    tableBody.innerHTML = data.exams.map(e => `
      <tr>
        <td>
          <strong>${escapeHtml(e.title)}</strong>
          <div style="font-size: 0.8rem; color: #64748b;">${escapeHtml(e.department_name)} &bull; Sem ${e.semester}</div>
        </td>
        <td>${escapeHtml(e.subject_name)} (${escapeHtml(e.subject_code)})</td>
        <td>${e.duration_minutes} Mins</td>
        <td>${e.total_marks} / Pass: ${e.passing_marks}</td>
        <td><strong>${e.question_count || 0} Questions</strong></td>
        <td><span class="badge ${e.status === 'Published' ? 'badge-published' : 'badge-draft'}">${e.status}</span></td>
        <td>
          <div style="display: flex; gap: 0.5rem;">
            ${e.status !== 'Published' ? `<button class="btn btn-success btn-sm" onclick="publishExam(${e.exam_id})">Publish</button>` : ''}
            <a href="/admin/questions.html?exam_id=${e.exam_id}" class="btn btn-secondary btn-sm">Questions</a>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: #ef4444;">Error loading examinations.</td></tr>`;
  }
}

async function publishExam(examId) {
  if (!confirm('Publishing this examination will automatically enroll and assign all eligible students in the department and semester. Proceed?')) return;

  try {
    const res = await fetch(`/api/exams/${examId}/publish`, { method: 'PUT' });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      loadAdminExamsView();
    } else {
      alert(data.error || 'Failed to publish examination.');
    }
  } catch (err) {
    alert('Error publishing examination.');
  }
}

// --------------------------------------------------------------------------
// 4. Create Examination Form View
// --------------------------------------------------------------------------
async function loadAdminCreateExamView() {
  const deptSelect = document.getElementById('exam-department');
  const subSelect = document.getElementById('exam-subject');
  const form = document.getElementById('create-exam-form');

  try {
    const [deptRes, subRes] = await Promise.all([
      fetch('/api/public/departments'),
      fetch('/api/public/subjects')
    ]);

    const deptData = await deptRes.json();
    const subData = await subRes.json();

    if (deptSelect && deptData.departments) {
      deptSelect.innerHTML = '<option value="">-- Select Department --</option>' +
        deptData.departments.map(d => `<option value="${d.department_id}">${escapeHtml(d.department_name)}</option>`).join('');
    }

    if (subSelect && subData.subjects) {
      subSelect.innerHTML = '<option value="">-- Select Subject --</option>' +
        subData.subjects.map(s => `<option value="${s.subject_id}">${escapeHtml(s.subject_name)} (${s.subject_code})</option>`).join('');
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          title: form.title.value.trim(),
          description: form.description.value.trim(),
          department_id: form.department_id.value,
          subject_id: form.subject_id.value,
          semester: form.semester.value,
          duration_minutes: form.duration_minutes.value,
          total_marks: form.total_marks.value,
          passing_marks: form.passing_marks.value,
          negative_marking: form.negative_marking.value,
          status: form.status.value
        };

        const res = await fetch('/api/exams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
          alert('Examination created successfully! Redirecting to add questions.');
          window.location.href = `/admin/questions.html?exam_id=${data.exam.exam_id}`;
        } else {
          alert(data.error || 'Failed to create examination.');
        }
      });
    }
  } catch (err) {
    console.error('Failed to load exam creation form options:', err);
  }
}

// --------------------------------------------------------------------------
// 5. Questions & Options Management View
// --------------------------------------------------------------------------
async function loadAdminQuestionsView() {
  const urlParams = new URLSearchParams(window.location.search);
  const examId = urlParams.get('exam_id');
  const examSelect = document.getElementById('question-exam-select');

  try {
    const res = await fetch('/api/exams');
    const data = await res.json();

    if (examSelect && data.exams) {
      examSelect.innerHTML = '<option value="">-- Choose Examination to Manage Questions --</option>' +
        data.exams.map(e => `<option value="${e.exam_id}" ${e.exam_id == examId ? 'selected' : ''}>${escapeHtml(e.title)} (${e.question_count || 0} questions)</option>`).join('');

      examSelect.addEventListener('change', () => {
        if (examSelect.value) {
          window.location.href = `/admin/questions.html?exam_id=${examSelect.value}`;
        }
      });
    }

    if (examId) {
      loadExamQuestions(examId);
    }

    const form = document.getElementById('add-question-form');
    if (form && examId) {
      form.addEventListener('submit', (e) => handleAddQuestion(e, examId));
    }
  } catch (err) {
    console.error('Error loading questions view:', err);
  }
}

async function loadExamQuestions(examId) {
  const container = document.getElementById('questions-list-container');
  if (!container) return;

  try {
    const res = await fetch(`/api/exams/${examId}`);
    const data = await res.json();
    if (!data.success) return;

    const exam = data.exam;
    document.getElementById('current-exam-title').textContent = exam.title;

    if (!exam.questions || exam.questions.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding: 2.5rem; color: #64748b; background: #fff; border-radius: 8px;">No questions created yet for this examination. Use the form above to add questions.</div>`;
      return;
    }

    container.innerHTML = exam.questions.map((q, idx) => `
      <div class="table-card" style="margin-bottom: 1.5rem; padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
          <h4 style="font-size: 1.1rem; color: #0f172a;">${idx + 1}. ${escapeHtml(q.question_text)}</h4>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span class="badge badge-scheduled">+${q.marks} Marks ${q.negative_marks > 0 ? `(-${q.negative_marks})` : ''}</span>
            <button class="btn btn-danger btn-sm" onclick="deleteQuestion(${q.question_id}, ${examId})">Delete</button>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          ${(q.options || []).map((opt, i) => `
            <div style="padding: 0.65rem 1rem; border-radius: 6px; border: 1px solid ${opt.is_correct ? '#10b981' : '#e2e8f0'}; background: ${opt.is_correct ? '#ecfdf5' : '#f8fafc'}; font-size: 0.9rem; color: ${opt.is_correct ? '#065f46' : '#334155'};">
              <strong>${String.fromCharCode(65 + i)}.</strong> ${escapeHtml(opt.option_text)}
              ${opt.is_correct ? ' <strong style="color: #10b981;">✓ (Correct)</strong>' : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div style="text-align:center; padding: 2rem; color: #ef4444;">Error loading questions.</div>`;
  }
}

async function handleAddQuestion(e, examId) {
  e.preventDefault();
  const form = e.target;

  const correctRadio = form.querySelector('input[name="correct_option"]:checked');
  if (!correctRadio) {
    alert('Please designate which option is the correct answer.');
    return;
  }
  const correctIndex = parseInt(correctRadio.value, 10);

  const payload = {
    question_text: form.question_text.value.trim(),
    marks: form.marks.value,
    negative_marks: form.negative_marks.value,
    options: [
      { option_text: form.option_1.value.trim(), is_correct: correctIndex === 1 },
      { option_text: form.option_2.value.trim(), is_correct: correctIndex === 2 },
      { option_text: form.option_3.value.trim(), is_correct: correctIndex === 3 },
      { option_text: form.option_4.value.trim(), is_correct: correctIndex === 4 }
    ]
  };

  try {
    const res = await fetch(`/api/exams/${examId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      form.reset();
      loadExamQuestions(examId);
    } else {
      alert(data.error || 'Failed to add question.');
    }
  } catch (err) {
    alert('Error submitting question.');
  }
}

async function deleteQuestion(questionId, examId) {
  if (!confirm('Are you sure you wish to delete this question?')) return;

  try {
    const res = await fetch(`/api/exams/questions/${questionId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      loadExamQuestions(examId);
    } else {
      alert(data.error || 'Failed to delete question.');
    }
  } catch (err) {
    alert('Error deleting question.');
  }
}

// --------------------------------------------------------------------------
// 6. Registered Students Roster View
// --------------------------------------------------------------------------
async function loadAdminStudentsView() {
  const tableBody = document.getElementById('admin-students-table-body');
  if (!tableBody) return;

  try {
    const res = await fetch('/api/admin/students');
    const data = await res.json();

    if (!data.success || data.students.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: #64748b;">No registered students found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = data.students.map(s => `
      <tr>
        <td>
          <strong>${escapeHtml(s.full_name)}</strong>
          <div style="font-size: 0.8rem; color: #64748b;">${escapeHtml(s.email)}</div>
        </td>
        <td><strong>${escapeHtml(s.student_id)}</strong></td>
        <td>${escapeHtml(s.department_name)}</td>
        <td>Semester ${s.semester}</td>
        <td>${s.total_attempts} attempts (${s.passed_exams} passed)</td>
        <td>${s.registered_date}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="openAssignModal(${s.user_id}, '${escapeHtml(s.full_name)}')">Assign Exam</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: #ef4444;">Error loading students roster.</td></tr>`;
  }
}

// --------------------------------------------------------------------------
// 7. Results & Evaluation Review View
// --------------------------------------------------------------------------
async function loadAdminResultsView() {
  const tableBody = document.getElementById('admin-results-table-body');
  if (!tableBody) return;

  try {
    const res = await fetch('/api/admin/results');
    const data = await res.json();

    if (!data.success || data.results.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem; color: #64748b;">No submitted examination attempts to review yet.</td></tr>`;
      return;
    }

    tableBody.innerHTML = data.results.map(r => `
      <tr>
        <td>
          <strong>${escapeHtml(r.student_name)}</strong>
          <div style="font-size: 0.8rem; color: #64748b;">${escapeHtml(r.roll_number)} &bull; ${escapeHtml(r.department_name)}</div>
        </td>
        <td><strong>${escapeHtml(r.exam_title)}</strong></td>
        <td>${r.obtained_marks} / ${r.total_marks}</td>
        <td><strong>${r.percentage}%</strong></td>
        <td>
          <span class="badge ${r.is_passed ? 'badge-live' : 'badge-cancelled'}">
            ${r.is_passed ? 'PASSED' : 'FAILED'}
          </span>
        </td>
        <td>${r.submitted_time}</td>
        <td>
          <span class="badge ${r.is_published ? 'badge-published' : 'badge-draft'}">
            ${r.is_published ? 'Published' : 'Hidden'}
          </span>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="togglePublishResult(${r.result_id})">
            ${r.is_published ? 'Unpublish' : 'Publish to Student'}
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem; color: #ef4444;">Error loading examination results.</td></tr>`;
  }
}

async function togglePublishResult(resultId) {
  try {
    const res = await fetch(`/api/admin/results/${resultId}/publish`, { method: 'PUT' });
    const data = await res.json();
    if (data.success) {
      loadAdminResultsView();
    } else {
      alert(data.error || 'Failed to toggle publication status.');
    }
  } catch (err) {
    alert('Error toggling publication status.');
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

document.addEventListener('DOMContentLoaded', initAdminPortal);
