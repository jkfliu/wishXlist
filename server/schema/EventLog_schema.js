const mongoose = require('mongoose');

const eventLogSchema = new mongoose.Schema({
  type:      { type: String, required: true },  // 'login' | 'pageview' | 'api'
  username:  { type: String },                  // null for unauthenticated requests
  path:      { type: String },
  status:    { type: Number },                  // HTTP status code
  duration:  { type: Number },                  // ms
  timestamp: { type: Date, default: Date.now },
});

eventLogSchema.index({ timestamp: 1 });
eventLogSchema.index({ type: 1, timestamp: 1 });

module.exports = eventLogSchema;
