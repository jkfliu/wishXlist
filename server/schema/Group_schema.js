const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name:       { type: String, required: true, unique: true },
  inviteCode: { type: String, required: true, unique: true },
  members:    { type: [String], default: [] },  // array of username (email) strings
  admins:     { type: [String], default: [] },  // usernames with admin privileges; creator is first admin
  createdAt:  { type: Date, default: Date.now },
});

groupSchema.index({ members: 1 });

module.exports = groupSchema;
