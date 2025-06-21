const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
  },
  profileName: {
    type: String,
    required: true,
    trim: true,
  },
  profilePicture: {
    type: String,
    default: "",
  },
  branch: {
    type: String,
    required: true,
    enum: [
      "Computer Science",
      "Mechanical Engineering",
      "Electrical Engineering",
      "Civil Engineering",
      "Electronics and Communication",
      "Information Technology",
      "Chemical Engineering",
      "Other",
    ],
  },
  academicYear: {
    type: String,
    required: true,
    enum: ["1st", "2nd", "3rd", "4th"],
  },
  collegeName: {
    type: String,
    default: "Vignan Institute Of Information Technology",
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  authProvider: {
    type: String,
    enum: ["email", "google"],
    default: "email",
  },
  favorites: [
    {
      bookId: String,
      title: String,
      author: String,
      condition: String,
      description: String,
      images: [
        {
          data: String,
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      ownerId: String,
      ownerName: String,
      ownerEmail: String,
      ownerPhone: String,
      createdAt: Date,
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", UserSchema);
