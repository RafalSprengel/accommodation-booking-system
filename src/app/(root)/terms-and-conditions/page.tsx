import { getBookingConfig } from '@/actions/bookingConfigActions';
import BackButton from './BackButton';
import styles from './page.module.css';

export default async function TermsAndConditionsPage() {
  const config = await getBookingConfig();
  const { checkInHour, checkOutHour } = config;

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <h1 className={styles.title}>
          Terms & Conditions
          <br />
          🌲 Wilcze Chatki <span className={styles.emoji}>🌲</span>
        </h1>
        <p className={styles.lead}>
          Most importantly: have fun and get some proper rest! This is your time{' '}
          <span className={styles.emoji}>🌿</span>
        </p>

        <ul className={styles.list}>
          <li>
            <strong>Check-in/Check-out:</strong> from <span className={styles.highlight}>{checkInHour}:00</span> on arrival day to{' '}
            <span className={styles.highlight}>{checkOutHour}:00</span> on departure day.
          </li>
           <li>
            <strong>No smoking</strong> inside the cottages or the pavilion (cigarettes or e-cigarettes). Outside is fine.
          </li>
          <li>
            Quiet hours between <span className={styles.highlight}>22:00 – 6:00</span> – the forest needs its sleep too{' '}
            <span className={styles.emoji}>🌙.</span>
          </li>
          <li>
            Only the number of guests <strong>declared at booking</strong> may stay in the cottage.
          </li>
          <li>
            If something gets damaged – <strong>please let us know</strong>. Guests are responsible for any damage caused during their stay.
          </li>
          <li>
            <strong>Leave things tidy</strong> – the next wolf pack wants to check in with a smile too{' '}
            <span className={styles.emoji}>🙂.</span>
          </li>
          <li className={styles.pets}>
            <span className={styles.petsIcon}>🐾</span> Pets are welcome! We only ask you to take care of them and
            clean up after them.
          </li>
          <li>
            We are <strong>not responsible</strong> for items left in the cottages.
          </li>
        </ul>

        <div className={styles.footer}>
          <p>Thank you for respecting the place and nature <span className={styles.emoji}>🌲</span></p>
          <p className={styles.signature}>
            Enjoy your stay
            <br />
            at Wilcze Chatki! <span className={styles.emoji}>🐺✨</span>
          </p>
        </div>

        <BackButton />
      </div>
    </div>
  );
}