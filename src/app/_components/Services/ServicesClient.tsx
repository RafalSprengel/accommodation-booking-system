'use client';

import { motion } from "framer-motion";
import styles from './Services.module.css';

interface PriceItem {
    description: string;
    amount: string;
}

interface ServicesClientProps {
    childrenFreeAge: number | null;
    weekdayRates: PriceItem[];
    weekendRates: PriceItem[];
}

export default function ServicesClient({ childrenFreeAge, weekdayRates, weekendRates }: ServicesClientProps) {



    const elementsVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeIn' as any } },
    };

    return (
        <div
            className={styles.grid}
        >
            <motion.div
                variants={elementsVariants as any}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                className={styles.equipment + ' ' + styles.gridFirstRow}
            >
                <h3>Equipment in each cottage:</h3>
                <ul className={styles.equipmentList}>
                    <li>Induction hob with oven</li>
                    <li>Refrigerator</li>
                    <li>Dishwasher</li>
                    <li>Kitchenware, pots, pans, toaster</li>
                    <li>Washing machine</li>
                    <li>TV and WiFi</li>
                    <li>Table for 6 people and a fold-out 2-seater sofa in the living room</li>
                    <li>Air conditioning</li>
                    <li>Hair dryer and clothes drying rack</li>
                    <li>Towels</li>
                    <li>Toiletries and hygiene products</li>
                    <li>Vacuum cleaner</li>
                    <li>Coffee and tea</li>
                </ul>
            </motion.div>
            <motion.div
                variants={elementsVariants as any}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                id="pricing" className={`${styles.card} ${styles.pricingCard}`}
            >
                <h3>Price per night:</h3>
                <div className={styles.priceGroup}>
                    <h4>Weekdays</h4>
                    {weekdayRates.map((rate, index) => (
                        <div key={index} className={styles.priceRow}>
                            <span>{rate.description}</span>
                            <strong>{rate.amount}</strong>
                        </div>
                    ))}
                </div>
                <div className={styles.priceGroup}>
                    <h4>Weekends</h4>
                    {weekendRates.map((rate, index) => (
                        <div key={index} className={styles.priceRow}>
                            <span>{rate.description}</span>
                            <strong>{rate.amount}</strong>
                        </div>
                    ))}
                </div>
                {childrenFreeAge !== null &&
                    <div className={styles.note}>* Children up to {childrenFreeAge} years old stay free of charge.</div>
                }
                <div className={styles.note}>** Pricing applies outside the high season.</div>
                <div className={styles.note}>
                    <a href="/terms-and-conditions" className={styles.link}>
                        Terms and conditions &raquo;
                    </a>
                </div>
            </motion.div>
            <motion.div
                variants={elementsVariants as any}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                className={`${styles.card} ${styles.featuresCard}`}
            >
                <h3>Main features:</h3>
                <ul className={styles.features}>
                    <li>Pavilion with sauna, jacuzzi, and two large tables</li>
                    <li>4-5 person infrared sauna</li>
                    <li>Wood-fired jacuzzi (included in the price)</li>
                    <li>Full equipment and air conditioning</li>
                    <li>Hammocks and relaxation zone</li>
                    <li>BBQ available</li>
                    <li>Children's playground</li>
                    <li>Trampoline</li>
                    <li>Campfire area</li>
                    <li>Fenced area</li>
                </ul>
            </motion.div>
        </div>
    );
}