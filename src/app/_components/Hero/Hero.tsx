import Link from 'next/link';
import styles from './Hero.module.css';

export default function Hero() {
    return (
        <section className={styles.hero}>
            <div className={styles.overlay}>
                <div className={styles.content}>
                    <h1>Wilcze Chatki</h1>
                    <p>Discover peace in the heart of Kashubia – Szumleś Królewski</p>
                    <Link href="#services" className={styles.cta}>
                        Check our offer
                    </Link>
                </div>
            </div>
        </section>
    );
}