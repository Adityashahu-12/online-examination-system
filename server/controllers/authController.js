const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

/**
 * Student Registration
 */
async function registerStudent(req, res, next) {
  const { full_name, email, student_id, department_id, semester, password, confirm_password, phone } = req.body;

  // 1. Validation
  if (!full_name || !email || !student_id || !department_id || !semester || !password) {
    return res.status(400).json({ success: false, error: 'All mandatory fields must be completed.' });
  }

  if (password !== confirm_password) {
    return res.status(400).json({ success: false, error: 'Passwords do not match.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters in length.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
  }

  const semNum = parseInt(semester, 10);
  if (isNaN(semNum) || semNum < 1 || semNum > 8) {
    return res.status(400).json({ success: false, error: 'Semester must be an integer between 1 and 8.' });
  }

  const deptNum = parseInt(department_id, 10);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 2. Check for duplicate email
    const existingUser = await client.query('SELECT user_id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, error: 'An account with this email address already exists.' });
    }

    // 3. Check for duplicate student_id
    const existingStudentId = await client.query('SELECT profile_id FROM student_profiles WHERE LOWER(student_id) = LOWER($1)', [student_id.trim()]);
    if (existingStudentId.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, error: 'A student profile with this Student ID / Roll Number already exists.' });
    }

    // 4. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Insert User
    const userRes = await client.query(`
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES ($1, $2, $3, 'Student')
      RETURNING user_id, full_name, email, role;
    `, [full_name.trim(), email.trim().toLowerCase(), passwordHash]);

    const newUser = userRes.rows[0];

    // 6. Insert Student Profile
    await client.query(`
      INSERT INTO student_profiles (user_id, student_id, department_id, semester, phone)
      VALUES ($1, $2, $3, $4, $5);
    `, [newUser.user_id, student_id.trim().toUpperCase(), deptNum, semNum, phone ? phone.trim() : null]);

    // 7. Auto-assign any existing exams published for this department & semester
    await client.query(`
      INSERT INTO exam_assignments (exam_id, student_id)
      SELECT exam_id, $1
      FROM exams
      WHERE department_id = $2 AND semester = $3 AND status = 'Published'
      ON CONFLICT DO NOTHING;
    `, [newUser.user_id, deptNum, semNum]);

    // 8. Log registration action
    await client.query(`
      INSERT INTO audit_logs (user_id, action, details, ip_address)
      VALUES ($1, 'STUDENT_REGISTER', $2, $3);
    `, [newUser.user_id, JSON.stringify({ email: newUser.email, student_id }), req.ip]);

    await client.query('COMMIT');

    // Create session
    req.session.user = {
      id: newUser.user_id,
      name: newUser.full_name,
      email: newUser.email,
      role: 'Student',
      student_id: student_id.trim().toUpperCase(),
      department_id: deptNum,
      semester: semNum
    };

    req.session.save((sessionError) => {
      if (sessionError) {
        return next(sessionError);
      }
      return res.status(201).json({
        success: true,
        message: 'Student account registered successfully.',
        user: req.session.user,
        redirect: '/student/dashboard.html'
      });
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * Universal Login (Student & Admin)
 */
async function login(req, res, next) {
  const { identifier, password, role_hint } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ success: false, error: 'Please enter your identifier (Email or Student ID) and password.' });
  }

  try {
    const isEmail = identifier.includes('@');
    let userQuery;
    let queryParams;

    if (isEmail) {
      userQuery = `
        SELECT u.user_id, u.full_name, u.email, u.password_hash, u.role, u.is_active,
               sp.student_id, sp.department_id, sp.semester, d.department_name
        FROM users u
        LEFT JOIN student_profiles sp ON u.user_id = sp.user_id
        LEFT JOIN departments d ON sp.department_id = d.department_id
        WHERE LOWER(u.email) = LOWER($1);
      `;
      queryParams = [identifier.trim()];
    } else {
      userQuery = `
        SELECT u.user_id, u.full_name, u.email, u.password_hash, u.role, u.is_active,
               sp.student_id, sp.department_id, sp.semester, d.department_name
        FROM users u
        JOIN student_profiles sp ON u.user_id = sp.user_id
        LEFT JOIN departments d ON sp.department_id = d.department_id
        WHERE LOWER(sp.student_id) = LOWER($1);
      `;
      queryParams = [identifier.trim()];
    }

    const result = await pool.query(userQuery, queryParams);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials. User not found.' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, error: 'Account is deactivated. Please contact the administrator.' });
    }

    // Role check if role_hint requested (e.g. from Admin login tab)
    if (role_hint === 'Admin' && user.role !== 'Admin') {
      return res.status(403).json({ success: false, error: 'Access denied: Administrator privileges required.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials. Incorrect password.' });
    }

    // Set session user
    req.session.user = {
      id: user.user_id,
      name: user.full_name,
      email: user.email,
      role: user.role,
      student_id: user.student_id || null,
      department_id: user.department_id || null,
      department_name: user.department_name || null,
      semester: user.semester || null
    };

    // Log login
    await pool.query(`
      INSERT INTO audit_logs (user_id, action, details, ip_address)
      VALUES ($1, 'USER_LOGIN', $2, $3);
    `, [user.user_id, JSON.stringify({ role: user.role, login_time: new Date() }), req.ip]);

    const redirectUrl = user.role === 'Admin' ? '/admin/dashboard.html' : '/student/dashboard.html';

    req.session.save((sessionError) => {
      if (sessionError) {
        return next(sessionError);
      }
      return res.json({
        success: true,
        message: `Welcome back, ${user.full_name}!`,
        user: req.session.user,
        redirect: redirectUrl
      });
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Logout
 */
function logout(req, res) {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Could not log out at this moment.' });
      }
      res.clearCookie('examhub.sid');
      return res.json({ success: true, message: 'Logged out successfully.', redirect: '/index.html' });
    });
  } else {
    return res.json({ success: true, message: 'Already logged out.', redirect: '/index.html' });
  }
}

/**
 * Get Current Logged-in User
 */
async function getCurrentUser(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.json({ success: true, authenticated: false, user: null });
  }

  try {
    const userRes = await pool.query(`
      SELECT u.user_id, u.full_name, u.email, u.role, u.is_active,
             sp.student_id, sp.department_id, sp.semester, sp.phone, d.department_name, d.department_code
      FROM users u
      LEFT JOIN student_profiles sp ON u.user_id = sp.user_id
      LEFT JOIN departments d ON sp.department_id = d.department_id
      WHERE u.user_id = $1;
    `, [req.session.user.id]);

    if (userRes.rows.length === 0) {
      req.session.destroy();
      return res.json({ success: true, authenticated: false, user: null });
    }

    const userData = userRes.rows[0];
    return res.json({
      success: true,
      authenticated: true,
      user: {
        id: userData.user_id,
        name: userData.full_name,
        email: userData.email,
        role: userData.role,
        student_id: userData.student_id,
        department_id: userData.department_id,
        department_name: userData.department_name,
        department_code: userData.department_code,
        semester: userData.semester,
        phone: userData.phone
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registerStudent,
  login,
  logout,
  getCurrentUser
};
