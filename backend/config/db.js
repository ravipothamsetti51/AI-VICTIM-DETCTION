const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/victim_detection';

  try {
    // Attempt standard connection with 2s serverSelectionTimeoutMS
    console.log(`[*] Connecting to MongoDB at ${primaryUri}...`);
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[+] Successfully connected to MongoDB at ${primaryUri}`);
  } catch (err) {
    console.warn(`[!] Direct MongoDB connection failed (${err.message}).`);
    console.log(`[*] Initializing high-speed embedded MongoDB fallback...`);

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memoryUri = mongodInstance.getUri();
      
      await mongoose.connect(memoryUri);
      console.log(`[+] Embedded MongoDB server running and connected at ${memoryUri}`);

      // Auto seed memory db
      const { autoSeedIfEmpty } = require('../scripts/seedHelper');
      await autoSeedIfEmpty();
    } catch (fallbackErr) {
      console.error(`[-] Critical: Failed to establish database connection: ${fallbackErr.message}`);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (e) {
    console.error('Error during DB shutdown:', e);
  }
};

module.exports = { connectDB, disconnectDB };
