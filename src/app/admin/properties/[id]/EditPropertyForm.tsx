"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProperty, updateProperty } from "@/actions/adminPropertyActions";
import Button from "@/app/_components/UI/Button/Button";
import FormField from "@/app/admin/_components/FormField/FormField";
import styles from "./page.module.css";

export default function EditPropertyForm({
  property,
  propertyId,
}: {
  property: any;
  propertyId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isActive, setIsActive] = useState(property.isActive);

  const handleUpdate = async (formData: FormData) => {
    startTransition(async () => {
      const result = await updateProperty(propertyId, formData);
      if (result.success) {
        setMessage({ type: "success", text: "Changes saved!" });
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.message });
      }
    });
  };

  const handleDelete = async () => {
    if (
      !confirm("Are you sure you want to delete this cottage? This action cannot be undone.")
    )
      return;
    setIsDeleting(true);
    const result = await deleteProperty(propertyId);
    if (result.success) {
      router.push("/admin/properties");
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.message });
      setIsDeleting(false);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsActive(e.target.checked);
  };

  return (
    <>
      {message && (
        <div
          className={`${styles.alert} ${message.type === "success" ? styles.alertSuccess : styles.alertError}`}
        >
          {message.text}
        </div>
      )}

      <form action={handleUpdate} className={styles.formCard}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Basic information</h2>
          <div className={styles.grid}>
            <FormField id="name" label="Cottage name *">
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={property.name}
                placeholder="e.g. Cottage A (Wolf)"
              />
            </FormField>

          </div>
          <FormField id="description" label="Description">
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={property.description || ""}
              placeholder="Short description of the cottage for guests..."
            />
          </FormField>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Capacity</h2>
          <div className={styles.grid}>
            <FormField id="maxAdults" label="Max. adults *" hint="Maximum number of adult guests.">
              <input
                id="maxAdults"
                name="maxAdults"
                type="number"
                min="1"
                max="30"
                required
                defaultValue={property.maxAdults}
              />
            </FormField>
            <FormField id="maxChildren" label="Max. children (free) *" hint="Maximum number of children.">
              <input
                id="maxChildren"
                name="maxChildren"
                type="number"
                min="0"
                max="30"
                required
                defaultValue={property.maxChildren}
              />
            </FormField>
            <FormField id="maxExtraBeds" label="Max. extra beds *" hint="How many additional beds can be added.">
              <input
                id="maxExtraBeds"
                name="maxExtraBeds"
                type="number"
                min="0"
                max="10"
                required
                defaultValue={property.maxExtraBeds}
              />
            </FormField>
          </div>
        </div>
        {/* <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Images</h2>
          <div className={styles.inputGroup}>
            <label htmlFor="images">Image URLs (separated by commas)</label>
            <textarea
              id="images"
              name="images"
              rows={3}
              defaultValue={property.images?.join(", ") || ""}
              placeholder="/images/cottage-1.jpg, /images/cottage-2.jpg"
            />
            <small className={styles.hint}>
              Paste image paths, separating them with commas.
            </small>
          </div>
        </div> */}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Status</h2>
          <div className={styles.toggleGroup}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                name="isActive"
                value="true"
                checked={isActive}
                onChange={handleStatusChange}
              />
              <span
                className={`${styles.toggleText} ${isActive ? styles.active : styles.inactive}`}
              >
                {isActive
                  ? "Active – visible in search"
                  : "Inactive – hidden from guests"}
              </span>
            </label>
          </div>
        </div>

        <div className={styles.actions}>
          <Button href="/admin/properties" variant="secondary">
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "⏳ Saving..." : "💾 Save changes"}
          </Button>
        </div>
      </form>

      <div className={styles.dangerZone}>
        <h3 className={styles.dangerTitle}>Danger Zone</h3>
        <p className={styles.dangerDesc}>
          Deleting a cottage is permanent. You can only delete properties that have no
          bookings.
        </p>
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "⏳ Deleting..." : "🗑️ Delete cottage"}
        </Button>
      </div>
    </>
  );
}