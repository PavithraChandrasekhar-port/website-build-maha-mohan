import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import marapachiSvg from '@/assets/media/Other/Marapachi.svg';
import '@/styles/loading.css';

interface LoadingPageProps {
  progress: number; // 0-100
  onComplete?: () => void;
}

export default function LoadingPage({ progress, onComplete }: LoadingPageProps) {
  const prefersReducedMotion = useReducedMotion();
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Animate progress counter
  useEffect(() => {
    if (progress >= 100 && !isComplete) {
      setIsComplete(true);
      // Wait a bit before calling onComplete to show 100%
      const timer = setTimeout(() => {
        onComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }

    // Smooth progress animation
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 50);

    return () => clearTimeout(timer);
  }, [progress, isComplete, onComplete, prefersReducedMotion]);

  // Calculate clip path for SVG fill (from top to bottom)
  const fillPercentage = displayProgress / 100;
  const clipPath = `inset(${100 - fillPercentage * 100}% 0% 0% 0%)`;

  return (
    <motion.div
      className="loading-page"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      style={{ zIndex: 99999 }}
    >
      <div className="loading-page-container">
        {/* Left Column - Marapachi SVG with fill effect */}
        <div className="loading-page-left">
          <motion.div
            className="loading-marapachi-container"
            initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="loading-marapachi-wrapper">
              <img 
                src={marapachiSvg} 
                alt="Marapachi" 
                className="loading-marapachi-svg"
                style={{
                  clipPath: prefersReducedMotion ? 'none' : clipPath,
                  transition: prefersReducedMotion ? 'none' : 'clip-path 0.3s ease-out',
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Center - Landing Name and Subtitle */}
        <div className="loading-page-center">
          <motion.div
            className="loading-landing-content"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <h1 className="loading-landing-name">Maha Mohan</h1>
            <p className="loading-landing-subtitle">Artist, Architect, Writer.</p>
          </motion.div>
        </div>

        {/* Right Column - Percentage Counter */}
        <div className="loading-page-right">
          <motion.div
            className="loading-percentage"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            {Math.round(displayProgress)}%
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
