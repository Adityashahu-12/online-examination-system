const { pool } = require('../config/database');

/**
 * Admin Dashboard Comprehensive Analytics (Case Study KPIs & Reports)
 */
async function getAdminStats(req, res, next) {
  try {
    const [
      examsCount,
      schedulesCount,
      studentsCount,
      centersCount,
      questionsCount,
      resultsCount,
      busiestCenters,
      deptCounts,
      recentRegs,
      upcomingExams
    ] = await Promise.all([
      // 1. Exam status counts
      pool.query(`
        SELECT 
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'Published') AS published,
          COUNT(*) FILTER (WHERE status = 'Draft') AS draft,
          COUNT(*) FILTER (WHERE status = 'Archived') AS archived
        FROM exams;
      `),
      // 2. Schedules status counts
      pool.query(`
        SELECT 
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'Scheduled') AS scheduled,
          COUNT(*) FILTER (WHERE status = 'Live') AS live,
          COUNT(*) FILTER (WHERE status = 'Completed') AS completed,
          COUNT(*) FILTER (WHERE status = 'Cancelled') AS cancelled
        FROM schedules;
      `),
      // 3. Students count
      pool.query('SELECT COUNT(*) AS total FROM student_profiles;'),
      // 4. Centers count
      pool.query('SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE active_status = TRUE) AS active FROM exam_centers;'),
      // 5. Total questions
      pool.query('SELECT COUNT(*) AS total FROM questions;'),
      // 6. Total attempts & results
      pool.query(`
        SELECT 
          COUNT(*) AS total_attempts,
          COUNT(*) FILTER (WHERE status = 'Submitted') AS submitted,
          COUNT(*) FILTER (WHERE is_passed = TRUE) AS passed
        FROM exam_attempts;
      `),
      // 7. Case Study Analytics Query: Busiest Exam Centers
      pool.query(`
        SELECT c.center_name, c.center_type, c.capacity, COUNT(s.schedule_id) AS scheduled_count
        FROM exam_centers c
        LEFT JOIN schedules s ON c.center_id = s.center_id AND s.status != 'Cancelled'
        GROUP BY c.center_id, c.center_name, c.center_type, c.capacity
        ORDER BY scheduled_count DESC, c.center_name ASC
        LIMIT 5;
      `),
      // 8. Department-wise student breakdown
      pool.query(`
        SELECT d.department_name, d.department_code, COUNT(sp.profile_id) AS student_count
        FROM departments d
        LEFT JOIN student_profiles sp ON d.department_id = sp.department_id
        GROUP BY d.department_id, d.department_name, d.department_code
        ORDER BY student_count DESC;
      `),
      // 9. Recent student registrations
      pool.query(`
        SELECT u.full_name, u.email, sp.student_id, d.department_name, sp.semester, TO_CHAR(sp.created_at, 'YYYY-MM-DD HH24:MI') AS registered_at
        FROM student_profiles sp
        JOIN users u ON sp.user_id = u.user_id
        JOIN departments d ON sp.department_id = d.department_id
        ORDER BY sp.created_at DESC
        LIMIT 6;
      `),
      // 10. Upcoming examinations
      pool.query(`
        SELECT s.schedule_id, e.title AS exam_title, sub.subject_name, c.center_name,
               TO_CHAR(s.exam_date, 'YYYY-MM-DD') AS exam_date,
               TO_CHAR(s.start_time, 'HH24:MI') AS start_time,
               TO_CHAR(s.end_time, 'HH24:MI') AS end_time,
               s.status
        FROM schedules s
        JOIN exams e ON s.exam_id = e.exam_id
        JOIN subjects sub ON e.subject_id = sub.subject_id
        JOIN exam_centers c ON s.center_id = c.center_id
        WHERE s.status = 'Scheduled'
        ORDER BY s.exam_date ASC, s.start_time ASC
        LIMIT 5;
      `)
    ]);

    res.json({
      success: true,
      stats: {
        exams: examsCount.rows[0],
        schedules: schedulesCount.rows[0],
        students: studentsCount.rows[0].total,
        centers: centersCount.rows[0],
        questions: questionsCount.rows[0].total,
        attempts: resultsCount.rows[0],
        busiest_centers: busiestCenters.rows,
        department_breakdown: deptCounts.rows,
        recent_students: recentRegs.rows,
        upcoming_schedules: upcomingExams.rows
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create Master Examination
 */
async function createExam(req, res, next) {
  const {
    title, description, department_id, subject_id, semester,
    duration_minutes, total_marks, passing_marks, negative_marking, status
  } = req.body;

  if (!title || !department_id || !subject_id || !duration_minutes) {
    return res.status(400).json({ success: false, error: 'Please provide Title, Department, Subject, and Duration.' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO exams (
        title, description, department_id, subject_id, semester,
        duration_minutes, total_marks, passing_marks, negative_marking, status, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `, [
      title.trim(),
      description ? description.trim() : 'Institutional Standardized Examination',
      parseInt(department_id, 10),
      parseInt(subject_id, 10),
      parseInt(semester, 10) || 5,
      parseInt(duration_minutes, 10),
      parseFloat(total_marks) || 100.00,
      parseFloat(passing_marks) || 40.00,
      parseFloat(negative_marking) || 0.00,
      status || 'Draft',
      req.session?.user?.id || null
    ]);

    // If created as Published, auto-assign to students
    if (result.rows[0].status === 'Published') {
      await pool.query(`
        INSERT INTO exam_assignments (exam_id, student_id)
        SELECT $1, sp.user_id
        FROM student_profiles sp
        WHERE sp.department_id = $2 AND sp.semester = $3
        ON CONFLICT DO NOTHING;
      `, [result.rows[0].exam_id, result.rows[0].department_id, result.rows[0].semester]);
    }

    res.status(201).json({
      success: true,
      message: 'Examination created successfully.',
      exam: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all examinations
 */
async function getExams(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT 
        e.exam_id,
        e.title,
        e.description,
        e.department_id,
        d.department_name,
        e.subject_id,
        s.subject_name,
        s.subject_code,
        e.semester,
        e.duration_minutes,
        e.total_marks,
        e.passing_marks,
        e.negative_marking,
        e.status,
        COUNT(q.question_id) AS question_count,
        TO_CHAR(e.created_at, 'YYYY-MM-DD') AS created_date
      FROM exams e
      JOIN departments d ON e.department_id = d.department_id
      JOIN subjects s ON e.subject_id = s.subject_id
      LEFT JOIN questions q ON e.exam_id = q.exam_id
      GROUP BY e.exam_id, d.department_name, s.subject_name, s.subject_code
      ORDER BY e.created_at DESC;
    `);

    res.json({ success: true, count: result.rows.length, exams: result.rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Get single examination details with questions & options
 */
async function getExamDetails(req, res, next) {
  const { exam_id } = req.params;

  try {
    const examRes = await pool.query(`
      SELECT e.*, d.department_name, s.subject_name, s.subject_code
      FROM exams e
      JOIN departments d ON e.department_id = d.department_id
      JOIN subjects s ON e.subject_id = s.subject_id
      WHERE e.exam_id = $1;
    `, [exam_id]);

    if (examRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Examination not found.' });
    }

    const exam = examRes.rows[0];

    const questionsRes = await pool.query(`
      SELECT q.question_id, q.question_text, q.marks, q.negative_marks, q.question_order,
             json_agg(json_build_object(
               'option_id', o.option_id,
               'option_text', o.option_text,
               'is_correct', o.is_correct,
               'option_order', o.option_order
             ) ORDER BY o.option_order ASC) AS options
      FROM questions q
      LEFT JOIN question_options o ON q.question_id = o.question_id
      WHERE q.exam_id = $1
      GROUP BY q.question_id
      ORDER BY q.question_order ASC, q.question_id ASC;
    `, [exam_id]);

    exam.questions = questionsRes.rows;

    res.json({ success: true, exam });
  } catch (err) {
    next(err);
  }
}

/**
 * Publish Examination & Auto-assign to Eligible Department/Semester Students
 */
async function publishExam(req, res, next) {
  const { exam_id } = req.params;

  try {
    const updateRes = await pool.query(`
      UPDATE exams
      SET status = 'Published'
      WHERE exam_id = $1
      RETURNING *;
    `, [exam_id]);

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Examination not found.' });
    }

    const exam = updateRes.rows[0];

    // Assign to students in same department and semester
    const assignRes = await pool.query(`
      INSERT INTO exam_assignments (exam_id, student_id)
      SELECT $1, sp.user_id
      FROM student_profiles sp
      WHERE sp.department_id = $2 AND sp.semester = $3
      ON CONFLICT DO NOTHING
      RETURNING assignment_id;
    `, [exam.exam_id, exam.department_id, exam.semester]);

    res.json({
      success: true,
      message: `Examination published successfully and assigned to ${assignRes.rowCount} eligible students.`,
      exam
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Add Question with Options to Exam
 */
async function addQuestion(req, res, next) {
  const { exam_id } = req.params;
  const { question_text, marks, negative_marks, options } = req.body;

  if (!question_text || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ success: false, error: 'Question must have text and at least 2 options.' });
  }

  const hasCorrect = options.some(opt => opt.is_correct === true);
  if (!hasCorrect) {
    return res.status(400).json({ success: false, error: 'At least one option must be marked as correct answer.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get next order
    const orderRes = await client.query('SELECT COALESCE(MAX(question_order), 0) + 1 AS next_order FROM questions WHERE exam_id = $1;', [exam_id]);
    const nextOrder = orderRes.rows[0].next_order;

    // Insert Question
    const qRes = await client.query(`
      INSERT INTO questions (exam_id, question_text, marks, negative_marks, question_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING question_id, question_text, marks, negative_marks, question_order;
    `, [exam_id, question_text.trim(), parseFloat(marks) || 1.00, parseFloat(negative_marks) || 0.00, nextOrder]);

    const questionId = qRes.rows[0].question_id;

    // Insert Options
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      await client.query(`
        INSERT INTO question_options (question_id, option_text, is_correct, option_order)
        VALUES ($1, $2, $3, $4);
      `, [questionId, opt.option_text.trim(), Boolean(opt.is_correct), i + 1]);
    }

    // Update total questions count in exam
    await client.query(`
      UPDATE exams
      SET total_questions = (SELECT COUNT(*) FROM questions WHERE exam_id = $1)
      WHERE exam_id = $1;
    `, [exam_id]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Question added successfully to examination.',
      question_id: questionId
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * Delete Question
 */
async function deleteQuestion(req, res, next) {
  const { question_id } = req.params;

  try {
    const qCheck = await pool.query('SELECT exam_id FROM questions WHERE question_id = $1;', [question_id]);
    if (qCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Question not found.' });
    }

    const examId = qCheck.rows[0].exam_id;
    await pool.query('DELETE FROM questions WHERE question_id = $1;', [question_id]);

    // Update count in exam
    await pool.query(`
      UPDATE exams
      SET total_questions = (SELECT COUNT(*) FROM questions WHERE exam_id = $1)
      WHERE exam_id = $1;
    `, [examId]);

    res.json({ success: true, message: 'Question deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Students List with Academic Details
 */
async function getStudents(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT 
        u.user_id,
        u.full_name,
        u.email,
        u.is_active,
        sp.student_id,
        d.department_name,
        d.department_code,
        sp.semester,
        sp.academic_year,
        sp.phone,
        COUNT(ea.attempt_id) AS total_attempts,
        COUNT(ea.attempt_id) FILTER (WHERE ea.is_passed = TRUE) AS passed_exams,
        TO_CHAR(sp.created_at, 'YYYY-MM-DD') AS registered_date
      FROM users u
      JOIN student_profiles sp ON u.user_id = sp.user_id
      JOIN departments d ON sp.department_id = d.department_id
      LEFT JOIN exam_attempts ea ON u.user_id = ea.student_id
      GROUP BY u.user_id, sp.profile_id, d.department_name, d.department_code
      ORDER BY sp.student_id ASC;
    `);

    res.json({ success: true, count: result.rows.length, students: result.rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Assign Exam to a Specific Student or Department
 */
async function assignExam(req, res, next) {
  const { exam_id, student_id, department_id, semester } = req.body;

  if (!exam_id) {
    return res.status(400).json({ success: false, error: 'Examination ID is required.' });
  }

  try {
    let assignedCount = 0;

    if (student_id) {
      // Assign to single student
      const resSingle = await pool.query(`
        INSERT INTO exam_assignments (exam_id, student_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        RETURNING assignment_id;
      `, [exam_id, student_id]);
      assignedCount = resSingle.rowCount;
    } else if (department_id) {
      // Bulk assign to department & semester
      let query = `
        INSERT INTO exam_assignments (exam_id, student_id)
        SELECT $1, sp.user_id
        FROM student_profiles sp
        WHERE sp.department_id = $2
      `;
      const params = [exam_id, department_id];
      if (semester) {
        query += ` AND sp.semester = $3`;
        params.push(semester);
      }
      query += ` ON CONFLICT DO NOTHING RETURNING assignment_id;`;

      const resBulk = await pool.query(query, params);
      assignedCount = resBulk.rowCount;
    }

    res.json({
      success: true,
      message: `Examination successfully assigned to ${assignedCount} student(s).`,
      count: assignedCount
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get All Results for Administration
 */
async function getAllResults(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT 
        r.result_id,
        r.attempt_id,
        u.full_name AS student_name,
        sp.student_id AS roll_number,
        d.department_name,
        e.title AS exam_title,
        sub.subject_name,
        r.total_marks,
        r.obtained_marks,
        r.percentage,
        r.is_passed,
        r.is_published,
        TO_CHAR(ea.submitted_at, 'YYYY-MM-DD HH24:MI') AS submitted_time
      FROM results r
      JOIN exam_attempts ea ON r.attempt_id = ea.attempt_id
      JOIN users u ON r.student_id = u.user_id
      JOIN student_profiles sp ON u.user_id = sp.user_id
      JOIN departments d ON sp.department_id = d.department_id
      JOIN exams e ON r.exam_id = e.exam_id
      JOIN subjects sub ON e.subject_id = sub.subject_id
      ORDER BY ea.submitted_at DESC;
    `);

    res.json({ success: true, count: result.rows.length, results: result.rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Toggle Publish Result
 */
async function togglePublishResult(req, res, next) {
  const { result_id } = req.params;

  try {
    const result = await pool.query(`
      UPDATE results
      SET is_published = NOT is_published,
          published_at = CASE WHEN is_published = FALSE THEN CURRENT_TIMESTAMP ELSE NULL END
      WHERE result_id = $1
      RETURNING result_id, is_published;
    `, [result_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Result not found.' });
    }

    res.json({
      success: true,
      message: `Result is now ${result.rows[0].is_published ? 'Published to student' : 'Unpublished'}.`,
      result: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAdminStats,
  createExam,
  getExams,
  getExamDetails,
  publishExam,
  addQuestion,
  deleteQuestion,
  getStudents,
  assignExam,
  getAllResults,
  togglePublishResult
};
