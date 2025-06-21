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
            Favorites
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
          />
        )}
        {activeTab === "exchange" && (
          <ReadyForExchange books={myBooks} onRefresh={fetchMyBooks} />
        )}
        {activeTab === "favorites" && (
          <FavoriteBooks favorites={favorites} onRefresh={fetchFavorites} />
        )}
        {activeTab === "profile" && (
          <UserProfile profile={userProfile} onUpdate={fetchProfile} />
        )}
      </main>
    </div>
  );
}

// Search Books Component
function SearchBooks({ books, onBookClick, onAddToFavorites }) {
  const { currentUser } = useAuth();

  const addToFavorites = async (book) => {
    try {
      const token = await currentUser.getIdToken();
      await axios.post(
        "http://localhost:5000/api/favorites",
        {
          bookId: book._id,
          title: book.title,
          author: book.author,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Added to favorites!");
      onAddToFavorites();
    } catch (err) {
      alert("Failed to add to favorites: " + err.response?.data?.error);
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
              <img
                src="/placeholder.svg?height=200&width=150"
                alt={book.title}
              />
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
              className="favorite-btn"
              onClick={(e) => {
                e.stopPropagation();
                addToFavorites(book);
              }}
            >
              ❤️
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
    branch: "",
    academicYear: "",
  });
  const { currentUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await currentUser.getIdToken();
      await axios.post("http://localhost:5000/api/exchange-books", newBook, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewBook({
        title: "",
        author: "",
        condition: "",
        description: "",
        branch: "",
        academicYear: "",
      });
      setShowForm(false);
      onRefresh();
    } catch (err) {
      alert("Failed to add book: " + err.response?.data?.error);
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

  return (
    <div className="ready-exchange">
      <div className="section-header">
        <h2>My Books for Exchange</h2>
        <button onClick={() => setShowForm(!showForm)} className="add-btn">
          {showForm ? "Cancel" : "Add Book"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="add-book-form">
          <div className="form-row">
            <input
              type="text"
              placeholder="Book Title *"
              value={newBook.title}
              onChange={(e) =>
                setNewBook({ ...newBook, title: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Author *"
              value={newBook.author}
              onChange={(e) =>
                setNewBook({ ...newBook, author: e.target.value })
              }
              required
            />
          </div>
          <div className="form-row">
            <select
              value={newBook.condition}
              onChange={(e) =>
                setNewBook({ ...newBook, condition: e.target.value })
              }
              required
            >
              <option value="">Condition *</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
            <select
              value={newBook.branch}
              onChange={(e) =>
                setNewBook({ ...newBook, branch: e.target.value })
              }
              required
            >
              <option value="">Branch *</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Mechanical Engineering">
                Mechanical Engineering
              </option>
              <option value="Information Technology">
                Information Technology
              </option>
            </select>
          </div>
          <select
            value={newBook.academicYear}
            onChange={(e) =>
              setNewBook({ ...newBook, academicYear: e.target.value })
            }
            required
          >
            <option value="">Academic Year *</option>
            <option value="1st">1st Year</option>
            <option value="2nd">2nd Year</option>
            <option value="3rd">3rd Year</option>
            <option value="4th">4th Year</option>
          </select>
          <textarea
            placeholder="Description (Optional)"
            value={newBook.description}
            onChange={(e) =>
              setNewBook({ ...newBook, description: e.target.value })
            }
          />
          <button type="submit">Add Book</button>
        </form>
      )}

      <div className="books-grid">
        {books.map((book) => (
          <div key={book._id} className="my-book-card">
            <div className="book-image">
              <img
                src="/placeholder.svg?height=200&width=150"
                alt={book.title}
              />
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
            <button onClick={() => deleteBook(book._id)} className="delete-btn">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Favorite Books Component
function FavoriteBooks({ favorites, onRefresh }) {
  const { currentUser } = useAuth();

  const removeFavorite = async (bookId) => {
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
          <div key={favorite.bookId} className="favorite-card">
            <div className="book-image">
              <img
                src="/placeholder.svg?height=200&width=150"
                alt={favorite.title}
              />
            </div>
            <div className="book-info">
              <h3>{favorite.title}</h3>
              <p>{favorite.author}</p>
              <p>Added: {new Date(favorite.addedAt).toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => removeFavorite(favorite.bookId)}
              className="remove-btn"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      {favorites.length === 0 && (
        <p className="no-books">No favorite books yet.</p>
      )}
    </div>
  );
}

// User Profile Component - Use the full Profile component
function UserProfile({ profile, onUpdate }) {
  return <Profile />;
}

export default MainDashboard;
