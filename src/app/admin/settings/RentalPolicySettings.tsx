import { getSystemConfig } from '@/actions/adminConfigActions';
import AdminSection from '@/app/_components/UI/AdminSection/AdminSection';
import SettingRow from '@/app/_components/UI/SettingRow/SettingRow';
import ToggleSwitch from './ToggleSwitchClient';

export default async function RentalPolicySettings() {
  const config = await getSystemConfig();

  return (
    <AdminSection title="Polityka wynajmu" badge="Globalne">
      <SettingRow
        label={<label htmlFor="auto-block-toggle">Automatyczna blokada drugiego domku</label>}
        description={
          <>
            Gdy ta opcja jest <strong>włączona</strong>, rezerwacja jednego domku automatycznie blokuje wszystkie pozostałe na te same daty (zasada &quot;jedna grupa na terenie&quot;).<br />
            Gdy <strong>wyłączona</strong>, klienci mogą rezerwować domek niezależnie, mimo że drugi jest już zarezerwowany przez innego klienta.
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
