/**
 * ExamHub - Universal Authentication & Session Management
 */

// Check current user session on page load
async function checkUserSession() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    return data.authenticated ? data.user : null;
  } catch (err) {
    console.error('Session check failed:', err);
    return null;
  }
}

// Universal Login Handler
async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const alertBox = document.getElementById('login-alert');
  const submitBtn = form.querySelector('button[type="submit"]');

  const identifier = form.identifier.value.trim();
  const password = form.password.value;
  const role_hint = form.role_hint ? form.role_hint.value : undefined;

  if (alertBox) alertBox.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Authenticating...';

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, role_hint })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      if (alertBox) {
        alertBox.className = 'alert alert-danger';
        alertBox.textContent = data.error || 'Authentication failed. Please check credentials.';
        alertBox.style.display = 'flex';
      }
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
      return;
    }

    // Success: redirect to assigned portal
    window.location.href = data.redirect || (data.user.role === 'Admin' ? '/admin/dashboard.html' : '/student/dashboard.html');
  } catch (err) {
    if (alertBox) {
      alertBox.className = 'alert alert-danger';
      alertBox.textContent = 'Network or server error during sign-in.';
      alertBox.style.display = 'flex';
    }
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In';
  }
}

// Student Registration Handler
async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  const alertBox = document.getElementById('register-alert');
  const submitBtn = form.querySelector('button[type="submit"]');

  const payload = {
    full_name: form.full_name.value.trim(),
    email: form.email.value.trim(),
    student_id: form.student_id.value.trim(),
    department_id: form.department_id.value,
    semester: form.semester.value,
    phone: form.phone ? form.phone.value.trim() : null,
    password: form.password.value,
    confirm_password: form.confirm_password.value
  };

  if (payload.password !== payload.confirm_password) {
    if (alertBox) {
      alertBox.className = 'alert alert-danger';
      alertBox.textContent = 'Passwords do not match.';
      alertBox.style.display = 'flex';
    }
    return;
  }

  if (alertBox) alertBox.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating Account...';

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      if (alertBox) {
        alertBox.className = 'alert alert-danger';
        alertBox.textContent = data.error || 'Registration failed.';
        alertBox.style.display = 'flex';
      }
      submitBtn.disabled = false;
      submitBtn.textContent = 'Complete Registration';
      return;
    }

    // Redirect to student portal
    window.location.href = data.redirect || '/student/dashboard.html';
  } catch (err) {
    if (alertBox) {
      alertBox.className = 'alert alert-danger';
      alertBox.textContent = 'Network or server error during registration.';
      alertBox.style.display = 'flex';
    }
    submitBtn.disabled = false;
    submitBtn.textContent = 'Complete Registration';
  }
}

// Universal Logout Handler
async function handleLogout() {
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    const data = await res.json();
    window.location.href = data.redirect || '/index.html';
  } catch (err) {
    window.location.href = '/index.html';
  }
}

// Attach logout listeners
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.btn-logout').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  });
});
