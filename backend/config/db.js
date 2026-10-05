const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/complaint_portal';
  try {
    const conn = await mongoose.connect(uri);
    isConnected = true;
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    if (!process.env.VERCEL) {
      console.error('Make sure MongoDB is running (e.g. run `mongod` or start the MongoDB service).');
      process.exit(1);
    }
    throw err;
  }
};

module.exports = connectDB;
