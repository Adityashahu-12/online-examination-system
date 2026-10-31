const { pool } = require('../config/database');

/**
 * Start or Resume an Examination
 * Computes genuine server-side remaining time based on attempt start_time and duration.
 * Strips out 'is_correct' field from options so students cannot cheat!
 */
async function startExam(req, res, next) {
  const studentUserId = req.session.user.id;
  const { exam_id } = req.params;

  try {
    // 1. Verify Exam exists and is Published
    const examRes = await pool.query(`
      SELECT e.*, s.subject_name, s.subject_code, d.department_name
      FROM exams e
      JOIN subjects s ON e.subject_id = s.subject_id
      JOIN departments d ON e.department_id = d.department_id
      WHERE e.exam_id = $1 AND e.status = 'Published';
    `, [exam_id]);

    if (examRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Examination not found or not published.' });
    }

    const exam = examRes.rows[0];

    // 2. Verify student is assigned
    const assignCheck = await pool.query(`
      SELECT assignment_id FROM exam_assignments
      WHERE exam_id = $1 AND student_id = $2;
    `, [exam_id, studentUserId]);

    if (assignCheck.rows.length === 0) {
      return res.status(403).json({ success: false, error: 'You are not eligible or assigned to take this examination.' });
    }

    // 3. Check for existing attempt
    let attemptRes = await pool.query(`
      SELECT attempt_id, start_time, end_time, status, score, percentage, is_passed
      FROM exam_attempts
      WHERE exam_id = $1 AND student_id = $2;
    `, [exam_id, studentUserId]);

    let attempt;
    const now = new Date();

    if (attemptRes.rows.length > 0) {
      attempt = attemptRes.rows[0];

      if (attempt.status === 'Submitted') {
        return res.status(400).json({
          success: false,
          error: 'You have already completed and submitted this examination.',
          attempt_id: attempt.attempt_id,
          status: 'Submitted'
        });
      }
    } else {
      // Create new attempt
      const newAttemptRes = await pool.query(`
        INSERT INTO exam_attempts (exam_id, student_id, start_time, status)
        VALUES ($1, $2, CURRENT_TIMESTAMP, 'In Progress')
        RETURNING attempt_id, start_time, status;
      `, [exam_id, studentUserId]);

      attempt = newAttemptRes.rows[0];

      // Audit log attempt start
      await pool.query(`
        INSERT INTO audit_logs (user_id, action, details, ip_address)
        VALUES ($1, 'EXAM_ATTEMPT_START', $2, $3);
      `, [studentUserId, JSON.stringify({ exam_id, attempt_id: attempt.attempt_id }), req.ip]);
    }

    // 4. Calculate Genuine Server-Side Remaining Time
    const startTime = new Date(attempt.start_time);
    const durationSeconds = exam.duration_minutes * 60;
    const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

    // If time has completely expired while away, auto-submit or return expired
    if (remainingSeconds <= 0 && attempt.status === 'In Progress') {
      return await autoSubmitExpiredExam(attempt.attempt_id, req, res, next);
    }

    // 5. Fetch Questions and Options (STRICTLY WITHOUT is_correct)
    const questionsRes = await pool.query(`
      SELECT 
        q.question_id,
        q.question_text,
        q.marks,
        q.negative_marks,
        q.question_order,
        json_agg(json_build_object(
          'option_id', o.option_id,
          'option_text', o.option_text,
          'option_order', o.option_order
        ) ORDER BY o.option_order ASC) AS options
      FROM questions q
      JOIN question_options o ON q.question_id = o.question_id
      WHERE q.exam_id = $1
      GROUP BY q.question_id
      ORDER BY q.question_order ASC, q.question_id ASC;
    `, [exam_id]);

    // 6. Fetch existing student answers for this attempt
    const answersRes = await pool.query(`
      SELECT question_id, selected_option_id, is_marked_for_review
      FROM student_answers
      WHERE attempt_id = $1;
    `, [attempt.attempt_id]);

    const studentAnswersMap = {};
    answersRes.rows.forEach(ans => {
      studentAnswersMap[ans.question_id] = {
        selected_option_id: ans.selected_option_id,
        is_marked_for_review: ans.is_marked_for_review
      };
    });

    res.json({
      success: true,
      attempt_id: attempt.attempt_id,
      exam: {
        exam_id: exam.exam_id,
        title: exam.title,
        description: exam.description,
        subject_name: exam.subject_name,
        subject_code: exam.subject_code,
        department_name: exam.department_name,
        duration_minutes: exam.duration_minutes,
        total_questions: questionsRes.rows.length,
        total_marks: exam.total_marks,
        passing_marks: exam.passing_marks,
        negative_marking: exam.negative_marking
      },
      timing: {
        server_time: now.toISOString(),
        start_time: startTime.toISOString(),
        duration_seconds: durationSeconds,
        elapsed_seconds: elapsedSeconds,
        remaining_seconds: remainingSeconds
      },
      questions: questionsRes.rows,
      saved_answers: studentAnswersMap
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Save / Update Single Answer in Real Time
 */
async function saveAnswer(req, res, next) {
  const studentUserId = req.session.user.id;
  const { attempt_id, question_id, selected_option_id, is_marked_for_review } = req.body;

  if (!attempt_id || !question_id) {
    return res.status(400).json({ success: false, error: 'attempt_id and question_id are required.' });
  }

  try {
    // 1. Verify attempt belongs to user and is In Progress
    const attemptRes = await pool.query(`
      SELECT ea.attempt_id, ea.start_time, ea.status, e.duration_minutes
      FROM exam_attempts ea
      JOIN exams e ON ea.exam_id = e.exam_id
      WHERE ea.attempt_id = $1 AND ea.student_id = $2;
    `, [attempt_id, studentUserId]);

    if (attemptRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Exam attempt not found or unauthorized.' });
    }

    const attempt = attemptRes.rows[0];
    if (attempt.status !== 'In Progress') {
      return res.status(400).json({ success: false, error: `Examination is already ${attempt.status}. Answers cannot be modified.` });
    }

    // 2. Check if server time has expired
    const startTime = new Date(attempt.start_time);
    const maxEndTime = new Date(startTime.getTime() + (attempt.duration_minutes * 60 + 30) * 1000); // 30 sec grace for network latency
    if (new Date() > maxEndTime) {
      return res.status(400).json({ success: false, error: 'Examination time has expired.', timed_out: true });
    }

    // 3. Upsert into student_answers
    await pool.query(`
      INSERT INTO student_answers (attempt_id, question_id, selected_option_id, is_marked_for_review, answered_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (attempt_id, question_id)
      DO UPDATE SET
        selected_option_id = EXCLUDED.selected_option_id,
        is_marked_for_review = EXCLUDED.is_marked_for_review,
        answered_at = CURRENT_TIMESTAMP;
    `, [attempt_id, question_id, selected_option_id || null, Boolean(is_marked_for_review)]);

    res.json({
      success: true,
      message: 'Answer recorded successfully.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Submit Examination & Compute Genuine Scorecard
 */
async function submitExam(req, res, next) {
  const studentUserId = req.session.user.id;
  const { attempt_id } = req.body;

  if (!attempt_id) {
    return res.status(400).json({ success: false, error: 'attempt_id is required for submission.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch attempt and exam specs
    const attemptRes = await client.query(`
      SELECT ea.attempt_id, ea.exam_id, ea.student_id, ea.status, e.total_marks, e.passing_marks, e.negative_marking
      FROM exam_attempts ea
      JOIN exams e ON ea.exam_id = e.exam_id
      WHERE ea.attempt_id = $1 AND ea.student_id = $2
      FOR UPDATE;
    `, [attempt_id, studentUserId]);

    if (attemptRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Examination attempt not found.' });
    }

    const attempt = attemptRes.rows[0];
    if (attempt.status === 'Submitted') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Examination has already been submitted.' });
    }

    // 2. Fetch all questions and their correct options
    const questionsRes = await client.query(`
      SELECT 
        q.question_id,
        q.marks,
        q.negative_marks,
        o.option_id AS correct_option_id
      FROM questions q
      LEFT JOIN question_options o ON q.question_id = o.question_id AND o.is_correct = TRUE
      WHERE q.exam_id = $1;
    `, [attempt.exam_id]);

    // 3. Fetch all student answers
    const answersRes = await client.query(`
      SELECT answer_id, question_id, selected_option_id
      FROM student_answers
      WHERE attempt_id = $1;
    `, [attempt_id]);

    const studentAnswers = {};
    answersRes.rows.forEach(ans => {
      studentAnswers[ans.question_id] = ans;
    });

    // 4. Calculate score
    let totalObtainedMarks = 0.0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    for (const q of questionsRes.rows) {
      const studentAns = studentAnswers[q.question_id];
      const qMarks = parseFloat(q.marks) || 1.0;
      const qNeg = parseFloat(q.negative_marks) || 0.0;

      if (!studentAns || !studentAns.selected_option_id) {
        // Unattempted
        unattemptedCount++;
        if (studentAns) {
          await client.query(`
            UPDATE student_answers
            SET is_correct = NULL, marks_awarded = 0
            WHERE answer_id = $1;
          `, [studentAns.answer_id]);
        }
      } else if (parseInt(studentAns.selected_option_id, 10) === parseInt(q.correct_option_id, 10)) {
        // Correct answer
        correctCount++;
        totalObtainedMarks += qMarks;
        await client.query(`
          UPDATE student_answers
          SET is_correct = TRUE, marks_awarded = $1
          WHERE answer_id = $2;
        `, [qMarks, studentAns.answer_id]);
      } else {
        // Incorrect answer
        incorrectCount++;
        totalObtainedMarks -= qNeg;
        await client.query(`
          UPDATE student_answers
          SET is_correct = FALSE, marks_awarded = $1
          WHERE answer_id = $2;
        `, [-qNeg, studentAns.answer_id]);
      }
    }

    // Prevent negative total marks
    if (totalObtainedMarks < 0) totalObtainedMarks = 0.0;

    const totalExamMarks = parseFloat(attempt.total_marks);
    const passingMarks = parseFloat(attempt.passing_marks);
    const percentage = totalExamMarks > 0 ? parseFloat(((totalObtainedMarks / totalExamMarks) * 100).toFixed(2)) : 0.0;
    const isPassed = totalObtainedMarks >= passingMarks;

    // 5. Update attempt
    await client.query(`
      UPDATE exam_attempts
      SET status = 'Submitted',
          end_time = CURRENT_TIMESTAMP,
          submitted_at = CURRENT_TIMESTAMP,
          score = $1,
          percentage = $2,
          is_passed = $3
      WHERE attempt_id = $4;
    `, [totalObtainedMarks, percentage, isPassed, attempt_id]);

    // 6. Insert / Update official Results table
    await client.query(`
      INSERT INTO results (attempt_id, exam_id, student_id, total_marks, obtained_marks, percentage, is_passed, is_published, published_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, CURRENT_TIMESTAMP)
      ON CONFLICT (attempt_id)
      DO UPDATE SET
        total_marks = EXCLUDED.total_marks,
        obtained_marks = EXCLUDED.obtained_marks,
        percentage = EXCLUDED.percentage,
        is_passed = EXCLUDED.is_passed,
        is_published = TRUE,
        published_at = CURRENT_TIMESTAMP;
    `, [attempt_id, attempt.exam_id, studentUserId, totalExamMarks, totalObtainedMarks, percentage, isPassed]);

    // 7. Audit Log submission
    await client.query(`
      INSERT INTO audit_logs (user_id, action, details, ip_address)
      VALUES ($1, 'EXAM_SUBMISSION', $2, $3);
    `, [studentUserId, JSON.stringify({ attempt_id, score: totalObtainedMarks, percentage, is_passed: isPassed }), req.ip]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Examination submitted successfully!',
      result: {
        attempt_id,
        total_marks: totalExamMarks,
        obtained_marks: totalObtainedMarks,
        percentage,
        is_passed: isPassed,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        unattempted_count: unattemptedCount,
        total_questions: questionsRes.rows.length
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * Internal helper for timed-out attempts
 */
async function autoSubmitExpiredExam(attempt_id, req, res, next) {
  // Reuse submit logic
  req.body.attempt_id = attempt_id;
  return submitExam(req, res, next);
}

/**
 * Get detailed scorecard for a student's completed exam attempt
 */
async function getAttemptResult(req, res, next) {
  const studentUserId = req.session.user.id;
  const { attempt_id } = req.params;

  try {
    const resultRes = await pool.query(`
      SELECT 
        r.result_id,
        r.attempt_id,
        e.title AS exam_title,
        e.description AS exam_description,
        sub.subject_name,
        sub.subject_code,
        d.department_name,
        r.total_marks,
        r.obtained_marks,
        r.percentage,
        r.is_passed,
        e.passing_marks,
        TO_CHAR(ea.start_time, 'YYYY-MM-DD HH24:MI:SS') AS started_at,
        TO_CHAR(ea.submitted_at, 'YYYY-MM-DD HH24:MI:SS') AS submitted_at,
        ROUND(EXTRACT(EPOCH FROM (ea.submitted_at - ea.start_time))/60) AS time_taken_minutes
      FROM results r
      JOIN exam_attempts ea ON r.attempt_id = ea.attempt_id
      JOIN exams e ON r.exam_id = e.exam_id
      JOIN subjects sub ON e.subject_id = sub.subject_id
      JOIN departments d ON e.department_id = d.department_id
      WHERE r.attempt_id = $1 AND (r.student_id = $2 OR $3 = 'Admin');
    `, [attempt_id, studentUserId, req.session.user.role]);

    if (resultRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Result scorecard not found.' });
    }

    res.json({ success: true, result: resultRes.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  startExam,
  saveAnswer,
  submitExam,
  getAttemptResult
};
