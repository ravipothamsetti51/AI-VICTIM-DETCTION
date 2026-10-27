const express = require('express');
const router = express.Router();
const axios = require('axios');
const mongoose = require('mongoose');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

router.get('/health', async (req, res) => {
  let aiHealth = { status: 'offline', error: null };

  try {
    const aiResp = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 3000 });
    aiHealth = aiResp.data;
  } catch (err) {
    aiHealth = { status: 'unreachable', error: err.message };
  }

  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.status(200).json({
    status: 'operational',
    service: 'aerosentry-backend-api',
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      name: mongoose.connection.name || 'victim_detection',
    },
    aiService: aiHealth,
  });
});

module.exports = router;
