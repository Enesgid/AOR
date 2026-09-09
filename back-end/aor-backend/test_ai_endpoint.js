require('dotenv').config();

const mongoose = require('mongoose');

const {
  refreshUniversityIntelligence,
} = require('./controllers/aiController');

(async () => {
  // Connect to MongoDB so controller DB calls work (if available)
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aor_database', {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('Connected to MongoDB for test runner');
  } catch (err) {
    console.warn('MongoDB test connection failed:', err.message);
  }

  // Mock express req/res
  const req = {
    user: { role: 'Director', id: '000000000000000000000000' },
  };

  const res = {
    status(code) {
      this._status = code;
      return this;
    },
    json(payload) {
      console.log('RESPONSE STATUS:', this._status || 200);
      console.log('RESPONSE BODY:', JSON.stringify(payload, null, 2));
      return payload;
    },
  };

  try {
    await refreshUniversityIntelligence(req, res);
    process.exit(0);
  } catch (err) {
    console.error('Test endpoint error:', err);
    process.exit(1);
  }
})();
