import { getSystemConfig } from '@/actions/adminConfigActions';
import AdminSection from '@/app/_components/UI/AdminSection/AdminSection';
import SettingRow from '@/app/_components/UI/SettingRow/SettingRow';
import ToggleSwitch from './ToggleSwitchClient';

export default async function RentalPolicySettings() {
  const config = await getSystemConfig();

  return (
    <AdminSection title="Rental Policy" badge="Global">
      <SettingRow
        label={<label htmlFor="auto-block-toggle">Auto-block other cabins</label>}
        description={
          <>
            When <strong>enabled</strong>, booking one cabin automatically blocks all others for the same dates ("single group on premises" rule).<br />
            When <strong>disabled</strong>, clients may book a cabin independently even if another cabin is already booked by another client.
          </>
        }
      >
        <ToggleSwitch
          initialState={config.autoBlockOtherCabins}
          settingKey="autoBlockOtherCabins"
        />
      </SettingRow>
    </AdminSection>
  );
}
