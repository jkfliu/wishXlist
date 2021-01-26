// Import dependencies
const mongoose = require("mongoose");

// Define the schema
const userSchema = new mongoose.Schema ({
  username: {
    type: String,
    required: true
  },
  first_name: {
    type: String,
  }, 
  last_name: {
    type: String
  },
  email: {
    type: String
  },
});

// Export the schema (rather than the model), to allow multiple connections to the DB
module.exports = userSchema;