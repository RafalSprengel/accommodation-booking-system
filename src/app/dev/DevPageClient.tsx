'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  clearAllData,
  seedAdmin,
  seedAllData,
  seedBookingConfig,
  seedBookings,
  seedExactBetterAuthUser,
  seedPriceConfigDefaults,
  seedProperties,
  seedPropertyPrices,
  seedSeasons,
  seedSystemConfig,
} from '@/actions/seed';
import styles from './page.module.css';

export default function DevPageClient() {
  const router = useRouter();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs((prev) =>
      [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 30),
    );
  };

  const runAction = async (
    name: string,
    actionFn: () => Promise<{ success: boolean; message?: string; error?: string }>,
  ) => {
    addLog(`Running: ${name}...`);
    try {
      const res = await actionFn();
      if (res.success) {
        addLog(`✅ SUCCESS: ${res.message}`);
      } else {
        addLog(`❌ ERROR: ${res.error || res.message}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ EXCEPTION: ${message}`);
    }
  };

  const handleLogout = async () => {
    await fetch('/dev/api/auth', { method: 'DELETE' });
    router.refresh();
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.devContainer}>
        <header className={styles.header}>
          <h1>Developer Console</h1>
          <div className={styles.status}>Environment: Development</div>
        </header>
        <div className={styles.grid}>
          <section className={styles.actions}>
            <h3>Database Actions</h3>
            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => runAction('Seed All (Reset)', seedAllData)}
              >
                Seed All Data (Full Reset)
              </button>

              <hr className={styles.divider} />

              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => runAction('Seed Properties (2 cabins)', seedProperties)}
              >
                Seed Properties Only
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => runAction('Seed PropertyPrices (prices)', seedPropertyPrices)}
              >
                Seed PropertyPrices (prices per property)
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => runAction('Seed Seasons', seedSeasons)}
              >
                Seed Seasons (4 seasons)
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => runAction('Seed Price Config (Default)', seedPriceConfigDefaults)}
              >
                Seed Price Config (Default)
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => runAction('Seed System Config', seedSystemConfig)}
              >
                Seed System Config
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => runAction('Seed Booking Config', seedBookingConfig)}
              >
                Seed Booking Config
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => runAction('Seed Bookings', seedBookings)}
              >
                Seed Bookings Only
              </button>

              <hr className={styles.divider} />

              <button
                type="button"
                className={styles.btnDanger}
                onClick={() => runAction('Clear Database', clearAllData)}
              >
                Clear All Collections
              </button>

              <hr className={styles.divider} />

              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => runAction('Seed Admin User', seedAdmin)}
              >
                Seed Admin User
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => runAction('Seed exact BetterAuth user', seedExactBetterAuthUser)}
              >
                Seed exact BetterAuth user
              </button>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </section>

          <section className={styles.console}>
            <h3>Output Logs</h3>
            <div className={styles.logWindow}>
              {logs.length === 0 && (
                <span className={styles.empty}>Waiting for actions...</span>
              )}
              {logs.map((log) => (
                <div key={log} className={styles.logEntry}>
                  {log}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
