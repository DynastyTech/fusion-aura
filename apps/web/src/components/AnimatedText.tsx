'use client';

import { useEffect, useState } from 'react';
import { motion, Variants } from 'framer-motion';

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export default function AnimatedText({ text, className = '', delay = 0 }: AnimatedTextProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  const letters = text.split('');

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.1,
      },
    },
  };

  const letterAnimation: Variants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      rotateX: -90,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: 'spring' as const,
        damping: 12,
        stiffness: 200,
      },
    },
  };

  if (!isVisible) {
    return <span className={`${className} opacity-0`}>{text}</span>;
  }

  return (
    <motion.span
      className={`inline-block ${className}`}
      variants={container}
      initial="hidden"
      animate="visible"
      style={{ perspective: '1000px' }}
    >
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          variants={letterAnimation}
          className="inline-block"
          style={{ 
            transformOrigin: 'bottom',
            display: letter === ' ' ? 'inline' : 'inline-block',
          }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </motion.span>
  );
}
