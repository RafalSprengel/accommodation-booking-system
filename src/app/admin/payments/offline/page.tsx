// FloatingBackButton provided by admin layout
export const dynamic = 'force-dynamic'

import { getAdminPaymentsData } from '@/actions/adminPaymentActions'
import AdminShell from '../../_components/AdminShell/AdminShell'
import PaymentsPanel from '../PaymentsPanel'
import styles from '../page.module.css'

export default async function AdminPaymentsOfflinePage() {
  const paymentsData = await getAdminPaymentsData()

  return (
    <AdminShell title="Cash or Transfer Payments" description="Browse payments made by cash or transfer.">

      <PaymentsPanel initialData={paymentsData} mode="offline" />
    </AdminShell>
  )
}
