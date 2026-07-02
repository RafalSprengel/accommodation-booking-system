"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { updateBookingAction } from "@/actions/adminBookingActions";
import Button from "@/app/_components/UI/Button/Button";
import styles from "./page.module.css";

interface FormData {
  firstName: string;
  lastName: string;
  guestEmail: string;
  guestPhone: string;
  adults: number | "";
  children: number | "";
  extraBedsCount: number | "";
  totalPrice: number | "";
  paidAmount: number | "";
  status: string;
  startDate: string;
  endDate: string;
  internalNotes: string;
  invoice: boolean;
  invoiceCompany: string;
  invoiceAddress: string;
  invoicePostalCode: string;
  invoiceCity: string;
}

const FIELD_LABELS: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  guestEmail: "Email",
  guestPhone: "Phone",
  adults: "Adults",
  children: "Children",
  extraBedsCount: "Extra beds",
  totalPrice: "Total price",
  paidAmount: "Paid amount",
  startDate: "Check-in date",
  endDate: "Check-out date",
  invoiceCompany: "Company name",
  invoiceAddress: "Address",
  invoicePostalCode: "Postal code",
  invoiceCity: "City",
};

export default function EditBookingForm({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const formatDate = (date: any) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  };

  const initialValues: FormData = {
    firstName: initialData.firstName ?? '',
    lastName: initialData.lastName ?? '',
    guestEmail: initialData.guestEmail ?? initialData.guestInfo?.email ?? "",
    guestPhone: initialData.guestPhone ?? initialData.guestInfo?.phone ?? "",
    adults: initialData.adults ?? 1,
    children: initialData.children ?? 0,
    extraBedsCount: initialData.extraBedsCount ?? 0,
    totalPrice: initialData.totalPrice ?? 0,
    paidAmount: initialData.paidAmount ?? 0,
    status: initialData.status ?? "pending",
    startDate: formatDate(initialData.startDate),
    endDate: formatDate(initialData.endDate),
    internalNotes: (initialData.adminNotes as string) ?? (initialData.internalNotes as string) ?? '',
    invoice: initialData.invoice ?? false,
    invoiceCompany: initialData.invoiceData?.companyName ?? '',
    invoiceAddress: initialData.invoiceData?.address ?? '',
    invoicePostalCode: initialData.invoiceData?.postalCode ?? '',
    invoiceCity: initialData.invoiceData?.city ?? '',
  };

  const orderId =
    typeof initialData.orderId === "string" ? initialData.orderId.trim() : "";

  const [form, setForm] = useState<FormData>(initialValues);
  const [originalData, setOriginalData] = useState<FormData>(initialValues);

  const hasChanges = () => {
    return JSON.stringify(form) !== JSON.stringify(originalData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const target = e.target;
    const name = target.name;
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
    // Clear error for the field being changed
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    if (
      [
        "adults",
        "children",
        "extraBedsCount",
        "totalPrice",
        "paidAmount",
      ].includes(name)
    ) {
      setForm((prev) => ({
        ...prev,
        [name]: value === "" ? "" : Number(value),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    if (isSaved) setIsSaved(false);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setForm(originalData);
      setFieldErrors({});
      setIsSaved(false);
    }
    setIsEditing(!isEditing);
  };

  /** Parse server validation error message and map each error to a field */
  const parseFieldErrors = (message: string): Record<string, string> => {
    const errors: Record<string, string> = {};
    const rules: [string, string, string][] = [
      ["Company name", "invoiceCompany", "invoice"],
      ["Address", "invoiceAddress", "invoice"],
      ["Postal code", "invoicePostalCode", "invoice"],
      ["City", "invoiceCity", "invoice"],
      ["First name", "firstName", ""],
      ["Last name", "lastName", ""],
      ["email", "guestEmail", ""],
      ["phone", "guestPhone", ""],
      ["adults", "adults", ""],
      ["children", "children", ""],
      ["extra beds", "extraBedsCount", ""],
      ["Total price", "totalPrice", ""],
      ["Paid amount", "paidAmount", ""],
    ];

    for (const [searchText, fieldKey, requiredCheck] of rules) {
      if (message.toLowerCase().includes(searchText.toLowerCase())) {
        if (requiredCheck === "invoice" && !form.invoice) continue;
        errors[fieldKey] = `"${FIELD_LABELS[fieldKey] || fieldKey}" is required.`;
      }
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Collect errors locally (setFieldErrors is async, so we build an object first)
    const localErrors: Record<string, string> = {};
    setFieldErrors({});

    const requiredNumeric = [
      "adults",
      "children",
      "extraBedsCount",
      "totalPrice",
      "paidAmount",
    ];
    for (const field of requiredNumeric) {
      const val = form[field as keyof FormData];
      if (val === "" || val === null || Number.isNaN(val)) {
        localErrors[field] = `"${FIELD_LABELS[field]}" must be filled.`;
      }
    }

    // Check invoice required fields locally before sending
    if (form.invoice) {
      const requiredInvoiceFields = [
        { key: "invoiceCompany", label: "Company name" },
        { key: "invoiceAddress", label: "Address" },
        { key: "invoicePostalCode", label: "Postal code" },
        { key: "invoiceCity", label: "City" },
      ];
      for (const { key, label } of requiredInvoiceFields) {
        if (!form[key as keyof FormData]?.toString().trim()) {
          localErrors[key] = `"${label}" is required for invoice.`;
        }
      }
    }

    // If we have local errors, stop
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      setIsSaving(false);
      toast.error("Please fix the errors before saving.");
      return;
    }

    const formData = new FormData();
    formData.append("bookingId", initialData._id);
    formData.append("propertyId", initialData.propertyId);
    formData.append("extraBedsCount", String(form.extraBedsCount));
    formData.append("children", String(form.children));
    formData.append("firstName", form.firstName);
    formData.append("lastName", form.lastName);
    formData.append("guestEmail", form.guestEmail);
    formData.append("guestPhone", form.guestPhone);
    formData.append("adults", String(form.adults));
    formData.append("totalPrice", String(form.totalPrice));
    formData.append("paidAmount", String(form.paidAmount));
    formData.append("status", form.status);
    formData.append("startDate", form.startDate);
    formData.append("endDate", form.endDate);
    formData.append("internalNotes", form.internalNotes ?? "");
    // Invoice data from form
    formData.append("invoice", form.invoice ? "true" : "false");
    formData.append("invoiceCompany", form.invoiceCompany ?? "");
    formData.append("invoiceAddress", form.invoiceAddress ?? "");
    formData.append("invoicePostalCode", form.invoicePostalCode ?? "");
    formData.append("invoiceCity", form.invoiceCity ?? "");

    const result = await updateBookingAction(null, formData);

    if (result.success) {
      toast.success("Changes saved successfully!");
      setOriginalData({ ...form });
      setIsSaved(true);
      setIsEditing(false);
      setFieldErrors({});
      router.refresh();
    } else {
      // Try to parse field-level errors from server message
      const parsed = parseFieldErrors(result.message || "");
      if (Object.keys(parsed).length > 0) {
        setFieldErrors(parsed);
      } else {
        toast.error(result.message || "An error occurred.");
      }
    }

    setIsSaving(false);
  };

  const getButtonText = () => {
    if (isSaving) return "⏳ Saving...";
    if (isSaved && !hasChanges()) return "✅ Saved";
    return "💾 Save";
  };

  /** Helper to render input with error message */
  const renderField = (
    name: keyof FormData,
    label: string,
    type: "input" | "number" | "email" | "tel" | "date" | "select" | "textarea" = "input",
    extraProps: Record<string, any> = {},
  ) => {
    const error = fieldErrors[name];
    const isSelect = type === "select";
    const isTextarea = type === "textarea";
    const isNumber = type === "number";
    const isEmail = type === "email";
    const isTel = type === "tel";
    const isDate = type === "date";
    const inputType = isNumber ? "number" : isEmail ? "email" : isTel ? "tel" : isDate ? "date" : "text";
    const hasError = !!error;

    return (
      <div className={`${styles.inputGroup} ${hasError ? styles.inputGroupError : ""}`}>
        <label htmlFor={name}>{label}</label>
        {isSelect ? (
          <select
            id={name}
            name={name}
            value={form[name] as string}
            onChange={handleChange}
            disabled={!isEditing}
            className={`${!isEditing ? styles.readOnly : ""} ${hasError ? styles.inputError : ""}`}
            {...extraProps}
          >
            {extraProps.children}
          </select>
        ) : isTextarea ? (
          <textarea
            id={name}
            name={name}
            value={form[name] as string}
            onChange={handleChange}
            disabled={!isEditing}
            className={`${!isEditing ? styles.readOnly : ""} ${hasError ? styles.inputError : ""}`}
            {...extraProps}
          />
        ) : (
          <input
            id={name}
            name={name}
            type={inputType}
            value={form[name] as string | number}
            onChange={handleChange}
            readOnly={!isEditing}
            className={`${!isEditing ? styles.readOnly : ""} ${hasError ? styles.inputError : ""}`}
            {...extraProps}
          />
        )}
        {hasError && <span className={styles.fieldError}>{error}</span>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* message handled via react-hot-toast */}

      <div className={styles.formHeader}>
        <div className={styles.formTitleWrap}>
          <h2 className={styles.formTitle}>Booking data</h2>
          <span className={styles.orderIdBadge}>
            {orderId.length > 0 ? orderId : "No order number"}
          </span>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={handleEditToggle}
          disabled={isSaving}
        >
          {isEditing ? "❌ Cancel" : "✏️ Edit"}
        </Button>
      </div>

      <div className={styles.formGrid}>
        {renderField("firstName", "First name")}
        {renderField("lastName", "Last name")}
        {renderField("guestEmail", "Email", "email")}
        {renderField("guestPhone", "Phone", "tel")}
        {renderField("adults", "Adults", "number", { min: 1 })}
        {renderField("children", "Children (free)", "number", { min: 0 })}
        {renderField("extraBedsCount", "Extra beds", "number", { min: 0 })}
        {renderField("startDate", "Check-in date", "date")}
        {renderField("endDate", "Check-out date", "date")}
        {renderField("totalPrice", "Total price (GBP)", "number", { step: "0.01" })}
        {renderField("paidAmount", "Paid amount (GBP)", "number", { step: "0.01" })}
        {renderField("status", "Status", "select", {
          children: (
            <>
              <option value="pending" disabled>Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed" disabled>Rejected (failed)</option>
            </>
          ),
        })}
        {renderField("internalNotes", "Internal notes", "textarea", { rows: 3 })}
      </div>

      <div className={styles.formGrid}>
        <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
          <label className={styles.checkboxLabel}>
            <input
              name="invoice"
              type="checkbox"
              checked={form.invoice}
              onChange={handleChange}
              disabled={!isEditing}
            />
            <span>VAT Invoice</span>
          </label>
        </div>
        {form.invoice && (
          <>
            {renderField("invoiceCompany", "Company name")}
            {renderField("invoiceAddress", "Address")}
            {renderField("invoicePostalCode", "Postal code")}
            {renderField("invoiceCity", "City")}
          </>
        )}
      </div>

      {isEditing && (
        <div className={styles.formActions}>
          <Button
            type="submit"
            disabled={isSaving || (!hasChanges() && isSaved)}
          >
            {getButtonText()}
          </Button>
        </div>
      )}
    </form>
  );
}