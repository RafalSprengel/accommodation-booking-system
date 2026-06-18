"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import Button from "@/app/_components/UI/Button/Button";
import Modal from "@/app/_components/Modal/Modal";
import styles from "./page.module.css";
export default function BookingDetailsContent({
  booking,
  onDelete,
}: {
  booking: any;
  onDelete: () => Promise<void>;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      toast.success("Booking has been deleted.");
      router.push("/admin/bookings/list");
      router.refresh();
    } catch {
      toast.error("An error occurred while deleting.");
      setIsDeleting(false);
    }
  };

  const openConfirm = () => setShowConfirm(true);
  const closeConfirm = () => setShowConfirm(false);
  const confirmDelete = async () => {
    await handleDelete();
    closeConfirm();
  };
  return (
    <>
      {/* errors shown via toast */}
      <div className={styles.infoBlock}>
        <h3 className={styles.cardTitle}>Summary</h3>
        <div className={styles.infoRow}>
          <span className={styles.label}>ID:</span>
          <code className={styles.code}>{booking._id}</code>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Created:</span>
          <span>{new Date(booking.createdAt).toLocaleString("pl-PL")}</span>
        </div>
      </div>
      <div className={styles.actionsBlock}>
        <h3 className={styles.cardTitle}>Danger zone</h3>
        <>
          <Button
            type="button"
            variant="danger"
            onClick={openConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "⏳ Deleting..." : "🗑️ Delete Booking"}
          </Button>
          <Modal
            isOpen={showConfirm}
            onClose={closeConfirm}
            onConfirm={confirmDelete}
            title={"Delete booking"}
            confirmText={"Delete"}
            cancelText={"Cancel"}
            confirmVariant="danger"
            isLoading={isDeleting}
          >
            <p>Are you sure you want to delete this booking? This action cannot be undone.</p>
          </Modal>
        </>
        <p className={styles.deleteHint}>
          Deleting a booking will free the date in the calendar.
        </p>
      </div>
    </>
  );
}