const mongoose = require('mongoose');

const eventLogSchema = new mongoose.Schema({
  type:      { type: String, required: true },  // 'login' | 'pageview' | 'api'
  username:  { type: String },                  // null for unauthenticated requests
  path:      { type: String },
  status:    { type: Number },                  // HTTP status code
  duration:  { type: Number },                  // ms
  responseBody: { type: String },               // error string for 4xx/5xx responses
  timestamp: { type: Date, default: Date.now },
});

eventLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // TTL: auto-delete after 90 days
eventLogSchema.index({ type: 1, timestamp: 1 });

module.exports = eventLogSchema;
