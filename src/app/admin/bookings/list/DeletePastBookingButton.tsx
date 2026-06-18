"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import Modal from "@/app/_components/Modal/Modal";
import { deleteBookingAction } from "@/actions/adminBookingActions";
import Button from "@/app/_components/UI/Button/Button";

export default function DeletePastBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteBookingAction(bookingId);
    if (result.success) {
      toast.success("Booking has been deleted.");
      router.refresh();
    } else {
      toast.error("Error: " + (result.message || "Failed to delete booking."));
      setIsDeleting(false);
    }
    setShowConfirm(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="danger"
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Delete booking"
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isDeleting}
      >
        <p>Are you sure you want to delete this booking? This action cannot be undone.</p>
      </Modal>
    </>
  );
}