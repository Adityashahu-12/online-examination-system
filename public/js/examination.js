/**
 * ExamHub - Online Examination Engine
 * Server-Synchronized Timer, Live Autosave, Question Palette & Auto-Evaluation
 */

let examData = null;
let questions = [];
let currentIndex = 0;
let savedAnswers = {}; // { question_id: { selected_option_id, is_marked_for_review } }
let attemptId = null;
let timerInterval = null;
let remainingSeconds = 0;

async function initExamination() {
  const urlParams = new URLSearchParams(window.location.search);
  const examId = urlParams.get('exam_id');

  if (!examId) {
    alert('No examination specified. Returning to student dashboard.');
    window.location.href = '/student/dashboard.html';
    return;
  }

  try {
    const res = await fetch(`/api/exams/${examId}/start`, { method: 'POST' });
    const data = await res.json();

    if (!res.ok || !data.success) {
      if (data.status === 'Submitted') {
        alert('You have already completed and submitted this examination. Redirecting to your results.');
        window.location.href = '/student/results.html';
        return;
      }
      alert(data.error || 'Unable to access examination room.');
      window.location.href = '/student/dashboard.html';
      return;
    }

    examData = data.exam;
    questions = data.questions || [];
    savedAnswers = data.saved_answers || {};
    attemptId = data.attempt_id;
    remainingSeconds = data.timing.remaining_seconds;

    if (questions.length === 0) {
      alert('This examination does not currently contain questions. Please contact your administrator.');
      window.location.href = '/student/dashboard.html';
      return;
    }

    // Set Exam Header Info
    document.getElementById('exam-title').textContent = examData.title;
    document.getElementById('exam-meta').textContent = `${examData.subject_name} (${examData.subject_code}) • ${examData.total_marks} Marks`;

    // Start Timer
    startTimer();

    // Render Question & Palette
    renderQuestion(0);
    renderPalette();

    // Prevent accidental page unload
    window.addEventListener('beforeunload', handleBeforeUnload);

  } catch (err) {
    console.error('Failed to start examination:', err);
    alert('Network error while connecting to examination server.');
  }
}

// --------------------------------------------------------------------------
// 1. Server-Synchronized Countdown Timer
// --------------------------------------------------------------------------
function startTimer() {
  const timerClock = document.getElementById('timer-clock');
  updateClockDisplay(timerClock, remainingSeconds);

  timerInterval = setInterval(() => {
    remainingSeconds--;

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      updateClockDisplay(timerClock, 0);
      alert('Examination time has expired! Your answers are being automatically submitted.');
      submitExamination(true);
      return;
    }

    updateClockDisplay(timerClock, remainingSeconds);
  }, 1000);
}

