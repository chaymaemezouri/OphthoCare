import { useEffect, useState } from 'react';

export const LANDING_EASE = [0.22, 1, 0.36, 1] as const;
export const LANDING_SPRING = { type: 'spring' as const, stiffness: 120, damping: 18 };

export const LANDING_VIEWPORT = { once: true, margin: '-80px' as const };
export const LANDING_VIEWPORT_REPEAT = { once: false, margin: '-60px' as const };

export const fadeUp = {
  hidden: { opacity: 0, y: 48 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: LANDING_EASE },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.7, ease: LANDING_EASE },
  },
};

export const blurReveal = {
  hidden: { opacity: 0, y: 32, filter: 'blur(12px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: LANDING_EASE },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.88, y: 28 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.75, ease: LANDING_EASE },
  },
};

export const scaleInSpring = {
  hidden: { opacity: 0, scale: 0.85, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: LANDING_SPRING,
  },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

export const staggerFast = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

export const slideFromLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: LANDING_EASE },
  },
};

export const slideFromRight = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: LANDING_EASE },
  },
};

export const wordStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

export const wordReveal = {
  hidden: { opacity: 0, y: 20, rotateX: -40 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.65, ease: LANDING_EASE },
  },
};

export const floatY = {
  animate: {
    y: [0, -14, 0],
    transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' as const },
  },
};

export const floatSlow = {
  animate: {
    y: [0, -20, 0],
    x: [0, 8, 0],
    transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' as const },
  },
};

export const pulseGlow = {
  animate: {
    scale: [1, 1.08, 1],
    opacity: [0.5, 0.75, 0.5],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const },
  },
};

/** Évite les mismatches SSR — activer les animations Framer après hydratation */
export function useLandingMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
