import React, { useState } from "react";
import axios from "axios";

function Login() {
  const [isSignup, setIsSignup] = useState(false);

  const [data, setData] = useState({
    username: "",
    password: "",
    role: "rider"
  });

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const switchToDriver = () => {
    setData({ ...data, role: "driver" });
  };

  const switchToRider = () => {
    setData({ ...data, role: "rider" });
  };

  // 🔴 Validation function
  const validate = () => {
    const usernameRegex = /^.{6,}$/; // min 6 chars
    const passwordRegex = /^(?=.*[A-Z]).{4,}$/; // 1 uppercase + min 4 chars

    if (!data.username || !data.password) {
      alert("Fill all fields");
      return false;
    }

    if (!usernameRegex.test(data.username)) {
      alert("Username must be at least 6 characters");
      return false;
    }

    if (!passwordRegex.test(data.password)) {
      alert("Password must have at least 1 uppercase letter and be minimum 4 characters");
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      const res = await axios.post("http://localhost:5000/login", {
        username: data.username,
        password: data.password
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);

      alert("Login Success");
      window.location.href = "/dashboard";
    } catch (err) {
      alert(err.response?.data?.msg || "Invalid Credentials");
    }
  };

  const handleSignup = async () => {
    if (!validate()) return;

    try {
      await axios.post("http://localhost:5000/signup", data);

      alert("Account Created! Now login");

      setIsSignup(false);
      setData({
        username: "",
        password: "",
        role: "rider"
      });
    } catch (err) {
      alert(err.response?.data?.msg || "Signup failed");
    }
  };

  const containerStyle = {
    background: "#0d0d0d",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px"
  };

  const cardStyle = {
    background: "#161616",
    padding: "32px",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #2a2a2a",
    background: "#111",
    color: "#fff"
  };

  const buttonStyle = {
    width: "100%",
    padding: "14px",
    background: "#00c853",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer"
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={{ textAlign: "center", color: "#fff" }}>
          {isSignup
            ? "Create Account"
            : data.role === "driver"
            ? "Driver Login"
            : "Login"}
        </h2>

        <input
          name="username"
          placeholder="Username"
          value={data.username}
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={data.password}
          onChange={handleChange}
          style={inputStyle}
        />

        <button
          onClick={isSignup ? handleSignup : handleLogin}
          style={buttonStyle}
        >
          {isSignup ? "Create Account" : "Login"}
        </button>

        <p style={{ textAlign: "center", color: "#aaa" }}>
          {isSignup ? "Already have account?" : "New user?"}{" "}
          <span
            onClick={() => setIsSignup(!isSignup)}
            style={{ color: "#00c853", cursor: "pointer" }}
          >
            {isSignup ? "Login" : "Signup"}
          </span>
        </p>

        {!isSignup && (
          <div style={{ textAlign: "center" }}>
            {data.role !== "driver" ? (
              <span
                onClick={switchToDriver}
                style={{ color: "#00c853", cursor: "pointer" }}
              >
                Switch to Driver Login
              </span>
            ) : (
              <span
                onClick={switchToRider}
                style={{ color: "#00c853", cursor: "pointer" }}
              >
                Switch to Rider Login
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;