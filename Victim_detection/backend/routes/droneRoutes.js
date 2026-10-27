const express = require('express');
const router = express.Router();
const Drone = require('../models/Drone');
const Alert = require('../models/Alert');
const { protect, authorize } = require('../middleware/auth');

// GET /api/drones (Protected)
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, assignedMissionId, page = 1, limit = 50, sort = '-createdAt' } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (assignedMissionId) filter.assignedMissionId = assignedMissionId;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Drone.countDocuments(filter);

    const drones = await Drone.find(filter)
      .populate('assignedMissionId', 'title disasterType location status')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: drones.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: drones,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/drones/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const drone = await Drone.findById(req.params.id).populate(
      'assignedMissionId',
      'title disasterType location status'
    );
    if (!drone) {
      return res.status(404).json({
        success: false,
        message: `UAV Asset with ID ${req.params.id} not found`,
        error: 'DroneNotFound',
      });
    }
    res.status(200).json({ success: true, data: drone });
  } catch (err) {
    next(err);
  }
});

// POST /api/drones (admin, operator)
router.post('/', protect, authorize('admin', 'operator'), async (req, res, next) => {
  try {
    const drone = await Drone.create(req.body);
    res.status(201).json({
      success: true,
      message: `UAV Asset ${drone.droneId} successfully commissioned.`,
      data: drone,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/drones/:id (admin, operator)
router.put('/:id', protect, authorize('admin', 'operator'), async (req, res, next) => {
  try {
    const drone = await Drone.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!drone) {
      return res.status(404).json({
        success: false,
        message: 'Drone not found',
        error: 'DroneNotFound',
      });
    }
    res.status(200).json({
      success: true,
      message: `UAV Asset ${drone.droneId} telemetry updated.`,
      data: drone,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/drones/:id (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const drone = await Drone.findByIdAndDelete(req.params.id);
    if (!drone) {
      return res.status(404).json({
        success: false,
        message: 'Drone not found',
        error: 'DroneNotFound',
      });
    }
    res.status(200).json({
      success: true,
      message: `UAV Asset ${drone.droneId} decommissioned.`,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/drones/:id/status
router.patch('/:id/status', protect, async (req, res, next) => {
  try {
    const { status, batteryLevel, currentLocation } = req.body;
    const updateData = { lastPing: new Date() };

    if (status) updateData.status = status;
    if (batteryLevel !== undefined) updateData.batteryLevel = Number(batteryLevel);
    if (currentLocation) updateData.currentLocation = currentLocation;

    const drone = await Drone.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!drone) {
      return res.status(404).json({
        success: false,
        message: 'Drone not found',
        error: 'DroneNotFound',
      });
    }

    // Check for alerts
    if (drone.batteryLevel <= 20) {
      await Alert.create({
        type: 'drone_low_battery',
        message: `CRITICAL TELEMETRY: Drone ${drone.droneId} battery at ${drone.batteryLevel}%. Immediate RTH (Return-To-Home) required.`,
        severity: drone.batteryLevel <= 10 ? 'critical' : 'high',
        relatedDroneId: drone.droneId,
        relatedMissionId: drone.assignedMissionId,
      });
    }

    if (drone.status === 'offline') {
      await Alert.create({
        type: 'drone_offline',
        message: `COMM LINK SEVERED: Drone ${drone.droneId} went offline in operational sector.`,
        severity: 'critical',
        relatedDroneId: drone.droneId,
        relatedMissionId: drone.assignedMissionId,
      });
    }

    res.status(200).json({
      success: true,
      message: `Status updated for UAV ${drone.droneId}`,
      data: drone,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
