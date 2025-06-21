"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { currentUser } = useAuth();

  const fetchFavorites = useCallback(async () => {
    try {
      const token = await currentUser.getIdToken();
      const res = await axios.get("http://localhost:5000/api/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites(res.data);
    } catch (err) {
      setError("Failed to fetch favorites");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const removeFavorite = async (bookId) => {
    try {
      const token = await currentUser.getIdToken();
      await axios.delete(`http://localhost:5000/api/favorites/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFavorites();
    } catch (err) {
      setError("Failed to remove favorite");
    }
  };

  if (loading) return <div className="loading">Loading favorites...</div>;

  return (
    <div className="favorites-container">
      <h2>My Favorite Books</h2>

      {error && <div className="error">{error}</div>}

      <div className="books-grid">
        {favorites.map((favorite) => (
          <div key={favorite.bookId} className="book-card">
            <h3>{favorite.title}</h3>
            <p>
              <strong>Author:</strong> {favorite.author}
            </p>
            <p>
              <strong>Added:</strong>{" "}
              {new Date(favorite.addedAt).toLocaleDateString()}
            </p>

            <button
              onClick={() => removeFavorite(favorite.bookId)}
              className="remove-btn"
            >
              Remove from Favorites
            </button>
          </div>
        ))}
      </div>

      {favorites.length === 0 && (
        <p className="no-books">
          You haven't added any books to favorites yet.
        </p>
      )}
    </div>
  );
}

export default Favorites;
