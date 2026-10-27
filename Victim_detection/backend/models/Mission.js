const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Mission title is required'],
    trim: true,
  },
  disasterType: {
    type: String,
    enum: ['earthquake', 'flood', 'structural_collapse', 'wildfire', 'landslide', 'other'],
    default: 'earthquake',
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, default: 'Incident Zone Alpha' },
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed', 'aborted'],
    default: 'planning',
  },
  assignedDrones: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drone',
  }],
  startedAt: {
    type: Date,
    default: null,
  },
  endedAt: {
    type: Date,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

module.exports = mongoose.model('Mission', missionSchema);
