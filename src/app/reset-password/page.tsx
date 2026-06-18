"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Button from "@/app/_components/UI/Button/Button";
import { authClient } from "@/lib/auth-client";
import styles from "./reset.module.css";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError(
        "Missing reset token. Make sure you are using the correct link from the email.",
      );
      return;
    }

    if (newPassword.length < 5) {
      setError("Password must be at least 5 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword,
        token,
      });

      if (resetError) {
        setError(
          resetError.message || "An error occurred while resetting the password.",
        );
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/admin-login");
        }, 3000);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles["reset-page"]}>
        <div className={styles["reset-page__form"]}>
          <h1 className={styles["reset-page__title"]}>Success!</h1>
          <p className={styles["reset-page__success"]}>
            Your password has been changed. You will be redirected to the
            login page shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles["reset-page"]}>
      <form
        className={styles["reset-page__form"]}
        onSubmit={handleSubmit}
        noValidate
      >
        <h1 className={styles["reset-page__title"]}>New Password</h1>
        <p className={styles["reset-page__subtitle"]}>
          Enter your new password below
        </p>

        {error && <p className={styles["reset-page__error"]}>{error}</p>}

        <div className={styles["reset-page__field"]}>
          <label className={styles["reset-page__label"]} htmlFor="newPassword">
            New password
          </label>
          <input
            id="newPassword"
            className={styles["reset-page__input"]}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={isLoading}
            placeholder="Enter new password"
          />
        </div>

        <div className={styles["reset-page__field"]}>
          <label
            className={styles["reset-page__label"]}
            htmlFor="confirmPassword"
          >
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            className={styles["reset-page__input"]}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
            placeholder="Repeat new password"
          />
        </div>

        <Button type="submit" fullWidth disabled={isLoading}>
          {isLoading ? "Saving..." : "Change password"}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className={styles["reset-page"]}>
          <div className={styles["reset-page__title"]}>Loading...</div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
