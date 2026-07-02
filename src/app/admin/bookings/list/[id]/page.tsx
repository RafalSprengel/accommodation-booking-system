import { getBookingById } from '@/actions/adminBookingActions';
import { notFound } from 'next/navigation';
import EditBookingForm from './EditBookingForm';
import styles from './page.module.css';
import AdminShell from '../../../_components/AdminShell/AdminShell';
import DeleteConfirmButton from './DeleteConfirmButton';
import { getPaymentBadge } from '../utils';

export default async function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking) { notFound(); }

  const bookingTypeLabel = booking.source === 'online'
    ? 'Client (online)'
    : booking.source === 'admin'
      ? 'Admin (manual)'
      : '-';

  const propertyName = booking.propertyName || '-';
  const paidAmount = Number(booking.paidAmount);
  const totalPrice = Number(booking.totalPrice);
  const remainingAmount = totalPrice - paidAmount;
  const paymentBadge = getPaymentBadge(booking.paymentStatus || '', paidAmount, totalPrice);
  const isFullyPaid = booking.paymentStatus === 'paid' || (totalPrice > 0 && paidAmount >= totalPrice);
  return (
    <AdminShell title="Booking details">
      <div className={styles.grid}>
        <div className={styles.mainCard}>
          <EditBookingForm initialData={booking} />
        </div>

        <div className={styles.sideCard}>
          <div className={styles.infoBlock}>
            <h3 className={styles.cardTitle}>Summary</h3>
            <div className={styles.infoRow}><span className={styles.label}>ID:</span><code className={styles.code}>{booking._id}</code></div>
            <div className={styles.infoRow}><span className={styles.label}>Created:</span><span>{new Date(booking.createdAt).toLocaleString('pl-PL')}</span></div>
            <div className={styles.infoRow}><span className={styles.label}>Cottage:</span><span className={styles.value}>{propertyName}</span></div>
            <div className={styles.infoRow}><span className={styles.label}>Type:</span><span className={styles.value}>{bookingTypeLabel}</span></div>
            <div className={styles.infoRow}><span className={styles.label}>Payment method:</span><span className={styles.value}>{booking.paymentMethod === 'online' ? 'Online' : booking.paymentMethod === 'cash' ? 'Cash' : booking.paymentMethod === 'transfer' ? 'Cash / Transfer' : booking.paymentMethod}</span></div>
            <div className={styles.infoRow}><span className={styles.label}>Price:</span><span className={styles.value}>{totalPrice.toFixed(2)} GBP</span></div>
            {isFullyPaid ? (
              <div className={styles.infoRow}>
                <span className={styles.label}>Payment status:</span>
                <span className={`${styles.value} ${styles.paymentPaid}`}>Paid</span>
              </div>
            ) : (
              <>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Paid:</span>
                  <span className={`${styles.value} ${styles.pricePaid}`}>{paidAmount.toFixed(2)} GBP</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Due:</span>
                  <span className={`${styles.value} ${styles.priceDue}`}>{remainingAmount.toFixed(2)} GBP</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Payment status:</span>
                  <span className={`${styles.value} ${styles[paymentBadge.class]}`}>
                    {paymentBadge.text}
                  </span>
                </div>
              </>
            )}
            {booking.source === 'admin' && (
              <div className={styles.adminBubble} style={{ marginTop: 12, fontSize: '0.92em', background: '#f1f5f9', color: '#334155', borderRadius: 8, padding: '6px 12px', display: 'inline-block' }}>
                Booking made via admin panel
              </div>
            )}
          </div>
          <div className={styles.actionsBlock}>
            <h3 className={styles.cardTitle}>Danger zone</h3>
            <div className={styles.deleteConfirmButtonWrap}>
              <DeleteConfirmButton bookingId={booking._id} />
            </div>
            <p className={styles.deleteHint}>Deleting a booking will free the date in the calendar.</p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}