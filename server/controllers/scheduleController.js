const { pool } = require('../config/database');

/**
 * Schedule a New Examination (Matching Figure 9.3)
 * Enforces PostgreSQL btree_gist Exclusion Constraint on tsrange(start_timestamp, end_timestamp, '[)')
 */
async function createSchedule(req, res, next) {
  const { exam_id, center_id, exam_date, start_time, end_time } = req.body;

  if (!exam_id || !center_id || !exam_date || !start_time || !end_time) {
    return res.status(400).json({
      success: false,
      error: 'Please provide all scheduling fields: Examination, Center, Date, Start Time, and End Time.'
    });
  }

  // Basic format validations
  if (start_time >= end_time) {
    return res.status(400).json({
      success: false,
      error: 'End Time must be strictly later than Start Time.'
    });
  }

  try {
    // 1. Verify exam exists
    const examCheck = await pool.query('SELECT exam_id, title, duration_minutes, status FROM exams WHERE exam_id = $1;', [exam_id]);
    if (examCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Selected examination not found.' });
    }

    // 2. Verify center exists and is active
    const centerCheck = await pool.query('SELECT center_id, center_name, active_status FROM exam_centers WHERE center_id = $1;', [center_id]);
    if (centerCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Selected examination center not found.' });
    }
    if (!centerCheck.rows[0].active_status) {
      return res.status(400).json({ success: false, error: 'The selected examination center is currently inactive.' });
    }

    // 3. Insert schedule - PostgreSQL exclusion constraint will automatically enforce time slot separation per center!
    const insertRes = await pool.query(`
      INSERT INTO schedules (exam_id, center_id, exam_date, start_time, end_time, status)
      VALUES ($1, $2, $3, $4, $5, 'Scheduled')
      RETURNING schedule_id, exam_id, center_id, TO_CHAR(exam_date, 'YYYY-MM-DD') AS exam_date, 
                TO_CHAR(start_time, 'HH24:MI') AS start_time, TO_CHAR(end_time, 'HH24:MI') AS end_time, status;
    `, [exam_id, center_id, exam_date, start_time, end_time]);

    // Audit log
    await pool.query(`
      INSERT INTO audit_logs (user_id, action, details, ip_address)
      VALUES ($1, 'SCHEDULE_CREATE', $2, $3);
    `, [req.session?.user?.id || null, JSON.stringify({ schedule_id: insertRes.rows[0].schedule_id, exam_id, center_id, exam_date, start_time, end_time }), req.ip]);

    return res.status(201).json({
      success: true,
      message: `Examination scheduled successfully at ${centerCheck.rows[0].center_name}.`,
      schedule: insertRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Cancel a Schedule
 */
async function cancelSchedule(req, res, next) {
  const { schedule_id } = req.params;

  try {
    const result = await pool.query(`
      UPDATE schedules
      SET status = 'Cancelled'
      WHERE schedule_id = $1
      RETURNING schedule_id, status;
    `, [schedule_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Schedule not found.' });
    }

    // Audit log
    await pool.query(`
      INSERT INTO audit_logs (user_id, action, details, ip_address)
      VALUES ($1, 'SCHEDULE_CANCEL', $2, $3);
    `, [req.session?.user?.id || null, JSON.stringify({ schedule_id }), req.ip]);

    return res.json({
      success: true,
      message: 'Schedule cancelled successfully.',
      schedule: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all schedules with full relations for Admin management
 */
async function getAllSchedules(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT 
        s.schedule_id,
        s.exam_id,
        e.title AS exam_title,
        s.center_id,
        c.center_name,
        c.center_type,
        c.capacity,
        d.department_name,
        sub.subject_name,
        sub.subject_code,
        TO_CHAR(s.exam_date, 'YYYY-MM-DD') AS exam_date,
        TO_CHAR(s.start_time, 'HH24:MI') AS start_time,
        TO_CHAR(s.end_time, 'HH24:MI') AS end_time,
        s.status
      FROM schedules s
      JOIN exams e ON s.exam_id = e.exam_id
      JOIN exam_centers c ON s.center_id = c.center_id
      JOIN departments d ON e.department_id = d.department_id
      JOIN subjects sub ON e.subject_id = sub.subject_id
      ORDER BY s.exam_date DESC, s.start_time DESC;
    `);

    res.json({ success: true, count: result.rows.length, schedules: result.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createSchedule,
  cancelSchedule,
  getAllSchedules
};
