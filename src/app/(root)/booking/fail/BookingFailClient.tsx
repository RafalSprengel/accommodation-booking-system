"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/app/_components/UI/Button/Button";
import styles from "./page.module.css";

interface BookingFailClientProps {
  siteSettings: {
    phone: string;
  };
}

export default function BookingFailClient({
  siteSettings,
}: BookingFailClientProps) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      router.push("/booking/summary");
    }, 500);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <span className={styles.failIcon}>✗</span>
        </div>

        <h1 className={styles.title}>Payment failed</h1>

        <p className={styles.message}>
          Unfortunately, your payment could not be processed.
        </p>

        <p className={styles.details}>
          Possible reasons: insufficient funds on the card, incorrect CVC code, or
          a temporary problem with the payment system.
        </p>

        <div className={styles.infoBox}>
          <p className={styles.infoText}>
            💳 Check if the card details are correct
          </p>
          <p className={styles.infoText}>
            📞 If you have any questions:{" "}
                <a
                  href={`tel:${siteSettings.phone}`}
                  className={styles.phoneLink}
                >
                  {siteSettings.phone}
                </a>
          </p>
        </div>

        <div className={styles.actions}>
          <Button onClick={handleRetry} variant="danger" disabled={isRetrying}>
            {isRetrying ? "Redirecting..." : "Try again"}
          </Button>
          <Button href="/" variant="tertiary">
            Back to home page
          </Button>
        </div>
      </div>
    </div>
  );
}
