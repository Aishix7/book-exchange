const mongoose = require("mongoose");

const ExchangeBookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  author: {
    type: String,
    required: true,
    trim: true,
  },
  condition: {
    type: String,
    required: true,
    enum: ["Excellent", "Good", "Fair", "Poor"],
  },
  description: {
    type: String,
    default: "",
  },
  images: [
    {
      data: {
        type: String,
        required: true,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  ownerId: {
    type: String,
    required: true,
  },
  ownerName: {
    type: String,
    required: true,
  },
  ownerEmail: {
    type: String,
    required: true,
  },
  ownerPhone: {
    type: String,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ExchangeBook", ExchangeBookSchema);
