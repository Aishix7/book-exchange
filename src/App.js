"use client";

import { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import Signup from "./components/Signup";
import MainDashboard from "./components/MainDashboard";
import "./App.css";

function AuthWrapper() {
  const [isLogin, setIsLogin] = useState(true);
  const { currentUser } = useAuth();

  // If user is authenticated, show the main dashboard
  if (currentUser) {
    return <MainDashboard />;
  }

  // If user is not authenticated, show login/signup forms
  return isLogin ? (
    <Login onToggleMode={() => setIsLogin(false)} />
  ) : (
    <Signup onToggleMode={() => setIsLogin(true)} />
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
}

export default App;
