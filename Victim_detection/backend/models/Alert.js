const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['victim_detected', 'drone_low_battery', 'drone_offline', 'mission_critical'],
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  relatedMissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission',
    default: null,
  },
  relatedDroneId: {
    type: String,
    default: null,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
