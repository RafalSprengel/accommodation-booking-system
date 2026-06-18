'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createProperty } from '@/actions/adminPropertyActions';
import Button from '@/app/_components/UI/Button/Button';
import FormField from '@/app/admin/_components/FormField/FormField';
import styles from './page.module.css';

export default function AddPropertyForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    const result = await createProperty(formData);
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      formRef.current?.reset();
      setTimeout(() => { router.push('/admin/properties'); router.refresh(); }, 1500);
    } else {
      setMessage({ type: 'error', text: result.message });
    }
    setIsSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Add new property</h1>
        <p>Enter the details of the new property in the system.</p>
      </header>
      {message && (<div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>{message.text}</div>)}
      <form ref={formRef} onSubmit={handleSubmit} className={styles.formCard}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Basic information</h2>
          <div className={styles.grid}>
            <FormField id="name" label="Cottage name *">
              <input id="name" name="name" type="text" required placeholder="e.g. Cottage A (Wolf)" />
            </FormField>

          </div>
          <FormField id="description" label="Description">
            <textarea id="description" name="description" rows={4} placeholder="Short description of the cottage for guests..." />
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
                max="20"
                defaultValue={4}
                required
              />
            </FormField>
            <FormField id="maxChildren" label="Max. children (free) *" hint="Maximum number of children.">
              <input
                id="maxChildren"
                name="maxChildren"
                type="number"
                min="0"
                max="30"
                defaultValue={6}
                required
              />
            </FormField>
            <FormField id="maxExtraBeds" label="Max. extra beds *" hint="How many additional beds can be added.">
              <input
                id="maxExtraBeds"
                name="maxExtraBeds"
                type="number"
                min="0"
                max="10"
                defaultValue={2}
                required
              />
            </FormField>
          </div>
        </div>
        {/* <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Images</h2>
          <div className={styles.inputGroup}>
            <label htmlFor="images">Image URLs (separated by commas)</label>
            <textarea id="images" name="images" rows={3} placeholder="/images/cottage-1.jpg, /images/cottage-2.jpg" />
            <small className={styles.hint}>Paste image paths, separating them with commas.</small>
          </div>
        </div> */}

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : '💾 Save property'}</Button>
        </div>
      </form>
    </div>
  );
}