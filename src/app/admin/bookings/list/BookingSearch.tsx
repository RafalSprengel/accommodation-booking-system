'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './page.module.css'

export default function BookingSearch({ defaultValue }: { defaultValue: string }) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const searchParams = new URLSearchParams(window.location.search);
    if (query.trim()) {
      searchParams.set('q', query.trim());
    } else {
      searchParams.delete('q');
    }
    router.push(`/admin/bookings/list?${searchParams.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className={styles.bookingSearchForm}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, email or order number"
        className={styles.bookingSearchInput}
      />
    </form>
  );
}