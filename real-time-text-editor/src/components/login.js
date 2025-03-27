import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css"; 

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

  
    const storedUser = localStorage.getItem(username);
    if (!storedUser) {
      alert("User not found!");
      return;
    }

    const { password: storedPassword } = JSON.parse(storedUser);

    
    if (password !== storedPassword) {
      alert("Invalid credentials!");
      return;
    }


    localStorage.setItem("username", username);
    navigate("/"); 
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      <p>
        No account? <a href="/signup">Sign up</a>
      </p>
      <p> <a href="/">Forgot Password?</a>
      </p>
    </div>
  );
}

export default Login;
