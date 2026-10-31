const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/stats', publicController.getPublicStats);
router.get('/timetable', publicController.getPublicTimetable);
router.get('/departments', publicController.getDepartments);
router.get('/subjects', publicController.getSubjects);
router.get('/centers', publicController.getCenters);

module.exports = router;
