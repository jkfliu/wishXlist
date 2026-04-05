// Import dependencies
const mongoose = require("mongoose");

// Define the schema
const wishListItemSchema = new mongoose.Schema ({
  user_name: {
    type: String,
    required: true
  },
  item_name: {
    type: String,
    required: true
  }, 
  model: {
    type: String
  },
  price: {
    type: Number
  },
  store: {
    type: String
  },
  item_create_date: {
    type: Date
  },
  item_modified_date: {
    type: Date
  },
  gifter_user_name: {
    type: String
  },
  gifted_date: {
    type: Date
  },
  visibleToGroups: {
    type: [String],
    default: []
  },
});

// Export the schema (rather than the model), to allow multiple connections to the DB
module.exports = wishListItemSchema;