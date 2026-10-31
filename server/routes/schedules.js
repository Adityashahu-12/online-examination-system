const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { requireAdmin } = require('../middleware/auth');

router.get('/', scheduleController.getAllSchedules);
router.post('/', requireAdmin, scheduleController.createSchedule);
router.delete('/:schedule_id', requireAdmin, scheduleController.cancelSchedule);

module.exports = router;
