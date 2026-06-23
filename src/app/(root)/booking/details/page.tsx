"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { isRangeAvailable } from '@/actions/availabilityActions'
import { toast } from 'react-hot-toast'
import Modal from '@/app/_components/Modal/Modal'
import Button from "@/app/_components/UI/Button/Button";
import FloatingBackButton from "@/app/_components/FloatingBackButton/FloatingBackButton";
import type { BookingData, ClientData, InvoiceData } from "@/types/booking";
import { formatDisplayDate } from "@/utils/formatDate";
import styles from "./page.module.css";

interface GuestData extends ClientData {
  invoice: boolean;
  invoiceData: InvoiceData;
  termsAccepted: boolean;
}

const STORAGE_KEY = "wilczechatki_booking_draft";

interface AvailabilityCheckResult {
  available: boolean;
  occupiedNames: string[];
}

async function checkBookingAvailability(data: BookingData): Promise<AvailabilityCheckResult> {
  const ids = data.orders.map(o => o.propertyId);
  const result = await isRangeAvailable(data.startDate, data.endDate, ids);
  if (!result.available) {
    const occupied = result.occupiedPropertyIds || [];
    const occupiedNames = data.orders
      .filter(o => occupied.includes(o.propertyId))
      .map(o => o.displayName);
    return { available: false, occupiedNames };
  }
  return { available: true, occupiedNames: [] };
}

