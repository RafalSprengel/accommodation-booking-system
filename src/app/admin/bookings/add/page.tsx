"use client";

import type React from "react";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  calculatePriceAction,
  createBookingByAdmin,
  getUnavailableDatesForProperty,
} from "@/actions/adminBookingActions";
import { getAllProperties } from "@/actions/adminPropertyActions";
import { getBookingConfig } from "@/actions/bookingConfigActions";
import Button from "@/app/_components/UI/Button/Button";
import CalendarPicker, {
  type DatesData,
} from "@/app/_components/CalendarPicker/CalendarPicker";
// FloatingBackButton provided by admin layout
import Modal from "@/app/_components/Modal/Modal";
import QuantityPicker from "@/app/_components/QuantityPicker/QuantityPicker";
import { useClickOutside } from "@/hooks/useClickOutside";
import { formatDisplayDate } from "@/utils/formatDate";
import styles from "./page.module.css";
import AdminShell from "../../_components/AdminShell/AdminShell";

interface BookingDates {
  start: string | null;
  end: string | null;
  count: number;
}

interface PropertyOption {
  _id: string;
  name: string;
  maxAdults: number;
  maxExtraBeds: number;
  maxChildren: number;
}

interface InvoiceData {
  companyName: string;
  address: string;
  postalCode: string;
  city: string;
}

const initialState = {
  message: "",
  success: false,
};

