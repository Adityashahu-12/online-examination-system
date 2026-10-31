/**
 * ExamHub - Public Timetable & Landing Page Controller
 */

// Load Live PostgreSQL Statistics for Landing Page (Figure 9.1)
async function loadPublicStats() {
  try {
    const res = await fetch('/api/public/stats');
    const data = await res.json();
    if (data.success && data.stats) {
      const elStudents = document.getElementById('stat-students');
      const elExams = document.getElementById('stat-exams');
      const elSchedules = document.getElementById('stat-schedules');
      const elCenters = document.getElementById('stat-centers');

      if (elStudents) elStudents.textContent = data.stats.total_students.toLocaleString();
      if (elExams) elExams.textContent = data.stats.total_exams.toLocaleString();
      if (elSchedules) elSchedules.textContent = data.stats.scheduled_exams.toLocaleString();
      if (elCenters) elCenters.textContent = data.stats.total_centers.toLocaleString();
    }
  } catch (err) {
    console.error('Failed to load public statistics:', err);
  }
}

// Load Dropdown Options for Timetable Filters & Registration
async function loadFilterDropdowns() {
  try {
    const [deptRes, centerRes] = await Promise.all([
      fetch('/api/public/departments'),
      fetch('/api/public/centers')
    ]);

    const deptData = await deptRes.json();
    const centerData = await centerRes.json();

    const deptSelect = document.getElementById('filter-department');
    if (deptSelect && deptData.departments) {
      deptData.departments.forEach(dept => {
        const opt = document.createElement('option');
        opt.value = dept.department_name;
        opt.textContent = dept.department_name;
        deptSelect.appendChild(opt);
      });
    }

    const regDeptSelect = document.getElementById('reg-department');
    if (regDeptSelect && deptData.departments) {
      deptData.departments.forEach(dept => {
        const opt = document.createElement('option');
        opt.value = dept.department_id;
        opt.textContent = `${dept.department_name} (${dept.department_code || ''})`;
        regDeptSelect.appendChild(opt);
      });
    }

    const centerSelect = document.getElementById('filter-center');
    if (centerSelect && centerData.centers) {
      centerData.centers.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.center_name;
        opt.textContent = `${c.center_name} (${c.center_type})`;
        centerSelect.appendChild(opt);
      });
    }
  } catch (err) {
    console.error('Failed to load filter dropdowns:', err);
  }
}

// Fetch and Render Public Examination Timetable (Figure 9.2)
async function loadTimetable() {
  const tableBody = document.getElementById('timetable-body');
  const countEl = document.getElementById('timetable-count');
  if (!tableBody) return;

  const search = document.getElementById('filter-search')?.value || '';
  const dept = document.getElementById('filter-department')?.value || '';
  const center = document.getElementById('filter-center')?.value || '';
  const date = document.getElementById('filter-date')?.value || '';

  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (dept) queryParams.set('department', dept);
  if (center) queryParams.set('center', center);
  if (date) queryParams.set('date', date);

  tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2.5rem; color: #64748b;">Loading institutional timetable...</td></tr>`;

  try {
    const res = await fetch(`/api/public/timetable?${queryParams.toString()}`);
    const data = await res.json();

    if (!data.success || data.timetable.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2.5rem; color: #64748b;">No scheduled examinations found matching your criteria.</td></tr>`;
      if (countEl) countEl.textContent = '0 examinations';
      return;
    }

    if (countEl) countEl.textContent = `${data.count} examination${data.count === 1 ? '' : 's'}`;

    tableBody.innerHTML = data.timetable.map(row => {
      let badgeClass = 'badge-scheduled';
      if (row.status === 'Live') badgeClass = 'badge-live';
      if (row.status === 'Completed') badgeClass = 'badge-completed';
      if (row.status === 'Cancelled') badgeClass = 'badge-cancelled';

      return `
        <tr>
          <td>
            <strong>${escapeHtml(row.exam_title)}</strong>
            <div style="font-size: 0.8rem; color: #64748b;">${escapeHtml(row.subject_code || '')} &bull; ${row.duration_minutes} Mins</div>
          </td>
          <td>${escapeHtml(row.subject_name)}</td>
          <td>${escapeHtml(row.department_name)}</td>
          <td>
            <div style="font-weight: 600;">${escapeHtml(row.center_name)}</div>
            <div style="font-size: 0.75rem; color: #64748b;">${escapeHtml(row.center_type)}</div>
          </td>
          <td>
            <span style="font-weight: 600;">${row.exam_date}</span>
          </td>
          <td>
            <span style="font-family: monospace; font-size: 0.85rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">
              ${row.start_time} - ${row.end_time}
            </span>
          </td>
          <td>
            <span class="badge ${badgeClass}">${escapeHtml(row.status)}</span>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2.5rem; color: #ef4444;">Error retrieving examination timetable.</td></tr>`;
  }
}

// Security: Basic HTML escaping helper
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initializers
document.addEventListener('DOMContentLoaded', () => {
  loadPublicStats();
  loadFilterDropdowns();
  loadTimetable();

  // Attach search and filter events
  const searchInput = document.getElementById('filter-search');
  const deptSelect = document.getElementById('filter-department');
  const centerSelect = document.getElementById('filter-center');
  const dateInput = document.getElementById('filter-date');
  const resetBtn = document.getElementById('filter-reset');

  if (searchInput) searchInput.addEventListener('input', debounce(loadTimetable, 300));
  if (deptSelect) deptSelect.addEventListener('change', loadTimetable);
  if (centerSelect) centerSelect.addEventListener('change', loadTimetable);
  if (dateInput) dateInput.addEventListener('change', loadTimetable);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (deptSelect) deptSelect.value = '';
      if (centerSelect) centerSelect.value = '';
      if (dateInput) dateInput.value = '';
      loadTimetable();
    });
  }
});

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
