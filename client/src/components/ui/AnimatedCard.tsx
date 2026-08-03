"use client";

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hoverScale?: number;
  glowOnHover?: boolean;
}

export function AnimatedCard({
  children,
  className = '',
  delay = 0,
  hoverScale = 1.02,
  glowOnHover = true,
  ...props
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={{
        scale: hoverScale,
        y: -4,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}
      className={`relative group transition-colors duration-200 ${
        glowOnHover ? 'hover:shadow-[0_0_25px_rgba(99,102,241,0.15)]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeInStagger({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.08,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
