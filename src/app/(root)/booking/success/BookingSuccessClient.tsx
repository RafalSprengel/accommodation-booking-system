"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Button from "@/app/_components/UI/Button/Button";
import styles from "./page.module.css";

const STORAGE_KEY = "wilczechatki_booking_draft";
const RETRY_DELAY_MS = 3000;
const MAX_ATTEMPTS = 4;

type VerificationState = "loading" | "success" | "error";

type CheckoutStatusResponse = {
  status?: string;
  paymentStatus?: string;
  customerEmail?: string | null;
  error?: string;
};

interface BookingSuccessClientProps {
  siteSettings: {
    phone: string;
  }
}

export default function BookingSuccessClient({
  siteSettings,
}: BookingSuccessClientProps) {
  const searchParams = useSearchParams();
  const [verificationState, setVerificationState] =
    useState<VerificationState>("loading");
  const [attempts, setAttempts] = useState(0);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);

  const bookingsParam = searchParams.get("bookings");
  const bookingsCount = useMemo(() => {
    if (!bookingsParam) {
      return undefined;
    }

    const parsed = Number(bookingsParam);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return undefined;
    }

    return parsed;
  }, [bookingsParam]);

  const sessionId = searchParams.get("session_id");
  const isMultiBooking = typeof bookingsCount === "number" && bookingsCount > 1;

  useEffect(() => {
    if (!sessionId) {
      setVerificationState("error");
      return;
    }

    let isCancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const waitForRetry = async () => {
      await new Promise<void>((resolve) => {
        timeoutId = setTimeout(() => resolve(), RETRY_DELAY_MS);
      });
    };

    const verifyCheckoutSession = async () => {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        if (isCancelled) {
          return;
        }

        setAttempts(attempt);

        try {
          const response = await fetch(
            `/api/checkout-status?session_id=${encodeURIComponent(sessionId)}`,
            {
              method: "GET",
              cache: "no-store",
            },
          );

          const data = (await response.json()) as CheckoutStatusResponse;

          if (!response.ok) {
            if (data.error) {
              throw new Error(data.error);
            }

            throw new Error("Payment verification API response error.");
          }

          if (data.status === "complete") {
            localStorage.removeItem(STORAGE_KEY);
            setCustomerEmail(data.customerEmail ?? null);
            setVerificationState("success");
            return;
          }

          if (data.status === "expired" || data.paymentStatus === "unpaid") {
            setVerificationState("error");
            return;
          }
        } catch (error) {
          if (attempt === MAX_ATTEMPTS) {
            setVerificationState("error");
            return;
          }

          if (error instanceof Error && error.name === "AbortError") {
            return;
          }
        }

        if (attempt < MAX_ATTEMPTS) {
          await waitForRetry();
        }
      }

      setVerificationState("error");
    };

    setVerificationState("loading");
    void verifyCheckoutSession();

    return () => {
      isCancelled = true;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [sessionId]);

  const isLoading = verificationState === "loading";
  const isSuccess = verificationState === "success";
  const isError = verificationState === "error";

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {isLoading && (
          <>
            <div className={styles.loaderWrapper}>
              <span className={styles.spinner} />
            </div>
            <h1 className={styles.title}>Verifying payment...</h1>
            <p className={styles.message}>Please do not refresh the page.</p>
            <p className={styles.details}>
              Confirming payment via Stripe.
            </p>
            <p className={styles.details}>
              Attempt {attempts}/{MAX_ATTEMPTS}
            </p>
          </>
        )}

        {isSuccess && (
          <>
            <div className={styles.iconWrapper}>
              <span className={styles.successIcon}>✓</span>
            </div>
            <h1 className={styles.title}>Payment confirmed!</h1>
            <p className={styles.message}>Thank you for your booking.</p>
            <p className={styles.details}>
              Payment has been successfully processed via Stripe.
            </p>

            {isMultiBooking && (
              <p className={styles.details}>
                <strong>{bookingsCount}</strong> bookings created (one for each
                selected cottage).
              </p>
            )}

            <p className={styles.details}>
              Your booking details have been sent to:
              {customerEmail ? (
                <strong> {customerEmail}</strong>
              ) : (
                " the email address you provided."
              )}
            </p>

            <div className={styles.infoBox}>
              <p className={styles.infoText}>
                Please check your inbox (and SPAM folder).
              </p>
              <p className={styles.infoText}>
                If you have any questions:{" "}
                <a
                  href={`tel:${siteSettings.phone}`}
                  className={styles.phoneLink}
                >
                  {siteSettings.phone}
                </a>
              </p>
            </div>
          </>
        )}

        {isError && (
          <>
            <div className={styles.errorIconWrapper}>
              <span className={styles.errorIcon}>!</span>
            </div>
            <h1 className={styles.title}>There was a problem with the payment.</h1>
              <p className={styles.message}>Please contact us at <a href={`tel:${siteSettings.phone}`} className={styles.phoneLink}>{siteSettings.phone}</a>.</p>
          </>
        )}

        <div className={styles.actions}>
          <Button href="/" variant="primary" size="large">
            Back to home page
          </Button>
        </div>
      </div>
    </div>
  );
}