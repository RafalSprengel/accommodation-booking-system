'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import Button from '@/app/_components/UI/Button/Button';
import DeletePastBookingButton from './DeletePastBookingButton';
import styles from './page.module.css';
import { formatGuestName, getPaymentBadge, getStatusLabel } from './utils';

interface Booking {
  _id: string;
  startDate: string;
  endDate: string;
  firstName?: string;
  lastName?: string;
  guestEmail?: string;
  propertyName?: string;
  orderId?: string;
  adults?: number;
  children?: number;
  extraBedsCount?: number;
  adminNotes?: string;
  totalPrice?: number;
  invoice?: boolean;
  paymentMethod?: string;
  paymentStatus?: string;
  paidAmount?: number;
  status?: string;
  createdAt?: string;
  source?: string;
}

interface BookingAccordionListProps {
  bookings: Booking[];
  isPast?: boolean;
}

function toNumber(value: number | string | undefined) {
  return typeof value === 'number' ? value : Number(value || 0);
}

export default function BookingAccordionList({ bookings, isPast }: BookingAccordionListProps) {
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  return (
    <div className={styles.cardsList}>
      {bookings.map((booking) => {
        const start = new Date(booking.startDate);
        const end = new Date(booking.endDate);
        const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const statusKey = booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Pending';
        const statusLabel = getStatusLabel(booking.status);
        const paidAmount = toNumber(booking.paidAmount);
        const totalPrice = toNumber(booking.totalPrice);
        const remainingAmount = totalPrice - paidAmount;
        const paymentBadge = getPaymentBadge(booking.paymentStatus || '', paidAmount, totalPrice);
        const isFullyPaid = booking.paymentStatus === 'paid' || (totalPrice > 0 && paidAmount >= totalPrice);
        const bookingId = booking._id;
        const isExpanded = activeBookingId === bookingId;
        const createdAtDate = booking.createdAt ? new Date(booking.createdAt) : null;

        return (
          <article key={bookingId} className={`${styles.bookingCard} ${isPast ? styles.pastCard : ''}`}>
            <button
              type="button"
              className={styles.bookingHeaderButton}
              onClick={() => setActiveBookingId((current) => (current === bookingId ? null : bookingId))}
              aria-expanded={isExpanded}
              aria-controls={`booking-panel-${bookingId}`}
            >
              <div className={styles.bookingHeader}>
                <span className={styles.dateLabel}>Booking:&nbsp;</span>
                <span className={styles.dateValue}>
                  {start.toLocaleDateString('pl-PL')} - {end.toLocaleDateString('pl-PL')}
                </span>
              </div>
              <span className={styles.accordionIcon} aria-hidden="true">
                <FontAwesomeIcon icon={faChevronDown} className={`${styles.icon} ${isExpanded ? styles.iconExpanded : ''}`} />
              </span>
            </button>

            <h3 className={styles.guestName}>{formatGuestName(`${booking.firstName || ''} ${booking.lastName || ''}`)}</h3>
            <div className={styles.guestEmail}>{booking.guestEmail || '-'}</div>
            <div className={styles.propertyName}>{booking.propertyName || 'Cottage'}</div>

            <div id={`booking-panel-${bookingId}`} className={`${styles.bookingPanel} ${isExpanded ? styles.bookingPanelOpen : styles.bookingPanelClosed}`}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Order no.:</span>
                <span className={styles.value}>{booking.orderId ? booking.orderId : 'No number'}</span>
              </div>

              <div className={styles.detailsGrid}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Nights:</span>
                  <span className={styles.value}>{nights}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Adults:</span>
                  <span className={styles.value}>{booking.adults}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Children (free):</span>
                  <span className={styles.value}>{booking.children}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Extra beds:</span>
                  <span className={styles.value}>{booking.extraBedsCount}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Internal notes:</span>
                  <span className={styles.value}>{booking.adminNotes ? booking.adminNotes : '-'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Price:</span>
                  <span className={styles.value}>{totalPrice.toFixed(2)} PLN</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>VAT invoice:</span>
                  <span className={styles.value}>{booking.invoice ? 'Yes' : 'No'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Payment type:</span>
                  <span className={styles.value}>{booking.paymentMethod === 'online' ? 'Online' : 'Cash / Transfer'}</span>
                </div>
                {isFullyPaid ? (
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Payment status:</span>
                    <span className={`${styles.value} ${styles.paymentPaid}`}>Paid</span>
                  </div>
                ) : (
                  <> 
                    <div className={styles.detailRow}>
                      <span className={styles.label}></span>
                      <div className={styles.priceBreakdown}>
                        <span className={styles.pricePaid}>Paid: {paidAmount.toFixed(2)} PLN</span>
                        <span className={styles.priceDue}>Due: {remainingAmount.toFixed(2)} PLN</span>
                      </div>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.label}>Payment status:</span>
                      <span className={`${styles.value} ${styles[paymentBadge.class]}`}>
                        {paymentBadge.text}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className={styles.cardFooter}>
                <span className={`${styles.badge} ${styles[`badge${statusKey}`]}`}>{statusLabel}</span>
                <span className={styles.addedDate}>
                  added: {createdAtDate ? `${createdAtDate.toLocaleDateString('pl-PL')} ${createdAtDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}` : '-'}
                </span>
                {isPast ? <DeletePastBookingButton bookingId={bookingId} /> : <Button variant="secondary" href={`/admin/bookings/list/${bookingId}`} className={styles.editBtn}>Details</Button>}
              </div>
              {booking.source === 'admin' && (
                <div className={styles.adminBubble}>Booking made via admin panel.</div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}