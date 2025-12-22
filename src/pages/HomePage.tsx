import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useEffect, useRef, useState } from 'react';
import landingVideo from '@/assets/videos/Chitramv2  (1).mp4';
import WorksGallery from '@/components/works/WorksGallery';
import WorksNavigation from '@/components/navigation/WorksNavigation';
import BlurOverlay from '@/components/webgl/BlurOverlay';
import ExhibitsSection from '@/components/exhibits/ExhibitsSection';
import '@/styles/landing.css';

export default function HomePage() {
  const prefersReducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const worksRef = useRef<HTMLElement>(null);
  const [blurIntensity, setBlurIntensity] = useState(0);
  const [worksVisible, setWorksVisible] = useState(false);
  const [numWorks, setNumWorks] = useState(14); // Default to 14, will be updated from WorksGallery
  const [exhibitsVisible, setExhibitsVisible] = useState(false);
  const [exhibitsBlurIntensity, setExhibitsBlurIntensity] = useState(0);
  const [exhibitsScrollProgress, setExhibitsScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<'home' | 'works' | 'exhibits'>('home');
  const [worksEndPosition, setWorksEndPosition] = useState(0);
  const [lastWorkActive, setLastWorkActive] = useState(false);
  const [lastWorkCenterPosition, setLastWorkCenterPosition] = useState(0);
  const [exhibitsTriggerDelay, setExhibitsTriggerDelay] = useState(false);
  const [maxBlurReached, setMaxBlurReached] = useState(false);
  const delayTimeoutRef = useRef<number | null>(null);

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
      
      // Calculate works section end position
      let currentWorksEndPosition = 0;
      if (worksRef.current) {
        const rect = worksRef.current.getBoundingClientRect();
        currentWorksEndPosition = rect.bottom + scrollY;
        setWorksEndPosition(currentWorksEndPosition);
      } else {
        // Fallback estimate if ref not available
        currentWorksEndPosition = viewportHeight * 2; // Rough estimate
        setWorksEndPosition(currentWorksEndPosition);
      }
      
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
      
      // Handle works section visibility
      if (scrollY < worksStart) {
        setWorksVisible(false);
        setActiveSection('home');
      } else if (scrollY >= worksEnd) {
        setWorksVisible(true);
        setActiveSection('works');
      } else {
        // Progressive fade-in for works section
        const worksProgress = (scrollY - worksStart) / worksRange;
        setWorksVisible(worksProgress > 0.1);
        if (worksProgress > 0.1) {
          setActiveSection('works');
        }
      }

      // Handle exhibits section - appears when scrolling past last work item center
      if (lastWorkCenterPosition > 0 && lastWorkActive) {
        const scrollPastLastWork = scrollY - lastWorkCenterPosition;
        const delayThreshold = viewportHeight * 0.1; // 10vh delay after last work center
        const blurRangeExhibits = viewportHeight * 0.3; // Blur over 30vh
        const exhibitsFadeRange = viewportHeight * 0.2; // Exhibits fade in over 20vh
        
        // Check if we've scrolled past last work center + delay threshold
        if (scrollPastLastWork >= delayThreshold) {
          // Trigger delay timer if not already triggered
          if (!exhibitsTriggerDelay && delayTimeoutRef.current === null) {
            delayTimeoutRef.current = setTimeout(() => {
              setExhibitsTriggerDelay(true);
            }, 500); // 500ms delay
          }
          
          if (exhibitsTriggerDelay) {
            // Calculate blur intensity (fades in over blurRangeExhibits)
            const blurStart = delayThreshold;
            const blurProgress = Math.min((scrollPastLastWork - blurStart) / blurRangeExhibits, 1.0);
            
            // Track if we've reached max blur
            if (blurProgress >= 0.95 && !maxBlurReached) {
              setMaxBlurReached(true);
            }
            
            // Once blur reaches max, keep it at max even when scrolling back (as long as we're past delay threshold)
            setExhibitsBlurIntensity(maxBlurReached ? 1.0 : blurProgress);
            
            // Calculate exhibits visibility (fades in over exhibitsFadeRange)
            const exhibitsStart = delayThreshold + (blurRangeExhibits * 0.3); // Start fading in at 30% of blur
            if (scrollPastLastWork >= exhibitsStart) {
              const exhibitsProgress = Math.min((scrollPastLastWork - exhibitsStart) / exhibitsFadeRange, 1.0);
              setExhibitsVisible(exhibitsProgress > 0.1);
              setActiveSection(exhibitsProgress > 0.5 ? 'exhibits' : 'works');
              
              // Calculate scroll progress for WebGL effects and horizontal card scrolling
              // Map scrollPastLastWork to 0-1 range for horizontal card scrolling
              // Use a range that allows scrolling through all cards including the last one
              const scrollRange = viewportHeight * 1.5; // Scroll range for all cards
              const progress = Math.min((scrollPastLastWork - exhibitsStart) / scrollRange, 1.0); // Allow reaching 1.0 for last card
              setExhibitsScrollProgress(Math.max(progress, 0));
            } else {
              setExhibitsVisible(false);
              setActiveSection('works');
              setExhibitsScrollProgress(0);
            }
          } else {
            // Still in delay period
            setExhibitsBlurIntensity(0);
            setExhibitsVisible(false);
            setExhibitsScrollProgress(0);
          }
        } else if (scrollPastLastWork >= 0) {
          // Between last work center and delay threshold - in delay zone
          // If we've already reached max blur, keep it; otherwise fade in
          if (maxBlurReached) {
            // Keep blur at max when scrolling back (works section still in view)
            setExhibitsBlurIntensity(1.0);
          } else {
            // Still fading in
            setExhibitsBlurIntensity(0);
          }
          setExhibitsVisible(false);
          setExhibitsScrollProgress(0);
        } else {
          // Scrolling back into works section (before last work center)
          // Fade out blur gradually as we scroll back past the works section
          const scrollBackDistance = Math.abs(scrollPastLastWork);
          const blurFadeOutRange = viewportHeight * 0.2; // Fade out over 20vh
          
          if (scrollBackDistance < blurFadeOutRange) {
            // Fade out blur as we scroll back past works section
            const fadeOutProgress = 1 - (scrollBackDistance / blurFadeOutRange);
            setExhibitsBlurIntensity(Math.max(0, fadeOutProgress));
          } else {
            // Fully scrolled back - reset everything
            if (delayTimeoutRef.current) {
              clearTimeout(delayTimeoutRef.current);
              delayTimeoutRef.current = null;
            }
            setExhibitsTriggerDelay(false);
            setMaxBlurReached(false);
            setExhibitsBlurIntensity(0);
            setExhibitsVisible(false);
            setExhibitsScrollProgress(0);
          }
        }
      } else {
        // Last work not active or position not calculated yet
        // Only reset if we're clearly not in exhibits zone
        if (lastWorkCenterPosition > 0 && scrollY < lastWorkCenterPosition - viewportHeight) {
          if (delayTimeoutRef.current) {
            clearTimeout(delayTimeoutRef.current);
            delayTimeoutRef.current = null;
          }
          setExhibitsTriggerDelay(false);
          setMaxBlurReached(false);
          setExhibitsBlurIntensity(0);
          setExhibitsScrollProgress(0);
          setExhibitsVisible(false);
        }
      }
      
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
        delayTimeoutRef.current = null;
      }
    };
  }, [numWorks, lastWorkCenterPosition, exhibitsTriggerDelay, maxBlurReached]);

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
      {/* Only render when blur intensity > 0 to avoid unnecessary WebGL context */}
      {videoRef.current && blurIntensity > 0 && (
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
        isVisible={worksVisible || exhibitsVisible} 
        activeSection={activeSection}
        worksEndPosition={worksEndPosition}
        lastWorkCenterPosition={lastWorkCenterPosition}
      />
      <WorksGallery 
        ref={worksRef} 
        isActive={worksVisible}
        onWorksCountChange={setNumWorks}
        onLastWorkActive={(isActive, position) => {
          setLastWorkActive(isActive);
          setLastWorkCenterPosition(position);
        }}
      />
      
      {/* Exhibits Blur Overlay - appears when scrolling past last work item */}
      {/* Uses same BlurOverlay component as landing, positioned over works section */}
      {videoRef.current && exhibitsBlurIntensity > 0 && (
        <BlurOverlay 
          key="exhibits-blur-overlay"
          videoElement={videoRef.current}
          blurIntensity={exhibitsBlurIntensity}
          blurRadius={20.0}
          burgundyIntensity={0.4}
          className="exhibits-blur-overlay"
        />
      )}
      
      {/* Exhibits Section - Always rendered, visibility controlled by isVisible */}
      <ExhibitsSection 
        isVisible={exhibitsVisible}
        scrollProgress={exhibitsScrollProgress}
      />
      
      {/* Spacer to allow scrolling past last work item - enables exhibits section to appear */}
      <div 
        style={{
          position: 'relative',
          width: '100%',
          height: '150vh', // Enough space to scroll past last work and trigger exhibits
          zIndex: 1, // Below everything
          pointerEvents: 'none', // Don't block interactions
        }}
        aria-hidden="true"
      />
    </>
  );
}
