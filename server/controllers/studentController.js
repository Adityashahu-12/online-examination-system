const { pool } = require('../config/database');

/**
 * Student Dashboard Overview
 */
async function getStudentDashboard(req, res, next) {
  const studentUserId = req.session.user.id;

  try {
    const [profileRes, assignedRes, attemptsRes, upcomingRes, resultsRes] = await Promise.all([
      // 1. Profile details
      pool.query(`
        SELECT u.user_id, u.full_name, u.email, sp.student_id, d.department_name, d.department_code, sp.semester, sp.academic_year
        FROM users u
        JOIN student_profiles sp ON u.user_id = sp.user_id
        JOIN departments d ON sp.department_id = d.department_id
        WHERE u.user_id = $1;
      `, [studentUserId]),

      // 2. Assigned active/published exams
      pool.query(`
        SELECT 
          e.exam_id,
          e.title,
          e.description,
          s.subject_name,
          s.subject_code,
          e.duration_minutes,
          e.total_questions,
          e.total_marks,
          e.passing_marks,
          ea.attempt_id,
          COALESCE(ea.status, 'Not Started') AS attempt_status,
          ea.score,
          ea.is_passed
        FROM exam_assignments asn
        JOIN exams e ON asn.exam_id = e.exam_id
        JOIN subjects s ON e.subject_id = s.subject_id
        LEFT JOIN exam_attempts ea ON e.exam_id = ea.exam_id AND ea.student_id = $1
        WHERE asn.student_id = $1 AND e.status = 'Published'
        ORDER BY e.created_at DESC;
      `, [studentUserId]),

      // 3. Count summary
      pool.query(`
        SELECT 
          COUNT(DISTINCT asn.exam_id) AS total_assigned,
          COUNT(DISTINCT ea.attempt_id) FILTER (WHERE ea.status = 'Submitted') AS total_completed,
          COUNT(DISTINCT ea.attempt_id) FILTER (WHERE ea.is_passed = TRUE) AS total_passed
        FROM exam_assignments asn
        LEFT JOIN exam_attempts ea ON asn.exam_id = ea.exam_id AND ea.student_id = $1
        WHERE asn.student_id = $1;
      `, [studentUserId]),

      // 4. Upcoming scheduled exams for this student
      pool.query(`
        SELECT 
          sch.schedule_id,
          e.exam_id,
          e.title AS exam_title,
          sub.subject_name,
          c.center_name,
          c.center_type,
          TO_CHAR(sch.exam_date, 'YYYY-MM-DD') AS exam_date,
          TO_CHAR(sch.start_time, 'HH24:MI') AS start_time,
          TO_CHAR(sch.end_time, 'HH24:MI') AS end_time,
          sch.status,
          ea.status AS attempt_status
        FROM exam_assignments asn
        JOIN exams e ON asn.exam_id = e.exam_id
        JOIN subjects sub ON e.subject_id = sub.subject_id
        JOIN schedules sch ON e.exam_id = sch.exam_id
        JOIN exam_centers c ON sch.center_id = c.center_id
        LEFT JOIN exam_attempts ea ON e.exam_id = ea.exam_id AND ea.student_id = $1
        WHERE asn.student_id = $1 AND sch.status = 'Scheduled'
        ORDER BY sch.exam_date ASC, sch.start_time ASC
        LIMIT 5;
      `, [studentUserId]),

      // 5. Recent published results
      pool.query(`
        SELECT 
          r.result_id,
          e.title AS exam_title,
          sub.subject_name,
          r.total_marks,
          r.obtained_marks,
          r.percentage,
          r.is_passed,
          TO_CHAR(ea.submitted_at, 'YYYY-MM-DD') AS submission_date
        FROM results r
        JOIN exam_attempts ea ON r.attempt_id = ea.attempt_id
        JOIN exams e ON r.exam_id = e.exam_id
        JOIN subjects sub ON e.subject_id = sub.subject_id
        WHERE r.student_id = $1 AND r.is_published = TRUE
        ORDER BY ea.submitted_at DESC
        LIMIT 5;
      `, [studentUserId])
    ]);

    res.json({
      success: true,
      profile: profileRes.rows[0] || req.session.user,
      summary: attemptsRes.rows[0],
      assigned_exams: assignedRes.rows,
      upcoming_schedules: upcomingRes.rows,
      recent_results: resultsRes.rows
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Available Exams with live eligibility & schedule status
 */
async function getAvailableExams(req, res, next) {
  const studentUserId = req.session.user.id;

  try {
    const result = await pool.query(`
      SELECT 
        e.exam_id,
        e.title,
        e.description,
        sub.subject_name,
        sub.subject_code,
        d.department_name,
        e.semester,
        e.duration_minutes,
        e.total_questions,
        e.total_marks,
        e.passing_marks,
        e.negative_marking,
        ea.attempt_id,
        COALESCE(ea.status, 'Not Started') AS attempt_status,
        ea.start_time AS attempt_start_time,
        ea.score,
        ea.is_passed,
        (
          SELECT json_build_object(
            'schedule_id', s.schedule_id,
            'exam_date', TO_CHAR(s.exam_date, 'YYYY-MM-DD'),
            'start_time', TO_CHAR(s.start_time, 'HH24:MI'),
            'end_time', TO_CHAR(s.end_time, 'HH24:MI'),
            'center_name', c.center_name,
            'status', s.status
          )
          FROM schedules s
          JOIN exam_centers c ON s.center_id = c.center_id
          WHERE s.exam_id = e.exam_id AND s.status != 'Cancelled'
          ORDER BY s.exam_date ASC, s.start_time ASC
          LIMIT 1
        ) AS schedule_info
      FROM exam_assignments asn
      JOIN exams e ON asn.exam_id = e.exam_id
      JOIN subjects sub ON e.subject_id = sub.subject_id
      JOIN departments d ON e.department_id = d.department_id
      LEFT JOIN exam_attempts ea ON e.exam_id = ea.exam_id AND ea.student_id = $1
      WHERE asn.student_id = $1 AND e.status = 'Published'
      ORDER BY e.created_at DESC;
    `, [studentUserId]);

    res.json({ success: true, count: result.rows.length, exams: result.rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Published Results for Student
 */
async function getStudentResults(req, res, next) {
  const studentUserId = req.session.user.id;

  try {
    const result = await pool.query(`
      SELECT 
        r.result_id,
        r.attempt_id,
        e.title AS exam_title,
        sub.subject_name,
        sub.subject_code,
        d.department_name,
        r.total_marks,
        r.obtained_marks,
        r.percentage,
        r.is_passed,
        r.is_published,
        TO_CHAR(ea.start_time, 'YYYY-MM-DD HH24:MI') AS started_at,
        TO_CHAR(ea.submitted_at, 'YYYY-MM-DD HH24:MI') AS submitted_at
      FROM results r
      JOIN exam_attempts ea ON r.attempt_id = ea.attempt_id
      JOIN exams e ON r.exam_id = e.exam_id
      JOIN subjects sub ON e.subject_id = sub.subject_id
      JOIN departments d ON e.department_id = d.department_id
      WHERE r.student_id = $1 AND r.is_published = TRUE
      ORDER BY ea.submitted_at DESC;
    `, [studentUserId]);

    res.json({ success: true, count: result.rows.length, results: result.rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Student Academic Profile
 */
async function getStudentProfile(req, res, next) {
  const studentUserId = req.session.user.id;

  try {
    const result = await pool.query(`
      SELECT 
        u.user_id,
        u.full_name,
        u.email,
        sp.student_id AS roll_number,
        d.department_name,
        d.department_code,
        sp.semester,
        sp.academic_year,
        sp.phone,
        TO_CHAR(u.created_at, 'YYYY-MM-DD') AS member_since
      FROM users u
      JOIN student_profiles sp ON u.user_id = sp.user_id
      JOIN departments d ON sp.department_id = d.department_id
      WHERE u.user_id = $1;
    `, [studentUserId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }

    res.json({ success: true, profile: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStudentDashboard,
  getAvailableExams,
  getStudentResults,
  getStudentProfile
};
