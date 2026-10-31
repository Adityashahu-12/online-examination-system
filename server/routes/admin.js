const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

router.get('/stats', adminController.getAdminStats);
router.get('/students', adminController.getStudents);
router.post('/assign-exam', adminController.assignExam);
router.get('/results', adminController.getAllResults);
router.put('/results/:result_id/publish', adminController.togglePublishResult);

module.exports = router;
