import type { PaymentStatus } from '@/types/bookingStatus';

export function calculatePaymentStatus(totalPrice: number, paidAmount: number): PaymentStatus {
  if (paidAmount >= totalPrice) return 'paid';
  if (paidAmount > 0) return 'partial_paid';
  return 'unpaid';
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case 'paid': return 'Paid';
    case 'partial_paid': return 'Partially paid';
    case 'refunded': return 'Refunded';
    case 'unpaid': return 'Unpaid';
    default: return 'Unknown';
  }
}

export function getPaymentStatusClass(status: PaymentStatus): string {
  switch (status) {
    case 'paid': return 'paymentPaid';
    case 'partial_paid': return 'paymentDeposit';
    case 'refunded': return 'paymentRefunded';
    case 'unpaid': return 'paymentUnpaid';
    default: return '';
  }
}