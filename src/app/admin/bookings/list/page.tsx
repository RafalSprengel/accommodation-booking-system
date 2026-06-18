export const dynamic = 'force-dynamic'

import { getAdminBookingsList } from '@/actions/adminBookingActions';
import Link from 'next/link';
import styles from './page.module.css';
import AdminShell from '../../_components/AdminShell/AdminShell';
import BookingSearch from './BookingSearch';
import BookingAccordionList from './BookingAccordionList';

interface BookingsListPageProps {
  searchParams?: Promise<{ q?: string; status?: string }>;
}

export default async function BookingsListPage({ searchParams }: BookingsListPageProps) {
  const bookings = await getAdminBookingsList();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const orderQuery = typeof resolvedSearchParams?.q === 'string' ? resolvedSearchParams.q.trim() : '';
  const statusFilter = typeof resolvedSearchParams?.status === 'string' ? resolvedSearchParams.status : 'confirmed';
  const normalizedOrderQuery = orderQuery.toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredBookings = bookings.filter((booking: any) => {
    let matchStatus = false;
    if (statusFilter === 'confirmed') {
      matchStatus = ['confirmed', 'blocked'].includes(booking.status);
    } else if (statusFilter === 'pending') {
      matchStatus = booking.status === 'pending';
    } else if (statusFilter === 'rejected') {
      matchStatus = ['failed', 'cancelled'].includes(booking.status);
    } else {
      matchStatus = true; // all
    }

    let matchSearch = true;
    if (normalizedOrderQuery.length > 0) {
      const q = normalizedOrderQuery;
      const fullName = `${(booking.firstName || '').toString()} ${(booking.lastName || '').toString()}`.trim();
      matchSearch =
        (typeof booking.orderId === 'string' && booking.orderId.toLowerCase().includes(q)) ||
        (fullName.length > 0 && fullName.toLowerCase().includes(q)) ||
        (typeof booking.guestEmail === 'string' && booking.guestEmail.toLowerCase().includes(q));
    }

    return matchStatus && matchSearch;
  });

  const upcomingBookings = filteredBookings
    .filter((b: any) => new Date(b.endDate) >= today)
    .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const pastBookings = filteredBookings
    .filter((b: any) => new Date(b.endDate) < today)
    .sort((a: any, b: any) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

  return (
    <AdminShell
      title="Booking list"
      description="Browse, edit or delete existing bookings."
    >

      <div className={styles.filtersWrap}>
        <div className={styles.filters} role="navigation" aria-label="Status filter">
          <Link
            href={`/admin/bookings/list?status=confirmed${orderQuery ? `&q=${orderQuery}` : ''}`}
            className={`${styles.filterBtn} ${statusFilter === 'confirmed' ? styles.filterBtnConfirmedActive : ''}`}
          >
            Confirmed
          </Link>
          <Link
            href={`/admin/bookings/list?status=rejected${orderQuery ? `&q=${orderQuery}` : ''}`}
            className={`${styles.filterBtn} ${statusFilter === 'rejected' ? styles.filterBtnFailedActive : ''}`}
          >
            Rejected
          </Link>
          <Link
            href={`/admin/bookings/list?status=pending${orderQuery ? `&q=${orderQuery}` : ''}`}
            className={`${styles.filterBtn} ${statusFilter === 'pending' ? styles.filterBtnPendingActive : ''}`}
          >
            Pending
          </Link>
          <Link
            href={`/admin/bookings/list?status=all${orderQuery ? `&q=${orderQuery}` : ''}`}
            className={`${styles.filterBtn} ${statusFilter === 'all' ? styles.filterBtnActive : ''}`}
          >
            All
          </Link>
        </div>

        <BookingSearch defaultValue={orderQuery} />
      </div>

      {filteredBookings.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{orderQuery.length > 0 ? 'No bookings matching the search query.' : 'No bookings in the system.'}</p>
        </div>
      ) : (
        <>
          {upcomingBookings.length > 0 && (
            <BookingAccordionList bookings={upcomingBookings} />
          )}

          {upcomingBookings.length > 0 && pastBookings.length > 0 && (
            <h2 className={styles.pastDivider}>Past bookings</h2>
          )}

          {pastBookings.length > 0 && (
            <BookingAccordionList bookings={pastBookings} isPast />
          )}
        </>
      )}
    </AdminShell>
  );
}