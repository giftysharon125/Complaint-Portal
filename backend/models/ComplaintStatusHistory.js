const mongoose = require('mongoose');
const { STATUSES } = require('../utils/constants');

const statusHistorySchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true,
    },
    status: { type: String, enum: STATUSES, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, trim: true, default: '', maxlength: 1000 },
    changedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

statusHistorySchema.index({ complaint: 1, changedAt: 1 });

module.exports = mongoose.model('ComplaintStatusHistory', statusHistorySchema);
