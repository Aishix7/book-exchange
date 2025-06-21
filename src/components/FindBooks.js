"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

function FindBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({ branch: "", academicYear: "" });
  const { currentUser } = useAuth();

  const fetchBooks = useCallback(async () => {
    try {
      const token = await currentUser.getIdToken();
      const res = await axios.get("http://localhost:5000/api/find-books", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBooks(res.data);
    } catch (err) {
      setError("Failed to fetch books");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

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
    } catch (err) {
      alert("Failed to add to favorites: " + err.response?.data?.error);
    }
  };

  const filteredBooks = books.filter((book) => {
    return (
      (!filter.branch || book.branch === filter.branch) &&
      (!filter.academicYear || book.academicYear === filter.academicYear)
    );
  });

  if (loading) return <div className="loading">Loading books...</div>;

  return (
    <div className="find-books-container">
      <h2>Find Books for Exchange</h2>

      <div className="filters">
        <select
          value={filter.branch}
          onChange={(e) => setFilter({ ...filter, branch: e.target.value })}
        >
          <option value="">All Branches</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Mechanical Engineering">Mechanical Engineering</option>
          <option value="Electrical Engineering">Electrical Engineering</option>
          <option value="Civil Engineering">Civil Engineering</option>
          <option value="Electronics and Communication">
            Electronics and Communication
          </option>
          <option value="Information Technology">Information Technology</option>
          <option value="Chemical Engineering">Chemical Engineering</option>
        </select>

        <select
          value={filter.academicYear}
          onChange={(e) =>
            setFilter({ ...filter, academicYear: e.target.value })
          }
        >
          <option value="">All Years</option>
          <option value="1st">1st Year</option>
          <option value="2nd">2nd Year</option>
          <option value="3rd">3rd Year</option>
          <option value="4th">4th Year</option>
        </select>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="books-grid">
        {filteredBooks.map((book) => (
          <div key={book._id} className="book-card">
            <h3>{book.title}</h3>
            <p>
              <strong>Author:</strong> {book.author}
            </p>
            <p>
              <strong>Condition:</strong> {book.condition}
            </p>
            <p>
              <strong>Branch:</strong> {book.branch}
            </p>
            <p>
              <strong>Year:</strong> {book.academicYear}
            </p>
            {book.description && (
              <p>
                <strong>Description:</strong> {book.description}
              </p>
            )}

            <div className="owner-info">
              <h4>Contact Owner:</h4>
              <p>
                <strong>Name:</strong> {book.ownerName}
              </p>
              <div className="contact-buttons">
                <a
                  href={`mailto:${book.ownerEmail}`}
                  className="contact-btn email-btn"
                >
                  Email
                </a>
                <a
                  href={`tel:${book.ownerPhone}`}
                  className="contact-btn phone-btn"
                >
                  Call
                </a>
                <button
                  onClick={() => addToFavorites(book)}
                  className="contact-btn favorite-btn"
                >
                  Add to Favorites
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBooks.length === 0 && !loading && (
        <p className="no-books">No books available for exchange.</p>
      )}
    </div>
  );
}

export default FindBooks;
