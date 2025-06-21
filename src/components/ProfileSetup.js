"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import "./Auth.css";

function ProfileSetup({ onComplete }) {
  const [profile, setProfile] = useState({
    profileName: "",
    branch: "",
    academicYear: "",
    phoneNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { currentUser } = useAuth();

  useEffect(() => {
    // For Google users, pre-fill name if available
    if (currentUser?.displayName) {
      setProfile((prev) => ({
        ...prev,
        profileName: currentUser.displayName,
      }));
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = await currentUser.getIdToken();
      await axios.post(
        "http://localhost:5000/api/profile",
        {
          ...profile,
          email: currentUser.email,
          authProvider: "google",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onComplete();
    } catch (err) {
      setError(
        "Failed to create profile: " +
          (err.response?.data?.error || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Complete Your Profile</h2>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "2rem" }}>
          Please complete your profile to start using Book-Swap
        </p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <input
              type="text"
              name="profileName"
              placeholder="Full Name *"
              value={profile.profileName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <select
              name="branch"
              value={profile.branch}
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
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <select
              name="academicYear"
              value={profile.academicYear}
              onChange={handleInputChange}
              required
            >
              <option value="">Academic Year *</option>
              <option value="1st">1st Year</option>
              <option value="2nd">2nd Year</option>
              <option value="3rd">3rd Year</option>
              <option value="4th">4th Year</option>
            </select>
          </div>

          <div className="form-group">
            <input
              type="tel"
              name="phoneNumber"
              placeholder="Phone Number *"
              value={profile.phoneNumber}
              onChange={handleInputChange}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading && <span className="loading-spinner"></span>}
            {loading ? "Creating Profile..." : "Complete Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfileSetup;
