'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Leaf {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  duration: number;
  delay: number;
  type: number;
}

// SVG leaf shapes
const LeafSVG = ({ type, size }: { type: number; size: number }) => {
  const color = 'rgba(86, 147, 48, 0.15)'; // #569330 with transparency
  
  switch (type) {
    case 0:
      // Simple leaf
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2C6.5 2 2 6.5 2 12c0 4.5 3 8.5 7 10 0-3 1-6 3-8 2-2 5-3 8-3-1.5-4-5.5-9-8-9z"
            fill={color}
          />
          <path
            d="M12 2v20M12 12c2-2 5-3 8-3"
            stroke="rgba(86, 147, 48, 0.25)"
            strokeWidth="0.5"
          />
        </svg>
      );
    case 1:
      // Herb sprig
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 22V8M8 10c0-3 2-5 4-5s4 2 4 5M6 14c0-2 1.5-3.5 3-3.5M15 14c0-2 1.5-3.5 3-3.5"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <ellipse cx="12" cy="5" rx="3" ry="4" fill={color} />
          <ellipse cx="7" cy="12" rx="2" ry="3" fill={color} transform="rotate(-30 7 12)" />
          <ellipse cx="17" cy="12" rx="2" ry="3" fill={color} transform="rotate(30 17 12)" />
        </svg>
      );
    case 2:
      // Round leaf
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="10" r="8" fill={color} />
          <path
            d="M12 18v4M12 10c-2 2-4 1-6 0M12 10c2 2 4 1 6 0"
            stroke="rgba(86, 147, 48, 0.25)"
            strokeWidth="0.5"
          />
        </svg>
      );
    case 3:
      // Pointed leaf
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2c-4 4-6 8-6 12 0 3 2 6 6 8 4-2 6-5 6-8 0-4-2-8-6-12z"
            fill={color}
          />
          <path
            d="M12 2v18"
            stroke="rgba(86, 147, 48, 0.3)"
            strokeWidth="0.5"
          />
        </svg>
      );
    default:
      // Small dot/seed
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <ellipse cx="12" cy="12" rx="6" ry="8" fill={color} transform="rotate(45 12 12)" />
        </svg>
      );
  }
};

export default function FloatingLeaves() {
  const [leaves, setLeaves] = useState<Leaf[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Generate leaves
    const leafCount = isMobile ? 8 : 15;
    const generatedLeaves: Leaf[] = [];

    for (let i = 0; i < leafCount; i++) {
      generatedLeaves.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 20 + Math.random() * 30,
        rotation: Math.random() * 360,
        duration: 15 + Math.random() * 20,
        delay: Math.random() * 5,
        type: Math.floor(Math.random() * 5),
      });
    }

    setLeaves(generatedLeaves);

    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobile]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {leaves.map((leaf) => (
        <motion.div
          key={leaf.id}
          className="absolute"
          initial={{
            x: `${leaf.x}vw`,
            y: `${leaf.y}vh`,
            rotate: leaf.rotation,
            opacity: 0,
          }}
          animate={{
            x: [
              `${leaf.x}vw`,
              `${leaf.x + (Math.random() - 0.5) * 20}vw`,
              `${leaf.x + (Math.random() - 0.5) * 20}vw`,
              `${leaf.x}vw`,
            ],
            y: [
              `${leaf.y}vh`,
              `${leaf.y + 10}vh`,
              `${leaf.y + 20}vh`,
              `${leaf.y}vh`,
            ],
            rotate: [
              leaf.rotation,
              leaf.rotation + 45,
              leaf.rotation - 30,
              leaf.rotation,
            ],
            opacity: [0, 0.8, 0.8, 0],
          }}
          transition={{
            duration: leaf.duration,
            delay: leaf.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <LeafSVG type={leaf.type} size={leaf.size} />
        </motion.div>
      ))}
    </div>
  );
}
