"use client";
import { useState } from "react";
import Button from "@/app/_components/UI/Button/Button";
import "./page.css";

export default function AdminRegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = () => {
    // Admin registration logic
  };

  const handleSignIn = () => {
    // Admin login logic
  };

  return (
    <div className="auth-container">
      <h2>Admin Registration</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="buttons">
        <Button onClick={handleSignUp}>Sign up</Button>
        <Button variant="secondary" onClick={handleSignIn}>
          Sign in
        </Button>
      </div>
    </div>
  );
}
