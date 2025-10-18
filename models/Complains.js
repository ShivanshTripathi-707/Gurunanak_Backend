const mongoose = require("mongoose");

const complainSchema = mongoose.Schema(
  {
    complains: {
      type: String,
      required: true
    },
    isRead: {      
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("complains", complainSchema);
