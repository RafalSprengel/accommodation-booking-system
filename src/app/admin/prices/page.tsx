import { getBookingConfig } from '@/actions/bookingConfigActions'
import { getAllProperties } from '@/actions/adminPropertyActions'
import { getAllSeasons } from '@/actions/seasonActions'
// FloatingBackButton provided by admin layout
import AdminShell from '../_components/AdminShell/AdminShell'
import PriceSettingsForm from './PriceSettingsForm'
import styles from './PriceSettingsForm.module.css'

export default async function PricesPage() {
  const [properties, bookingConfig, seasons] = await Promise.all([
    getAllProperties(),
    getBookingConfig(),
    getAllSeasons()
  ])

  const childrenFreeAge = bookingConfig?.childrenFreeAgeLimit ?? 13

  const serializedProperties = JSON.parse(JSON.stringify(properties))
  const serializedSeasons = JSON.parse(JSON.stringify(seasons))

  return (
    <AdminShell title="Price Management" description="Configure base rates, seasonal rates, and individual prices.">

      <div className={styles.priorityInfo}>
        <div className={styles.priorityInfoIcon}>i</div>
        <div className={styles.content}>
          <span className={styles.priorityInfoTitle}>Price Priorities</span>
          <span className={styles.priorityInfoText}>
            Individual prices take priority over seasonal prices, and seasonal prices take priority over base prices.
          </span>
          <div className={styles.priorityInfoChain}>
            <span>Individual prices</span>
            <span className={styles.priorityInfoArrow}>→</span>
            <span>Seasonal prices</span>
            <span className={styles.priorityInfoArrow}>→</span>
            <span>Base prices</span>
          </div>
        </div>
      </div>

      <PriceSettingsForm
        properties={serializedProperties}
        childrenFreeAgeLimit={childrenFreeAge}
        seasons={serializedSeasons}
      />
    </AdminShell>
  )
}