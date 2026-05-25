'use client';

import { useEffect, useRef } from 'react';
import styles from './LightBoxGallery.module.css';
import 'glightbox/dist/css/glightbox.min.css';
import { motion } from 'motion/react';

interface ImageProps {
  full: string;
  thumb: string;
  description?: string;
}

interface LightBoxGalleryProps {
  images: ImageProps[];
}

export default function LightBoxGallery({ images }: LightBoxGalleryProps) {
  const lightboxRef = useRef<any>(null);

  useEffect(() => {
    let lightboxInstance: any = null;
    let isMounted = true;

    const initLightbox = async () => {
      try {
        const GLightboxModule = (await import('glightbox')).default;
        
        if (!isMounted) return;

        if (lightboxRef.current) {
          lightboxRef.current.destroy();
        }

        lightboxInstance = GLightboxModule({
          touchNavigation: true,
          loop: true,
          selector: '.glightbox-trigger',
          openEffect: 'zoom',
          closeEffect: 'fade',
        });

        lightboxRef.current = lightboxInstance;
      } catch (error) {
        console.error('Failed to load GLightbox:', error);
      }
    };

    initLightbox();

    return () => {
      isMounted = false;
      if (lightboxInstance) {
        lightboxInstance.destroy();
        lightboxRef.current = null;
      }
    };
  }, [images]);

  const thumbContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.09,
        delayChildren: 0.1,
      },
    },
  };

  const thumbItem = {
    hidden: { opacity: 0, x: 100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: 'easeIn' as any },
    },
  };

  return (
    <div className={styles.galleryWrapper}>
      <motion.div
        className={styles.gallery}
        variants={thumbContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        {images.map((img, index) => (
          <motion.a
            href={img.full}
            className={`glightbox-trigger ${styles.imageLink}`}
            data-gallery="my-gallery"
            key={`${img.full}-${index}`}
            variants={thumbItem}
          >
            <img
              src={img.thumb}
              alt={img.description || `Gallery item ${index + 1}`}
              className={styles.image}
            />
            {img.description && (
              <div className={styles.caption}>
                <span>{img.description}</span>
              </div>
            )}
          </motion.a>
        ))}
      </motion.div>
    </div>
  );
}