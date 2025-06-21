const Book = require("./models/Book");
const User = require("./models/User");
const ExchangeBook = require("./models/ExchangeBook");
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increase limit for multiple base64 images
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Simple auth middleware for development
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const base64Payload = token.split(".")[1];
    const payload = JSON.parse(Buffer.from(base64Payload, "base64").toString());
    req.user = { uid: payload.user_id || payload.sub };
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
};

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Test Route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

// Original Book Routes (Keep existing functionality)
app.post("/api/books", authenticateUser, async (req, res) => {
  try {
    const { title, author, pages } = req.body;
    const book = new Book({
      title,
      author,
      pages,
      userId: req.user.uid,
    });
    await book.save();
    res.status(201).json(book);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/books", authenticateUser, async (req, res) => {
  try {
    const books = await Book.find({ userId: req.user.uid });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// Enhanced User Profile Routes
app.post("/api/profile", authenticateUser, async (req, res) => {
  try {
    const {
      profileName,
      branch,
      academicYear,
      phoneNumber,
      profilePicture,
      email,
      authProvider,
    } = req.body;

    let user = await User.findOne({ userId: req.user.uid });

    if (user) {
      // Update existing profile
      user.profileName = profileName;
      user.branch = branch;
      user.academicYear = academicYear;
      user.phoneNumber = phoneNumber;
      if (profilePicture !== undefined) user.profilePicture = profilePicture;
      if (authProvider) user.authProvider = authProvider;
      await user.save();
    } else {
      // Create new profile
      user = new User({
        userId: req.user.uid,
        email: email,
        profileName,
        branch,
        academicYear,
        phoneNumber,
        profilePicture: profilePicture || "",
        authProvider: authProvider || "email",
      });
      await user.save();
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/profile", authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.uid });
    if (!user) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Get profile by user ID (for viewing other users' profiles)
app.get("/api/profile/:userId", authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Return only public profile information
    const publicProfile = {
      profileName: user.profileName,
      profilePicture: user.profilePicture,
      branch: user.branch,
      academicYear: user.academicYear,
      collegeName: user.collegeName,
    };

    res.json(publicProfile);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Remove Profile Picture Route
app.delete("/api/profile/picture", authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.uid });
    if (!user) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Remove the profile picture
    user.profilePicture = "";
    await user.save();

    res.json({ message: "Profile picture removed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove profile picture" });
  }
});

// Exchange Book Routes
app.post("/api/exchange-books", authenticateUser, async (req, res) => {
  try {
    const { title, author, condition, description, images } = req.body;

    // Validate images
    if (!images || images.length === 0) {
      return res.status(400).json({ error: "At least one image is required" });
    }

    if (images.length > 3) {
      return res.status(400).json({ error: "Maximum 3 images allowed" });
    }

    // Get user profile for owner details
    const user = await User.findOne({ userId: req.user.uid });
    if (!user) {
      return res
        .status(400)
        .json({ error: "Please complete your profile first" });
    }

    const exchangeBook = new ExchangeBook({
      title,
      author,
      condition,
      description,
      images: images.map((img) => ({ data: img })),
      ownerId: req.user.uid,
      ownerName: user.profileName,
      ownerEmail: user.email,
      ownerPhone: user.phoneNumber,
    });

    await exchangeBook.save();
    res.status(201).json(exchangeBook);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/exchange-books", authenticateUser, async (req, res) => {
  try {
    const books = await ExchangeBook.find({
      ownerId: req.user.uid,
      isAvailable: true,
    });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch exchange books" });
  }
});

app.get("/api/find-books", authenticateUser, async (req, res) => {
  try {
    const books = await ExchangeBook.find({
      ownerId: { $ne: req.user.uid },
      isAvailable: true,
    });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch available books" });
  }
});

app.delete("/api/exchange-books/:id", authenticateUser, async (req, res) => {
  try {
    const book = await ExchangeBook.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user.uid,
    });

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete book" });
  }
});

// Delete specific image from book
app.delete(
  "/api/exchange-books/:id/images/:imageIndex",
  authenticateUser,
  async (req, res) => {
    try {
      const { id, imageIndex } = req.params;
      const book = await ExchangeBook.findOne({
        _id: id,
        ownerId: req.user.uid,
      });

      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }

      if (book.images.length <= 1) {
        return res
          .status(400)
          .json({
            error:
              "Cannot delete the last image. At least one image is required.",
          });
      }

      if (imageIndex < 0 || imageIndex >= book.images.length) {
        return res.status(400).json({ error: "Invalid image index" });
      }

      book.images.splice(imageIndex, 1);
      await book.save();

      res.json({ message: "Image deleted successfully", book });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete image" });
    }
  }
);

// Enhanced Favorites Routes
app.post("/api/favorites", authenticateUser, async (req, res) => {
  try {
    const { bookId } = req.body;

    // Get the complete book details
    const book = await ExchangeBook.findById(bookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    const user = await User.findOne({ userId: req.user.uid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already in favorites
    const existingFavorite = user.favorites.find(
      (fav) => fav.bookId === bookId
    );
    if (existingFavorite) {
      return res.status(400).json({ error: "Book already in favorites" });
    }

    // Store complete book information in favorites
    const favoriteBook = {
      bookId: book._id,
      title: book.title,
      author: book.author,
      condition: book.condition,
      description: book.description,
      images: book.images,
      ownerId: book.ownerId,
      ownerName: book.ownerName,
      ownerEmail: book.ownerEmail,
      ownerPhone: book.ownerPhone,
      createdAt: book.createdAt,
      addedAt: new Date(),
    };

    user.favorites.push(favoriteBook);
    await user.save();

    res.json({ message: "Added to favorites", favorite: favoriteBook });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/favorites/:bookId", authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.uid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.favorites = user.favorites.filter(
      (fav) => fav.bookId !== req.params.bookId
    );
    await user.save();

    res.json({ message: "Removed from favorites" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove from favorites" });
  }
});

app.get("/api/favorites", authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.uid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user.favorites);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

// Check if book is favorited
app.get("/api/favorites/check/:bookId", authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.uid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isFavorited = user.favorites.some(
      (fav) => fav.bookId === req.params.bookId
    );
    res.json({ isFavorited });
  } catch (error) {
    res.status(500).json({ error: "Failed to check favorite status" });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
