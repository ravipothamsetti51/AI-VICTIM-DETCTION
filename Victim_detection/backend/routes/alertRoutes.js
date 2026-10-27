const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const { protect } = require('../middleware/auth');

// GET /api/alerts
router.get('/', protect, async (req, res, next) => {
  try {
    const { severity, isRead, type, limit = 50, page = 1 } = req.query;

    const filter = {};
    if (severity) filter.severity = severity;
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    if (type) filter.type = type;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Alert.countDocuments(filter);
    const unreadCount = await Alert.countDocuments({ isRead: false });

    const alerts = await Alert.find(filter)
      .populate('relatedMissionId', 'title disasterType location')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: alerts.length,
      total,
      unreadCount,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: alerts,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/alerts/:id/read
router.patch('/:id/read', protect, async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
        error: 'AlertNotFound',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Alert marked as acknowledged.',
      data: alert,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/alerts/read-all
router.patch('/read-all', protect, async (req, res, next) => {
  try {
    await Alert.updateMany({ isRead: false }, { isRead: true });
    res.status(200).json({
      success: true,
      message: 'All tactical alerts acknowledged.',
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
        error: 'AlertNotFound',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Alert dismissed.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
