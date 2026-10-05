const mongoose = require('mongoose');

// Simple sequence counter used to generate sequential complaint IDs (CMP-YYYY-0001)
const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);
