const express = require('express');
const router = express.Router();
const Mission = require('../models/Mission');
const Drone = require('../models/Drone');
const Alert = require('../models/Alert');
const { protect, authorize } = require('../middleware/auth');

// GET /api/missions
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, disasterType, page = 1, limit = 50, sort = '-createdAt' } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (disasterType) filter.disasterType = disasterType;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Mission.countDocuments(filter);

    const missions = await Mission.find(filter)
      .populate('assignedDrones', 'droneId name model status batteryLevel currentLocation')
      .populate('createdBy', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: missions.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: missions,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/missions/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const mission = await Mission.findById(req.params.id)
      .populate('assignedDrones')
      .populate('createdBy', 'name email role');

    if (!mission) {
      return res.status(404).json({
        success: false,
        message: 'Mission not found',
        error: 'MissionNotFound',
      });
    }

    res.status(200).json({ success: true, data: mission });
  } catch (err) {
    next(err);
  }
});

// POST /api/missions (admin, operator only)
router.post('/', protect, authorize('admin', 'operator'), async (req, res, next) => {
  try {
    const { title, disasterType, location, status, assignedDrones } = req.body;

    const mission = await Mission.create({
      title,
      disasterType,
      location,
      status: status || 'planning',
      assignedDrones: assignedDrones || [],
      createdBy: req.user._id,
      startedAt: status === 'active' ? new Date() : null,
    });

    // If drones were assigned, link them
    if (assignedDrones && assignedDrones.length > 0) {
      await Drone.updateMany(
        { _id: { $in: assignedDrones } },
        { assignedMissionId: mission._id, status: status === 'active' ? 'active' : 'idle' }
      );
    }

    await Alert.create({
      type: 'mission_critical',
      message: `NEW OPERATION INITIATED: [${mission.title}] (${mission.disasterType.toUpperCase()}) at ${mission.location?.address || 'Target Sector'}.`,
      severity: 'medium',
      relatedMissionId: mission._id,
    });

    res.status(201).json({
      success: true,
      message: 'Mission successfully authorized and scheduled.',
      data: mission,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/missions/:id (admin, operator)
router.put('/:id', protect, authorize('admin', 'operator'), async (req, res, next) => {
  try {
    const mission = await Mission.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!mission) {
      return res.status(404).json({
        success: false,
        message: 'Mission not found',
        error: 'MissionNotFound',
      });
    }

    if (req.body.assignedDrones) {
      await Drone.updateMany(
        { _id: { $in: req.body.assignedDrones } },
        { assignedMissionId: mission._id }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Mission parameters updated.',
      data: mission,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/missions/:id (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const mission = await Mission.findByIdAndDelete(req.params.id);
    if (!mission) {
      return res.status(404).json({
        success: false,
        message: 'Mission not found',
        error: 'MissionNotFound',
      });
    }

    // Unassign drones
    await Drone.updateMany(
      { assignedMissionId: req.params.id },
      { assignedMissionId: null, status: 'idle' }
    );

    res.status(200).json({
      success: true,
      message: 'Mission archived and deleted.',
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/missions/:id/status
router.patch('/:id/status', protect, authorize('admin', 'operator'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['planning', 'active', 'completed', 'aborted'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be planning, active, completed, or aborted.',
        error: 'ValidationError',
      });
    }

    const update = { status };
    if (status === 'active') {
      update.startedAt = new Date();
    } else if (status === 'completed' || status === 'aborted') {
      update.endedAt = new Date();
    }

    const mission = await Mission.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!mission) {
      return res.status(404).json({
        success: false,
        message: 'Mission not found',
        error: 'MissionNotFound',
      });
    }

    // Drone status synchronization
    if (status === 'active') {
      await Drone.updateMany(
        { _id: { $in: mission.assignedDrones } },
        { status: 'active' }
      );
    } else if (status === 'completed' || status === 'aborted') {
      await Drone.updateMany(
        { _id: { $in: mission.assignedDrones } },
        { status: 'returning' }
      );
    }

    await Alert.create({
      type: 'mission_critical',
      message: `OPERATION STATUS CHANGED: [${mission.title}] is now ${status.toUpperCase()}.`,
      severity: status === 'aborted' ? 'critical' : status === 'active' ? 'high' : 'medium',
      relatedMissionId: mission._id,
    });

    res.status(200).json({
      success: true,
      message: `Mission status shifted to ${status}`,
      data: mission,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
