'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function DevLogin() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const response = await fetch('/dev/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      window.location.reload();
      return;
    }

    setError('Incorrect dev login or password.');
    setIsLoading(false);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.loginContainer}>
        <div className={styles.loginHeader}>
          <h2>Developer access</h2>
          <p>Enter your developer credentials to access the `/dev` console.</p>
        </div>

        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="dev-login">Login</label>
            <input
              id="dev-login"
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="dev-password">Password</label>
            <input
              id="dev-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <div className={styles.errorMessage}>{error}</div>}
          <button className={styles.btnPrimary} type="submit" disabled={isLoading}>
            {isLoading ? 'Checking...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
