const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId:    { type: String, unique: true, sparse: true },
  facebookId:  { type: String, unique: true, sparse: true },
  username:    { type: String, required: true, unique: true },  // full email address
  displayName: { type: String },
  createdAt:   { type: Date, default: Date.now },
});

// Export the schema (rather than the model), to allow the connection to be specified in index.js
module.exports = userSchema;
