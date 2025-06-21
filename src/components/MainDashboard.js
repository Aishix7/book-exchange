"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import BookDetails from "./BookDetails";
import ProfileSetup from "./ProfileSetup";
import "./MainDashboard.css";
import Profile from "./Profile";

function MainDashboard() {
  const [activeTab, setActiveTab] = useState("search");
  const [books, setBooks] = useState([]);
  const [myBooks, setMyBooks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [favoritedBooks, setFavoritedBooks] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const { currentUser, logout } = useAuth();

  const fetchAllBooks = useCallback(async () => {
    try {
      const token = await currentUser.getIdToken();
      const res = await axios.get("http://localhost:5000/api/find-books", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBooks(res.data);
    } catch (err) {
      console.error("Failed to fetch books:", err);
    }
  }, [currentUser]);

  const fetchMyBooks = useCallback(async () => {
    try {
      const token = await currentUser.getIdToken();
      const res = await axios.get("http://localhost:5000/api/exchange-books", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyBooks(res.data);
    } catch (err) {
      console.error("Failed to fetch my books:", err);
    }
  }, [currentUser]);

  const fetchFavorites = useCallback(async () => {
    try {
      const token = await currentUser.getIdToken();
      const res = await axios.get("http://localhost:5000/api/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites(res.data);

      // Create a set of favorited book IDs for quick lookup
      const favoritedIds = new Set(res.data.map((fav) => fav.bookId));
      setFavoritedBooks(favoritedIds);
    } catch (err) {
      console.error("Failed to fetch favorites:", err);
    }
  }, [currentUser]);

  const fetchProfile = useCallback(async () => {
    try {
      const token = await currentUser.getIdToken();
      const res = await axios.get("http://localhost:5000/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserProfile(res.data);
    } catch (err) {
      setShowProfileSetup(true);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchProfile();
      fetchAllBooks();
      fetchMyBooks();
      fetchFavorites();
    }
  }, [currentUser, fetchProfile, fetchAllBooks, fetchMyBooks, fetchFavorites]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (showProfileSetup) {
    return <ProfileSetup onComplete={() => setShowProfileSetup(false)} />;
  }

  if (selectedBook) {
    return (
      <BookDetails book={selectedBook} onBack={() => setSelectedBook(null)} />
    );
  }

  return (
    <div className="main-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>📚 Book-Swap</h1>
          </div>

          {activeTab === "search" && (
            <div className="search-section">
              <input
                type="text"
                placeholder="Search by Title, Author name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          )}

          <div className="user-section">
            <span>
              Welcome, {userProfile?.profileName || currentUser?.email}
            </span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>

        <nav className="main-nav">
          <button
            className={activeTab === "search" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveTab("search")}
          >
            Search Books
          </button>
          <button
            className={activeTab === "exchange" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveTab("exchange")}
          >
            Ready for Exchange
          </button>
          <button
            className={activeTab === "favorites" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveTab("favorites")}
          >
            Favorites ({favorites.length})
          </button>
          <button
            className={activeTab === "profile" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
        </nav>
      </header>

      <main className="dashboard-content">
        {activeTab === "search" && (
          <SearchBooks
            books={filteredBooks}
            onBookClick={setSelectedBook}
            onAddToFavorites={fetchFavorites}
            favoritedBooks={favoritedBooks}
          />
        )}
        {activeTab === "exchange" && (
          <ReadyForExchange books={myBooks} onRefresh={fetchMyBooks} />
        )}
        {activeTab === "favorites" && (
          <FavoriteBooks
            favorites={favorites}
            onRefresh={fetchFavorites}
            onBookClick={setSelectedBook}
          />
        )}
        {activeTab === "profile" && (
          <UserProfile profile={userProfile} onUpdate={fetchProfile} />
        )}
      </main>
    </div>
  );
}

// Search Books Component
function SearchBooks({ books, onBookClick, onAddToFavorites, favoritedBooks }) {
  const { currentUser } = useAuth();

  const toggleFavorite = async (book, e) => {
    e.stopPropagation();

    try {
      const token = await currentUser.getIdToken();

      if (favoritedBooks.has(book._id)) {
        // Remove from favorites
        await axios.delete(`http://localhost:5000/api/favorites/${book._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Add to favorites
        await axios.post(
          "http://localhost:5000/api/favorites",
          { bookId: book._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      onAddToFavorites();
    } catch (err) {
      alert(
        "Failed to update favorites: " +
          (err.response?.data?.error || err.message)
      );
    }
  };

  return (
    <div className="search-books">
      <div className="books-grid">
        {books.map((book) => (
          <div
            key={book._id}
            className="book-card"
            onClick={() => onBookClick(book)}
          >
            <div className="book-image">
              {book.images && book.images.length > 0 ? (
                <img
                  src={book.images[0].data || "/placeholder.svg"}
                  alt={book.title}
                />
              ) : (
                <img
                  src="/placeholder.svg?height=200&width=150"
                  alt={book.title}
                />
              )}
              <div
                className={`condition-badge ${book.condition.toLowerCase()}`}
              >
                {book.condition}
              </div>
            </div>
            <div className="book-info">
              <h3>{book.title}</h3>
              <p className="author">{book.author}</p>
              <p className="owner">by {book.ownerName}</p>
            </div>
            <button
              className={`favorite-btn ${
                favoritedBooks.has(book._id) ? "favorited" : ""
              }`}
              onClick={(e) => toggleFavorite(book, e)}
              title={
                favoritedBooks.has(book._id)
                  ? "Remove from favorites"
                  : "Add to favorites"
              }
            >
              {favoritedBooks.has(book._id) ? "🔖" : "🤍"}
            </button>
          </div>
        ))}
      </div>
      {books.length === 0 && (
        <p className="no-books">No books found matching your search.</p>
      )}
    </div>
  );
}

// Ready for Exchange Component
function ReadyForExchange({ books, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    condition: "",
    description: "",
  });
  const [bookImages, setBookImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { currentUser } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBook((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    if (bookImages.length + files.length > 3) {
      setError("Maximum 3 images allowed");
      return;
    }

    files.forEach((file) => {
      if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setBookImages((prev) => [...prev, event.target.result]);
        };
        reader.readAsDataURL(file);
      } else {
        setError("Please select only JPG or PNG images");
      }
    });
  };

  const removeImage = (index) => {
    setBookImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (bookImages.length === 0) {
      setError("At least one image is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await currentUser.getIdToken();
      await axios.post(
        "http://localhost:5000/api/exchange-books",
        {
          ...newBook,
          images: bookImages,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Reset form
      setNewBook({ title: "", author: "", condition: "", description: "" });
      setBookImages([]);
      setShowForm(false);
      onRefresh();
    } catch (err) {
      setError(
        "Failed to add book: " + (err.response?.data?.error || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteBook = async (bookId) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;
    try {
      const token = await currentUser.getIdToken();
      await axios.delete(`http://localhost:5000/api/exchange-books/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onRefresh();
    } catch (err) {
      alert("Failed to delete book");
    }
  };

  const deleteBookImage = async (bookId, imageIndex) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;
    try {
      const token = await currentUser.getIdToken();
      await axios.delete(
        `http://localhost:5000/api/exchange-books/${bookId}/images/${imageIndex}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onRefresh();
    } catch (err) {
      alert(
        "Failed to delete image: " + (err.response?.data?.error || err.message)
      );
    }
  };

  return (
    <div className="ready-exchange">
      <div className="section-header">
        <h2>My Books for Exchange</h2>
        <button onClick={() => setShowForm(!showForm)} className="add-btn">
          {showForm ? "Cancel" : "Add Book"}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="add-book-form">
          <div className="form-row">
            <input
              type="text"
              name="title"
              placeholder="Book Title *"
              value={newBook.title}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="author"
              placeholder="Author *"
              value={newBook.author}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-row">
            <select
              name="condition"
              value={newBook.condition}
              onChange={handleInputChange}
              required
            >
              <option value="">Condition *</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
          </div>

          <textarea
            name="description"
            placeholder="Description (Optional)"
            value={newBook.description}
            onChange={handleInputChange}
            rows="3"
          />

          {/* Image Upload Section */}
          <div className="image-upload-section">
            <label>Book Images * (1-3 images required)</label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={handleImageUpload}
              disabled={bookImages.length >= 3}
            />

            {bookImages.length > 0 && (
              <div className="uploaded-images">
                {bookImages.map((image, index) => (
                  <div key={index} className="image-preview">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Book ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="remove-image-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="image-info">
              {bookImages.length}/3 images uploaded{" "}
              {bookImages.length === 0 && "(At least 1 required)"}
            </p>
          </div>

          <button type="submit" disabled={loading || bookImages.length === 0}>
            {loading ? "Adding Book..." : "Add Book"}
          </button>
        </form>
      )}

      <div className="books-grid">
        {books.map((book) => (
          <div key={book._id} className="my-book-card">
            <div className="book-image-container">
              {book.images && book.images.length > 0 ? (
                <div className="book-images">
                  <img
                    src={book.images[0].data || "/placeholder.svg"}
                    alt={book.title}
                    className="main-image"
                  />
                  {book.images.length > 1 && (
                    <div className="image-count">+{book.images.length - 1}</div>
                  )}
                </div>
              ) : (
                <img
                  src="/placeholder.svg?height=200&width=150"
                  alt={book.title}
                />
              )}
              <div
                className={`condition-badge ${book.condition.toLowerCase()}`}
              >
                {book.condition}
              </div>
            </div>

            <div className="book-info">
              <h3>{book.title}</h3>
              <p>{book.author}</p>
              <p>Listed: {new Date(book.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="book-actions">
              {book.images && book.images.length > 1 && (
                <div className="image-management">
                  <p>Manage Images:</p>
                  <div className="image-thumbnails">
                    {book.images.map((image, index) => (
                      <div key={index} className="thumbnail-container">
                        <img
                          src={image.data || "/placeholder.svg"}
                          alt={`${book.title} ${index + 1}`}
                          className="thumbnail"
                        />
                        {book.images.length > 1 && (
                          <button
                            onClick={() => deleteBookImage(book._id, index)}
                            className="delete-image-btn"
                            title="Delete this image"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => deleteBook(book._id)}
                className="delete-btn"
              >
                Delete Book
              </button>
            </div>
          </div>
        ))}
      </div>

      {books.length === 0 && (
        <p className="no-books">
          You haven't listed any books for exchange yet.
        </p>
      )}
    </div>
  );
}

// Enhanced Favorite Books Component
function FavoriteBooks({ favorites, onRefresh, onBookClick }) {
  const { currentUser } = useAuth();

  const removeFavorite = async (bookId, e) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Are you sure you want to remove this book from favorites?"
      )
    )
      return;

    try {
      const token = await currentUser.getIdToken();
      await axios.delete(`http://localhost:5000/api/favorites/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onRefresh();
    } catch (err) {
      alert("Failed to remove favorite");
    }
  };

  return (
    <div className="favorites">
      <h2>My Favorite Books</h2>
      <div className="books-grid">
        {favorites.map((favorite) => (
          <div
            key={favorite.bookId}
            className="book-card favorite-book-card"
            onClick={() => onBookClick(favorite)}
          >
            <div className="book-image">
              {favorite.images && favorite.images.length > 0 ? (
                <img
                  src={favorite.images[0].data || "/placeholder.svg"}
                  alt={favorite.title}
                />
              ) : (
                <img
                  src="/placeholder.svg?height=200&width=150"
                  alt={favorite.title}
                />
              )}
              <div
                className={`condition-badge ${favorite.condition.toLowerCase()}`}
              >
                {favorite.condition}
              </div>
              {favorite.images && favorite.images.length > 1 && (
                <div className="image-count">+{favorite.images.length - 1}</div>
              )}
            </div>
            <div className="book-info">
              <h3>{favorite.title}</h3>
              <p className="author">{favorite.author}</p>
              <p className="owner">by {favorite.ownerName}</p>
              <p className="added-date">
                Added: {new Date(favorite.addedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="favorite-actions">
              <span className="favorited-indicator">🔖</span>
              <button
                onClick={(e) => removeFavorite(favorite.bookId, e)}
                className="remove-favorite-btn"
                title="Remove from favorites"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      {favorites.length === 0 && (
        <p className="no-books">No favorite books yet. Start adding some!</p>
      )}
    </div>
  );
}

// User Profile Component - Use the full Profile component
function UserProfile({ profile, onUpdate }) {
  return <Profile />;
}

export default MainDashboard;
