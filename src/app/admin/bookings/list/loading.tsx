import AdminShell from '../../_components/AdminShell/AdminShell'
import styles from './page.module.css';
// FloatingBackButton provided by admin layout

export default function Loading() {
  return (
    <AdminShell title="Booking list" description="Browse, edit or delete existing bookings.">

      <div className={styles.loadingState} role="status" aria-live="polite">
        <span className={styles.loadingSpinner} aria-hidden="true"></span>
        <span>Loading...</span>
      </div>
    </AdminShell>
  )
}