function updateClockDisplay(clockEl, totalSec) {
  if (!clockEl) return;

  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  let timeString = '';
  if (hours > 0) {
    timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  clockEl.textContent = timeString;

  // Visual cues
  clockEl.classList.remove('warning', 'danger');
  if (totalSec <= 60) {
    clockEl.classList.add('danger');
  } else if (totalSec <= 300) {
    clockEl.classList.add('warning');
  }
}

// --------------------------------------------------------------------------
// 2. Question Rendering
// --------------------------------------------------------------------------
function renderQuestion(index) {
  if (index < 0 || index >= questions.length) return;
  currentIndex = index;

  const q = questions[currentIndex];
  const saved = savedAnswers[q.question_id] || {};

  // Update header badges
  document.getElementById('q-number-badge').textContent = `Question ${currentIndex + 1} of ${questions.length}`;
  document.getElementById('q-marks-badge').textContent = `+${q.marks} Marks ${q.negative_marks > 0 ? `(-${q.negative_marks})` : ''}`;

  // Update Question Text
  document.getElementById('q-text').textContent = q.question_text;

  // Render Options
  const optionsContainer = document.getElementById('options-container');
  optionsContainer.innerHTML = (q.options || []).map((opt, i) => {
    const isSelected = saved.selected_option_id === opt.option_id;
    const optionLetter = String.fromCharCode(65 + i);

    return `
      <label class="option-item ${isSelected ? 'selected' : ''}" data-option-id="${opt.option_id}">
        <input type="radio" name="question_option" value="${opt.option_id}" ${isSelected ? 'checked' : ''} onchange="onOptionSelected(${q.question_id}, ${opt.option_id})">
        <span class="option-label"><strong>${optionLetter}.</strong> ${escapeHtml(opt.option_text)}</span>
      </label>
    `;
  }).join('');

  // Update navigation button states
  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');
  if (prevBtn) prevBtn.disabled = (currentIndex === 0);
  if (nextBtn) {
    nextBtn.textContent = (currentIndex === questions.length - 1) ? 'Review / Finish' : 'Next Question';
  }

  // Update Review Checkbox / Button
  const reviewBtn = document.getElementById('btn-review');
  if (reviewBtn) {
    reviewBtn.className = saved.is_marked_for_review ? 'btn btn-warning' : 'btn btn-secondary';
    reviewBtn.textContent = saved.is_marked_for_review ? '★ Marked for Review' : '☆ Mark for Review';
  }

  renderPalette();
}

// --------------------------------------------------------------------------
// 3. Answer Selection & Real-Time Autosave
// --------------------------------------------------------------------------
async function onOptionSelected(questionId, optionId) {
  if (!savedAnswers[questionId]) {
    savedAnswers[questionId] = {};
  }
  savedAnswers[questionId].selected_option_id = optionId;

  // Highlight selected option visually
  document.querySelectorAll('.option-item').forEach(el => {
    el.classList.toggle('selected', el.getAttribute('data-option-id') == optionId);
  });

  renderPalette();

  // Autosave to PostgreSQL
  await persistAnswer(questionId);
}

async function persistAnswer(questionId) {
  const current = savedAnswers[questionId] || {};

  try {
    const res = await fetch('/api/exams/save-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attempt_id: attemptId,
        question_id: questionId,
        selected_option_id: current.selected_option_id || null,
        is_marked_for_review: Boolean(current.is_marked_for_review)
      })
    });

    const data = await res.json();
    if (!res.ok && data.timed_out) {
      alert('Time has expired! Submitting examination now.');
      submitExamination(true);
    }
  } catch (err) {
    console.warn('Autosave warning:', err);
  }
}

// Clear selected option
async function clearSelection() {
  const q = questions[currentIndex];
  if (!q) return;

  if (savedAnswers[q.question_id]) {
    savedAnswers[q.question_id].selected_option_id = null;
  }

  document.querySelectorAll('.option-item').forEach(el => {
    el.classList.remove('selected');
    const radio = el.querySelector('input[type="radio"]');
    if (radio) radio.checked = false;
  });

  renderPalette();
  await persistAnswer(q.question_id);
}

// Toggle Mark For Review
async function toggleReview() {
  const q = questions[currentIndex];
  if (!q) return;

  if (!savedAnswers[q.question_id]) {
    savedAnswers[q.question_id] = {};
  }
  savedAnswers[q.question_id].is_marked_for_review = !savedAnswers[q.question_id].is_marked_for_review;

  const reviewBtn = document.getElementById('btn-review');
  if (reviewBtn) {
    reviewBtn.className = savedAnswers[q.question_id].is_marked_for_review ? 'btn btn-warning' : 'btn btn-secondary';
    reviewBtn.textContent = savedAnswers[q.question_id].is_marked_for_review ? '★ Marked for Review' : '☆ Mark for Review';
  }

  renderPalette();
  await persistAnswer(q.question_id);
}

// --------------------------------------------------------------------------
// 4. Question Palette Rendering
// --------------------------------------------------------------------------
function renderPalette() {
  const paletteContainer = document.getElementById('palette-grid');
  if (!paletteContainer) return;

  let answeredCount = 0;
  let reviewCount = 0;
  let unansweredCount = 0;

  paletteContainer.innerHTML = questions.map((q, idx) => {
    const saved = savedAnswers[q.question_id] || {};
    let statusClass = 'unanswered';

    if (saved.is_marked_for_review) {
      statusClass = 'review';
      reviewCount++;
    } else if (saved.selected_option_id) {
      statusClass = 'answered';
      answeredCount++;
    } else {
      unansweredCount++;
    }

    const isCurrent = (idx === currentIndex);

    return `
      <button type="button" class="palette-btn ${statusClass} ${isCurrent ? 'current' : ''}" onclick="jumpToQuestion(${idx})">
        ${idx + 1}
      </button>
    `;
  }).join('');

  // Update counts in legend
  const elAns = document.getElementById('count-answered');
  const elRev = document.getElementById('count-review');
  const elUnans = document.getElementById('count-unanswered');
  if (elAns) elAns.textContent = answeredCount;
  if (elRev) elRev.textContent = reviewCount;
  if (elUnans) elUnans.textContent = unansweredCount;
}

