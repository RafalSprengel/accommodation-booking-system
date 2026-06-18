"use client";

import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  createBlockedBookingByAdmin,
  deleteBlockedBookingByAdmin,
  getBlockedBookings,
  getUnavailableDatesForBlocking,
} from "@/actions/adminBookingActions";
import { getAllProperties } from "@/actions/adminPropertyActions";
import Button from "@/app/_components/UI/Button/Button";
import CalendarPicker, {
  type DatesData,
} from "@/app/_components/CalendarPicker/CalendarPicker";
// FloatingBackButton provided by admin layout
import Modal from "@/app/_components/Modal/Modal";
import { formatDisplayDate } from "@/utils/formatDate";
import styles from "./page.module.css";
import AdminShell from "../../_components/AdminShell/AdminShell";
import { isDateInPast } from "@/utils/dateHelpers";

interface PropertyOption {
  _id: string;
  name: string;
}

interface BookingDates {
  start: string | null;
  end: string | null;
  count: number;
}

interface BlockedItem {
  _id: string;
  propertyId: string;
  propertyName: string;
  startDate: string;
  endDate: string;
  adminNotes: string;
  createdAt: string;
}

const ALL_PROPERTIES_ID = "ALL_PROPERTIES";

export default function BlockBookingsPage() {
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [bookingDates, setBookingDates] = useState<BookingDates>({
    start: null,
    end: null,
    count: 0,
  });
  const [calendarDates, setCalendarDates] = useState<DatesData>({});
  const [allBlockedBookings, setAllBlockedBookings] = useState<BlockedItem[]>([]);
  const [adminNotes, setAdminNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUnavailable, setIsLoadingUnavailable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlockedItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  const loadBlockedBookings = useCallback(async () => {
    try {
      const rows = await getBlockedBookings();
      setAllBlockedBookings(rows);
    } catch (error: any) {
      setErrorMessage(error?.message ?? "Failed to load blocked dates.");
    }
  }, []);



  const loadUnavailable = useCallback(async (propertyId: string) => {
    setIsLoadingUnavailable(true);
    try {
      const dates = await getUnavailableDatesForBlocking(propertyId);
      const mapped: DatesData = {};
      dates.forEach((entry) => {
        if (entry.date) {
          mapped[entry.date] = { available: false };
        }
      });
      setCalendarDates(mapped);
    } catch (error: any) {
      setErrorMessage(
        error?.message ?? "Failed to load occupied dates.",
      );
    } finally {
      setIsLoadingUnavailable(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const props = await getAllProperties();
        setProperties(props.map((p) => ({ _id: p._id, name: p.name })));
        await loadBlockedBookings();
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [loadBlockedBookings]);

  useEffect(() => {
    setBookingDates({ start: null, end: null, count: 0 });
    setErrorMessage(null);

    if (!selectedPropertyId) {
      setCalendarDates({});
    } else {
      loadUnavailable(selectedPropertyId);
    }
  }, [selectedPropertyId, loadUnavailable]);

  const handleCreateBlock = async () => {
    if (!selectedPropertyId || !bookingDates.start) {
      const message = "Select a cottage and at least a start date for the block.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    const normalizedEndDate =
      bookingDates.end &&
        dayjs(bookingDates.end).isAfter(dayjs(bookingDates.start), "day")
        ? dayjs(bookingDates.end).add(1, "day").format("YYYY-MM-DD")
        : dayjs(bookingDates.start).add(1, "day").format("YYYY-MM-DD");

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await createBlockedBookingByAdmin({
        propertyId: selectedPropertyId,
        startDate: bookingDates.start,
        endDate: normalizedEndDate,
        adminNotes,
      });

      if (result.success) {
        toast.success(result.message);
        setBookingDates({ start: null, end: null, count: 0 });
        setAdminNotes("");
        await loadUnavailable(selectedPropertyId);
        await loadBlockedBookings();
      } else {
        toast.error(result.message);
        setErrorMessage(result.message);
      }
    } catch (error: any) {
      const message =
        error?.message ?? "Failed to create date block.";
      toast.error(message);
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    setIsDeletingId(id);
    setErrorMessage(null);

    try {
      const result = await deleteBlockedBookingByAdmin(id);
      if (result.success) {
        setDeleteTarget(null);
        toast.success(result.message);
        if (selectedPropertyId) {
          await loadUnavailable(selectedPropertyId);
        }
        await loadBlockedBookings();
      } else {
        toast.error(result.message);
        setErrorMessage(result.message);
      }
    } catch (error: any) {
      const message = error?.message ?? "Failed to delete block.";
      toast.error(message);
      setErrorMessage(message);
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <AdminShell title="Block dates" description="Create administrative blocks for one cottage or all cottages.">
      <div className={styles.container}>
        <form
          className={styles.card}
          onSubmit={(e) => {
            e.preventDefault();
            void handleCreateBlock();
          }}
        >
          <div className={styles.cardHeader}>
            <h2>New block</h2>
            <span className={styles.cardBadge}>Admin</span>
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingContent}>
              <label className={styles.settingLabel} htmlFor="propertySelect">
                Cottage
              </label>
              <p className={styles.settingDescription}>
                Select a cottage from the list or the "All" option.
              </p>
            </div>
            <div className={styles.settingControl}>
              <select
                id="propertySelect"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className={styles.selectInput}
                disabled={isLoading || isSubmitting}
              >
                <option value="">-- Select cottage --</option>
                {properties.map((property) => (
                  <option key={property._id} value={property._id}>
                    {property.name}
                  </option>
                ))}
                <option value={ALL_PROPERTIES_ID}>All</option>
              </select>
            </div>
          </div>

          {selectedPropertyId && (
            <div className={styles.settingRow}>
              <div className={styles.settingContent}>
                <label className={styles.settingLabel}>Block range</label>
                <p className={styles.settingDescription}>
                  Select a day or range to block in the calendar.
                </p>
              </div>
              <div className={styles.settingControl}>
                {isLoadingUnavailable ? (
                  <div className={styles.loadingHint}>
                    Loading occupied dates...
                  </div>
                ) : (
                  <CalendarPicker
                    dates={calendarDates}
                    onDateChange={setBookingDates}
                    minBookingDays={0}
                  />
                )}
                <div className={styles.rangePreview}>
                  <strong>Selected range:</strong>{" "}
                  {bookingDates.start && bookingDates.end
                    ? `${formatDisplayDate(bookingDates.start)} -> ${formatDisplayDate(bookingDates.end)}`
                    : bookingDates.start
                      ? `${formatDisplayDate(bookingDates.start)} (1 day)`
                      : "none"}
                </div>
              </div>
            </div>
          )}

          {selectedPropertyId && (
            <div className={styles.settingRow}>
              <div className={styles.settingContent}>
                <label className={styles.settingLabel} htmlFor="adminNotes">
                  Note (optional)
                </label>
                <p className={styles.settingDescription}>
                  This note will not be visible to customers, only in the admin panel.
                </p>
              </div>
              <div className={styles.settingControl}>
                <textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className={styles.notesInput}
                  placeholder="e.g. technical service"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          <div className={styles.actionsRow}>
            <Button
              type="button"
              variant='secondary'
              onClick={() => void handleCreateBlock()}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Block date"}
            </Button>
          </div>

          {errorMessage && <div className={styles.errorMsg}>{errorMessage}</div>}
        </form>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Existing blocks</h2>
            <span className={styles.cardBadge}>
              {showPast
                ? allBlockedBookings.length
                : allBlockedBookings.filter((b) => !isDateInPast(b.endDate)).length}
            </span>
          </div>

          {(showPast
            ? allBlockedBookings
            : allBlockedBookings.filter((b) => !isDateInPast(b.endDate))
          ).length === 0 ? (
            <div className={styles.emptyState}>
              No active blocks.
            </div>
          ) : (
            <div className={styles.blockList}>
              {(showPast
                ? allBlockedBookings
                : allBlockedBookings.filter((b) => !isDateInPast(b.endDate))
              ).map((item) => (
                <article
                  key={item._id}
                  className={`${styles.blockItem}${isDateInPast(item.endDate) ? ` ${styles.blockItemPast}` : ""}`}
                >
                  <div className={styles.blockMeta}>
                    <div className={styles.blockMetaHeader}>
                      <strong>{item.propertyName}</strong>
                      {isDateInPast(item.endDate) && (
                        <span className={styles.pastBadge}>past</span>
                      )}
                    </div>
                    <span>
                      {dayjs(item.endDate).diff(dayjs(item.startDate), "day") === 1
                        ? formatDisplayDate(item.startDate)
                        : `${formatDisplayDate(item.startDate)} – ${formatDisplayDate(dayjs(item.endDate).subtract(1, "day").toISOString())}`}
                    </span>
                    {item.adminNotes && <small>{item.adminNotes}</small>}
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => setDeleteTarget(item)}
                    disabled={isDeletingId === item._id}
                    style={{ backgroundColor : isDateInPast(item.endDate) ? "#d66a6a" : undefined, borderColor: isDateInPast(item.endDate) ? "#ef7d7d" : undefined }}
                  >
                    {isDeletingId === item._id ? "Deleting..." : "Delete block"}
                  </Button>
                </article>
              ))}
            </div>
          )}
          <button
            type="button"
            className={styles.togglePastLink}
            onClick={() => setShowPast((prev) => !prev)}
          >
            {showPast ? "Show current" : "Show past as well"}
          </button>
        </div>

        <Modal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={
            deleteTarget ? () => handleDeleteBlock(deleteTarget._id) : undefined
          }
          title="Confirm deletion"
          confirmText="Yes, delete"
          loadingText="Deleting..."
          cancelText="Cancel"
          confirmVariant="danger"
          isLoading={Boolean(deleteTarget && isDeletingId === deleteTarget._id)}
        >
          <p>Are you sure you want to delete this block?</p>
        </Modal>
      </div>
    </AdminShell>
  );
}