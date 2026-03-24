import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useEffect, useRef, useState, useCallback } from 'react';
import landingVideo from '@/assets/videos/Chitramv2  (1).mp4';
import WorksGallery from '@/components/works/WorksGallery';
import WorksNavigation from '@/components/navigation/WorksNavigation';
import BlurOverlay from '@/components/webgl/BlurOverlay';
import ExhibitsSectionScrollHijack from '@/components/exhibits/ExhibitsSectionScrollHijack';
import PrintedMatterSection from '@/components/printed-matter/PrintedMatterSection';
import AboutSection from '@/components/about/AboutSection';
import '@/styles/landing.css';

// Exhibits section height - since we're using button navigation, exhibits section is in normal document flow
// The section will naturally take up space, so we just need to track when we've scrolled past it
const EXHIBITS_SECTION_HEIGHT = 1.0; // 100vh for exhibits section
const TRANSITION_ZONE = 0.5; // 50vh transition zone
const TOTAL_EXHIBITS_SCROLL = EXHIBITS_SECTION_HEIGHT + TRANSITION_ZONE; // 100vh + 50vh = 150vh

export default function HomePage() {
  const prefersReducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const worksRef = useRef<HTMLElement>(null);
  const exhibitsSectionRef = useRef<HTMLElement>(null);
  const [blurIntensity, setBlurIntensity] = useState(0);
  const [worksVisible, setWorksVisible] = useState(false);
  const [numWorks, setNumWorks] = useState(14); // Default to 14, will be updated from WorksGallery
  const [exhibitsVisible, setExhibitsVisible] = useState(false);
  const [exhibitsBlurIntensity, setExhibitsBlurIntensity] = useState(0);
  const [exhibitsScrollProgress, setExhibitsScrollProgress] = useState(0);
  const [printedMatterVisible, setPrintedMatterVisible] = useState(false);
  const [printedMatterBlurIntensity, setPrintedMatterBlurIntensity] = useState(0);
  const [printedMatterScrollProgress, setPrintedMatterScrollProgress] = useState(0);
  const [printedMatterFadeOutProgress, setPrintedMatterFadeOutProgress] = useState(0);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [aboutFadeInProgress, setAboutFadeInProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<'home' | 'works' | 'exhibits' | 'printed-matter' | 'about'>('home');
  const [worksEndPosition, setWorksEndPosition] = useState(0);
  const [lastWorkActive, setLastWorkActive] = useState(false);
  const [lastWorkCenterPosition, setLastWorkCenterPosition] = useState(0);
  const [exhibitsTriggerDelay, setExhibitsTriggerDelay] = useState(false);
  const [maxBlurReached, setMaxBlurReached] = useState(false);
  const [printedMatterTriggerDelay, setPrintedMatterTriggerDelay] = useState(false);
  const [maxPrintedMatterBlurReached, setMaxPrintedMatterBlurReached] = useState(false);
  const [, setExhibitsEndPosition] = useState(0);
  const [exhibitsStartScroll, setExhibitsStartScroll] = useState(0); // Track scroll position when exhibits appears
  const [printedMatterStartScroll, setPrintedMatterStartScroll] = useState(0); // Track scroll position when printed matter appears
  const [videoMuted, setVideoMuted] = useState(true); // Start muted for autoplay; user can unmute
  const delayTimeoutRef = useRef<number | null>(null);
  const printedMatterDelayTimeoutRef = useRef<number | null>(null);
  const exhibitsStartScrollRef = useRef(0); // Ref version to avoid dependency loops
  const printedMatterStartScrollRef = useRef(0); // Ref version to avoid dependency loops
  const activeSectionRef = useRef<'home' | 'works' | 'exhibits' | 'printed-matter' | 'about'>('home'); // Ref to avoid stale closures
  const lastWorkActiveRef = useRef(false); // Ref to track last work active state
  const lastWorkCenterPositionRef = useRef(0); // Ref to track last work center position
  const worksEndPositionRef = useRef(0); // Ref to track works end position

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
        // Only update state if value actually changed (avoid unnecessary re-renders)
        if (Math.abs(currentWorksEndPosition - worksEndPositionRef.current) > 10) {
          worksEndPositionRef.current = currentWorksEndPosition;
          setWorksEndPosition(currentWorksEndPosition);
        }
      } else {
        // Fallback estimate if ref not available
        currentWorksEndPosition = viewportHeight * 2; // Rough estimate
        if (Math.abs(currentWorksEndPosition - worksEndPositionRef.current) > 10) {
          worksEndPositionRef.current = currentWorksEndPosition;
          setWorksEndPosition(currentWorksEndPosition);
        }
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
        // Explicitly set home section when at top
        if (scrollY < viewportHeight * 0.1) {
          const newSection = 'home';
          activeSectionRef.current = newSection;
          setActiveSection(newSection);
        }
      } else if (scrollY >= worksEnd) {
        setWorksVisible(true);
        const newSection = 'works';
        activeSectionRef.current = newSection;
        setActiveSection(newSection);
      } else {
        // Progressive fade-in for works section
        const worksProgress = (scrollY - worksStart) / worksRange;
        setWorksVisible(worksProgress > 0.1);
        if (worksProgress > 0.1) {
          const newSection = 'works';
          activeSectionRef.current = newSection;
          setActiveSection(newSection);
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
            delayTimeoutRef.current = window.setTimeout(() => {
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
            
            // Set exhibits start scroll position when it should begin fading in
            const exhibitsStart = delayThreshold + (blurRangeExhibits * 0.3); // Start fading in at 30% of blur
            if (scrollPastLastWork >= exhibitsStart) {
              // Set the start scroll position for exhibits (fixed position fade in)
              if (exhibitsStartScrollRef.current === 0) {
                const targetStartScroll = lastWorkCenterPosition + exhibitsStart;
                exhibitsStartScrollRef.current = targetStartScroll;
                setExhibitsStartScroll(targetStartScroll);
              }
              
              // Calculate exhibits visibility based on scroll past start position
              const scrollPastExhibitsStart = scrollY - exhibitsStartScrollRef.current;
              const fadeInDuration = viewportHeight * 0.3;
              const exhibitsProgress = Math.min(scrollPastExhibitsStart / fadeInDuration, 1.0);
              setExhibitsVisible(exhibitsProgress > 0.1);
              
              const newSection = exhibitsProgress > 0.5 ? 'exhibits' : 'works';
              activeSectionRef.current = newSection;
              setActiveSection(newSection);
              
              // Calculate scroll progress for WebGL effects (not used for card scrolling anymore)
              setExhibitsScrollProgress(Math.max(exhibitsProgress, 0));
            } else {
              setExhibitsVisible(false);
              const newSection = 'works';
              activeSectionRef.current = newSection;
              setActiveSection(newSection);
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

      // If user has scrolled to bottom (e.g. clicked "About" before scrolling through exhibits),
      // set exhibitsStartScrollRef so the About block below runs and About section can show.
      const nearBottom = scrollY >= document.documentElement.scrollHeight - viewportHeight - 200;
      if (nearBottom && exhibitsStartScrollRef.current === 0) {
        const aboutZoneScrollPast = viewportHeight * 4.8; // scrollPastExhibitsStart that puts us in about (past PM fade-out + transition)
        exhibitsStartScrollRef.current = scrollY - aboutZoneScrollPast;
        setExhibitsStartScroll(scrollY - aboutZoneScrollPast);
      }

      // Handle printed matter section
      // Exhibits fades in at fixed position, stays visible, then fades out before printed matter
      if (exhibitsStartScrollRef.current > 0) {
        const scrollPastExhibitsStart = scrollY - exhibitsStartScrollRef.current;
        const viewportHeight = window.innerHeight;
        
        // Phase 1: Fade in exhibits (30vh fade in)
        const fadeInDuration = viewportHeight * 0.3; // 30vh to fade in
        // Phase 2: Stay visible (100vh - reduced by half)
        const stayVisibleDuration = viewportHeight * 1.0; // 100vh to stay visible (reduced from 200vh)
        // Phase 3: Fade out exhibits (30vh fade out)
        const fadeOutDuration = viewportHeight * 0.3; // 30vh to fade out
        
        const fadeInEnd = fadeInDuration;
        const stayVisibleEnd = fadeInEnd + stayVisibleDuration;
        const fadeOutEnd = stayVisibleEnd + fadeOutDuration;
        
        if (scrollPastExhibitsStart < fadeInEnd) {
          // Phase 1: Fading in exhibits
          const fadeProgress = scrollPastExhibitsStart / fadeInDuration;
          setExhibitsVisible(fadeProgress > 0.1);
          setPrintedMatterBlurIntensity(0);
          setPrintedMatterVisible(false);
          const newSection = 'exhibits';
          activeSectionRef.current = newSection;
          setActiveSection(newSection);
          setPrintedMatterScrollProgress(0);
        } else if (scrollPastExhibitsStart >= fadeInEnd && scrollPastExhibitsStart < stayVisibleEnd) {
          // Phase 2: Exhibits fully visible, staying in place
          setExhibitsVisible(true);
          setPrintedMatterBlurIntensity(0);
          setPrintedMatterVisible(false);
          const newSection = 'exhibits';
          activeSectionRef.current = newSection;
          setActiveSection(newSection);
          setPrintedMatterScrollProgress(0);
        } else if (scrollPastExhibitsStart >= stayVisibleEnd && scrollPastExhibitsStart < fadeOutEnd) {
          // Phase 3: Fading out exhibits (in place)
          const fadeOutProgress = (scrollPastExhibitsStart - stayVisibleEnd) / fadeOutDuration;
          const exhibitsOpacity = Math.max(0, 1 - fadeOutProgress);
          setExhibitsVisible(exhibitsOpacity > 0.1);
          setPrintedMatterBlurIntensity(1.0);
          setPrintedMatterVisible(false);
          const newSection = 'exhibits';
          activeSectionRef.current = newSection;
          setActiveSection(newSection);
          setPrintedMatterScrollProgress(0);
        } else if (scrollPastExhibitsStart >= fadeOutEnd) {
          // Phase 4: Exhibits fully faded out, now show printed matter
          setExhibitsVisible(false);
          
          // Calculate printed matter visibility - fade in after exhibits fade out
          const pastFadeOut = scrollPastExhibitsStart - fadeOutEnd;
          const fadeRange = viewportHeight * 0.3; // 30vh fade in
          const visibilityProgress = Math.min(pastFadeOut / fadeRange, 1.0);
          
          // Printed matter → About: one swift scroll band (same range for fade-out and fade-in)
          const printedMatterVisibleDuration = viewportHeight * 2.0; // 200vh visible
          const printedMatterFadeOutStart = fadeOutEnd + printedMatterVisibleDuration;
          const transitionRange = viewportHeight * 1.2; // 1.2vh for one swift scroll
          const printedMatterFadeOutRange = transitionRange;
          const printedMatterFadeOutProgress = Math.max(0, Math.min(1, (scrollPastExhibitsStart - printedMatterFadeOutStart) / printedMatterFadeOutRange));
          
          const aboutFadeInStart = printedMatterFadeOutStart;
          const aboutFadeInRange = transitionRange;
          const aboutFadeInProgress = Math.max(0, Math.min(1, (scrollPastExhibitsStart - aboutFadeInStart) / aboutFadeInRange));
          
          setPrintedMatterBlurIntensity(1.0);
          setMaxPrintedMatterBlurReached(true);
          setPrintedMatterVisible(visibilityProgress > 0.05 && printedMatterFadeOutProgress < 0.95);
          // Use hysteresis to prevent rapid toggling: switch to printed-matter at 0.3, back to exhibits at 0.15
          const shouldShowPrintedMatter = (visibilityProgress > 0.3 || (activeSectionRef.current === 'printed-matter' && visibilityProgress > 0.15)) && printedMatterFadeOutProgress < 0.9;
          const shouldShowAbout = aboutFadeInProgress > 0.1;
          const newActiveSection = shouldShowPrintedMatter ? 'printed-matter' : (shouldShowAbout ? 'about' : 'exhibits');
          activeSectionRef.current = newActiveSection;
          setActiveSection(newActiveSection);
          setPrintedMatterScrollProgress(visibilityProgress);
          setPrintedMatterFadeOutProgress(printedMatterFadeOutProgress);
          setAboutVisible(shouldShowAbout);
          setAboutFadeInProgress(aboutFadeInProgress);
        }
      } else if (!exhibitsVisible) {
        // Reset printed matter when scrolling back before exhibits
        setPrintedMatterBlurIntensity(0);
        setPrintedMatterScrollProgress(0);
        setPrintedMatterVisible(false);
        setPrintedMatterFadeOutProgress(0);
        setMaxPrintedMatterBlurReached(false);
        setAboutVisible(false);
        setAboutFadeInProgress(0);
      } else {
        // Exhibits visible but not complete yet
        setPrintedMatterBlurIntensity(0);
        setPrintedMatterVisible(false);
        setPrintedMatterScrollProgress(0);
        setPrintedMatterFadeOutProgress(0);
        setAboutVisible(false);
        setAboutFadeInProgress(0);
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
      if (printedMatterDelayTimeoutRef.current) {
        clearTimeout(printedMatterDelayTimeoutRef.current);
        printedMatterDelayTimeoutRef.current = null;
      }
    };
  }, [numWorks, lastWorkCenterPosition, exhibitsTriggerDelay, maxBlurReached, maxPrintedMatterBlurReached]);

  // Track when exhibits section should start appearing (based on scroll past last work)
  // Since exhibits is fixed, we track scroll position when it should fade in
  useEffect(() => {
    // The exhibits start scroll is set in the main scroll handler when exhibitsTriggerDelay is true
    // This effect just ensures it's tracked properly
    if (exhibitsTriggerDelay && exhibitsStartScrollRef.current === 0 && lastWorkCenterPosition > 0) {
      const viewportHeight = window.innerHeight;
      const delayThreshold = viewportHeight * 0.1;
      const blurRange = viewportHeight * 0.3;
      const exhibitsStart = delayThreshold + (blurRange * 0.3);
      const currentScroll = window.scrollY;
      const targetStartScroll = lastWorkCenterPosition + exhibitsStart;
      
      // Only set if we're close to the target position
      if (Math.abs(currentScroll - targetStartScroll) < viewportHeight) {
        exhibitsStartScrollRef.current = targetStartScroll;
        setExhibitsStartScroll(targetStartScroll);
      }
    }
    
    // Reset if scrolled back significantly before exhibits
    if (exhibitsStartScrollRef.current > 0 && window.scrollY < exhibitsStartScrollRef.current - 500) {
      exhibitsStartScrollRef.current = 0;
      setExhibitsStartScroll(0);
      setExhibitsVisible(false);
    }
  }, [exhibitsTriggerDelay, lastWorkCenterPosition]);

  // Track scroll position when printed matter first becomes visible
  useEffect(() => {
    if (printedMatterVisible && printedMatterStartScrollRef.current === 0) {
      const currentScroll = window.scrollY;
      printedMatterStartScrollRef.current = currentScroll;
      setPrintedMatterStartScroll(currentScroll);
    } else if (!printedMatterVisible && printedMatterStartScrollRef.current > 0) {
      // Reset when printed matter is no longer visible
      printedMatterStartScrollRef.current = 0;
      setPrintedMatterStartScroll(0);
    }
  }, [printedMatterVisible]);


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
        muted={videoMuted}
        playsInline
        className="landing-video"
      />
      <div className="landing-overlay" />
      
      {/* WebGL Blur Overlay - blurs video with burgundy tint and noise */}
      {/* Only render when blur intensity > 0.01 to avoid unnecessary WebGL context creation */}
      {videoRef.current && blurIntensity > 0.01 && (
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

      {/* Volume toggle - fixed left bottom, visible on all sections (video plays throughout) */}
      <button
        type="button"
        className="volume-toggle"
        onClick={() => setVideoMuted((m) => !m)}
        aria-label={videoMuted ? 'Unmute video' : 'Mute video'}
      >
        {videoMuted ? (
          <svg className="volume-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg className="volume-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>

      <WorksNavigation 
        isVisible={worksVisible || exhibitsVisible || printedMatterVisible || aboutVisible} 
        activeSection={activeSection}
        worksEndPosition={worksEndPosition}
        lastWorkCenterPosition={lastWorkCenterPosition}
        exhibitsStartScroll={exhibitsStartScroll}
        onNavSectionClick={useCallback((section: 'home' | 'works' | 'exhibits' | 'printed-matter' | 'about') => {
          activeSectionRef.current = section;
          setActiveSection(section);
          if (section === 'about') {
            setAboutVisible(true);
            setAboutFadeInProgress(1);
            const vh = window.innerHeight;
            const maxScroll = document.documentElement.scrollHeight - vh;
            exhibitsStartScrollRef.current = Math.max(0, maxScroll - 4.8 * vh);
            setExhibitsStartScroll(Math.max(0, maxScroll - 4.8 * vh));
          }
        }, [])}
      />
      <WorksGallery 
        ref={worksRef} 
        isActive={worksVisible}
        onWorksCountChange={setNumWorks}
        onLastWorkActive={useCallback((isActive: boolean, position: number) => {
          // Only update if values actually changed to prevent infinite loops
          if (lastWorkActiveRef.current !== isActive || Math.abs(lastWorkCenterPositionRef.current - position) > 1) {
            lastWorkActiveRef.current = isActive;
            lastWorkCenterPositionRef.current = position;
            setLastWorkActive(isActive);
            setLastWorkCenterPosition(position);
          }
        }, [])}
      />
      
      {/* Exhibits Blur Overlay - appears when scrolling past last work item */}
      {/* Uses same BlurOverlay component as landing, positioned over works section */}
      {/* Only render when blur intensity > 0.01 to avoid unnecessary WebGL context creation */}
      {videoRef.current && exhibitsBlurIntensity > 0.01 && (
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
      <div ref={exhibitsSectionRef as React.RefObject<HTMLDivElement>}>
        <ExhibitsSectionScrollHijack 
          isVisible={exhibitsVisible}
          scrollProgress={exhibitsScrollProgress}
          exhibitsStartPosition={exhibitsStartScroll}
          onExhibitsEndPosition={(endPosition) => {
            // Optional: You can use this to track when exhibits section ends
            // The component will automatically handle the transition
          }}
        />
      </div>

      {/* Printed Matter Blur Overlay - appears when scrolling past exhibits section */}
      {/* Only render when blur intensity > 0.01 to avoid unnecessary WebGL context creation */}
      {videoRef.current && printedMatterBlurIntensity > 0.01 && (
        <BlurOverlay 
          key="printed-matter-blur-overlay"
          videoElement={videoRef.current}
          blurIntensity={printedMatterBlurIntensity}
          blurRadius={20.0}
          burgundyIntensity={0.4}
          className="printed-matter-blur-overlay"
        />
      )}
      
      {/* Printed Matter Section - Always rendered, visibility controlled by isVisible */}
      <PrintedMatterSection 
        isVisible={printedMatterVisible}
        scrollProgress={printedMatterScrollProgress}
        fadeOutProgress={printedMatterFadeOutProgress}
      />

      {/* About Section - Appears on top of Printed Matter with higher z-index */}
      <AboutSection 
        isVisible={aboutVisible}
        fadeInProgress={aboutFadeInProgress}
      />

      {/* Spacer to allow scrolling past last work item - enables exhibits, printed matter, and about sections to appear */}
      {/* Need enough space for: exhibits (100vh) + transition (50vh) + printed matter visible (200vh) + printed matter fade out (100vh) + about fade in (100vh) = 550vh minimum */}
      <div 
        style={{
          position: 'relative',
          width: '100%',
          height: '600vh', // Enough space to scroll through all sections including about
          zIndex: 1, // Below everything
          pointerEvents: 'none', // Don't block interactions
          backgroundColor: 'transparent', // Ensure it's visible in dev tools
        }}
        aria-hidden="true"
      />
      
    </>
  );
}
