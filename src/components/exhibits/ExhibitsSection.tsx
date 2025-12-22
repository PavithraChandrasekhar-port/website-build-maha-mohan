import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { Exhibit } from '@/types/cms';
import exhibitsData from '@/data/exhibits.json';
import risdImage from '@/assets/media/Exhibits/RISD.png';
import asSheShouldImage from '@/assets/media/Exhibits/As She Should.png';
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
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [canStartHorizontalScroll, setCanStartHorizontalScroll] = useState(false);
  const [hasScrolledOnce, setHasScrolledOnce] = useState(false);
  const delayTimeoutRef = useRef<number | null>(null);
  const previousScrollProgressRef = useRef<number>(0);

  // Load exhibits data
  useEffect(() => {
    try {
      const data = exhibitsData as { exhibits: Exhibit[] };
      setExhibits(data.exhibits || []);
    } catch (error) {
      console.error('Failed to load exhibits data:', error);
    }
  }, []);

  // Map exhibit titles to imported images
  const getExhibitImage = (title: string): string | null => {
    const imageMap: Record<string, string> = {
      'RISD Grad Show': risdImage,
      'As She Should': asSheShouldImage,
    };
    return imageMap[title] || null;
  };

  // Load images for exhibits
  useEffect(() => {
    const loadImages = async () => {
      const images: Record<string, HTMLImageElement> = {};
      
      for (const exhibit of exhibits) {
        // First check if exhibit has image path in data
        let imageSrc = exhibit.image;
        
        // If no image path, try to match by title
        if (!imageSrc) {
          const matchedImage = getExhibitImage(exhibit.title);
          if (matchedImage) {
            imageSrc = matchedImage;
          }
        }
        
        if (imageSrc) {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = imageSrc!;
            });
            images[exhibit.id] = img;
          } catch (error) {
            console.warn(`Failed to load image for exhibit ${exhibit.id}:`, error);
          }
        }
      }
      
      setLoadedImages(images);
    };

    if (exhibits.length > 0) {
      loadImages();
    }
  }, [exhibits]);

  // Format label as [001], [002], etc.
  const formatLabel = (id: string): string => {
    const num = id.padStart(3, '0');
    return `[${num}]`;
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
      setThreeSecondsPassed(false);
      setCanStartHorizontalScroll(false);
      setHasScrolledOnce(false);
      previousScrollProgressRef.current = 0;
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
        // scrollProgress (0.0 to 1.0) is directly tied to vertical scroll position
        const totalCards = exhibits.length;
        // Map vertical scroll progress to horizontal card index (0 to totalCards - 1)
        // As user scrolls down vertically, cards scroll horizontally
        const targetIndex = Math.min(
          Math.floor(scrollProgress * totalCards),
          totalCards - 1 // Can reach last card
        );
        
        // Update current card index
        setCurrentCardIndex(targetIndex);
        
        // Get actual card element to calculate width
        const cards = scrollContainerRef.current.querySelectorAll('.exhibit-card');
        if (cards[targetIndex]) {
          const cardElement = cards[targetIndex] as HTMLElement;
          const cardRect = cardElement.getBoundingClientRect();
          const containerRect = scrollContainerRef.current.getBoundingClientRect();
          
          // Calculate horizontal scroll position to center the target card
          // This position is directly controlled by vertical scroll progress
          const cardLeft = cardElement.offsetLeft;
          const cardWidth = cardRect.width;
          const containerWidth = containerRect.width;
          // Center the card in the visible area (accounting for 3.5 cards visible)
          const scrollPosition = cardLeft - (containerWidth / 2) + (cardWidth / 2);
          
          // Scroll horizontally based on vertical scroll position
          scrollContainerRef.current.scrollTo({
            left: Math.max(0, scrollPosition),
            behavior: 'smooth'
          });
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
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      style={{ 
        display: 'block',
        opacity: isVisible ? 1 : 0, // Force opacity for immediate visibility
      }}
    >
      {/* WebGL Background effects handled by BlurOverlay in HomePage - reuses same context pattern */}

      <div className="exhibits-container">
        <h2 className="exhibits-title">Upcoming and Ongoing Exhibits</h2>
        
        {exhibits.length === 0 && (
          <p style={{ color: 'white', padding: '2rem' }}>Loading exhibits...</p>
        )}
        
        <div className="exhibits-scroll-container" ref={scrollContainerRef}>
          {exhibits.length > 0 ? exhibits.map((exhibit, index) => {
            const imageElement = loadedImages[exhibit.id];
            // Check if we have an image element OR a matched image path
            const matchedImage = getExhibitImage(exhibit.title);
            const hasImage = !!imageElement || (!!matchedImage && !imageElement);

            return (
              <div key={exhibit.id} className="exhibit-card">
                <span className="exhibit-label">{formatLabel(exhibit.id)}</span>
                
                <div className="exhibit-image-container">
                  {/* Using regular images to avoid creating multiple WebGL contexts */}
                  {/* WebGL blur overlay already provides WebGL effects for the section */}
                  {imageElement ? (
                    <img
                      src={imageElement.src}
                      alt={exhibit.title}
                      className="exhibit-image"
                    />
                  ) : matchedImage ? (
                    <img
                      src={matchedImage}
                      alt={exhibit.title}
                      className="exhibit-image"
                    />
                  ) : (
                    <div className="exhibit-image-placeholder" />
                  )}
                </div>

                <div className="exhibit-info">
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

