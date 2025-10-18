const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema(
  {
    notification: {
      type: String,
      required: true
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("notification", notificationSchema);
