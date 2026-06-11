"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createCheckoutSession } from "@/actions/stripe";
import { isRangeAvailable } from '@/actions/availabilityActions'
import { toast } from 'react-hot-toast'
import Modal from '@/app/_components/Modal/Modal'
import Button from "@/app/_components/UI/Button/Button";
import FloatingBackButton from "@/app/_components/FloatingBackButton/FloatingBackButton";
import type { BookingData } from "@/types/booking";
import { formatDisplayDate } from "@/utils/formatDate";
import styles from "./page.module.css";

const STORAGE_KEY = "wilczechatki_booking_draft";

export default function BookingSummaryPage() {
  const router = useRouter();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [unavailableModal, setUnavailableModal] = useState<{
    isOpen: boolean
    title: string
    occupiedNames: string[]
  }>({ isOpen: false, title: '', occupiedNames: [] });
  const [networkModal, setNetworkModal] = useState<{
    isOpen: boolean
    title: string
    message?: string
    onRetry?: () => Promise<void>
  }>({ isOpen: false, title: '' });

  const checkBookingAvailability = async (parsed: BookingData) => {
    try {
      const ids = parsed.orders.map(o => o.propertyId);
      const result = await isRangeAvailable(parsed.startDate, parsed.endDate, ids);
      if (!result.available) {
        localStorage.removeItem(STORAGE_KEY);
        router.push("/booking");
        return;
      }
      setBookingData(parsed);
      setIsValidating(false);
    } catch (err) {
      console.error('Błąd sprawdzania dostępności:', err);
      setNetworkModal({
        isOpen: true, title: 'Błąd sieci', message: 'Nie udało się sprawdzić dostępności. Spróbuj ponownie.', onRetry: async () => {
          try {
            const ids = parsed.orders.map(o => o.propertyId);
            const r = await isRangeAvailable(parsed.startDate, parsed.endDate, ids);
            if (!r.available) {
              localStorage.removeItem(STORAGE_KEY);
              router.push("/booking");
              return;
            }
            setBookingData(parsed);
          } catch (retryErr) {
            console.error('Retry failed:', retryErr);
          } finally {
            setNetworkModal({ isOpen: false, title: '' });
            setIsValidating(false);
          }
        }
      });
      // stop validating spinner when network error occurs
      setIsValidating(false);
    }

  }

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      router.push("/booking");
      return;
    }

    try {
      const parsed: BookingData = JSON.parse(saved);
      const hasOrders =
        Array.isArray(parsed.orders) && parsed.orders.length > 0;
      if (
        !parsed.clientData?.firstName ||
        !hasOrders ||
        !Number.isInteger(parsed.adults) ||
        parsed.adults < 1 ||
        !Number.isInteger(parsed.children) ||
        parsed.children < 0
      ) {
        router.push("/booking/details");
        return;
      }

      checkBookingAvailability(parsed) // sprawdzenie dostępności przy wejściu na podsumowanie
    } catch {
      router.push("/booking");
    }
  }, [router]);

  const handleStripePayment = async () => {
    if (!bookingData) return;
    // finalne sprawdzenie dostępności przed utworzeniem sesji Stripe
    try {
      setIsProcessing(true);
      const ids = bookingData.orders.map(o => o.propertyId);
      const result = await isRangeAvailable(bookingData.startDate, bookingData.endDate, ids);
      if (!result.available) {
        const occupied = result.occupiedPropertyIds || [];
        const occupiedNames = bookingData.orders
          .filter((o) => occupied.includes(o.propertyId))
          .map((o) => o.displayName);
        localStorage.removeItem(STORAGE_KEY);
        setUnavailableModal({ isOpen: true, title: 'Termin niedostępny', occupiedNames });
        setIsProcessing(false);
        return;
      }
    } catch (err) {
      console.error('Błąd sprawdzania dostępności przed płatnością:', err);
      setNetworkModal({
        isOpen: true, title: 'Błąd sieci', message: 'Nie udało się sprawdzić dostępności. Spróbuj ponownie.', onRetry: async () => {
          try {
            const ids = bookingData.orders.map(o => o.propertyId);
            const r = await isRangeAvailable(bookingData.startDate, bookingData.endDate, ids);
            if (!r.available) {
              const occupied = r.occupiedPropertyIds || [];
              const occupiedNames = bookingData.orders
                .filter((o) => occupied.includes(o.propertyId))
                .map((o) => o.displayName);
              setUnavailableModal({ isOpen: true, title: 'Termin niedostępny', occupiedNames: [...occupiedNames] });
              setNetworkModal({ isOpen: false, title: '' });
              return;
            }
            // if available after retry, continue to create checkout
            const result = await createCheckoutSession(bookingData);
            if (result?.url) {
              window.location.href = result.url;
            }
          } catch (retryErr) {
            console.error('Retry payment flow failed:', retryErr);
          } finally {
            setNetworkModal({ isOpen: false, title: '' });
          }
        }
      });
      return;
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
      const result = await createCheckoutSession(bookingData);
      if (result?.url) {
        window.location.href = result.url;
      } else {
        throw new Error("Nie można uzyskać URL sesji płatności");
      }
    } catch (error) {
      console.error("Błąd podczas inicjowania płatności:", error);
      setIsProcessing(false);
      alert(
        "Wystąpił błąd podczas inicjowania płatności. Spróbuj ponownie: " +
        error,
      );
    }
  };

  if (!bookingData || isValidating) {
    return (
      <div className={styles.container}>
        <FloatingBackButton />
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>{isValidating ? 'Weryfikacja dostępności...' : 'Ładowanie podsumowania...'}</p>
        </div>
      </div>
    );
  }

  const { startDate, endDate, clientData, invoiceData, orders } = bookingData;
  const totalGuests = orders.reduce((sum, item) => sum + item.guests, 0);
  const totalExtraBeds = orders.reduce((sum, item) => sum + item.extraBeds, 0);
  const totalPrice = orders.reduce((sum, item) => sum + item.price, 0);
  const orderDisplayName =
    orders.length === 1
      ? orders[0].displayName
      : `${orders.length} obiekty: ${orders.map((item) => item.displayName).join(", ")}`;
  const hasInvoiceData = Boolean(
    invoiceData.companyName ||
    invoiceData.nip ||
    invoiceData.street ||
    invoiceData.city ||
    invoiceData.postalCode,
  );

  const nights = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
    (1000 * 60 * 60 * 24),
  );

  return (
    <div className={styles.container}>
      <FloatingBackButton />
      <Modal
        isOpen={unavailableModal.isOpen}
        onClose={() => { setUnavailableModal({ ...unavailableModal, isOpen: false }); router.refresh(); }}
        title={unavailableModal.title}
        confirmText="Wróć do wyboru"
        cancelText="Odśwież wyniki"
        confirmVariant="warning"
        onConfirm={() => {
          localStorage.removeItem(STORAGE_KEY);
          setUnavailableModal({ ...unavailableModal, isOpen: false });
          router.push('/booking');
        }}
      >
        <p>
          {unavailableModal.occupiedNames.length > 0
            ? `Niedostępne obiekty: ${unavailableModal.occupiedNames.join(', ')}`
            : 'Wybrany termin jest już niedostępny.'}
        </p>
      </Modal>
      <Modal
        isOpen={networkModal.isOpen}
        onClose={() => setNetworkModal({ ...networkModal, isOpen: false })}
        title={networkModal.title}
        confirmText="Spróbuj ponownie"
        cancelText="Anuluj"
        confirmVariant="warning"
        onConfirm={async () => { if (networkModal.onRetry) await networkModal.onRetry(); setNetworkModal({ ...networkModal, isOpen: false }); }}
      >
        <p>{networkModal.message}</p>
      </Modal>

      <header className={styles.header}>
        <h1>Podsumowanie rezerwacji</h1>
        <p>Sprawdź dane przed potwierdzeniem.</p>
      </header>

      <div className={styles.summaryCard}>
        <h2 className={styles.summaryTitle}>Dane pobytu</h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Termin:</span>
            <span className={styles.summaryValue}>
              {formatDisplayDate(startDate)} — {formatDisplayDate(endDate)} (
              {nights} nocy)
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Obiekt:</span>
            <span className={styles.summaryValue}>{orderDisplayName}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Goście:</span>
            <span className={styles.summaryValue}>
              {totalGuests} osób
              {totalExtraBeds > 0 && ` + ${totalExtraBeds} dostawki`}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.summaryCard}>
        <h2 className={styles.summaryTitle}>Dane kontaktowe</h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Imię i nazwisko:</span>
            <span className={styles.summaryValue}>
              {clientData.firstName} {clientData.lastName}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Adres:</span>
            <span className={styles.summaryValue}>{clientData.address}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>E-mail:</span>
            <span className={styles.summaryValue}>{clientData.email}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Telefon:</span>
            <span className={styles.summaryValue}>{clientData.phone}</span>
          </div>
        </div>
      </div>

      {hasInvoiceData && (
        <div className={styles.summaryCard}>
          <h2 className={styles.summaryTitle}>Dane faktury VAT</h2>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Nazwa firmy:</span>
              <span className={styles.summaryValue}>
                {invoiceData.companyName}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>NIP:</span>
              <span className={styles.summaryValue}>{invoiceData.nip}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Adres:</span>
              <span className={styles.summaryValue}>
                {invoiceData.street}, {invoiceData.postalCode}{" "}
                {invoiceData.city}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.priceCard}>
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>Cena całkowita:</span>
          <span className={styles.priceValue}>{totalPrice} zł</span>
        </div>
      </div>

      <div className={styles.actions}>
        <Button href="/booking/details" variant="secondary">
          ← Edytuj dane
        </Button>
        <Button onClick={handleStripePayment} disabled={isProcessing}>
          {isProcessing
            ? "Przekierowywanie do płatności..."
            : "Przejdź do płatności →"}
        </Button>
      </div>
    </div>
  );
}
