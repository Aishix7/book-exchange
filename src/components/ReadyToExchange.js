"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

function ReadyToExchange() {
  const [books, setBooks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    condition: "",
    description: "",
    branch: "",
    academicYear: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { currentUser } = useAuth();

  const fetchBooks = useCallback(async () => {
    try {
      const token = await currentUser.getIdToken();
      const res = await axios.get(
        "https://book-exchange-q07q.onrender.com/api/exchange-books",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBooks(res.data);
    } catch (err) {
      setError("Failed to fetch books");
    }
  }, [currentUser]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBook((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = await currentUser.getIdToken();
      await axios.post(
        "https://book-exchange-q07q.onrender.com/api/exchange-books",
        newBook,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setNewBook({
        title: "",
        author: "",
        condition: "",
        description: "",
        branch: "",
        academicYear: "",
      });
      setShowForm(false);
      fetchBooks();
    } catch (err) {
      setError("Failed to add book: " + err.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const deleteBook = async (bookId) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;

    try {
      const token = await currentUser.getIdToken();
      await axios.delete(
        `https://book-exchange-q07q.onrender.com/api/exchange-books/${bookId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchBooks();
    } catch (err) {
      setError("Failed to delete book");
    }
  };

  return (
    <div className="ready-to-exchange-container">
      <div className="header-section">
        <h2>Ready to Exchange</h2>
        <button onClick={() => setShowForm(!showForm)} className="add-book-btn">
          {showForm ? "Cancel" : "Add New Book"}
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
              <option value="">Select Condition *</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>

            <select
              name="branch"
              value={newBook.branch}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Branch *</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Mechanical Engineering">
                Mechanical Engineering
              </option>
              <option value="Electrical Engineering">
                Electrical Engineering
              </option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Electronics and Communication">
                Electronics and Communication
              </option>
              <option value="Information Technology">
                Information Technology
              </option>
              <option value="Chemical Engineering">Chemical Engineering</option>
            </select>
          </div>

          <div className="form-row">
            <select
              name="academicYear"
              value={newBook.academicYear}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Year *</option>
              <option value="1st">1st Year</option>
              <option value="2nd">2nd Year</option>
              <option value="3rd">3rd Year</option>
              <option value="4th">4th Year</option>
            </select>
          </div>

          <textarea
            name="description"
            placeholder="Description (Optional)"
            value={newBook.description}
            onChange={handleInputChange}
            rows="3"
          />

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Adding..." : "Add Book"}
          </button>
        </form>
      )}

      <div className="books-grid">
        {books.map((book) => (
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
            <p>
              <strong>Listed:</strong>{" "}
              {new Date(book.createdAt).toLocaleDateString()}
            </p>

            <button onClick={() => deleteBook(book._id)} className="delete-btn">
              Delete
            </button>
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

export default ReadyToExchange;
