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

  const verifyAvailability = async (data: BookingData): Promise<boolean> => {
    const ids = data.orders.map(o => o.propertyId);
    const result = await isRangeAvailable(data.startDate, data.endDate, ids);
    
    if (!result.available) {
      const occupied = result.occupiedPropertyIds || [];
      const occupiedNames = data.orders
        .filter((o) => occupied.includes(o.propertyId))
        .map((o) => o.displayName);
      
      setUnavailableModal({ 
        isOpen: true, 
        title: 'Dates are being reserved, please check again in 15 minutes.', 
        occupiedNames 
      });
      
      return false;
    }
    
    return true;
  };

  const handleInitValidation = async (parsedData: BookingData, isMounted: boolean) => {
    try {
      const isAvailable = await verifyAvailability(parsedData);
      if (!isMounted) return;
      
      if (isAvailable) {
        setBookingData(parsedData);
      }
      setIsValidating(false);
    } catch (err) {
      console.error('Error checking availability on entry:', err);
      if (!isMounted) return;

      toast.error('A network problem occurred. Could not verify the availability of the date.');
    }
  };

  useEffect(() => {
    let isMounted = true;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      router.push("/booking");
      return;
    }

    try {
      const parsed: BookingData = JSON.parse(saved);
      const hasOrders = Array.isArray(parsed.orders) && parsed.orders.length > 0;
      
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

      handleInitValidation(parsed, isMounted);

    } catch {
      router.push("/booking");
    }

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleStripePayment = async () => {
    if (!bookingData) return;

    setIsProcessing(true);

    try {
      const isAvailable = await verifyAvailability(bookingData);
      if (!isAvailable) {
        setIsProcessing(false);
        return;
      }

      localStorage.removeItem(STORAGE_KEY);
      const result = await createCheckoutSession(bookingData);
      if (result?.url) {
        window.location.href = result.url;
      } else {
        throw new Error("Could not obtain payment session URL");
      }
    } catch (error) {
      console.error("Error during verification or payment:", error);
      setIsProcessing(false);
      
      toast.error("Network problem. Payment could not be processed. Please try again.");
    }
  };

  if (!bookingData || isValidating) {
    return (
      <div className={styles.container}>
        <FloatingBackButton />
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>{isValidating ? 'Verifying availability...' : 'Loading summary...'}</p>
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
      : `${orders.length} properties: ${orders.map((item) => item.displayName).join(", ")}`;
  
  const hasInvoiceData = Boolean(
    invoiceData.companyName ||
    invoiceData.address ||
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
        onClose={() => { 
          setUnavailableModal({ ...unavailableModal, isOpen: false }); 
        }}
        title={unavailableModal.title}
        confirmText="Back to search"
        cancelText="Refresh results"
        confirmVariant="warning"
        onConfirm={() => {
          localStorage.removeItem(STORAGE_KEY);
          setUnavailableModal({ ...unavailableModal, isOpen: false });
          router.push('/booking');
        }}
      >
        <p>
          {unavailableModal.occupiedNames.length > 0
            ? `Unavailable properties: ${unavailableModal.occupiedNames.join(', ')}`
            : 'The selected dates are no longer available.'}
        </p>
      </Modal>

      <header className={styles.header}>
        <h1>Booking summary</h1>
        <p>Review your details before confirming.</p>
      </header>

      <div className={styles.summaryCard}>
        <h2 className={styles.summaryTitle}>Stay details</h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Dates:</span>
            <span className={styles.summaryValue}>
              {formatDisplayDate(startDate)} — {formatDisplayDate(endDate)} (
              {nights} nights)
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Property:</span>
            <span className={styles.summaryValue}>{orderDisplayName}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Guests:</span>
            <span className={styles.summaryValue}>
              {totalGuests} guests
              {totalExtraBeds > 0 && ` + ${totalExtraBeds} extra beds`}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.summaryCard}>
        <h2 className={styles.summaryTitle}>Contact details</h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Full name:</span>
            <span className={styles.summaryValue}>
              {clientData.firstName} {clientData.lastName}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Address:</span>
            <span className={styles.summaryValue}>{clientData.address}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Email:</span>
            <span className={styles.summaryValue}>{clientData.email}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Phone:</span>
            <span className={styles.summaryValue}>{clientData.phone}</span>
          </div>
        </div>
      </div>

      {hasInvoiceData && (
        <div className={styles.summaryCard}>
          <h2 className={styles.summaryTitle}>VAT invoice details</h2>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Company name:</span>
              <span className={styles.summaryValue}>
                {invoiceData.companyName}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Address:</span>
              <span className={styles.summaryValue}>
                {invoiceData.address}, {invoiceData.postalCode}{" "}
                {invoiceData.city}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.priceCard}>
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>Total price:</span>
          <span className={styles.priceValue}>{totalPrice} £</span>
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => router.back()}>
          ← Edit details
        </Button>
        <Button onClick={handleStripePayment} disabled={isProcessing}>
          {isProcessing
            ? "Redirecting to payment..."
            : "Go to payment →"}
        </Button>
      </div>
    </div>
  );
}