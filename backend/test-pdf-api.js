const http = require('http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  const user = await User.findOne({ role: 'employee' });
  if (!user) {
    console.log('No Employee user found');
    process.exit(1);
  }
  
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  console.log('Generated token for Employee. Testing PDF endpoint...');
  
  const pdfOptions = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/ai/export-pdf?token=${token}`,
    method: 'GET'
  };
  
  const pdfReq = http.request(pdfOptions, (pdfRes) => {
    console.log('PDF Status:', pdfRes.statusCode);
    console.log('PDF Headers:', pdfRes.headers);
    let chunks = [];
    pdfRes.on('data', chunk => chunks.push(chunk));
    pdfRes.on('end', () => {
      const full = Buffer.concat(chunks);
      fs.writeFileSync('test-output.pdf', full);
      console.log('Wrote test-output.pdf, size:', full.length);
      process.exit(0);
    });
  });
  pdfReq.end();
});