export default function BookingDetailsPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [formData, setFormData] = useState<GuestData>({
    firstName: "",
    lastName: "",
    address: "",
    email: "",
    phone: "",
    invoice: false,
    invoiceData: {
      companyName: "",
      address: "",
      city: "",
      postalCode: "",
    },
    termsAccepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bookingSummary, setBookingSummary] = useState<BookingData | null>(
    null,
  );
  const [unavailableModal, setUnavailableModal] = useState<{
    isOpen: boolean
    title: string
    occupiedNames: string[]
  }>({ isOpen: false, title: '', occupiedNames: [] });

  const EMPTY_INVOICE_DATA = {
    companyName: '',
    address: '',
    city: '',
    postalCode: '',
  };

  const initialParsedRef = useRef<BookingData | null>(null);

  const validateInitialBooking = async (parsed: BookingData) => {
    try {
      const { available, occupiedNames } = await checkBookingAvailability(parsed);

      if (!available) {
        localStorage.removeItem(STORAGE_KEY);
        router.push("/booking");
        return;
      }
    } catch (err) {
      console.error('Error checking availability:', err);
      toast.error('A network problem occurred. Could not verify the availability of the date.');
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed: BookingData = JSON.parse(savedData);
        if (
          !Array.isArray(parsed.orders) ||
          parsed.orders.length === 0 ||
          !Number.isInteger(parsed.adults) ||
          parsed.adults < 1 ||
          !Number.isInteger(parsed.children) ||
          parsed.children < 0
        ) {
          router.push("/booking");
          return;
        }

        initialParsedRef.current = parsed;
        setBookingSummary(parsed);
        validateInitialBooking(parsed);

        const hasInvoiceData = Boolean(
          parsed.invoiceData.companyName ||
          parsed.invoiceData.address ||
          parsed.invoiceData.city ||
          parsed.invoiceData.postalCode,
        );

        setFormData((prev) => ({
          ...prev,
          ...parsed.clientData,
          invoice: hasInvoiceData,
          invoiceData: parsed.invoiceData,
        }));
      } catch {
        router.push("/booking");
      }
    } else {
      router.push("/booking");
    }
  }, [router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim())
      newErrors.lastName = "Last name is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[\d\s+\-()]+$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number format";
    }

    if (formData.invoice) {
      if (!formData.invoiceData?.companyName.trim()) {
        newErrors.companyName = "Company name is required for VAT invoice";
      }
      if (!formData.invoiceData?.address.trim()) {
        newErrors.address = "Address is required for VAT invoice";
      }
      if (!formData.invoiceData?.city.trim()) {
        newErrors.invoiceCity = "City is required for VAT invoice";
      }
      if (!formData.invoiceData?.postalCode.trim()) {
        newErrors.postalCode = "Postal code is required for VAT invoice";
      }
    }

    if (!formData.termsAccepted)
      newErrors.termsAccepted = "You must accept the terms and conditions";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (name === "invoice") {
      setFormData((prev) => ({
        ...prev,
        invoice: checked,
        ...(checked && !prev.invoiceData
          ? {
            invoiceData: {
              companyName: "",
              address: "",
              city: "",
              postalCode: "",
            },
          }
          : {}),
      }));
    } else if (name.startsWith("invoice.")) {
      const invoiceField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        invoiceData: {
          ...prev.invoiceData!,
          [invoiceField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const proceedToSummary = async () => {
    const nextInvoiceData = formData.invoice
      ? formData.invoiceData
      : EMPTY_INVOICE_DATA;

    const updatedData: BookingData = {
      ...(bookingSummary as BookingData),
      clientData: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        email: formData.email,
        phone: formData.phone,
      },
      invoice: formData.invoice,
      invoiceData: nextInvoiceData,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push('/booking/summary');
  };

  const handleTermAndConditionsClick = () => {
    const nextInvoiceData = formData.invoice
      ? formData.invoiceData
      : EMPTY_INVOICE_DATA;

    const updatedData: BookingData = {
      ...(bookingSummary as BookingData),
      clientData: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        email: formData.email,
        phone: formData.phone,
      },
      invoice: formData.invoice,
      invoiceData: nextInvoiceData,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    router.push("/terms-and-conditions");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    if (bookingSummary) {
      try {
        const { available, occupiedNames } = await checkBookingAvailability(bookingSummary);
        console.log(available, occupiedNames)
        if (!available) {
          setUnavailableModal({ isOpen: true, title: 'Dates are no longer available or are being reserved. Please try again in 15 minutes.', occupiedNames });
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        console.error('Availability validation error before submit:', err);
        toast.error('A network problem occurred. Your form data is safe. Please try clicking the button again.');
        setIsSubmitting(false);
        return;
      }
    }

    await proceedToSummary();
  };

  if (!bookingSummary) {
    return (
      <div className={styles.container}>
        <FloatingBackButton />
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading booking data...</p>
        </div>
      </div>
    );
  }

  const { startDate, endDate, orders } = bookingSummary;
  const totalGuests = orders.reduce((sum, item) => sum + item.guests, 0);
  const totalExtraBeds = orders.reduce((sum, item) => sum + item.extraBeds, 0);
  const totalPrice = orders.reduce((sum, item) => sum + item.price, 0);

  const orderDisplayName =
    orders.length === 1
      ? orders[0].displayName
      : `${orders.length} properties: ${orders.map((item) => item.displayName).join(", ")}`;

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
        confirmText="Back to selection"
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
        <h1>Guest details</h1>
        <p>Fill in the form to continue with your booking.</p>
      </header>

      <div className={styles.summaryCard}>
        <h2 className={styles.summaryTitle}>Booking details</h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Property:</span>
            <span className={styles.summaryValue}>{orderDisplayName}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Dates:</span>
            <span className={styles.summaryValue}>
              {formatDisplayDate(startDate)} — {formatDisplayDate(endDate)} (
              {nights} nights)
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Guests:</span>
            <span className={styles.summaryValue}>
              {totalGuests} guests
              {totalExtraBeds > 0 &&
                ` + ${totalExtraBeds} extra bed${totalExtraBeds > 1 ? "s" : ""}`}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total price:</span>
            <span className={styles.summaryPrice}>{totalPrice} £</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.formCard}>
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Personal details</h2>
          <div className={styles.grid}>
            <div className={styles.inputGroup}>
              <label htmlFor="firstName">First name *</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                className={errors.firstName ? styles.inputError : ""}
                autoComplete="given-name"
              />
              {errors.firstName && (
                <span className={styles.errorText}>{errors.firstName}</span>
              )}
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="lastName">Last name *</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                className={errors.lastName ? styles.inputError : ""}
                autoComplete="family-name"
              />
              {errors.lastName && (
                <span className={styles.errorText}>{errors.lastName}</span>
              )}
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="address">Address *</label>
            <input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleChange}
              placeholder="Street, number, postal code, city"
              className={errors.address ? styles.inputError : ""}
              autoComplete="street-address"
            />
            {errors.address && (
              <span className={styles.errorText}>{errors.address}</span>
            )}
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Contact details</h2>
          <div className={styles.grid}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? styles.inputError : ""}
                autoComplete="email"
              />
              {errors.email && (
                <span className={styles.errorText}>{errors.email}</span>
              )}
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="phone">Phone *</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+48 123 456 789"
                className={errors.phone ? styles.inputError : ""}
                autoComplete="tel"
              />
              {errors.phone && (
                <span className={styles.errorText}>{errors.phone}</span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Additional options</h2>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="invoice"
              checked={formData.invoice}
              onChange={handleChange}
            />
            <span>I would like to receive a VAT invoice</span>
          </label>

          <div
            className={`${styles.invoiceWrapper} ${formData.invoice ? styles.expanded : ""}`}
          >
            <div className={styles.invoiceContent}>
              <h3 className={styles.invoiceTitle}>VAT invoice details</h3>
              <div
                className={`${styles.inputGroup} ${styles.fadeIn}`}
                style={{ animationDelay: "0.05s" }}
              >
                <label htmlFor="invoice.companyName">Company name *</label>
                <input
                  id="invoice.companyName"
                  name="invoice.companyName"
                  type="text"
                  value={formData.invoiceData.companyName}
                  onChange={handleChange}
                  className={errors.companyName ? styles.inputError : ""}
                  placeholder="Full company name"
                />
                {errors.companyName && (
                  <span className={styles.errorText}>{errors.companyName}</span>
                )}
              </div>
              <div
                className={`${styles.inputGroup} ${styles.fadeIn}`}
                style={{ animationDelay: "0.1s" }}
              >
                <label htmlFor="invoice.address">Address *</label>
                <input
                  id="invoice.address"
                  name="invoice.address"
                  type="text"
                  value={formData.invoiceData.address}
                  onChange={handleChange}
                  className={errors.address ? styles.inputError : ""}
                  placeholder="123 Example Street"
                />
                {errors.address && (
                  <span className={styles.errorText}>
                    {errors.address}
                  </span>
                )}
              </div>
              <div
                className={`${styles.grid} ${styles.fadeIn}`}
                style={{ animationDelay: "0.2s" }}
              >
                <div className={styles.inputGroup}>
                  <label htmlFor="invoice.postalCode">Postal code *</label>
                  <input
                    id="invoice.postalCode"
                    name="invoice.postalCode"
                    type="text"
                    value={formData.invoiceData.postalCode}
                    onChange={handleChange}
                    className={errors.postalCode ? styles.inputError : ""}
                    placeholder="00-000"
                  />
                  {errors.postalCode && (
                    <span className={styles.errorText}>
                      {errors.postalCode}
                    </span>
                  )}
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="invoice.city">City *</label>
                  <input
                    id="invoice.city"
                    name="invoice.city"
                    type="text"
                    value={formData.invoiceData.city}
                    onChange={handleChange}
                    className={errors.invoiceCity ? styles.inputError : ""}
                    placeholder="City"
                  />
                  {errors.invoiceCity && (
                    <span className={styles.errorText}>
                      {errors.invoiceCity}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Acceptance of terms</h2>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleChange}
            />
            <span>
              I have read and accept the{" "}
              <button
                type="button"
                onClick={handleTermAndConditionsClick}
                className={styles.linkButton}
              >
                terms and conditions
              </button>{" "}
              *
            </span>
          </label>
          {errors.termsAccepted && (
            <span className={styles.errorText}>{errors.termsAccepted}</span>
          )}
        </div>

        <div className={styles.formActions}>
          <Button variant="secondary" onClick={() => router.back()}>
            ← Back
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Next →"}
          </Button>
        </div>
      </form>
    </div>
  );
}