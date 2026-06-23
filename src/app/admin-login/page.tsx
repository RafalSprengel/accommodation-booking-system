"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  requestPasswordResetByUsername,
  requestUsernameReminderByEmail,
} from "@/actions/resetAdminPasswordAction";
import Button from "@/app/_components/UI/Button/Button";
import { authClient } from "@/lib/auth-client";
import styles from "./login.module.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isUsernameReminderLoading, setIsUsernameReminderLoading] =
    useState(false);
  const [isForgotPasswordFieldVisible, setIsForgotPasswordFieldVisible] =
    useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleResetPassword = async () => {
    if (username.trim() === "") {
      setError("First enter your username");
      setSuccessMsg(null);
      return;
    }
    setError(null);
    setSuccessMsg(null);

    if (isResetLoading) return;

    setIsResetLoading(true);
    try {
      const res = await requestPasswordResetByUsername(username);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMsg(
          "If the username exists, a password reset link has been sent to the associated email.",
        );
        setIsForgotPasswordFieldVisible(false);
      }
    } catch (err) {
      setError("An error occurred while sending the link.");
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleUsernameReminder = async () => {
    if (recoveryEmail.trim() === "") {
      setError("First enter your email address");
      setSuccessMsg(null);
      return;
    }
    setError(null);
    setSuccessMsg(null);

    if (isUsernameReminderLoading) return;

    setIsUsernameReminderLoading(true);
    try {
      const res = await requestUsernameReminderByEmail(recoveryEmail);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMsg(
          "If the email address exists, the username has been sent to the associated inbox.",
        );
        setIsForgotPasswordFieldVisible(false);
      }
    } catch (err) {
      setError("An error occurred while sending the username.");
    } finally {
      setIsUsernameReminderLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;

    setError(null);
    setIsLoggingIn(true);
    try {
      const { error: signInError } = await authClient.signIn.username({
        username,
        password,
        callbackURL: "/admin",
      });
      if (signInError) {
        if (
          signInError.message === "Invalid username" ||
          signInError.message === "Invalid username or password" ||
          signInError.message === "Invalid email or password"
        ) {
          setError("Invalid username or password");
          return;
        }

        setError(signInError.message || "An error occurred during login");
        return;
      }
      router.push("/admin");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className={styles.page}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <h1 className={styles.title}>Admin Panel</h1>
        <p className={styles.subtitle}>Log in to continue</p>

        {error && <p className={styles.error}>{error}</p>}
        {successMsg && <p className={styles.success}>{successMsg}</p>}

        <label className={styles.label} htmlFor="username">
          Username
        </label>
        <input
          id="username"
          className={styles.input}
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          disabled={isLoggingIn}
          placeholder="Enter username"
        />

        <label className={styles.label} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          disabled={isLoggingIn}
          placeholder="Enter password"
        />
        <div
          onClick={() =>
            setIsForgotPasswordFieldVisible(!isForgotPasswordFieldVisible)
          }
          className={styles.forgotPassword}
        >
          I don't remember my username or password
        </div>
        {isForgotPasswordFieldVisible && (
          <>
            <div
              onClick={handleResetPassword}
              aria-disabled={isResetLoading}
              className={styles.forgotPasswordInfo}
            >
              {isResetLoading
                ? "Sending link..."
                : "Click here to receive a password reset link to the email associated with the account"}
            </div>
            <input
              id="recovery-email"
              className={styles.input}
              type="email"
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
              autoComplete="email"
              placeholder="Enter email address associated with the account"
              disabled={isLoggingIn || isUsernameReminderLoading}
            />
            <div
              onClick={handleUsernameReminder}
              aria-disabled={isUsernameReminderLoading}
              className={styles.forgotPasswordInfo}
            >
              {isUsernameReminderLoading
                ? "Sending username..."
                : "Send username to the email address associated with the account"}
            </div>
          </>
        )}

        <Button type="submit" fullWidth disabled={isLoggingIn}>
          {isLoggingIn ? (
            <span className={styles.loadingWrapper}>
              <span className={styles.spinner} />
              Logging in...
            </span>
          ) : (
            "Log in"
          )}
        </Button>
      </form>
    </div>
  );
}
