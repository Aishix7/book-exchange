"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import "./BookDetails.css";

function BookDetails({ book, onBack }) {
  const [ownerBooks, setOwnerBooks] = useState([]);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { currentUser } = useAuth();

  const fetchOwnerBooks = useCallback(async () => {
    try {
      const token = await currentUser.getIdToken();
      const res = await axios.get("http://localhost:5000/api/find-books", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ownerOtherBooks = res.data.filter(
        (b) => b.ownerId === book.ownerId && b._id !== book._id
      );
      setOwnerBooks(ownerOtherBooks);
    } catch (err) {
      console.error("Failed to fetch owner books:", err);
    }
  }, [currentUser, book]);

  const fetchOwnerProfile = useCallback(async () => {
    try {
      const token = await currentUser.getIdToken();
      const res = await axios.get(
        `http://localhost:5000/api/profile/${book.ownerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOwnerProfile(res.data);
    } catch (err) {
      console.error("Failed to fetch owner profile:", err);
    }
  }, [currentUser, book.ownerId]);

  useEffect(() => {
    fetchOwnerBooks();
    fetchOwnerProfile();
  }, [fetchOwnerBooks, fetchOwnerProfile]);

  const nextImage = () => {
    if (book.images && book.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % book.images.length);
    }
  };

  const prevImage = () => {
    if (book.images && book.images.length > 1) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + book.images.length) % book.images.length
      );
    }
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  return (
    <div className="book-details">
      <button onClick={onBack} className="back-btn">
        ← Back to Search
      </button>

      <div className="book-detail-content">
        <div className="book-main">
          <div className="book-image-large">
            {book.images && book.images.length > 0 ? (
              <div className="image-gallery">
                <div className="main-image-container">
                  <img
                    src={
                      book.images[currentImageIndex]?.data || "/placeholder.svg"
                    }
                    alt={`${book.title} ${currentImageIndex + 1}`}
                    className="main-book-image"
                  />
                  <div
                    className={`condition-badge ${book.condition.toLowerCase()}`}
                  >
                    {book.condition}
                  </div>

                  {book.images.length > 1 && (
                    <>
                      <button className="image-nav prev" onClick={prevImage}>
                        ‹
                      </button>
                      <button className="image-nav next" onClick={nextImage}>
                        ›
                      </button>
                      <div className="image-counter">
                        {currentImageIndex + 1} / {book.images.length}
                      </div>
                    </>
                  )}
                </div>

                {book.images.length > 1 && (
                  <div className="image-thumbnails">
                    {book.images.map((image, index) => (
                      <img
                        key={index}
                        src={image.data || "/placeholder.svg"}
                        alt={`${book.title} thumbnail ${index + 1}`}
                        className={`thumbnail ${
                          index === currentImageIndex ? "active" : ""
                        }`}
                        onClick={() => goToImage(index)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="no-image">
                <img
                  src="/placeholder.svg?height=300&width=200"
                  alt={book.title}
                />
                <div
                  className={`condition-badge ${book.condition.toLowerCase()}`}
                >
                  {book.condition}
                </div>
              </div>
            )}
          </div>

          <div className="book-info-detailed">
            <h1>{book.title}</h1>
            <h2>by {book.author}</h2>
            <div className="book-details-grid">
              <div className="detail-item">
                <strong>Condition:</strong>
                <span
                  className={`condition-text ${book.condition.toLowerCase()}`}
                >
                  {book.condition}
                </span>
              </div>
              <div className="detail-item">
                <strong>Branch:</strong> {book.branch || "Not specified"}
              </div>
              <div className="detail-item">
                <strong>Academic Year:</strong>{" "}
                {book.academicYear || "Not specified"}
              </div>
              <div className="detail-item">
                <strong>Listed:</strong>{" "}
                {new Date(book.createdAt).toLocaleDateString()}
              </div>
            </div>
            {book.description && (
              <div className="book-description">
                <strong>Description:</strong>
                <p>{book.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="owner-section">
          <h3>Book Owner</h3>
          <div className="owner-info-detailed">
            <div className="owner-header">
              <div className="owner-avatar">
                {ownerProfile?.profilePicture ? (
                  <img
                    src={ownerProfile.profilePicture || "/placeholder.svg"}
                    alt={`${book.ownerName}'s profile`}
                    className="profile-picture"
                  />
                ) : (
                  <div className="profile-placeholder">
                    <span>{book.ownerName.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div className="owner-basic-info">
                <h4>{book.ownerName}</h4>
                {ownerProfile && (
                  <div className="owner-academic-info">
                    <p>
                      <strong>Branch:</strong> {ownerProfile.branch}
                    </p>
                    <p>
                      <strong>Year:</strong> {ownerProfile.academicYear}
                    </p>
                    <p>
                      <strong>College:</strong>{" "}
                      {ownerProfile.collegeName ||
                        "Vignan Institute Of Information Technology"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="contact-info">
              <div className="contact-details">
                <p>
                  <strong>Email:</strong> {book.ownerEmail}
                </p>
                <p>
                  <strong>Phone:</strong> {book.ownerPhone}
                </p>
              </div>
              <div className="contact-buttons">
                <a
                  href={`mailto:${book.ownerEmail}`}
                  className="contact-btn email"
                >
                  📧 Email
                </a>
                <a
                  href={`tel:${book.ownerPhone}`}
                  className="contact-btn phone"
                >
                  📞 Call
                </a>
              </div>
            </div>
          </div>
        </div>

        {ownerBooks.length > 0 && (
          <div className="owner-other-books">
            <h3>Other Books by {book.ownerName}</h3>
            <div className="books-grid-small">
              {ownerBooks.map((ownerBook) => (
                <div key={ownerBook._id} className="small-book-card">
                  <div className="small-book-image">
                    {ownerBook.images && ownerBook.images.length > 0 ? (
                      <img
                        src={ownerBook.images[0].data || "/placeholder.svg"}
                        alt={ownerBook.title}
                      />
                    ) : (
                      <img
                        src="/placeholder.svg?height=150&width=100"
                        alt={ownerBook.title}
                      />
                    )}
                    <span
                      className={`condition-small ${ownerBook.condition.toLowerCase()}`}
                    >
                      {ownerBook.condition}
                    </span>
                  </div>
                  <div className="small-book-info">
                    <h4>{ownerBook.title}</h4>
                    <p>{ownerBook.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookDetails;
