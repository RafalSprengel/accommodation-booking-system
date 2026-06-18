'use client';
import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import styles from './HeroSlider.module.css';

interface SliderItem {
  id: number;
  title: string;
  topic: string;
  description: string;
  image: string;
}

const thumbnailContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};

const thumbnailItemVariants = {
  hidden: { opacity: 0, x: 200 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeIn' as any } },
};

const items: SliderItem[] = [
  {
    id: 1,
    title: 'Wilcze Chatki',
    topic: 'Kashubian silence',
    description: 'Two cozy cottages in Szumlesie Królewski, perfect for escaping the hustle and bustle of the city.',
    image: '/images/img1.webp'
  },
  {
    id: 2,
    title: 'Relaxation zone',
    topic: 'Sauna and jacuzzi',
    description: 'Year-round relaxation zone in a closed pavilion with an infrared sauna and wood-fired jacuzzi.',
    image: '/images/img2.webp'
  },
  {
    id: 3,
    title: 'Nature at your fingertips',
    topic: 'The heart of Kashubia',
    description: 'Close to the Kashubian Landscape Park, Wieżyca hill, and picturesque lakes.',
    image: '/images/img3.webp'
  },
  {
    id: 4,
    title: 'Family getaway',
    topic: 'Playground and BBQ',
    description: 'Private terrace with a BBQ and a playground with a trampoline and swings for the little ones.',
    image: '/images/img4.webp'
  },
  {
    id: 5,
    title: 'Comfortable cottages',
    topic: 'Fully equipped',
    description: 'Air-conditioned interiors, kitchenette, and cozy attic bedrooms for 6-8 people.',
    image: '/images/img5.webp'
  },
];



export default function HeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(-1);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleNext = useCallback(() => {
    if (isAnimating) return;
    setDirection('next');
    setPrevIndex(activeIndex);
    setIsAnimating(true);
    setActiveIndex((prev) => (prev + 1) % items.length);
    setTimeout(() => setIsAnimating(false), 1000); // Matching CSS transition duration
  }, [isAnimating, activeIndex]);

  const handlePrev = useCallback(() => {
    if (isAnimating) return;
    setDirection('prev');
    setPrevIndex(activeIndex);
    setIsAnimating(true);
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
    setTimeout(() => setIsAnimating(false), 1000);
  }, [isAnimating, activeIndex]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      handleNext();
    }, 7000);
  }, [handleNext]);

  const changeSlide = useCallback((newIndex: number) => {
    if (isAnimating || newIndex === activeIndex) return;

    setDirection(newIndex > activeIndex ? 'next' : 'prev');
    setPrevIndex(activeIndex);
    setIsAnimating(true);
    setActiveIndex(newIndex);
    startTimer();

    setTimeout(() => setIsAnimating(false), 1000);
  }, [isAnimating, activeIndex, startTimer]);

  useEffect(() => {
    setIsMounted(true);
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  return (
    <section className={styles.heroSlider}>
      <div className={styles.sliderMain}>
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          const isPrev = index === prevIndex;

          let statusClass = '';
          if (isActive) statusClass = styles.active;
          else if (isPrev) statusClass = direction === 'next' ? styles.exitNext : styles.exitPrev;
          else statusClass = direction === 'next' ? styles.enterNext : styles.enterPrev;

          return (
            <div
              key={item.id}
              className={`${styles.slide} ${isMounted ? statusClass : ''}`}
            >
              <div className={styles.overlay}></div>
              <img src={item.image} alt={item.title} className={styles.slideImg} />

              <div className={styles.slideContent}>
                <span className={styles.slideSubtitle}>SZUMLEŚ KRÓLEWSKI</span>
                <h1 className={styles.slideTitle}>{item.title}</h1>
                <h2 className={styles.slideTopic}>{item.topic}</h2>
                <p className={styles.slideDesc}>{item.description}</p>
                <div className={styles.slideActions}>
                  <Link href="/booking" className={styles.btnPrimary}>Bookings</Link>
                  <Link href="/gallery" className={styles.btnOutline}>Gallery</Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.sliderControls}>
        <motion.div
          className={styles.thumbnailsContainer}
          variants={thumbnailContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {items.map((item, index) => (
            <motion.div
              key={`thumb-${item.id}`}
              variants={thumbnailItemVariants}>
              <div
                className={`${styles.thumbItem} ${index === activeIndex ? styles.activeThumb : ''}`}
                onClick={() => changeSlide(index)}
              >
                <img src={item.image} alt="" />
                {index === activeIndex && <div className={styles.thumbProgress} />}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className={styles.bottomNav}>
          <div className={styles.paginationDots}>
            {items.map((_, index) => (
              <span
                key={index}
                className={`${styles.dot} ${index === activeIndex ? styles.activeDot : ''}`}
              />
            ))}
          </div>
          <div className={styles.arrows}>
            <button onClick={handlePrev} className={styles.arrow}>←</button>
            <button onClick={handleNext} className={styles.arrow}>→</button>
          </div>
        </div>
      </div>
    </section >
  );
}