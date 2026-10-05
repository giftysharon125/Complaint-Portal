require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB().catch((err) => console.error('Initial DB connection error:', err.message));

// Ensure DB is connected for serverless invocations
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// --- Global middleware ---
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// --- Static files ---
// Uploaded complaint attachments
const uploadDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadDir));
// Frontend (HTML/CSS/JS) is served by the same Express server in development
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// --- API routes ---
app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'Complaint Management System API is running' })
);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));

// API 404
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// --- Central error handler (never leaks internal errors) ---
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Multer (file upload) errors
  if (err.name === 'MulterError') {
    const msg =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Attachment is too large. Maximum size is 5 MB.'
        : 'Attachment upload failed: ' + err.code;
    return res.status(400).json({ success: false, message: msg });
  }
  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const first = Object.values(err.errors)[0];
    return res.status(400).json({ success: false, message: first ? first.message : 'Invalid data provided' });
  }
  // Duplicate key (unique index) errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const label = field === 'studentId' ? 'Student ID' : field.charAt(0).toUpperCase() + field.slice(1);
    return res.status(400).json({ success: false, message: `${label} is already registered` });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid identifier format' });
  }
  // Our own ApiError -> safe to expose message
  if (err.statusCode) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  // Unexpected errors -> generic message only
  console.error('[ERROR]', err.message);
  return res.status(500).json({ success: false, message: 'Something went wrong on the server' });
});
const PORT_RAW = parseInt(process.env.PORT, 10);
const PORT = Number.isInteger(PORT_RAW) && PORT_RAW > 0 ? PORT_RAW : 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
