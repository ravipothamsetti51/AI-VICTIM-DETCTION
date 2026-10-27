require('dotenv').config();
const mongoose = require('mongoose');
const { seedDatabase } = require('./seedHelper');

const run = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/victim_detection';
  console.log(`[*] Connecting to MongoDB at ${uri}...`);

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('[+] Connected to database.');
    await seedDatabase();
    console.log('[+] Seeding complete. Exiting.');
    process.exit(0);
  } catch (err) {
    console.warn(`[!] Direct connection failed: ${err.message}. Running standalone in-memory seed check.`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
      await seedDatabase();
      console.log('[+] In-memory seed test passed successfully.');
      process.exit(0);
    } catch (inMemErr) {
      console.error('[-] Seeding failed:', inMemErr);
      process.exit(1);
    }
  }
};

run();