export default function AddBookingPage() {
  const [state, formAction, isPending] = useActionState(
    createBookingByAdmin,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [propertySelection, setPropertySelection] = useState("");
  const [selectedProperty, setSelectedProperty] =
    useState<PropertyOption | null>(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [extraBeds, setExtraBeds] = useState(0);
  const [paidAmount, setPaidAmount] = useState<number | null>(null);
  const [propertyError, setPropertyError] = useState("");
  const [paidAmountError, setPaidAmountError] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [bookingDates, setBookingDates] = useState<BookingDates>({
    start: null,
    end: null,
    count: 0,
  });
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [calendarDates, setCalendarDates] = useState<DatesData>({});
  const [isLoadingUnavailableDates, setIsLoadingUnavailableDates] =
    useState(false);
  const [hasLoadedUnavailableDates, setHasLoadedUnavailableDates] =
    useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const priceRequestIdRef = useRef(0);
  const [isCalculating, startPriceCalculation] = useTransition();
  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    companyName: "",
    address: "",
    postalCode: "",
    city: "",
  });
  const [invoiceErrors, setInvoiceErrors] = useState<Record<string, string>>(
    {},
  );
  const [guestData, setGuestData] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [guestErrors, setGuestErrors] = useState<Record<string, string>>({});
  const [minBookingDays, setMinBookingDays] = useState(1);
  const [maxBookingDays, setMaxBookingDays] = useState(30);
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  const isDateRangeSelected = !!(bookingDates.start && bookingDates.end);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingProperties(true);
      try {
        const [props, config] = await Promise.all([
          getAllProperties(),
          getBookingConfig(),
        ]);
        setProperties(props);
        setMinBookingDays(config.minBookingDays);
        setMaxBookingDays(config.maxBookingDays);
      } finally {
        setIsLoadingProperties(false);
      }
    };
    loadInitialData();
  }, []);

  const selectedPropertyMaxAdults = selectedProperty?.maxAdults ?? null;
  const selectedPropertyMaxExtraBeds = selectedProperty?.maxExtraBeds ?? null;

  useEffect(() => {
    setBookingDates({ start: null, end: null, count: 0 });
    setTotalPrice(0);
  }, [propertySelection]);

  useEffect(() => {
    if (propertySelection) {
      const prop = properties.find((p) => p._id === propertySelection);
      setSelectedProperty(prop || null);
    } else {
      setSelectedProperty(null);
    }
  }, [propertySelection, properties]);

  useEffect(() => {
    if (selectedProperty) {
      if (
        selectedPropertyMaxAdults != null &&
        adults > selectedPropertyMaxAdults
      ) {
        setAdults(Math.min(2, selectedPropertyMaxAdults));
      }
      if (children < 0) setChildren(0);
      if (
        selectedPropertyMaxExtraBeds != null &&
        extraBeds > selectedPropertyMaxExtraBeds
      ) {
        setExtraBeds(0);
      }
    }
  }, [
    selectedProperty,
    selectedPropertyMaxAdults,
    selectedPropertyMaxExtraBeds,
    adults,
    children,
    extraBeds,
  ]);

  useEffect(() => {
    let isActive = true;

    const fetchUnavailableDates = async () => {
      if (propertySelection) {
        setIsLoadingUnavailableDates(true);
        setHasLoadedUnavailableDates(false);
        setCalendarOpen(false);
        setCalendarDates({});

        try {
          const dates = await getUnavailableDatesForProperty(propertySelection);
          if (!isActive) return;

          const mappedDates: DatesData = {};
          dates.forEach((entry) => {
            if (entry.date) {
              mappedDates[entry.date] = { available: false };
            }
          });
          setCalendarDates(mappedDates);
          setHasLoadedUnavailableDates(true);
        } catch (error) {
          if (!isActive) return;
          console.error("Failed to fetch unavailable dates:", error);
          setCalendarDates({});
          setHasLoadedUnavailableDates(true);
        } finally {
          if (isActive) {
            setIsLoadingUnavailableDates(false);
          }
        }
      } else {
        setCalendarOpen(false);
        setIsLoadingUnavailableDates(false);
        setHasLoadedUnavailableDates(false);
        setCalendarDates({});
      }
    };

    fetchUnavailableDates();

    return () => {
      isActive = false;
    };
  }, [propertySelection]);

  useClickOutside(calendarRef, () => {
    if (isCalendarOpen) setCalendarOpen(false);
  });

  useEffect(() => {
    if (state.success) {
      setFeedbackModal({
        isOpen: true,
        title: "Booking created",
        message: (
          <div className={styles.successDetails}>
            <p>{state.message}</p>
            <ul className={styles.successList}>
              <li><strong>Property:</strong> <span>{selectedProperty?.name}</span></li>
              <li><strong>Dates:</strong> <span>{bookingDates.start ? formatDisplayDate(bookingDates.start) : ""} — {bookingDates.end ? formatDisplayDate(bookingDates.end) : ""}</span></li>
              <li><strong>Adults:</strong> <span>{adults}</span></li>
              <li><strong>Children:</strong> <span>{children}</span></li>
              <li><strong>Extra beds:</strong> <span>{extraBeds}</span></li>
            </ul>
          </div>
        ),
      });
      formRef.current?.reset();
      setExtraBeds(0);
      setPaidAmount(null);
      setTotalPrice(0);
      setBookingDates({ start: null, end: null, count: 0 });
      setAdults(2);
      setChildren(0);
      setPropertySelection("");
      setSelectedProperty(null);
      setWantsInvoice(false);
      setInvoiceData({
        companyName: "",
        address: "",
        postalCode: "",
        city: "",
      });
      setInvoiceErrors({});
      setGuestData({ firstName: "", lastName: "", email: "", phone: "" });
      setGuestErrors({});
      setPropertyError("");
      setPaidAmountError("");
    } else if (state.message && !state.success) {
      setFeedbackModal({
        isOpen: true,
        title: "Failed to create booking",
        message: state.message,
      });
    }
  }, [state]);

  useEffect(() => {
    const { start, end } = bookingDates;
    if (start && end && adults > 0 && propertySelection) {
      const requestId = ++priceRequestIdRef.current;
      startPriceCalculation(async () => {
        const { price } = await calculatePriceAction({
          startDate: start,
          endDate: end,
          baseGuests: adults,
          extraBeds,
          propertySelection,
        });
        if (requestId === priceRequestIdRef.current) {
          setTotalPrice(price);
        }
      });
    }
  }, [bookingDates, adults, extraBeds, propertySelection]);

  const handlePaidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (paidAmountError) setPaidAmountError("");
    const rawValue = e.target.value.replace(/,/g, ".");
    if (rawValue === "") {
      setPaidAmount(null);
      return;
    }
    const value = parseFloat(rawValue);
    if (!isNaN(value)) setPaidAmount(Math.max(0, value));
  };

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInvoiceData((prev) => ({ ...prev, [name]: value }));
    if (invoiceErrors[name]) {
      setInvoiceErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateInvoiceData = (): boolean => {
    const errors: Record<string, string> = {};
    if (!invoiceData.companyName.trim()) errors.companyName = "Required";
    if (!invoiceData.address.trim()) errors.address = "Required";
    if (!invoiceData.postalCode.trim()) {
      errors.postalCode = "Required";
    }
    if (!invoiceData.city.trim()) errors.city = "Required";
    setInvoiceErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetAll = () => {
    formRef.current?.reset();
    setPropertySelection("");
    setSelectedProperty(null);
    setBookingDates({ start: null, end: null, count: 0 });
    setTotalPrice(0);
    setPaidAmount(null);
    setAdults(2);
    setChildren(0);
    setExtraBeds(0);
    setWantsInvoice(false);
    setInvoiceData({
      companyName: "",
      address: "",
      postalCode: "",
      city: "",
    });
    setInvoiceErrors({});
    setGuestData({ firstName: "", lastName: "", email: "", phone: "" });
    setGuestErrors({});
    setPropertyError("");
    setPaidAmountError("");
  };

  const validateGuestData = (): boolean => {
    const errors: Record<string, string> = {};
    if (!guestData.firstName.trim()) errors.firstName = "Required";
    if (!guestData.lastName.trim()) errors.lastName = "Required";
    if (!guestData.email.trim()) {
      errors.email = "Required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestData.email)) {
      errors.email = "Invalid email";
    }
    if (!guestData.phone.trim()) errors.phone = "Required";
    setGuestErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    let hasErrors = false;
    if (!propertySelection) {
      setPropertyError("Select a property");
      hasErrors = true;
    }
    if (!bookingDates.start || !bookingDates.end) {
      setFeedbackModal({
        isOpen: true,
        title: "No date selected",
        message: "Please select a booking date.",
      });
      hasErrors = true;
    }
    if (paidAmount === null) {
      setPaidAmountError("Required");
      hasErrors = true;
    }
    if (hasErrors) {
      e.preventDefault();
      return;
    }
    if (wantsInvoice && !validateInvoiceData()) {
      e.preventDefault();
      setFeedbackModal({
        isOpen: true,
        title: "Invalid invoice data",
        message: "Please fill in the invoice data correctly.",
      });
      return;
    }
    if (!validateGuestData()) {
      e.preventDefault();
      return;
    }
  };

  const remainingAmount = totalPrice - (paidAmount ?? 0);
  const getPaymentBadge = () => {
    if ((paidAmount ?? 0) >= totalPrice && totalPrice > 0)
      return { text: "Paid", class: styles.paymentPaid };
    if (paidAmount !== null && paidAmount > 0)
      return { text: "Deposit", class: styles.paymentDeposit };
    return { text: "Unpaid", class: styles.paymentUnpaid };
  };
  const paymentBadge = getPaymentBadge();

  const maxAdults = selectedPropertyMaxAdults;
  const maxExtraBedsValue = selectedPropertyMaxExtraBeds;

  const missingLimits =
    selectedProperty &&
    (selectedPropertyMaxAdults == null || selectedPropertyMaxExtraBeds == null);

  return (
    <AdminShell title="Add new booking" description="Manual entry of a booking (e.g. by phone).">

      {missingLimits && (
        <div className={styles.warningBox}>
          <span>
            No guest limits or extra bed limits configured for the selected
            property.
            <br />
            <a
              href="/admin/properties"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.settingsLink}
            >
              Go to property settings
            </a>
          </span>
        </div>
      )}

      <form
        ref={formRef}
        action={formAction}
        onSubmit={handleSubmit}
        className={styles.formCard}
      >
        <input
          type="hidden"
          name="startDate"
          value={bookingDates.start || ""}
        />
        <input type="hidden" name="endDate" value={bookingDates.end || ""} />
        <input type="hidden" name="adults" value={adults} />
        <input type="hidden" name="children" value={children} />
        <input type="hidden" name="extraBedsCount" value={extraBeds} />
        <input type="hidden" name="totalPrice" value={totalPrice} />
        <input type="hidden" name="paidAmount" value={paidAmount ?? 0} />
        <input
          type="hidden"
          name="invoice"
          value={wantsInvoice ? "true" : "false"}
        />
        <input
          type="hidden"
          name="invoiceCompany"
          value={invoiceData.companyName}
        />
        <input type="hidden" name="invoiceAddress" value={invoiceData.address} />
        <input
          type="hidden"
          name="invoicePostalCode"
          value={invoiceData.postalCode}
        />
        <input type="hidden" name="invoiceCity" value={invoiceData.city} />

        <h2 className={styles.sectionTitle}>Date and Property</h2>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label htmlFor="propertyId">Property</label>
            <select
              id="propertyId"
              name="propertyId"
              disabled={isLoadingProperties}
              onChange={(e) => { setPropertySelection(e.target.value); if (propertyError) setPropertyError(""); }}
              value={propertySelection}
              className={propertyError ? styles.inputError : ""}
            >
              <option value="">
                {isLoadingProperties ? "Loading..." : "Select a cottage"}
              </option>
              {properties.map((prop) => (
                <option key={prop._id} value={prop._id}>
                  {prop.name}
                </option>
              ))}
            </select>
            {propertyError && <span className={styles.errorText}>{propertyError}</span>}
          </div>

          <div className={styles.dateBox}>
            <label className={styles.label}>Select dates</label>
            <div
              className={`${styles.date} ${!propertySelection || isLoadingUnavailableDates ? styles.dateDisabled : ""}`}
              onClick={() =>
                propertySelection &&
                !isLoadingUnavailableDates &&
                hasLoadedUnavailableDates &&
                setCalendarOpen(!isCalendarOpen)
              }
            >
              <span className={styles.dateText}>
                <span>
                  {bookingDates.start && bookingDates.end
                    ? `${formatDisplayDate(bookingDates.start)} — ${formatDisplayDate(bookingDates.end)}`
                    : !propertySelection
                      ? "First select a property"
                      : isLoadingUnavailableDates
                        ? "Loading calendar..."
                        : "Select dates"}
                </span>
                {isLoadingUnavailableDates && (
                  <span
                    className={styles.inlineSpinner}
                    aria-hidden="true"
                  ></span>
                )}
              </span>
              <span className={styles.dateArrow}>&#9662;</span>
            </div>
            {isCalendarOpen &&
              hasLoadedUnavailableDates &&
              !isLoadingUnavailableDates && (
                <div
                  ref={calendarRef}
                  className={`${styles.setDate} ${isCalendarOpen ? styles.expandedDate : ""}`}
                >
                  <CalendarPicker
                    dates={calendarDates}
                    onDateChange={setBookingDates}
                    minBookingDays={minBookingDays}
                    maxBookingDays={maxBookingDays}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setCalendarOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              )}
          </div>

          <div
            className={`${styles.inputGroup} ${!propertySelection || missingLimits ? styles.disabledGroup : ""}`}
          >
            <label>Adults</label>
            <QuantityPicker
              value={adults}
              onIncrement={() =>
                setAdults((prev) => Math.min(maxAdults ?? 1, prev + 1))
              }
              onDecrement={() => setAdults((prev) => Math.max(1, prev - 1))}
              min={1}
              max={maxAdults ?? 1}
            />
          </div>

          <div
            className={`${styles.inputGroup} ${!propertySelection || missingLimits ? styles.disabledGroup : ""}`}
          >
            <label>Children (free)</label>
            <QuantityPicker
              value={children}
              onIncrement={() => setChildren((prev) => Math.min(selectedProperty?.maxChildren ?? 10, prev + 1))}
              onDecrement={() => setChildren((prev) => Math.max(0, prev - 1))}
              min={0}
              max={selectedProperty?.maxChildren ?? 10}
            />
          </div>

          <div
            className={`${styles.inputGroup} ${!propertySelection || missingLimits ? styles.disabledGroup : ""}`}
          >
            <label>Extra beds</label>
            <QuantityPicker
              value={extraBeds}
              onIncrement={() =>
                setExtraBeds((prev) =>
                  Math.min(maxExtraBedsValue ?? 0, prev + 1),
                )
              }
              onDecrement={() => setExtraBeds((prev) => Math.max(0, prev - 1))}
              min={0}
              max={maxExtraBedsValue ?? 0}
            />
          </div>
        </div>

        <h2 className={styles.sectionTitle}>Payment</h2>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label htmlFor="totalPrice">Total price (GBP)</label>
            <div className={styles.priceInputWrapper}>
              <input
                id="totalPrice"
                type="number"
                required
                step="0.01"
                min="0.01"
                value={totalPrice || ""}
                disabled={
                  isCalculating || !propertySelection || !isDateRangeSelected
                }
                onChange={(e) => setTotalPrice(parseFloat(e.target.value) || 0)}
              />
              {isCalculating && <div className={styles.spinner}></div>}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="paidAmount">Paid amount (GBP)</label>
            <input
              id="paidAmount"
              type="number"
              step="0.01"
              min="0"
              max={totalPrice}
              value={paidAmount ?? ""}
              onChange={handlePaidAmountChange}
              onKeyDown={(e) => {
                if (e.key === ",") {
                  e.preventDefault();
                  document.execCommand("insertText", false, ".");
                }
              }}
              className={paidAmountError ? styles.inputError : ""}
            />
            {paidAmountError && <span className={styles.errorText}>{paidAmountError}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label>Amount due</label>
            <div className={styles.remainingAmount}>
              <span className={styles.remainingValue}>
                {remainingAmount.toFixed(2)} GBP
              </span>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Payment status</label>
            <span className={`${styles.badge} ${paymentBadge.class}`}>
              {paymentBadge.text}
            </span>
          </div>
        </div>

        <h2 className={styles.sectionTitle}>Additional options</h2>
        <div className={styles.invoiceOptionGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={wantsInvoice}
              onChange={(e) => setWantsInvoice(e.target.checked)}
            />
            <span>Invoice required</span>
          </label>
        </div>

        <div
          className={`${styles.invoiceWrapper} ${wantsInvoice ? styles.expanded : ""}`}
        >
          <div className={styles.invoiceContent}>
            <h3 className={styles.invoiceTitle}>VAT invoice details</h3>
            <div className={styles.inputGroup}>
              <label>Company name *</label>
              <input
                name="companyName"
                type="text"
                value={invoiceData.companyName}
                onChange={handleInvoiceChange}
                className={invoiceErrors.companyName ? styles.inputError : ""}
                disabled={!wantsInvoice}
              />
              {invoiceErrors.companyName && <span className={styles.errorText}>{invoiceErrors.companyName}</span>}
            </div>
            <div className={styles.inputGroup}>
              <label>Address *</label>
              <input
                name="address"
                type="text"
                value={invoiceData.address}
                onChange={handleInvoiceChange}
                className={invoiceErrors.address ? styles.inputError : ""}
                disabled={!wantsInvoice}
              />
              {invoiceErrors.address && <span className={styles.errorText}>{invoiceErrors.address}</span>}
            </div>
            <div className={styles.grid}>
              <div className={styles.inputGroup}>
                <label>Postal code *</label>
                <input
                  name="postalCode"
                  type="text"
                  value={invoiceData.postalCode}
                  onChange={handleInvoiceChange}
                  className={invoiceErrors.postalCode ? styles.inputError : ""}
                  maxLength={6}
                  disabled={!wantsInvoice}
                />
                {invoiceErrors.postalCode && <span className={styles.errorText}>{invoiceErrors.postalCode}</span>}
              </div>
              <div className={styles.inputGroup}>
                <label>City *</label>
                <input
                  name="city"
                  type="text"
                  value={invoiceData.city}
                  onChange={handleInvoiceChange}
                  className={invoiceErrors.city ? styles.inputError : ""}
                  disabled={!wantsInvoice}
                />
                {invoiceErrors.city && <span className={styles.errorText}>{invoiceErrors.city}</span>}
              </div>
            </div>
          </div>
        </div>

        <h2 className={styles.sectionTitle}>Guest details</h2>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label htmlFor="firstName">First name</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={guestData.firstName}
              onChange={(e) => { setGuestData((p) => ({ ...p, firstName: e.target.value })); if (guestErrors.firstName) setGuestErrors((p) => ({ ...p, firstName: "" })); }}
              className={guestErrors.firstName ? styles.inputError : ""}
            />
            {guestErrors.firstName && <span className={styles.errorText}>{guestErrors.firstName}</span>}
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="lastName">Last name</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={guestData.lastName}
              onChange={(e) => { setGuestData((p) => ({ ...p, lastName: e.target.value })); if (guestErrors.lastName) setGuestErrors((p) => ({ ...p, lastName: "" })); }}
              className={guestErrors.lastName ? styles.inputError : ""}
            />
            {guestErrors.lastName && <span className={styles.errorText}>{guestErrors.lastName}</span>}
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="guestEmail">Email</label>
            <input
              id="guestEmail"
              name="guestEmail"
              type="email"
              value={guestData.email}
              onChange={(e) => { setGuestData((p) => ({ ...p, email: e.target.value })); if (guestErrors.email) setGuestErrors((p) => ({ ...p, email: "" })); }}
              className={guestErrors.email ? styles.inputError : ""}
            />
            {guestErrors.email && <span className={styles.errorText}>{guestErrors.email}</span>}
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="guestPhone">Phone</label>
            <input
              id="guestPhone"
              name="guestPhone"
              type="tel"
              value={guestData.phone}
              onChange={(e) => { setGuestData((p) => ({ ...p, phone: e.target.value })); if (guestErrors.phone) setGuestErrors((p) => ({ ...p, phone: "" })); }}
              className={guestErrors.phone ? styles.inputError : ""}
            />
            {guestErrors.phone && <span className={styles.errorText}>{guestErrors.phone}</span>}
          </div>
        </div>

        <div className={styles.inputGroup + " " + styles.internalNotes}>
          <label htmlFor="internalNotes">Internal note</label>
          <textarea id="internalNotes" name="internalNotes" rows={3}></textarea>
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={resetAll}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={Boolean(isPending || missingLimits)}
            title={
              missingLimits
                ? "First configure guest limits in property settings"
                : undefined
            }
          >
            {isPending ? "Saving..." : "Save booking"}
          </Button>
        </div>
      </form>

      <Modal
        isOpen={feedbackModal.isOpen}
        onClose={() =>
          setFeedbackModal({
            isOpen: false,
            title: "",
            message: "",
          })
        }
        title={feedbackModal.title}
        cancelText="Close"
      >
        <div>{feedbackModal.message}</div>
      </Modal>
    </AdminShell>
  );
}