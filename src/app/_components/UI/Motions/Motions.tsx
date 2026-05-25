"use client";

import { motion } from "motion/react";
import { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  margin?: string;
}

export function FadeIn({ children, delay = 0 }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.8,
        ease: "easeOut",
        delay: delay,
      }}
    >
      {children}
    </motion.div>
  );
}

export function SlideLeft({ children, delay = 0, margin = "100px" }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 200 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin }}
      transition={{
        duration: 0.8,
        ease: "easeOut",
        delay: delay,
      }}
    >
      {children}
    </motion.div>
  );
}

export function SlideRight({ children, delay = 0, margin = "-10px" }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -200 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin }}
      transition={{
        duration: 0.8,
        ease: "easeOut",
        delay: delay,
      }}
    >
      {children}
    </motion.div>
  );
}
