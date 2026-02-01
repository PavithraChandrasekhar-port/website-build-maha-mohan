import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { LazyImage } from '@/components/media/LazyImage';
import type { Exhibit } from '@/types/cms';
import { exhibitsFromFolders } from '@/utils/exhibitsFromFolders';
import backArrowSvg from '@/icons/Back arrow.svg';
import '@/styles/exhibits.css';

interface ExhibitsSectionScrollHijackProps {
  isVisible?: boolean;
  scrollProgress?: number;
  exhibitsStartPosition?: number;
  onExhibitsEndPosition?: (position: number) => void;
}

const CARDS_VISIBLE = 3;
const ANIMATION_DURATION = 0.5; // seconds

export default function ExhibitsSectionScrollHijack({ 
  isVisible = false, 
  scrollProgress: _scrollProgress = 0,
  exhibitsStartPosition: _exhibitsStartPosition = 0,
  onExhibitsEndPosition: _onExhibitsEndPosition
}: ExhibitsSectionScrollHijackProps) {
  const prefersReducedMotion = useReducedMotion();
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
  const [loadedImageArrays, setLoadedImageArrays] = useState<Record<string, HTMLImageElement[]>>({}); // Multiple images per exhibit
  const [startIndex, setStartIndex] = useState(0); // Index of first visible card
  const [direction, setDirection] = useState<'left' | 'right' | null>(null); // Track animation direction
  const [hoveredExhibitId, setHoveredExhibitId] = useState<string | null>(null);
  const [hoverImageIndex, setHoverImageIndex] = useState<Record<string, number>>({}); // Track current image index for each exhibit
  const hoverIntervalRef = useRef<Record<string, number>>({}); // Store intervals for each exhibit
  const isAnimatingRef = useRef(false);
  const isProcessingRef = useRef(false); // Guard against rapid multiple clicks

  // Load exhibits from folder structure (placeholder + folder-based + placeholder)
  useEffect(() => {
    setExhibits(exhibitsFromFolders);
    const maxStartIndex = Math.max(0, exhibitsFromFolders.length - CARDS_VISIBLE);
    setStartIndex(prev => Math.min(prev, maxStartIndex));
  }, []);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(hoverIntervalRef.current).forEach(intervalId => {
        clearInterval(intervalId);
      });
      hoverIntervalRef.current = {};
    };
  }, []);

  useEffect(() => {
    const loadImages = async () => {
      const images: Record<string, HTMLImageElement> = {};
      const imageArrays: Record<string, HTMLImageElement[]> = {};
      
      for (const exhibit of exhibits) {
        // Primary image (exhibit.image or first of exhibit.images)
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
            console.warn(`Failed to load image for ${exhibit.id}:`, error);
          }
        }
        
        // All images for hover cycling
        if (exhibit.images && exhibit.images.length > 0) {
          const imageArray: HTMLImageElement[] = [];
          for (const imgSrc of exhibit.images) {
            try {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imgSrc;
              });
              imageArray.push(img);
            } catch (error) {
              console.warn(`Failed to load hover image for ${exhibit.id}:`, error);
            }
          }
          if (imageArray.length > 0) {
            imageArrays[exhibit.id] = imageArray;
          }
        }
      }
      setLoadedImages(images);
      setLoadedImageArrays(imageArrays);
    };
    if (exhibits.length > 0) loadImages();
  }, [exhibits]);

  const formatLabel = (id: string): string => {
    if (id === 'placeholder-start' || id === 'placeholder-end') return '[—]';
    return `[${id.padStart(3, '0')}]`;
  };

  // Get visible cards (3 cards starting from startIndex)
  const getVisibleCards = useCallback(() => {
    const visible: Exhibit[] = [];
    for (let i = 0; i < CARDS_VISIBLE; i++) {
      const index = startIndex + i;
      if (index < exhibits.length) {
        visible.push(exhibits[index]);
      }
    }
    return visible;
  }, [startIndex, exhibits]);

  // Navigate to previous set of cards
  const handlePrevCard = useCallback(() => {
    // Atomic check and set - prevent double calls
    if (isAnimatingRef.current || isProcessingRef.current) {
      console.log('⏸️ Already processing, skipping prev');
      return;
    }
    
    if (exhibits.length === 0) {
      console.log('⚠️ No exhibits loaded');
      return;
    }
    
    // Set guard immediately to prevent double calls
    isProcessingRef.current = true;
    
    setStartIndex(prev => {
      const maxStartIndex = Math.max(0, exhibits.length - CARDS_VISIBLE);
      console.log('⬅️ Prev clicked, current startIndex:', prev, 'maxStartIndex:', maxStartIndex, 'exhibits.length:', exhibits.length);
      
      // Double-check we can still proceed (in case state changed)
      if (prev <= 0) {
        console.log('⚠️ Already at start, cannot go prev');
        isProcessingRef.current = false;
        setDirection(null);
        return prev;
      }
      
      // Set animation flag
      isAnimatingRef.current = true;
      setDirection('right'); // Prev: cards slide in from left (x: -100 -> 0)
      
      // Clear flags after animation
      setTimeout(() => {
        isAnimatingRef.current = false;
        isProcessingRef.current = false;
        setDirection(null);
      }, prefersReducedMotion ? 0 : ANIMATION_DURATION * 1000);
      
      const newIndex = prev - 1;
      console.log('✅ Moving to startIndex:', newIndex);
      return newIndex;
    });
  }, [exhibits.length, prefersReducedMotion]);

  // Navigate to next set of cards
  const handleNextCard = useCallback(() => {
    // Atomic check and set - prevent double calls
    if (isAnimatingRef.current || isProcessingRef.current) {
      console.log('⏸️ Already processing, skipping next');
      return;
    }
    
    if (exhibits.length === 0) {
      console.log('⚠️ No exhibits loaded');
      return;
    }
    
    // Set guard immediately to prevent double calls
    isProcessingRef.current = true;
    
    setStartIndex(prev => {
      const maxStartIndex = Math.max(0, exhibits.length - CARDS_VISIBLE);
      console.log('➡️ Next clicked, current startIndex:', prev, 'maxStartIndex:', maxStartIndex, 'exhibits.length:', exhibits.length);
      
      // Double-check we can still proceed (in case state changed)
      if (prev >= maxStartIndex) {
        console.log('⚠️ Already at end, cannot go next');
        isProcessingRef.current = false;
        setDirection(null);
        return prev;
      }
      
      // Set animation flag
      isAnimatingRef.current = true;
      setDirection('left'); // Next: cards slide in from right (x: 100 -> 0)
      
      // Clear flags after animation
      setTimeout(() => {
        isAnimatingRef.current = false;
        isProcessingRef.current = false;
        setDirection(null);
      }, prefersReducedMotion ? 0 : ANIMATION_DURATION * 1000);
      
      const newIndex = prev + 1;
      console.log('✅ Moving to startIndex:', newIndex);
      return newIndex;
    });
  }, [exhibits.length, prefersReducedMotion]);

  // Check if we can go left/right - recalculate on every render
  // Note: Don't check isAnimatingRef.current here as refs don't trigger re-renders
  // The click handlers will check it instead
  const maxStartIndex = exhibits.length > 0 ? Math.max(0, exhibits.length - CARDS_VISIBLE) : 0;
  const canGoLeft = startIndex > 0;
  const canGoRight = exhibits.length > 0 && startIndex < maxStartIndex;
  
  // Debug: Log navigation state
  useEffect(() => {
    console.log('📍 Navigation state:', {
      startIndex,
      maxStartIndex,
      exhibitsLength: exhibits.length,
      canGoLeft,
      canGoRight,
      isAnimating: isAnimatingRef.current,
      visibleCardIds: getVisibleCards().map(c => c.id)
    });
  }, [startIndex, maxStartIndex, exhibits.length, canGoLeft, canGoRight, getVisibleCards]);

  // Forward arrow SVG (flip back arrow)
  const ForwardArrow = () => (
    <svg width="24" height="24" viewBox="0 0 36 35" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'scaleX(-1)', display: 'block' }}>
      <path d="M0.146447 17.6464C-0.0488155 17.8417 -0.0488155 18.1583 0.146447 18.3536L3.32843 21.5355C3.52369 21.7308 3.84027 21.7308 4.03553 21.5355C4.2308 21.3403 4.2308 21.0237 4.03553 20.8284L1.20711 18L4.03553 15.1716C4.2308 14.9763 4.2308 14.6597 4.03553 14.4645C3.84027 14.2692 3.52369 14.2692 3.32843 14.4645L0.146447 17.6464ZM35.5 18V17.5H0.5V18V18.5H35.5V18Z" fill="white"/>
    </svg>
  );

  const visibleCards = getVisibleCards();

  return (
    <motion.section
      className={`exhibits-section ${isVisible ? 'visible' : ''}`}
      initial={prefersReducedMotion ? {} : { opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      style={{ 
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <div className="exhibits-container">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '3rem',
        }}>
          <h2 className="exhibits-title">Upcoming and Ongoing Exhibits</h2>
          
          {/* Arrow Navigation Buttons */}
          <div style={{
            display: 'flex',
            gap: '2rem',
            position: 'relative',
            zIndex: 10,
          }}>
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Additional guard: check refs directly (not just state)
                if (isAnimatingRef.current || isProcessingRef.current) {
                  console.log('⏸️ Click ignored - already processing');
                  return;
                }
                console.log('⬅️ Prev button clicked, canGoLeft:', canGoLeft, 'isAnimating:', isAnimatingRef.current, 'isProcessing:', isProcessingRef.current);
                if (canGoLeft) {
                  handlePrevCard();
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0',
                cursor: 'pointer', // Always show pointer, not not-allowed
                opacity: canGoLeft ? 1 : 0.3, // Grey out when disabled
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxSizing: 'border-box',
                pointerEvents: 'auto',
                userSelect: 'none',
              }}
              role="button"
              tabIndex={canGoLeft ? 0 : -1}
              aria-label="Previous exhibit"
              aria-disabled={!canGoLeft}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && canGoLeft && !isAnimatingRef.current && !isProcessingRef.current) {
                  e.preventDefault();
                  handlePrevCard();
                }
              }}
            >
              <img src={backArrowSvg} alt="Previous" style={{ width: '24px', height: '24px', display: 'block', pointerEvents: 'none' }} />
              <span style={{ 
                fontSize: '0.65rem', 
                fontFamily: 'Absans, sans-serif',
                color: 'rgba(255, 255, 255, 1)',
                pointerEvents: 'none',
                whiteSpace: 'nowrap'
              }}>Prev</span>
            </div>
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Additional guard: check refs directly (not just state)
                if (isAnimatingRef.current || isProcessingRef.current) {
                  console.log('⏸️ Click ignored - already processing');
                  return;
                }
                console.log('➡️ Next button clicked, canGoRight:', canGoRight, 'isAnimating:', isAnimatingRef.current, 'isProcessing:', isProcessingRef.current);
                if (canGoRight) {
                  handleNextCard();
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0',
                cursor: 'pointer', // Always show pointer, not not-allowed
                opacity: canGoRight ? 1 : 0.3, // Grey out when disabled
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxSizing: 'border-box',
                pointerEvents: 'auto',
                userSelect: 'none',
              }}
              role="button"
              tabIndex={canGoRight ? 0 : -1}
              aria-label="Next exhibit"
              aria-disabled={!canGoRight}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && canGoRight && !isAnimatingRef.current && !isProcessingRef.current) {
                  e.preventDefault();
                  handleNextCard();
                }
              }}
            >
              <span style={{ 
                fontSize: '0.65rem', 
                fontFamily: 'Absans, sans-serif',
                color: 'rgba(255, 255, 255, 1)',
                pointerEvents: 'none',
                whiteSpace: 'nowrap'
              }}>Next</span>
              <ForwardArrow />
            </div>
          </div>
        </div>
        
        {exhibits.length === 0 && (
          <p style={{ color: 'white', padding: '2rem' }}>Loading...</p>
        )}
        
        <div className="exhibits-grid-container">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={startIndex}
              className="exhibits-grid"
              custom={direction}
              initial={prefersReducedMotion || !direction ? undefined : direction === 'left' ? { x: 300 } : { x: -300 }}
              animate={{ x: 0 }}
              exit={prefersReducedMotion || !direction ? undefined : direction === 'left' ? { x: -300 } : { x: 300 }}
              transition={{ 
                duration: prefersReducedMotion ? 0 : ANIMATION_DURATION,
                ease: [0.4, 0, 0.2, 1]
              }}
            >
            {visibleCards.map((exhibit) => {
              const imageElement = loadedImages[exhibit.id];
              const hoverImages = loadedImageArrays[exhibit.id] || [];
              const currentHoverIndex = hoverImageIndex[exhibit.id] || 0;
              const isHovered = hoveredExhibitId === exhibit.id;
              
              // Determine which image to show (folder-based: primary or first of images, then hover cycle)
              let currentImageSrc: string | null = null;
              if (isHovered && hoverImages.length > 0) {
                currentImageSrc = hoverImages[currentHoverIndex]?.src || null;
              } else if (imageElement) {
                currentImageSrc = imageElement.src;
              } else if (exhibit.images?.[0]) {
                currentImageSrc = exhibit.images[0];
              }

              return (
                <div
                  key={exhibit.id}
                  className="exhibit-card"
                  onMouseEnter={() => {
                    if (hoverImages.length > 0) {
                      setHoveredExhibitId(exhibit.id);
                      setHoverImageIndex(prev => ({ ...prev, [exhibit.id]: 0 }));
                      
                      // Start cycling through images
                      const intervalId = window.setInterval(() => {
                        setHoverImageIndex(prev => {
                          const currentIndex = prev[exhibit.id] || 0;
                          const nextIndex = (currentIndex + 1) % hoverImages.length;
                          return { ...prev, [exhibit.id]: nextIndex };
                        });
                      }, 500); // 0.5s per swap
                      
                      hoverIntervalRef.current[exhibit.id] = intervalId;
                    }
                  }}
                  onMouseLeave={() => {
                    if (hoverImages.length > 0) {
                      setHoveredExhibitId(null);
                      setHoverImageIndex(prev => ({ ...prev, [exhibit.id]: 0 })); // Reset to first image
                      
                      // Clear interval
                      if (hoverIntervalRef.current[exhibit.id]) {
                        clearInterval(hoverIntervalRef.current[exhibit.id]);
                        delete hoverIntervalRef.current[exhibit.id];
                      }
                    }
                  }}
                >
                  <div className="exhibit-image-container">
                    {currentImageSrc ? (
                      <LazyImage
                        src={currentImageSrc}
                        alt={exhibit.title}
                        responsive
                        widths={[400, 600, 800, 1024, 1280]}
                        className="exhibit-image"
                        style={{
                          transition: 'opacity 0.3s ease-in-out',
                        }}
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
            })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
}
