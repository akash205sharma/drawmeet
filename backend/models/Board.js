const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  actions: [{ type: mongoose.Schema.Types.Mixed }], // event sourcing
  notes: [{
    text: String,
    color: String,
    x: Number,
    y: Number,
    user: String,
    createdAt: { type: Date, default: Date.now }
  }],
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Board', BoardSchema);
