export function getPaymentBadge(paymentStatus: string, paidAmount: number, totalPrice: number) {
  const isFullyPaidByAmount = totalPrice > 0 && paidAmount >= totalPrice;
  if (paymentStatus === 'paid' || isFullyPaidByAmount) {
    return { text: 'Paid', class: 'paymentPaid' };
  }

  if (paidAmount > 0) {
    return { text: 'Deposit', class: 'paymentDeposit' };
  }

  return { text: 'Unpaid', class: 'paymentUnpaid' };
}

export function formatGuestName(name: string) {
  if (!name) return 'Guest';
  const trimmed = name.trim();
  if (trimmed === trimmed.toUpperCase() || trimmed === trimmed.toLowerCase()) {
    return trimmed
      .toLowerCase()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return trimmed;
}

export function getStatusLabel(status?: string) {
  if (status === 'confirmed') return 'Confirmed';
  if (status === 'blocked') return 'Blocked';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'failed') return 'Rejected';
  return 'Pending';
}