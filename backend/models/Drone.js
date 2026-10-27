const mongoose = require('mongoose');

const droneSchema = new mongoose.Schema({
  droneId: {
    type: String,
    required: [true, 'Drone ID is required (e.g. UAV-01)'],
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Drone name is required'],
    trim: true,
  },
  model: {
    type: String,
    required: [true, 'Model name is required'],
    default: 'AeroScout Hexa-FLIR X4',
  },
  status: {
    type: String,
    enum: ['idle', 'active', 'returning', 'offline'],
    default: 'idle',
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 100,
  },
  currentLocation: {
    lat: { type: Number, required: true, default: 37.7749 },
    lng: { type: Number, required: true, default: -122.4194 },
  },
  assignedMissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission',
    default: null,
  },
  lastPing: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Drone', droneSchema);
