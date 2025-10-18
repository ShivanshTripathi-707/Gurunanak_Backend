const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    alternateNumber: {
      type: String,
      default: "",
      trim: true,
    },
    dateOfJoin: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false, 
    },
    complains: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "complains",
      }
    ],

    securityDeposit: {
      type: String,
      default: "to be updated",
      trim: true,
    },
    rentRecieved: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("residents", userSchema);
