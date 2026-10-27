const mongoose = require('mongoose');

const detectionSchema = new mongoose.Schema({
  missionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission',
    required: false,
    default: null,
  },
  droneId: {
    type: String,
    required: false,
    default: 'UAV-01',
  },
  imageUrl: {
    type: String,
    required: true,
  },
  processedImageUrl: {
    type: String,
    required: false,
  },
  boundingBoxes: [{
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    w: { type: Number, required: true },
    h: { type: Number, required: true },
    confidence: { type: Number, required: true },
  }],
  victimCount: {
    type: Number,
    default: 0,
  },
  gpsLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  status: {
    type: String,
    enum: ['unconfirmed', 'confirmed', 'false_positive', 'rescued'],
    default: 'unconfirmed',
  },
  detectedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Detection', detectionSchema);
