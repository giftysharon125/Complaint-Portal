const Counter = require('../models/Counter');

// Generates a unique sequential complaint ID like CMP-2026-0001 using an
// atomic findOneAndUpdate on a counter document (safe under concurrency).
const generateComplaintId = async () => {
  const year = new Date().getFullYear();
  const key = `complaint_${year}`;
  const counter = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `CMP-${year}-${String(counter.seq).padStart(4, '0')}`;
};

module.exports = generateComplaintId;
