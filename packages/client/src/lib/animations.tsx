/**
 * rndvx Animation Library
 *
 * Reusable Framer Motion components for scroll-driven animations.
 * Inspired by MindMarket's scroll-progress interpolation pattern.
 *
 * Components:
 *   <FadeIn>          — fade + slide up on scroll into view
 *   <ColorPopCard>    — card that scales in with a bold background color
 *   <StickyStack>     — container for cards that stick and overlap on scroll
 *   <StickyCard>      — individual card inside a StickyStack
 *   <ParallaxSection> — background parallax on scroll
 *   <BgColorShift>    — background color changes as user scrolls
 *
 * All components use viewport intersection by default (no global scroll listener).
 */

import { useRef, ReactNode } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  type MotionValue,
} from 'framer-motion';

/* ─── FadeIn ──────────────────────────────────────────────────── */

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.6,
  y = 40,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ─── ColorPopCard ────────────────────────────────────────────── */

interface ColorPopCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** scale the card starts at before popping to 1 */
  initialScale?: number;
}

export function ColorPopCard({
  children,
  className,
  delay = 0,
  initialScale = 0.85,
}: ColorPopCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: initialScale, y: 30 }}
      animate={
        inView
          ? { opacity: 1, scale: 1, y: 0 }
          : undefined
      }
      transition={{
        duration: 0.5,
        delay,
        ease: [0.34, 1.56, 0.64, 1], // overshoot spring-like
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─── StickyStack ─────────────────────────────────────────────── */

interface StickyStackProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper that gives each <StickyCard> enough scroll runway to stick.
 * Use a tall container (e.g. `h-[300vh]`) or let children define height.
 */
export function StickyStack({ children, className }: StickyStackProps) {
  return (
    <div className={`relative ${className ?? ''}`}>
      {children}
    </div>
  );
}

/* ─── StickyCard ──────────────────────────────────────────────── */

interface StickyCardProps {
  children: ReactNode;
  className?: string;
  /** top offset in px — increment per card to create the peek/stack effect */
  topOffset?: number;
  index?: number;
}

/**
 * Card that sticks at a `top` offset. Place multiple inside <StickyStack>
 * with increasing topOffset values (e.g. 0, 16, 32) so they overlap.
 */
export function StickyCard({
  children,
  className,
  topOffset = 0,
  index = 0,
}: StickyCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      className={`sticky ${className ?? ''}`}
      style={{
        top: topOffset,
        zIndex: index + 1,
      }}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─── ParallaxSection ─────────────────────────────────────────── */

interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  /** how far the content shifts relative to scroll (default 0.3 = 30%) */
  speed?: number;
}

export function ParallaxSection({
  children,
  className,
  speed = 0.3,
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [`${speed * -100}px`, `${speed * 100}px`]);

  return (
    <div ref={ref} className={`overflow-hidden ${className ?? ''}`}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

/* ─── BgColorShift ────────────────────────────────────────────── */

interface BgColorShiftProps {
  children: ReactNode;
  className?: string;
  /** array of colors to transition through as user scrolls */
  colors: string[];
}

export function BgColorShift({
  children,
  className,
  colors,
}: BgColorShiftProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  const stops = colors.map((_, i) => i / (colors.length - 1));
  const bg = useTransform(scrollYProgress, stops, colors);

  return (
    <motion.div ref={ref} className={className} style={{ backgroundColor: bg as MotionValue<string> }}>
      {children}
    </motion.div>
  );
}

/* ─── Staggered container helper ──────────────────────────────── */

interface StaggerChildrenProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
}

/**
 * Staggers the entrance of direct children using Framer Motion variants.
 */
export function StaggerChildren({
  children,
  className,
  stagger = 0.1,
}: StaggerChildrenProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: stagger },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Use as direct children of <StaggerChildren> */
export const staggerItemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};