function jumpToQuestion(index) {
  renderQuestion(index);
}

function nextQuestion() {
  if (currentIndex < questions.length - 1) {
    renderQuestion(currentIndex + 1);
  } else {
    openSubmitModal();
  }
}

function prevQuestion() {
  if (currentIndex > 0) {
    renderQuestion(currentIndex - 1);
  }
}

// --------------------------------------------------------------------------
// 5. Submit Examination
// --------------------------------------------------------------------------
function openSubmitModal() {
  let answered = 0;
  let review = 0;
  let unattempted = 0;

  questions.forEach(q => {
    const saved = savedAnswers[q.question_id] || {};
    if (saved.selected_option_id) {
      answered++;
    } else {
      unattempted++;
    }
    if (saved.is_marked_for_review) {
      review++;
    }
  });

  document.getElementById('modal-total-q').textContent = questions.length;
  document.getElementById('modal-answered-q').textContent = answered;
  document.getElementById('modal-review-q').textContent = review;
  document.getElementById('modal-unattempted-q').textContent = unattempted;

  const modal = document.getElementById('submit-modal');
  if (modal) modal.classList.add('active');
}

function closeSubmitModal() {
  const modal = document.getElementById('submit-modal');
  if (modal) modal.classList.remove('active');
}

async function submitExamination(isAuto = false) {
  clearInterval(timerInterval);
  window.removeEventListener('beforeunload', handleBeforeUnload);

  const confirmBtn = document.getElementById('btn-confirm-submit');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Submitting & Evaluating...';
  }

  try {
    const res = await fetch('/api/exams/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attempt_id: attemptId })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      alert(data.error || 'Failed to submit examination.');
      if (confirmBtn) confirmBtn.disabled = false;
      return;
    }

    closeSubmitModal();

    // Show Completion Scorecard Modal
    const result = data.result;
    const completionModalBody = document.getElementById('completion-modal-body');
    if (completionModalBody) {
      completionModalBody.innerHTML = `
        <div style="text-align: center; margin-bottom: 2rem;">
          <div style="width: 72px; height: 72px; border-radius: 9999px; background: ${result.is_passed ? '#ecfdf5' : '#fef2f2'}; color: ${result.is_passed ? '#10b981' : '#ef4444'}; font-size: 2.25rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
            ${result.is_passed ? '✓' : '✕'}
          </div>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem;">
            ${result.is_passed ? 'Congratulations! Examination Passed' : 'Examination Completed'}
          </h2>
          <p style="color: #64748b; font-size: 0.95rem;">Your assessment has been officially submitted and evaluated.</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; text-align: center; margin-bottom: 2rem;">
          <div style="background: #f8fafc; padding: 1.25rem; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 1.75rem; font-weight: 800; color: #2563eb;">${result.obtained_marks} / ${result.total_marks}</div>
            <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Marks Secured</div>
          </div>
          <div style="background: #f8fafc; padding: 1.25rem; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 1.75rem; font-weight: 800; color: ${result.is_passed ? '#10b981' : '#ef4444'};">${result.percentage}%</div>
            <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Percentage</div>
          </div>
          <div style="background: #f8fafc; padding: 1.25rem; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 1.75rem; font-weight: 800; color: #0f172a;">${result.correct_count} / ${result.total_questions}</div>
            <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Correct Answers</div>
          </div>
        </div>

        <div style="text-align: center;">
          <a href="/student/results.html" class="btn btn-primary btn-lg" style="width: 100%;">View Full Results & Scorecard</a>
        </div>
      `;

      const completionModal = document.getElementById('completion-modal');
      if (completionModal) completionModal.classList.add('active');
    }
  } catch (err) {
    alert('Error submitting examination.');
    if (confirmBtn) confirmBtn.disabled = false;
  }
}

function handleBeforeUnload(e) {
  e.preventDefault();
  e.returnValue = 'You have an active examination in progress. Are you sure you wish to leave?';
  return e.returnValue;
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

document.addEventListener('DOMContentLoaded', initExamination);
