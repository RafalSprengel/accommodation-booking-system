import { SlideLeft, SlideRight } from '@components/UI/Motions/Motions';
import ServicesClient from "./ServicesClient";
import styles from './Services.module.css';

import { getBookingConfig } from '@/actions/bookingConfigActions';
import { getAllProperties } from '@/actions/adminPropertyActions';
import { getBasicPrices } from '@/actions/seasonActions';

interface PriceTier {
    minGuests: number;
    maxGuests: number;
    price: number;
}

interface PriceItem {
    description: string;
    amount: string;
}

interface BasicPricesData {
    weekdayPrices?: PriceTier[];
    weekendPrices?: PriceTier[];
    weekdayExtraBedPrice?: number;
    weekendExtraBedPrice?: number;
}

function formatGuestsLabel(minGuests: number, maxGuests: number): string {
    if (minGuests === maxGuests) {
        if (minGuests === 1) return '1 person';
        const lastDigit = minGuests % 10;
        const lastTwoDigits = minGuests % 100;
        if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 10 || lastTwoDigits > 20)) {
            return `${minGuests} persons`;
        }
        return `${minGuests} persons`;
    } else {
        const lastDigitMax = maxGuests % 10;
        const lastTwoDigitsMax = maxGuests % 100;
        if (lastDigitMax >= 2 && lastDigitMax <= 4 && (lastTwoDigitsMax < 10 || lastTwoDigitsMax > 20)) {
            return `${minGuests}-${maxGuests} persons`;
        }
        return `${minGuests}-${maxGuests} persons`;
    }
}

function mapTiersToPriceItems(tiers: PriceTier[]): PriceItem[] {
    return [...tiers]
        .sort((a, b) => a.minGuests - b.minGuests)
        .map((tier) => ({
            description: formatGuestsLabel(tier.minGuests, tier.maxGuests),
            amount: `${tier.price} zł`,
        }));
}

export default async function Services() {

    let childrenFreeAge: number | null = 13;
    const defaultWeekdayRates: PriceItem[] = [
        { description: '2-3 people', amount: 'Contact' },
        { description: '4-5 people', amount: 'Contact' },
        { description: '6 people', amount: 'Contact' },
        { description: 'Extra bed', amount: 'Contact' }
    ];

    const defaultWeekendRates: PriceItem[] = [
        { description: '2-3 people', amount: 'Contact' },
        { description: '4-5 people', amount: 'Contact' },
        { description: '6 people', amount: 'Contact' },
        { description: 'Extra bed', amount: 'Contact' }
    ];

    let basicPricesData: BasicPricesData | null = null;

    try {
        const bookingConfig = await getBookingConfig();
        childrenFreeAge = bookingConfig?.childrenFreeAgeLimit ?? 13;

        const properties = await getAllProperties();
        const firstProperty = properties[0];

        if (firstProperty?._id) {
            const basicPricesResult = await getBasicPrices(firstProperty._id);
            if (basicPricesResult.success && basicPricesResult.data) {
                basicPricesData = basicPricesResult.data as BasicPricesData;
            }
        }
    } catch {

    }

    const weekdayRates = basicPricesData
        ? [
            ...mapTiersToPriceItems(basicPricesData.weekdayPrices ?? []),
            {
                description: 'Extra bed',
                amount: basicPricesData.weekdayExtraBedPrice != null ? `+${basicPricesData.weekdayExtraBedPrice} zł` : '—',
            },
        ]
        : defaultWeekdayRates;

    const weekendRates = basicPricesData
        ? [
            ...mapTiersToPriceItems(basicPricesData.weekendPrices ?? []),
            {
                description: 'Extra bed',
                amount: basicPricesData.weekendExtraBedPrice != null ? `+${basicPricesData.weekendExtraBedPrice} zł` : '—',
            },
        ]
        : defaultWeekendRates;

    return (
        <section id="services" className={styles.section}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <SlideRight>
                        <h1 className={styles.title}>Our offer</h1>
                    </SlideRight>
                </header>
                <SlideLeft>
                    <div className={styles.description}>
                        <p>
                            We offer two cozy cottages of 35 m² each. Each cottage comfortably accommodates 6 people
                            (with the possibility of 2 extra beds). The shared area for both properties is a closed pavilion,
                            equipped with a 4-5 person infrared sauna and a wood-fired jacuzzi (wood included in the price), along with two large dining tables.
                        </p>
                        <p>
                            On the terrace of each cottage there is a BBQ and a table. We also provide our guests with
                            a children's playground equipped with a swing, trampoline, slide, and hammocks.
                            The interior of each cottage includes a kitchenette, bathroom, and two rooms in the attic:
                            one with a double bed, the other with two single beds.
                        </p>

                    </div>
                </SlideLeft>
                <ServicesClient childrenFreeAge={childrenFreeAge} weekdayRates={weekdayRates} weekendRates={weekendRates} />
            </div>
        </section >
    );
}