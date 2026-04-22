import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard";

// Protected route
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" />;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Update state when token changes
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    window.location.href = "/";
  };

  return (
    <BrowserRouter>
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 25px",
          background: "#0f0f0f",
          borderBottom: "1px solid #1f1f1f"
        }}
      >
        {/* LEFT: TITLE */}
        <Link
          to="/"
          style={{
            textDecoration: "none",
            color: "#00ff88",
            fontSize: "20px",
            fontWeight: "bold"
          }}
        >
          BunkRide
        </Link>

        {/* RIGHT: NAV ITEMS */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {!isLoggedIn ? (
            <Link
              to="/"
              style={{
                textDecoration: "none",
                color: "white"
              }}
            >
              Login
            </Link>
          ) : (
            <>
              <Link
                to="/dashboard"
                style={{
                  textDecoration: "none",
                  color: "white"
                }}
              >
                Dashboard
              </Link>

              <span
                onClick={handleLogout}
                style={{
                  cursor: "pointer",
                  color: "#ff4d4d",
                  fontWeight: "bold"
                }}
              >
                Logout
              </span>
            </>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;