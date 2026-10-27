const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function testPipeline() {
  console.log('==================================================');
  console.log('  TESTING FULL END-TO-END PIPELINE (NO DOCKER)   ');
  console.log('==================================================');

  // Step 1: Login as Operator
  console.log('\n[*] 1. Authenticating as Operator (operator@aerosentry.io)...');
  const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
    email: 'operator@aerosentry.io',
    password: 'Operator@123'
  });
  console.log('[+] Login success! Token received. Operator role:', loginRes.data.user.role);
  const token = loginRes.data.token;

  // Step 2: Upload Drone Recon Image
  console.log('\n[*] 2. Simulating Drone UAV-01 Reconnaissance Image Upload...');
  const form = new FormData();
  const testImagePath = path.join(__dirname, '../../sample-imagery/drone_recon_alpha.jpg');
  form.append('image', fs.createReadStream(testImagePath));
  form.append('droneId', 'UAV-01');
  form.append('lat', '27.71882');
  form.append('lng', '85.32654');
  form.append('confidence_threshold', '0.2');

  const uploadRes = await axios.post('http://localhost:5000/api/detections/upload', form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${token}`
    }
  });

  console.log('[+] Upload & AI Detection finished!');
  console.log('    - Detected Victims:', uploadRes.data.data.victimCount);
  console.log('    - Bounding Boxes Count:', uploadRes.data.data.boundingBoxes.length);
  console.log('    - Raw Image URL:', uploadRes.data.data.imageUrl);
  console.log('    - Processed Image URL:', uploadRes.data.data.processedImageUrl);
  console.log('    - GPS Coordinates:', uploadRes.data.data.gpsLocation);
  console.log('    - AI Metrics:', uploadRes.data.aiMetrics);
  if (uploadRes.data.alert) {
    console.log('    - Auto-generated Emergency Alert:', uploadRes.data.alert.message);
  }

  // Step 3: Rescuer Triage Action (Confirm Victim)
  console.log('\n[*] 3. Testing Rescuer Triage Action on Detection ID:', uploadRes.data.data._id);
  const patchRes = await axios.patch(
    `http://localhost:5000/api/detections/${uploadRes.data.data._id}/status`,
    { status: 'confirmed' },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log('[+] Triage status updated to:', patchRes.data.data.status);

  // Step 4: Verify Alerts Matrix
  console.log('\n[*] 4. Fetching Emergency Alerts Matrix...');
  const alertsRes = await axios.get('http://localhost:5000/api/alerts?limit=5', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('[+] Alerts Count:', alertsRes.data.count, '| Total Unread:', alertsRes.data.unreadCount);
  console.log('    Latest Alert:', alertsRes.data.data[0]?.message);

  console.log('\n==================================================');
  console.log('  ALL PIPELINE INTEGRATION TESTS PASSED 100%!     ');
  console.log('==================================================');
}

testPipeline().catch(err => {
  console.error('[-] Test failed:', err.response?.data || err.message);
  process.exit(1);
});
