"use client";

import { useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import "./Auth.css";

function Signup({ onToggleMode }) {
  const [formData, setFormData] = useState({
    name: "",
    year: "",
    branch: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    if (formData.password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    try {
      setError("");
      setLoading(true);

      // Create Firebase account
      const userCredential = await signup(formData.email, formData.password);

      // Immediately save profile data to MongoDB
      const token = await userCredential.user.getIdToken();
      await axios.post(
        "https://book-exchange-q07q.onrender.com/api/profile",
        {
          profileName: formData.name,
          branch: formData.branch,
          academicYear: formData.year,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          authProvider: "email",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      setError("Failed to create account: " + error.message);
    }
    setLoading(false);
  }

  async function handleGoogleSignup() {
    try {
      setError("");
      setLoading(true);
      await loginWithGoogle();
    } catch (error) {
      setError("Failed to sign up with Google: " + error.message);
    }
    setLoading(false);
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Your Account</h2>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "2rem" }}>
          Join Book-Swap to exchange books with your classmates
        </p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder="Full Name *"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <select
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Academic Year *</option>
              <option value="1st">1st Year</option>
              <option value="2nd">2nd Year</option>
              <option value="3rd">3rd Year</option>
              <option value="4th">4th Year</option>
            </select>
          </div>

          <div className="form-group">
            <select
              name="branch"
              value={formData.branch}
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
            <input
              type="email"
              name="email"
              placeholder="College Email ID *"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="tel"
              name="phoneNumber"
              placeholder="Phone Number *"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password (min 6 characters) *"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength="6"
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password *"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
            />
          </div>

          <button disabled={loading} type="submit" className="submit-btn">
            {loading && <span className="loading-spinner"></span>}
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="divider">OR</div>

        <button
          className="google-btn"
          onClick={handleGoogleSignup}
          disabled={loading}
        >
          <svg className="google-icon" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="toggle-section">
          <p>Already have an account?</p>
          <button className="link-btn" onClick={onToggleMode}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

export default Signup;
