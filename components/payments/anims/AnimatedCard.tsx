"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

type SlideTransitionProps = {
  /** Controls mount/unmount — flipping this to false triggers the exit animation. */
  show: boolean;
  children: ReactNode;
  /** Optional className for the animating wrapper div (e.g. width utilities). */
  className?: string;
};

const variants = {
  hidden: { opacity: 0, x: 100 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }, // smooth ease-out
  },
  exit: {
    opacity: 0,
    x: -100,
    transition: { duration: 0.35, ease: [0.7, 0, 0.84, 0] as const }, // ease-in, accelerates out
  },
};

/**
 * Wrap any content (e.g. a Card) to have it slide in from the right on mount
 * and slide out to the left on unmount.
 *
 * Usage:
 *   <SlideTransition show={showCard}>
 *     <Card>...</Card>
 *   </SlideTransition>
 */
export function SlideTransition({
  show,
  children,
  className,
}: SlideTransitionProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="slide-transition"
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}