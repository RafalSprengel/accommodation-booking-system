import { SlideLeft, SlideRight } from '@components/UI/Motions/Motions';
import styles from './Attractions.module.css';

export default function Attractions() {
    const attractions = [
        {
            title: 'Cycling Routes - Nowa Karczma',
            description: 'Local trails leading through the most beautiful corners of the municipality.',
            distance: 'approx. 4 km',
            url: 'https://www.nowakarczma.pl/asp/walory-turystyczne,42,,1'
        },
        {
            title: 'National Anthem Museum in Będomin',
            description: 'The only museum in the world dedicated to "Mazurek Dąbrowskiego" (Poland\'s national anthem).',
            distance: 'approx. 5 km',
            url: 'http://www.jozefwybicki.pl/'
        },
        {
            title: 'Trzepowo Ski Slope',
            description: 'Ski lifts, beginner slopes, and snow tubing.',
            distance: 'approx. 5 km',
            url: 'https://nartykaszuby.pl/'
        },
        {
            title: 'Ostrich Farm in Garczyn',
            description: 'The oldest ostrich farm in Poland. Guided tours available.',
            distance: 'approx. 19 km',
            url: 'http://www.strusie-garczyn.pl/'
        },
        {
            title: 'Upside-Down House in Szymbark',
            description: 'Centre for Education and Regional Promotion (CEPR) with the famous Upside-Down House, the Longest Plank in the World, and the Siberian Exile House.',
            distance: 'approx. 20 km',
            url: 'https://cepr.pl/'
        },
        {
            title: 'Aqua Centrum Swimming Pool',
            description: 'Modern water park in Kościerzyna with pools and a sauna zone.',
            distance: 'approx. 20 km',
            url: 'https://basenac.pl/'
        },
        {
            title: 'Wieżyca – Observation Tower',
            description: 'The highest peak of the Polish Lowlands (329 m above sea level) with stunning views.',
            distance: 'approx. 24 km',
            url: 'https://www.wiezyca.pl/wieza-widokowa-na-szczycie-wiezyca/'
        },
        {
            title: 'Wieżyca Ski Resort',
            description: 'The largest ski resort in Kashubia. Koszałkowo settlement is an Active Leisure Centre not only for skiing.',
            distance: 'approx. 25 km',
            url: 'https://www.wiezyca.pl/'
        },
        {
            title: 'Open-Air Museum in Wdzydze',
            description: 'The oldest open-air museum in Poland on the "Kashubian Sea".',
            distance: 'approx. 30 km',
            url: 'http://www.muzeum-wdzydze.gda.pl/'
        },
        {
            title: 'Kashubian Landscape Park',
            description: 'Countless lakes and moraine hills known as the "Kashubian Switzerland".',
            distance: 'approx. 33 km',
            url: 'https://kpk.org.pl/o-parku/'
        }
    ];
    return (
        <section id="attractions" className={styles.section}>
            <div className={styles.container}>
                <SlideRight>
                    <h1 className={styles.title}>Local attractions</h1>
                </SlideRight>
                <SlideLeft>
                    <p className={styles.subtitle}>
                        Discover the charms of Szumleś Królewski and the heart of Kashubia.
                    </p>
                </SlideLeft>

                <div className={styles.grid}>
                    {attractions.map((item, idx) => (
                        <SlideRight key={idx} delay={idx * 0.08}>
                            <div className={styles.card}>
                                <div className={styles.header}>
                                    <span className={styles.dot}></span>
                                    <p className={styles.cardTitle}>{item.title}</p>
                                </div>
                                <p className={styles.description}>{item.description}</p>
                                <p className={styles.distanceInfo}>Distance: {item.distance}</p>
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.link}
                                >
                                    Find out more &raquo;
                                </a>
                            </div>
                        </SlideRight>
                    ))}
                </div>
            </div>
        </section>
    );
}