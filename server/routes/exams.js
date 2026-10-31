const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const adminController = require('../controllers/adminController');
const { requireAuth, requireStudent, requireAdmin } = require('../middleware/auth');

// Student Exam Execution Endpoints
router.post('/:exam_id/start', requireStudent, examController.startExam);
router.post('/save-answer', requireStudent, examController.saveAnswer);
router.post('/submit', requireStudent, examController.submitExam);
router.get('/result/:attempt_id', requireAuth, examController.getAttemptResult);

// Exam Management Endpoints
router.get('/', requireAuth, adminController.getExams);
router.post('/', requireAdmin, adminController.createExam);
router.get('/:exam_id', requireAuth, adminController.getExamDetails);
router.put('/:exam_id/publish', requireAdmin, adminController.publishExam);
router.post('/:exam_id/questions', requireAdmin, adminController.addQuestion);
router.delete('/questions/:question_id', requireAdmin, adminController.deleteQuestion);

module.exports = router;
