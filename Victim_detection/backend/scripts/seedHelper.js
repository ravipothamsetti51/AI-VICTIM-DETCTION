const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Drone = require('../models/Drone');
const Mission = require('../models/Mission');
const Detection = require('../models/Detection');
const Alert = require('../models/Alert');

const ensureUploadsExist = () => {
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Create sample dummy drone reconnaissance images if not already present
  const sample1 = path.join(uploadDir, 'sample-drone-1.jpg');
  const sample2 = path.join(uploadDir, 'sample-drone-2.jpg');
  const sample3 = path.join(uploadDir, 'sample-drone-3.jpg');

  // Minimal 1x1 or sample dummy buffer if needed
  const dummyBuffer = Buffer.from(
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
    'base64'
  );

  if (!fs.existsSync(sample1)) fs.writeFileSync(sample1, dummyBuffer);
  if (!fs.existsSync(sample2)) fs.writeFileSync(sample2, dummyBuffer);
  if (!fs.existsSync(sample3)) fs.writeFileSync(sample3, dummyBuffer);
};

const seedDatabase = async () => {
  ensureUploadsExist();
  console.log('[*] Purging existing database collections for clean seed...');
  await Promise.all([
    User.deleteMany({}),
    Drone.deleteMany({}),
    Mission.deleteMany({}),
    Detection.deleteMany({}),
    Alert.deleteMany({}),
  ]);

  console.log('[*] Seeding tactical operators...');
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('Admin@123', salt);
  const operatorHash = await bcrypt.hash('Operator@123', salt);
  const rescuerHash = await bcrypt.hash('Rescuer@123', salt);

  const [admin, operator, rescuer] = await User.create([
    {
      name: 'Commander Sarah Vance',
      email: 'admin@aerosentry.io',
      passwordHash: adminHash,
      role: 'admin',
    },
    {
      name: 'Operator Marcus Chen',
      email: 'operator@aerosentry.io',
      passwordHash: operatorHash,
      role: 'operator',
    },
    {
      name: 'Specialist Elena Rostova',
      email: 'rescuer@aerosentry.io',
      passwordHash: rescuerHash,
      role: 'rescuer',
    },
  ]);

  console.log('[*] Seeding disaster operations...');
  const mission1 = await Mission.create({
    title: 'Operation Iron Phoenix - Sector 4 Seismic Zone',
    disasterType: 'earthquake',
    location: {
      lat: 27.7172,
      lng: 85.3240,
      address: 'Central District, Urban Rubble Grid Delta',
    },
    status: 'active',
    createdBy: admin._id,
    startedAt: new Date(Date.now() - 3600 * 1000 * 4),
  });

  const mission2 = await Mission.create({
    title: 'Operation Monsoon Sentinel - River Basin Flash Flood',
    disasterType: 'flood',
    location: {
      lat: 27.7010,
      lng: 85.3415,
      address: 'Eastern Lowlands Drainage Basin',
    },
    status: 'active',
    createdBy: operator._id,
    startedAt: new Date(Date.now() - 3600 * 1000 * 2),
  });

  const mission3 = await Mission.create({
    title: 'Operation Titan Fall - Industrial Plant Structural Collapse',
    disasterType: 'structural_collapse',
    location: {
      lat: 27.7280,
      lng: 85.3110,
      address: 'Northern Logistics Zone Warehouse 7',
    },
    status: 'planning',
    createdBy: admin._id,
  });

  const mission4 = await Mission.create({
    title: 'Operation Cliff Watch - Ridge Slope Landslide Area',
    disasterType: 'landslide',
    location: {
      lat: 27.6920,
      lng: 85.3040,
      address: 'Southern Ridge Pass Mile 14',
    },
    status: 'completed',
    createdBy: operator._id,
    startedAt: new Date(Date.now() - 3600 * 1000 * 48),
    endedAt: new Date(Date.now() - 3600 * 1000 * 12),
  });

  console.log('[*] Seeding UAV Drone Fleet...');
  const drones = await Drone.create([
    {
      droneId: 'UAV-01',
      name: 'SkyRanger Alpha',
      model: 'AeroScout Hexa-FLIR X4',
      status: 'active',
      batteryLevel: 88,
      currentLocation: { lat: 27.7185, lng: 85.3262 },
      assignedMissionId: mission1._id,
      lastPing: new Date(),
    },
    {
      droneId: 'UAV-02',
      name: 'ThermalHawk Brazo',
      model: 'DJI Matrice 300 RTK SAR',
      status: 'active',
      batteryLevel: 64,
      currentLocation: { lat: 27.7158, lng: 85.3218 },
      assignedMissionId: mission1._id,
      lastPing: new Date(),
    },
    {
      droneId: 'UAV-03',
      name: 'Valkyrie Recon-3',
      model: 'Skydio X2D Autonomous AI',
      status: 'active',
      batteryLevel: 91,
      currentLocation: { lat: 27.7022, lng: 85.3430 },
      assignedMissionId: mission2._id,
      lastPing: new Date(),
    },
    {
      droneId: 'UAV-04',
      name: 'Sentinel Echo',
      model: 'Autel EVO Max 4T Quad',
      status: 'idle',
      batteryLevel: 100,
      currentLocation: { lat: 27.7120, lng: 85.3280 },
      assignedMissionId: null,
      lastPing: new Date(),
    },
    {
      droneId: 'UAV-05',
      name: 'GhostEye Scout',
      model: 'Parrot Anafi USA GOV',
      status: 'returning',
      batteryLevel: 17, // Low battery!
      currentLocation: { lat: 27.6995, lng: 85.3395 },
      assignedMissionId: mission2._id,
      lastPing: new Date(),
    },
    {
      droneId: 'UAV-06',
      name: 'Apex Heavy Lifter',
      model: 'Freefly Alta X Payload SAR',
      status: 'offline',
      batteryLevel: 0,
      currentLocation: { lat: 27.7310, lng: 85.3020 },
      assignedMissionId: null,
      lastPing: new Date(Date.now() - 3600 * 1000 * 5),
    },
  ]);

  // Link assigned drones to missions
  mission1.assignedDrones = [drones[0]._id, drones[1]._id];
  await mission1.save();

  mission2.assignedDrones = [drones[2]._id, drones[4]._id];
  await mission2.save();

  console.log('[*] Seeding AI Detection Events...');
  await Detection.create([
    {
      missionId: mission1._id,
      droneId: 'UAV-01',
      imageUrl: '/uploads/sample-drone-1.jpg',
      processedImageUrl: '/uploads/sample-drone-1.jpg',
      boundingBoxes: [
        { x: 140, y: 95, w: 75, h: 160, confidence: 0.94 },
        { x: 280, y: 110, w: 80, h: 155, confidence: 0.89 },
      ],
      victimCount: 2,
      gpsLocation: { lat: 27.7188, lng: 85.3265 },
      status: 'unconfirmed',
      detectedAt: new Date(Date.now() - 1000 * 60 * 18),
    },
    {
      missionId: mission1._id,
      droneId: 'UAV-02',
      imageUrl: '/uploads/sample-drone-2.jpg',
      processedImageUrl: '/uploads/sample-drone-2.jpg',
      boundingBoxes: [
        { x: 210, y: 130, w: 90, h: 180, confidence: 0.96 },
      ],
      victimCount: 1,
      gpsLocation: { lat: 27.7152, lng: 85.3210 },
      status: 'confirmed',
      detectedAt: new Date(Date.now() - 1000 * 60 * 45),
    },
    {
      missionId: mission2._id,
      droneId: 'UAV-03',
      imageUrl: '/uploads/sample-drone-3.jpg',
      processedImageUrl: '/uploads/sample-drone-3.jpg',
      boundingBoxes: [
        { x: 180, y: 160, w: 65, h: 135, confidence: 0.82 },
      ],
      victimCount: 1,
      gpsLocation: { lat: 27.7028, lng: 85.3435 },
      status: 'unconfirmed',
      detectedAt: new Date(Date.now() - 1000 * 60 * 8),
    },
    {
      missionId: mission1._id,
      droneId: 'UAV-01',
      imageUrl: '/uploads/sample-drone-1.jpg',
      processedImageUrl: '/uploads/sample-drone-1.jpg',
      boundingBoxes: [
        { x: 150, y: 200, w: 70, h: 140, confidence: 0.91 },
      ],
      victimCount: 1,
      gpsLocation: { lat: 27.7175, lng: 85.3235 },
      status: 'rescued',
      detectedAt: new Date(Date.now() - 1000 * 60 * 120),
    },
  ]);

  console.log('[*] Seeding Tactical Alerts...');
  await Alert.create([
    {
      type: 'victim_detected',
      message: 'EMERGENCY DISPATCH: UAV [UAV-01] detected 2 potential victim(s) at [27.71880, 85.32650]. Triage verification required.',
      severity: 'critical',
      relatedMissionId: mission1._id,
      relatedDroneId: 'UAV-01',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 18),
    },
    {
      type: 'drone_low_battery',
      message: 'CRITICAL TELEMETRY: Drone UAV-05 battery at 17%. Immediate RTH (Return-To-Home) required.',
      severity: 'high',
      relatedMissionId: mission2._id,
      relatedDroneId: 'UAV-05',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 12),
    },
    {
      type: 'victim_detected',
      message: 'PRIORITY FLASH: UAV [UAV-03] spotted 1 isolated survivor on rooftop flood beacon [27.70280, 85.34350].',
      severity: 'high',
      relatedMissionId: mission2._id,
      relatedDroneId: 'UAV-03',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 8),
    },
    {
      type: 'drone_offline',
      message: 'COMM LINK SEVERED: Drone UAV-06 went offline in operational sector.',
      severity: 'critical',
      relatedDroneId: 'UAV-06',
      isRead: true,
      createdAt: new Date(Date.now() - 3600 * 1000 * 5),
    },
    {
      type: 'mission_critical',
      message: 'NEW OPERATION INITIATED: [Operation Iron Phoenix - Sector 4 Seismic Zone] (EARTHQUAKE).',
      severity: 'medium',
      relatedMissionId: mission1._id,
      isRead: true,
      createdAt: new Date(Date.now() - 3600 * 1000 * 4),
    },
  ]);

  console.log('[+] Tactical database successfully seeded with demo operations, UAV fleet, and triage records!');
};

const autoSeedIfEmpty = async () => {
  const count = await User.countDocuments();
  if (count === 0) {
    console.log('[*] Empty database detected. Performing automated tactical seeding...');
    await seedDatabase();
  }
};

module.exports = { seedDatabase, autoSeedIfEmpty };
