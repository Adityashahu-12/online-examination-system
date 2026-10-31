const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { requireStudent } = require('../middleware/auth');

router.use(requireStudent);

router.get('/dashboard', studentController.getStudentDashboard);
router.get('/available-exams', studentController.getAvailableExams);
router.get('/results', studentController.getStudentResults);
router.get('/profile', studentController.getStudentProfile);

module.exports = router;
