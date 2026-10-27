require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route Imports
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const droneRoutes = require('./routes/droneRoutes');
const missionRoutes = require('./routes/missionRoutes');
const detectionRoutes = require('./routes/detectionRoutes');
const alertRoutes = require('./routes/alertRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();

// Connect to Database (with automatic embedded fallback if local Mongo is inactive)
connectDB();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploaded drone imagery
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Tactical Banner
console.log('==================================================');
console.log('  AEROSENTRY // DISASTER RESPONSE COMMAND BACKEND ');
console.log('  CLASSIFICATION: TACTICAL / EMERGENCY DEFENSE    ');
console.log('==================================================');

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/drones', droneRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/detections', detectionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/stats', statsRoutes);

// Root Status
app.get('/', (req, res) => {
  res.json({
    system: 'AeroSentry Disaster Response Command API',
    status: 'ONLINE',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Central Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[+] Command Center API operational on port ${PORT} [http://localhost:${PORT}]`);
  console.log(`[+] Recon uploads served from: ${uploadsPath}`);
});

// Graceful termination handling
process.on('SIGINT', () => {
  console.log('[*] SIGINT received. Shutting down Command Center gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

module.exports = app;
