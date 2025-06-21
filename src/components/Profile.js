"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import "./Auth.css";

function Profile() {
  const [profile, setProfile] = useState({
    profileName: "",
    branch: "",
    academicYear: "",
    phoneNumber: "",
    profilePicture: "",
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [cropData, setCropData] = useState({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();

  const fetchProfile = useCallback(async () => {
    try {
      const token = await currentUser.getIdToken();
      const res = await axios.get(
        "https://book-exchange-q07q.onrender.com/api/profile",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProfile(res.data);
    } catch (err) {
      console.log("Profile not found");
    }
  }, [currentUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = await currentUser.getIdToken();
      await axios.post(
        "https://book-exchange-q07q.onrender.com/api/profile",
        { ...profile, email: currentUser.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Profile updated successfully!");
      setEditing(false);

      // Refresh the profile data
      fetchProfile();
    } catch (err) {
      setError(
        "Failed to update profile: " +
          (err.response?.data?.error || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Image Upload Functions
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target.result);
        setShowImageUpload(true);
        setCropData({ x: 0, y: 0, width: 200, height: 200 });
      };
      reader.readAsDataURL(file);
    } else {
      setError("Please select a JPG or PNG image file");
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    const rect = imageRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left - cropData.x,
      y: e.clientY - rect.top - cropData.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragStart.x;
    const newY = e.clientY - rect.top - dragStart.y;

    const maxX = rect.width - cropData.width;
    const maxY = rect.height - cropData.height;

    setCropData((prev) => ({
      ...prev,
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const cropImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const image = imageRef.current;

    if (!image || !ctx) return;

    canvas.width = cropData.width;
    canvas.height = cropData.height;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    ctx.drawImage(
      image,
      cropData.x * scaleX,
      cropData.y * scaleY,
      cropData.width * scaleX,
      cropData.height * scaleY,
      0,
      0,
      cropData.width,
      cropData.height
    );

    const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCroppedImage(croppedDataUrl);
  };

  const uploadProfilePicture = async () => {
    if (!croppedImage) return;

    setLoading(true);
    try {
      const token = await currentUser.getIdToken();
      await axios.post(
        "https://book-exchange-q07q.onrender.com/api/profile",
        { ...profile, profilePicture: croppedImage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile((prev) => ({ ...prev, profilePicture: croppedImage }));
      setShowImageUpload(false);
      setSelectedImage(null);
      setCroppedImage(null);
      setSuccess("Profile picture updated successfully!");

      // Refresh the profile data
      fetchProfile();
    } catch (err) {
      setError("Failed to update profile picture");
    } finally {
      setLoading(false);
    }
  };

  const removeProfilePicture = async () => {
    if (
      !window.confirm("Are you sure you want to remove your profile picture?")
    )
      return;

    setLoading(true);
    try {
      const token = await currentUser.getIdToken();
      await axios.delete(
        "https://book-exchange-q07q.onrender.com/api/profile/picture",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProfile((prev) => ({ ...prev, profilePicture: "" }));
      setSuccess("Profile picture removed successfully!");

      // Refresh the profile data
      fetchProfile();
    } catch (err) {
      setError("Failed to remove profile picture");
    } finally {
      setLoading(false);
    }
  };

  if (editing) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <h2>Edit Profile</h2>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

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
                <option value="Chemical Engineering">
                  Chemical Engineering
                </option>
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

            <div className="form-buttons">
              <button type="submit" disabled={loading} className="submit-btn">
                {loading && <span className="loading-spinner"></span>}
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>My Profile</h2>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <div className="profile-section">
          {/* Profile Picture Section */}
          <div className="profile-picture-section">
            <div className="profile-picture-container">
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture || "/placeholder.svg"}
                  alt="Profile"
                  className="profile-picture"
                />
              ) : (
                <div className="profile-picture-placeholder">
                  <span>📷</span>
                </div>
              )}
            </div>
            <div className="profile-picture-buttons">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="upload-btn"
                disabled={loading}
              >
                {profile.profilePicture ? "Change Picture" : "Upload Picture"}
              </button>
              {profile.profilePicture && (
                <button
                  onClick={removeProfilePicture}
                  className="remove-btn"
                  disabled={loading}
                >
                  {loading ? "Removing..." : "Remove Picture"}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleImageSelect}
              style={{ display: "none" }}
            />
          </div>

          {/* Profile Information */}
          <div className="profile-info">
            <div className="info-item">
              <label>Name:</label>
              <span>{profile.profileName || "Not set"}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{profile.email}</span>
            </div>
            <div className="info-item">
              <label>Branch:</label>
              <span>{profile.branch || "Not set"}</span>
            </div>
            <div className="info-item">
              <label>Academic Year:</label>
              <span>{profile.academicYear || "Not set"}</span>
            </div>
            <div className="info-item">
              <label>Phone:</label>
              <span>{profile.phoneNumber || "Not set"}</span>
            </div>
            <div className="info-item">
              <label>College:</label>
              <span>Vignan Institute Of Information Technology</span>
            </div>
          </div>

          <button onClick={() => setEditing(true)} className="submit-btn">
            Edit Profile
          </button>
        </div>

        {/* Image Upload Modal */}
        {showImageUpload && (
          <div className="image-upload-modal">
            <div className="modal-content">
              <h3>Crop Your Profile Picture</h3>
              <div className="crop-container">
                <div
                  className="image-container"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <img
                    ref={imageRef}
                    src={selectedImage || "/placeholder.svg"}
                    alt="Selected"
                    className="crop-image"
                    draggable={false}
                  />
                  <div
                    className="crop-overlay"
                    style={{
                      left: cropData.x,
                      top: cropData.y,
                      width: cropData.width,
                      height: cropData.height,
                    }}
                    onMouseDown={handleMouseDown}
                  />
                </div>
                <div className="crop-preview">
                  <h4>Preview:</h4>
                  <canvas
                    ref={canvasRef}
                    className="preview-canvas"
                    width={cropData.width}
                    height={cropData.height}
                  />
                </div>
              </div>
              <div className="modal-buttons">
                <button onClick={cropImage} className="crop-btn">
                  Crop Image
                </button>
                {croppedImage && (
                  <button
                    onClick={uploadProfilePicture}
                    disabled={loading}
                    className="submit-btn"
                  >
                    {loading ? "Uploading..." : "Save Picture"}
                  </button>
                )}
                <button
                  onClick={() => setShowImageUpload(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
