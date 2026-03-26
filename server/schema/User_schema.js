const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId:    { type: String, required: true, unique: true },
  username:    { type: String, required: true, unique: true },  // full email address
  displayName: { type: String },
});

// Export the schema (rather than the model), to allow the connection to be specified in index.js
module.exports = userSchema;
