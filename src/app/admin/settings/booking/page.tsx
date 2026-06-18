import { getBookingConfig } from '@/actions/bookingConfigActions';
import AdminShell from '../../_components/AdminShell/AdminShell';
import BookingSettingsForm from './BookingSettingsForm';

export default async function BookingSettingsPage() {
  const config = await getBookingConfig();
  return (
    <AdminShell title="Booking settings" description="Manage global booking rules.">
      <BookingSettingsForm initialConfig={config} />
    </AdminShell>
  );
}