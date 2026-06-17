"use client";
import { useState } from "react";
import Button from "@/app/_components/UI/Button/Button";
import styles from "./ContactForm.module.css";

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    message: "",
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    message: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const errors = {
    name: formData.name.length < 3 ? "Please enter your full name." : "",
    email: !emailRegex.test(formData.email)
      ? "Please enter a valid email address."
      : "",
    message:
      formData.message.length < 10
        ? "The message must be at least 10 characters long."
        : "",
  };

  const isFormValid = !errors.name && !errors.email && !errors.message;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setTouched({ name: true, email: true, message: true });

    if (!isFormValid) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        if (!result.message) {
          throw new Error("Failed to send the message.");
        }

        throw new Error(result.message);
      }

      setIsSubmitted(true);
      setFormData({ name: "", email: "", message: "" });
      setTouched({ name: false, email: false, message: false });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to send the message.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={styles.successContainer}>
        <p className={styles.successMessage}>Message sent successfully!</p>
        <Button
          onClick={() => {
            setIsSubmitted(false);
            setSubmitError(null);
          }}
          type="button"
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit}>
        <div className={styles.group}>
          <label htmlFor="name">Full name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            className={styles.input}
          />
          {touched.name && errors.name && (
            <div className={styles.errorMessage}>{errors.name}</div>
          )}
        </div>

        <div className={styles.group}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={styles.input}
          />
          {touched.email && errors.email && (
            <div className={styles.errorMessage}>{errors.email}</div>
          )}
        </div>

        <div className={styles.group}>
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            onBlur={handleBlur}
            className={styles.textarea}
          ></textarea>
          {touched.message && errors.message && (
            <div className={styles.errorMessage}>{errors.message}</div>
          )}
        </div>

        {submitError && (
          <div className={styles.errorMessage}>{submitError}</div>
        )}

        <Button type="submit" fullWidth disabled={!isFormValid || isSubmitting}>
          {isSubmitting ? (
            <span className={styles.loadingContent}>
              <span className={styles.spinner} aria-hidden="true" />
              <span>Sending...</span>
            </span>
          ) : (
            "Send message"
          )}
        </Button>
      </form>
    </div>
  );
}