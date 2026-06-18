import AdminAccountSettings from './AdminAccountSettings';
import SiteSettingsForm from './SiteSettingsForm';
import BookingConfirmationSettings from './BookingConfirmationSettings';
import RentalPolicySettings from './RentalPolicySettings';
import AdminShell from '../_components/AdminShell/AdminShell';

export default async function SettingsPage() {
  return (
    <AdminShell title="System settings" description="Manage the global property rental policy.">
      <RentalPolicySettings />
      <SiteSettingsForm />
      <BookingConfirmationSettings />
      <AdminAccountSettings />
    </AdminShell>
  );
}