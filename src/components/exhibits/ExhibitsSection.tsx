import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { LazyImage } from '@/components/media/LazyImage';
import type { Exhibit } from '@/types/cms';
import { exhibitsFromFolders } from '@/utils/exhibitsFromFolders';
import '@/styles/exhibits.css';

interface ExhibitsSectionProps {
  isVisible?: boolean;
  scrollProgress?: number; // 0.0 to 1.0 for WebGL effects
}

export default function ExhibitsSection({ isVisible = false, scrollProgress = 0 }: ExhibitsSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
  const [, setCurrentCardIndex] = useState(0);
  const [canStartHorizontalScroll, setCanStartHorizontalScroll] = useState(false);
  const [hasScrolledOnce, setHasScrolledOnce] = useState(false);
  const delayTimeoutRef = useRef<number | null>(null);
  const previousScrollProgressRef = useRef<number>(0);
  const lastScrollPositionRef = useRef<number>(0);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Load exhibits from folder structure (placeholder + folder-based + placeholder)
  useEffect(() => {
    setExhibits(exhibitsFromFolders);
  }, []);

  // Load images for exhibits (primary = exhibit.image or first of exhibit.images)
  useEffect(() => {
    const loadImages = async () => {
      const images: Record<string, HTMLImageElement> = {};
      for (const exhibit of exhibits) {
        const primarySrc = exhibit.image || (exhibit.images && exhibit.images[0]);
        if (primarySrc) {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = primarySrc;
            });
            images[exhibit.id] = img;
          } catch (error) {
            console.warn(`Failed to load image for exhibit ${exhibit.id}:`, error);
          }
        }
      }
      setLoadedImages(images);
    };
    if (exhibits.length > 0) loadImages();
  }, [exhibits]);

  const formatLabel = (id: string): string => {
    if (id === 'placeholder-start' || id === 'placeholder-end') return '[—]';
    return `[${id.padStart(3, '0')}]`;
  };

  // Track when section becomes visible and start delay timer
  const [threeSecondsPassed, setThreeSecondsPassed] = useState(false);
  
  useEffect(() => {
    if (isVisible && !threeSecondsPassed) {
      // Start 3 second delay timer
      delayTimeoutRef.current = window.setTimeout(() => {
        setThreeSecondsPassed(true);
      }, 3000);
      
      return () => {
        if (delayTimeoutRef.current) {
          clearTimeout(delayTimeoutRef.current);
          delayTimeoutRef.current = null;
        }
      };
    } else if (!isVisible) {
      // Reset when section becomes invisible
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
        delayTimeoutRef.current = null;
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
      setThreeSecondsPassed(false);
      setCanStartHorizontalScroll(false);
      setHasScrolledOnce(false);
      previousScrollProgressRef.current = 0;
      lastScrollPositionRef.current = 0;
    }
  }, [isVisible, threeSecondsPassed]);

  // Handle horizontal scrolling based on vertical scroll progress
  useEffect(() => {
    if (scrollContainerRef.current && exhibits.length > 0 && !prefersReducedMotion && isVisible) {
      // Check if 3 seconds have passed and user has scrolled at least once
      if (threeSecondsPassed && !hasScrolledOnce) {
        // Check if scroll progress has changed (user has scrolled vertically)
        // Only trigger if scroll progress actually changed (not just initialized)
        const hasScrolled = scrollProgress !== previousScrollProgressRef.current;
        if (hasScrolled && previousScrollProgressRef.current >= 0) {
          setHasScrolledOnce(true);
          setCanStartHorizontalScroll(true);
        }
      }
      
      // Only start horizontal scrolling after both conditions are met (3 seconds + one vertical scroll)
      if (canStartHorizontalScroll && hasScrolledOnce && threeSecondsPassed) {
        // Calculate which card should be visible based on vertical scroll progress
        // Make it snap to one card at a time by using a larger step size
        const totalCards = exhibits.length;
        
        // Divide scroll progress into discrete steps (one per card)
        // Each card gets an equal portion of the scroll range
        const cardStep = 1.0 / totalCards;
        
        // Find which card should be visible based on scroll progress
        // Use Math.floor to snap to the current card, not interpolate between cards
        // Ensure we can reach the last card: if progress is >= 0.99, force last card
        let targetIndex: number;
        if (scrollProgress >= 0.99) {
          targetIndex = totalCards - 1; // Force last card when near completion
        } else {
          targetIndex = Math.floor(scrollProgress / cardStep);
        }
        targetIndex = Math.min(targetIndex, totalCards - 1); // Clamp to last card
        targetIndex = Math.max(targetIndex, 0); // Clamp to first card
        
        // Update current card index
        setCurrentCardIndex(targetIndex);
        
        // Get actual card element to calculate width
        const cards = scrollContainerRef.current.querySelectorAll('.exhibit-card');
        if (cards[targetIndex]) {
          const cardElement = cards[targetIndex] as HTMLElement;
          const cardRect = cardElement.getBoundingClientRect();
          const containerRect = scrollContainerRef.current.getBoundingClientRect();
          
          // Calculate horizontal scroll position to center the target card
          const cardLeft = cardElement.offsetLeft;
          const cardWidth = cardRect.width;
          const containerWidth = containerRect.width;
          // Center the card in the visible area
          let scrollPosition = cardLeft - (containerWidth / 2) + (cardWidth / 2);
          
          // For the last card, ensure we scroll to the maximum possible position
          if (targetIndex === totalCards - 1) {
            const maxScroll = scrollContainerRef.current.scrollWidth - containerWidth;
            // Use the maximum scroll position to ensure last card is fully visible
            scrollPosition = Math.max(scrollPosition, maxScroll);
          }
          
          // Only scroll if the position has changed significantly (avoid unnecessary scrolls)
          const scrollDiff = Math.abs(scrollPosition - lastScrollPositionRef.current);
          if (scrollDiff > 1 || targetIndex === totalCards - 1) {
            // Always scroll for last card, or if position changed significantly
            lastScrollPositionRef.current = scrollPosition;
            
            // Clear any pending scroll timeout
            if (scrollTimeoutRef.current) {
              clearTimeout(scrollTimeoutRef.current);
            }
            
            // Scroll horizontally - use instant behavior for snapping effect
            scrollContainerRef.current.scrollTo({
              left: Math.max(0, scrollPosition),
              behavior: 'smooth' // Keep smooth for better UX, but snapping is controlled by discrete steps
            });
            
            // For the last card, also try to scroll to max after a short delay to ensure completion
            if (targetIndex === totalCards - 1) {
              scrollTimeoutRef.current = window.setTimeout(() => {
                if (scrollContainerRef.current) {
                  const maxScroll = scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth;
                  scrollContainerRef.current.scrollTo({
                    left: maxScroll,
                    behavior: 'smooth'
                  });
                }
              }, 100);
            }
          }
        }
      }
      
      // Update previous scroll progress to track vertical scroll changes
      previousScrollProgressRef.current = scrollProgress;
    }
  }, [scrollProgress, exhibits.length, prefersReducedMotion, canStartHorizontalScroll, hasScrolledOnce, isVisible, threeSecondsPassed]);



  return (
    <motion.section
      className={`exhibits-section ${isVisible ? 'visible' : ''}`}
      initial={prefersReducedMotion ? {} : { opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      style={{ 
        display: isVisible ? 'block' : 'none', // Hide completely when not visible
        opacity: isVisible ? 1 : 0,
      }}
    >
      {/* WebGL Background effects handled by BlurOverlay in HomePage - reuses same context pattern */}

      <div className="exhibits-container">
        <h2 className="exhibits-title">Upcoming and Ongoing Exhibits</h2>
        
        {exhibits.length === 0 && (
          <p style={{ color: 'white', padding: '2rem' }}>Loading exhibits...</p>
        )}
        
        <div className="exhibits-scroll-container" ref={scrollContainerRef}>
          {exhibits.length > 0 ? exhibits.map((exhibit) => {
            const imageElement = loadedImages[exhibit.id];
            const imageSrc = imageElement?.src ?? exhibit.image ?? exhibit.images?.[0];

            return (
              <div key={exhibit.id} className="exhibit-card">
                <div className="exhibit-image-container">
                  {imageSrc ? (
                    <LazyImage
                      src={imageSrc}
                      alt={exhibit.title}
                      responsive
                      widths={[400, 600, 800, 1024, 1280]}
                      className="exhibit-image"
                    />
                  ) : (
                    <div className="exhibit-image-placeholder" />
                  )}
                </div>

                <div className="exhibit-info">
                  <span className="exhibit-label">{formatLabel(exhibit.id)}</span>
                  <h3 className="exhibit-title">{exhibit.title}</h3>
                  <p className="exhibit-venue">{exhibit.venue}</p>
                  <p className="exhibit-location">{exhibit.location}</p>
                  <p className="exhibit-year">{exhibit.year}</p>
                </div>
              </div>
            );
          }) : (
            <p style={{ color: 'white', padding: '2rem' }}>No exhibits found</p>
          )}
        </div>
      </div>
    </motion.section>
  );
}

