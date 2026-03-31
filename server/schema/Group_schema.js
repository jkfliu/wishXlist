const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name:       { type: String, required: true, unique: true },
  inviteCode: { type: String, required: true, unique: true },
  members:    { type: [String], default: [] },  // array of username (email) strings
  createdAt:  { type: Date, default: Date.now },
});

module.exports = groupSchema;
