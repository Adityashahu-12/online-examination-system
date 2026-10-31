const { pool } = require('../config/database');

/**
 * Public Portal Stats for Landing Page (Figure 9.1)
 */
async function getPublicStats(req, res, next) {
  try {
    const [studentsRes, examsRes, schedulesRes, centersRes] = await Promise.all([
      pool.query('SELECT COUNT(*) AS count FROM student_profiles;'),
      pool.query('SELECT COUNT(*) AS count FROM exams;'),
      pool.query("SELECT COUNT(*) AS count FROM schedules WHERE status != 'Cancelled';"),
      pool.query('SELECT COUNT(*) AS count FROM exam_centers WHERE active_status = TRUE;')
    ]);

    res.json({
      success: true,
      stats: {
        total_students: parseInt(studentsRes.rows[0].count, 10),
        total_exams: parseInt(examsRes.rows[0].count, 10),
        scheduled_exams: parseInt(schedulesRes.rows[0].count, 10),
        total_centers: parseInt(centersRes.rows[0].count, 10)
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Public Examination Timetable (Figure 9.2)
 */
async function getPublicTimetable(req, res, next) {
  try {
    const { search, department, center, subject, date, status } = req.query;

    let queryText = `
      SELECT 
        schedule_id,
        exam_id,
        exam_title,
        subject_name,
        subject_code,
        department_name,
        center_name,
        center_type,
        TO_CHAR(exam_date, 'YYYY-MM-DD') AS exam_date,
        TO_CHAR(start_time, 'HH24:MI') AS start_time,
        TO_CHAR(end_time, 'HH24:MI') AS end_time,
        status,
        duration_minutes,
        total_questions,
        total_marks
      FROM exam_schedule_view
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (search && search.trim()) {
      queryText += ` AND (exam_title ILIKE $${paramIndex} OR subject_name ILIKE $${paramIndex} OR center_name ILIKE $${paramIndex} OR department_name ILIKE $${paramIndex})`;
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (department) {
      queryText += ` AND department_name = $${paramIndex}`;
      params.push(department);
      paramIndex++;
    }

    if (center) {
      queryText += ` AND center_name = $${paramIndex}`;
      params.push(center);
      paramIndex++;
    }

    if (subject) {
      queryText += ` AND (subject_name = $${paramIndex} OR subject_code = $${paramIndex})`;
      params.push(subject);
      paramIndex++;
    }

    if (date) {
      queryText += ` AND exam_date = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }

    if (status) {
      queryText += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    queryText += ` ORDER BY exam_date ASC, start_time ASC;`;

    const result = await pool.query(queryText, params);
    res.json({
      success: true,
      count: result.rows.length,
      timetable: result.rows
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Public lookup for departments
 */
async function getDepartments(req, res, next) {
  try {
    const result = await pool.query('SELECT department_id, department_name, department_code FROM departments ORDER BY department_name ASC;');
    res.json({ success: true, departments: result.rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Public lookup for subjects
 */
async function getSubjects(req, res, next) {
  try {
    const result = await pool.query('SELECT subject_id, subject_name, subject_code FROM subjects ORDER BY subject_name ASC;');
    res.json({ success: true, subjects: result.rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Public lookup for examination centers
 */
async function getCenters(req, res, next) {
  try {
    const result = await pool.query('SELECT center_id, center_name, center_type, capacity FROM exam_centers WHERE active_status = TRUE ORDER BY center_name ASC;');
    res.json({ success: true, centers: result.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPublicStats,
  getPublicTimetable,
  getDepartments,
  getSubjects,
  getCenters
};
