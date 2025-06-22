"use client";

import { useState } from "react";
import Profile from "./Profile";
import FindBooks from "./FindBooks";
import ReadyToExchange from "./ReadyToExchange";
import Favorites from "./Favorites";
import { useAuth } from "../contexts/AuthContext";
import "./Dashboard.css";

function Dashboard() {
  const [activeTab, setActiveTab] = useState("find-books");
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const renderActiveComponent = () => {
    switch (activeTab) {
      case "find-books":
        return <FindBooks />;
      case "ready-to-exchange":
        return <ReadyToExchange />;
      case "favorites":
        return <Favorites />;
      case "profile":
        return <Profile />;
      default:
        return <FindBooks />;
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>xBook Exchange Platform</h1>
          <div className="user-info">
            <span>Welcome, {currentUser?.email}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>

        <nav className="dashboard-nav">
          <button
            className={
              activeTab === "find-books" ? "nav-btn active" : "nav-btn"
            }
            onClick={() => setActiveTab("find-books")}
          >
            Find Books
          </button>
          <button
            className={
              activeTab === "ready-to-exchange" ? "nav-btn active" : "nav-btn"
            }
            onClick={() => setActiveTab("ready-to-exchange")}
          >
            Ready to Exchange
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

      <main className="dashboard-main">{renderActiveComponent()}</main>
    </div>
  );
}

export default Dashboard;
