const mongoose = require('mongoose');

async function connectDB(uri) {
  if (!uri) {
    console.warn('MONGODB URI is missing — skipping DB connection');
    return false;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('MongoDB connected successfully');
    return true;
  } catch (err) {
    console.warn(`MongoDB connection failed: ${err.message}`);
    return false;
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (err) {
    console.warn(`MongoDB disconnect error: ${err.message}`);
  }
}

module.exports = { connectDB, disconnectDB };