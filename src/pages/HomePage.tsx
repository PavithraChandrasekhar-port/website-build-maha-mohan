import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useEffect, useRef, useState } from 'react';
import landingVideo from '@/assets/videos/Chitramv2  (1).mp4';
import WorksGallery from '@/components/works/WorksGallery';
import WorksNavigation from '@/components/navigation/WorksNavigation';
import BlurOverlay from '@/components/webgl/BlurOverlay';
import '@/styles/landing.css';

export default function HomePage() {
  const prefersReducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const worksRef = useRef<HTMLElement>(null);
  const [blurIntensity, setBlurIntensity] = useState(0);
  const [worksVisible, setWorksVisible] = useState(false);
  const [numWorks, setNumWorks] = useState(14); // Default to 14, will be updated from WorksGallery

  useEffect(() => {
    // Ensure video plays on load
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.warn('Video autoplay failed:', error);
      });
    }
  }, []);

  useEffect(() => {
    // Track scroll progress for progressive blur and works section
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      
      // Skip if numWorks not yet set
      if (!numWorks || numWorks === 0) return;

      // Blur phase: starts at 10% viewport height, reaches max at 30% (faster transition)
      const blurStart = viewportHeight * 0.1;
      const blurEnd = viewportHeight * 0.3;
      const blurRange = blurEnd - blurStart;
      
      // Works section phase: appears at 30%+ scroll (when blur is complete)
      const worksStart = viewportHeight * 0.3;
      const worksEnd = viewportHeight * 0.4; // Faster fade-in
      const worksRange = worksEnd - worksStart;
      
      // Handle landing blur intensity
      if (scrollY < blurStart) {
        setBlurIntensity(0);
      } else if (scrollY >= blurEnd) {
        setBlurIntensity(1);
      } else {
        // Progressive blur between blurStart and blurEnd
        const progress = (scrollY - blurStart) / blurRange;
        setBlurIntensity(progress);
      }
      
      // Handle works section visibility (appears when blur is complete)
      if (scrollY < worksStart) {
        setWorksVisible(false);
      } else if (scrollY >= worksEnd) {
        setWorksVisible(true);
      } else {
        // Progressive fade-in for works section
        const worksProgress = (scrollY - worksStart) / worksRange;
        setWorksVisible(worksProgress > 0.1);
      }
      
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [numWorks]);

  // Scroll to center project #1 (Alchemy) when works section first becomes visible
  useEffect(() => {
    if (worksVisible && worksRef.current) {
      // Calculate position to center project 1
      // Works section starts at 100vh, first work item is at top
      // We need to scroll so project 1's center is at viewport center
      const viewportHeight = window.innerHeight;
      const worksStartPosition = viewportHeight;
      
      // Estimate: first work item height is approximately 400px (title + image + spacing)
      // We want the center of the first work to be at viewport center
      const firstWorkCenterOffset = 200; // Approximate center of first work item
      const targetScroll = worksStartPosition + firstWorkCenterOffset - (viewportHeight / 2);
      
      // Only scroll if we're not already at the right position
      if (Math.abs(window.scrollY - targetScroll) > 20) {
        // Smooth scroll to center project 1
        window.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      }
    }
  }, [worksVisible]);

  return (
    <>
      <section 
        ref={sectionRef}
        className="landing-section"
      >
      <video
        ref={videoRef}
        src={landingVideo}
        autoPlay
        loop
        muted
        playsInline
        className="landing-video"
      />
      <div className="landing-overlay" />
      
      {/* WebGL Blur Overlay - blurs video with burgundy tint and noise */}
      {videoRef.current && (
        <BlurOverlay 
          key="landing-blur-overlay"
          videoElement={videoRef.current}
          blurIntensity={blurIntensity}
          blurRadius={20.0}
          burgundyIntensity={0.4}
          className="landing-blur-overlay"
        />
      )}
      
      <motion.div
        className="landing-content"
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          filter: blurIntensity > 0 ? `blur(${blurIntensity * 25}px)` : 'blur(0px)'
        }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <h1 className="landing-name">Maha Mohan</h1>
        <p className="landing-subtitle">Artist, Architect, Writer.</p>
      </motion.div>

      <motion.p
        className="landing-scroll-text"
        initial={prefersReducedMotion ? {} : { opacity: 0 }}
        animate={{ 
          opacity: blurIntensity < 0.5 ? 1 : 0,
          filter: blurIntensity > 0 ? `blur(${blurIntensity * 25}px)` : 'blur(0px)'
        }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        SCROLL TO BEGIN
      </motion.p>
      </section>

      <WorksNavigation 
        isVisible={worksVisible} 
        activeSection={worksVisible ? 'works' : 'home'}
      />
      <WorksGallery 
        ref={worksRef} 
        isActive={worksVisible}
        onWorksCountChange={setNumWorks}
      />
    </>
  );
}
