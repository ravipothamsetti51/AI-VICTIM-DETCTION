const express = require('express');
const router = express.Router();
const Drone = require('../models/Drone');
const Mission = require('../models/Mission');
const Detection = require('../models/Detection');
const Alert = require('../models/Alert');
const { protect } = require('../middleware/auth');

// GET /api/stats (Tactical Dashboard Metrics)
router.get('/', protect, async (req, res, next) => {
  try {
    const [
      activeMissionsCount,
      totalMissionsCount,
      totalDronesCount,
      activeDronesCount,
      idleDronesCount,
      offlineDronesCount,
      totalDetectionsCount,
      unconfirmedVictimsCount,
      confirmedVictimsCount,
      rescuedVictimsCount,
      unreadAlertsCount,
      criticalAlertsCount,
      recentAlerts,
      recentDetections,
      drones,
    ] = await Promise.all([
      Mission.countDocuments({ status: 'active' }),
      Mission.countDocuments(),
      Drone.countDocuments(),
      Drone.countDocuments({ status: 'active' }),
      Drone.countDocuments({ status: 'idle' }),
      Drone.countDocuments({ status: 'offline' }),
      Detection.countDocuments(),
      Detection.countDocuments({ status: 'unconfirmed' }),
      Detection.countDocuments({ status: 'confirmed' }),
      Detection.countDocuments({ status: 'rescued' }),
      Alert.countDocuments({ isRead: false }),
      Alert.countDocuments({ severity: 'critical', isRead: false }),
      Alert.find().sort('-createdAt').limit(5),
      Detection.find().populate('missionId', 'title location').sort('-detectedAt').limit(6),
      Drone.find().select('droneId name status batteryLevel currentLocation'),
    ]);

    // Timeline aggregations for charts (last 7 days detection volume)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const detectionsTimeline = await Detection.aggregate([
      { $match: { detectedAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$detectedAt' } },
          detections: { $sum: 1 },
          victims: { $sum: '$victimCount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format 7-day timeline with zero-fill
    const timelineFormatted = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const found = detectionsTimeline.find((item) => item._id === dateKey);

      timelineFormatted.push({
        date: dateKey,
        day: dayName,
        detections: found ? found.detections : 0,
        victims: found ? found.victims : 0,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        summary: {
          activeMissions: activeMissionsCount,
          totalMissions: totalMissionsCount,
          activeDrones: activeDronesCount,
          idleDrones: idleDronesCount,
          offlineDrones: offlineDronesCount,
          totalDrones: totalDronesCount,
          fleetHealthPct: totalDronesCount > 0 ? Math.round(((totalDronesCount - offlineDronesCount) / totalDronesCount) * 100) : 100,
          unconfirmedVictims: unconfirmedVictimsCount,
          confirmedVictims: confirmedVictimsCount,
          rescuedVictims: rescuedVictimsCount,
          totalVictimsDetected: totalDetectionsCount,
          unreadAlerts: unreadAlertsCount,
          criticalAlerts: criticalAlertsCount,
        },
        timeline: timelineFormatted,
        dronesDistribution: [
          { name: 'Active', value: activeDronesCount, fill: '#10b981' },
          { name: 'Idle', value: idleDronesCount, fill: '#f59e0b' },
          { name: 'Offline', value: offlineDronesCount, fill: '#ef4444' },
        ],
        detectionStatusBreakdown: [
          { name: 'Unconfirmed', value: unconfirmedVictimsCount, fill: '#ef4444' },
          { name: 'Confirmed', value: confirmedVictimsCount, fill: '#f59e0b' },
          { name: 'Rescued', value: rescuedVictimsCount, fill: '#10b981' },
        ],
        recentAlerts,
        recentDetections,
        drones,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
