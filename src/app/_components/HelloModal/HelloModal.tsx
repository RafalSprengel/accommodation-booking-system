'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './HelloModal.module.css';

const HelloModal = () => {
    const [isVisible, setIsVisible] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const hasSeenModal = localStorage.getItem('hasSeenHelloModal');

        if (pathname === '/' && !hasSeenModal) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [pathname]);

    useEffect(() => {
        if (isVisible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isVisible]);

    const handleClose = () => {
        setIsVisible(false);
    };

    const handleDontShowAgain = (e: React.MouseEvent) => {
        e.preventDefault();
        localStorage.setItem('hasSeenHelloModal', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.container}>
                <button
                    onClick={handleClose}
                    className={styles.closeX}
                    aria-label="Close"
                >
                    ✕
                </button>

                <h2 className={styles.title}>
                    Welcome to my Project!
                </h2>

                <p className={styles.text}>
                    I'm <strong>Rafał Sprengel</strong>. Explore this <strong>Full-Stack Application</strong>.
                    Feel free to look around or test the management features.
                </p>

                <div className={styles.actions}>
                    <button
                        onClick={handleClose}
                        className={styles.btnPrimary}
                    >
                        Start Exploring (Main Page)
                    </button>

                    <div className={styles.loginRow}>
                        <Link href="/admin-login" className={styles.btnSecondary}>
                            Admin Login
                        </Link>
                        <Link href="/booking" className={styles.btnSecondary}>
                            Book Now
                        </Link>
                    </div>
                </div>

                <div className={styles.footer}>
                    <p>
                        💡 Link is also available via the <strong>"Admin"</strong> link in the Footer.
                    </p>
                    <button
                        onClick={handleDontShowAgain}
                        className={styles.dontShowLink}
                    >
                        Don't show this message again
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HelloModal;