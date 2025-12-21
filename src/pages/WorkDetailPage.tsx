import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LazyImage } from '@/components/media/LazyImage';
import { LazyVideo } from '@/components/media/LazyVideo';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { getWorkById } from '@/utils/works/workData';
import BlurOverlay from '@/components/webgl/BlurOverlay';
import TransitionOverlay from '@/components/webgl/TransitionOverlay';
import backArrowIcon from '@/icons/Back arrow.svg';
import '@/styles/work-detail.css';

export default function WorkDetailPage() {
  // ============================================================================
  // CRITICAL: ALL HOOKS MUST BE AT THE TOP LEVEL
  // Rules of Hooks:
  // 1. Only call hooks at the top level
  // 2. Don't call hooks inside loops, conditions, or nested functions
  // 3. Always use hooks at the top level, before any early returns
  // 4. Only call hooks from React function components or custom hooks
  // ============================================================================
  
  // 1. Router hooks (must be first)
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // 2. Custom hooks
  const prefersReducedMotion = useReducedMotion();
  
  // 3. State hooks - all useState calls grouped together
  const [work, setWork] = useState<ReturnType<typeof getWorkById> | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [scrollAccumulator, setScrollAccumulator] = useState(0);
  const [backgroundMedia, setBackgroundMedia] = useState<{ id: string; type: 'image' | 'video'; url: string; alt?: string } | null>(null);
  const [transitionComplete, setTransitionComplete] = useState(false);
  const [backgroundImageLoaded, setBackgroundImageLoaded] = useState(false);
  const [sourceImageElement, setSourceImageElement] = useState<HTMLImageElement | null>(null);
  const [targetImageElement, setTargetImageElement] = useState<HTMLImageElement | null>(null);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [morphComplete, setMorphComplete] = useState(false); // MUST be false initially - Phase 1 must run first!
  const [morphTarget, setMorphTarget] = useState<{ centerX: number; centerY: number; targetWidth: number; targetHeight: number } | null>(null);
  
  // 4. Ref hooks - all useRef calls grouped together
  const containerRef = useRef<HTMLDivElement>(null);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement | null>(null);
  const firstImageRef = useRef<HTMLImageElement | null>(null);
  const firstImageContainerRef = useRef<HTMLDivElement | null>(null);
  const morphTargetCalculatedRef = useRef<string | null>(null);
  const transitionIdRef = useRef<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);
  const animationStartedRef = useRef(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const targetImageRef = useRef<HTMLImageElement | null>(null);
  
  // 5. Get transition data from location state (not a hook, but needed early)
  const transitionData = location.state?.transition as {
    type: string;
    sourceRect: { x: number; y: number; width: number; height: number };
    sourceImage: string;
    workId: string;
  } | undefined;


  // Load work data and select random background media
  // Load synchronously - no loading state needed
  useEffect(() => {
    if (!id) {
      return;
    }
    
    try {
      console.log('🔍 Loading work data for ID:', id);
      const data = getWorkById(id);
      if (data) {
        console.log('✅ Work data loaded:', {
          id: data.id,
          name: data.name,
          mediaCount: data.media.length,
        });
        // If we have transition data with a thumbnail, find it in media and set as first
        if (transitionData?.sourceImage && data.media.length > 0) {
          // Extract filename from thumbnail URL for better matching
          const thumbnailFilename = transitionData.sourceImage.split('/').pop()?.toLowerCase() || '';
          
          // Find the thumbnail image in the media array by comparing filenames
          const thumbnailIndex = data.media.findIndex((media) => {
            const mediaFilename = media.url.split('/').pop()?.toLowerCase() || '';
            // Match by exact filename or if thumbnail URL is contained in media URL
            return mediaFilename === thumbnailFilename || 
                   media.url === transitionData.sourceImage ||
                   media.url.includes(thumbnailFilename.split('.')[0]); // Match by base name
          });
          
          if (thumbnailIndex > 0) {
            // Reorder media array to put thumbnail first
            const reorderedMedia = [
              data.media[thumbnailIndex],
              ...data.media.slice(0, thumbnailIndex),
              ...data.media.slice(thumbnailIndex + 1)
            ];
            setWork({ ...data, media: reorderedMedia });
            setActiveMediaIndex(0); // Set thumbnail as first/active
          } else if (thumbnailIndex === 0) {
            // Already first
            setWork(data);
            setActiveMediaIndex(0);
          } else {
            // Thumbnail not found, use first media item
            setWork(data);
            setActiveMediaIndex(0);
          }
        } else {
          setWork(data);
          setActiveMediaIndex(0);
        }
        
        setBackgroundImageLoaded(false);
        setTransitionProgress(0); // Reset transition progress
        
        // Preload the ORIGINAL first image (not the thumbnail) for transition target
        // This is the image that should appear in the work detail page
        // CRITICAL: Must find a DIFFERENT image from the source thumbnail
        const targetImageUrl = transitionData?.sourceImage && data.media.length > 0
          ? (() => {
              // Find ANY media item that's different from the source
              const sourceUrl = transitionData.sourceImage;
              
              // Try to find a different image
              for (const media of data.media) {
                // Compare normalized URLs (handle both full paths and filenames)
                const mediaUrl = media.url;
                const mediaFilename = mediaUrl.split('/').pop()?.toLowerCase() || '';
                const sourceFilename = sourceUrl.split('/').pop()?.toLowerCase() || '';
                
                // If URLs or filenames don't match, use this as target
                if (mediaUrl !== sourceUrl && mediaFilename !== sourceFilename) {
                  return mediaUrl;
                }
              }
              
              // If all images are the same (shouldn't happen), return null to skip transition
              return null;
            })()
          : (data.media.length > 0 ? data.media[0].url : null);
        
        if (targetImageUrl && data.media.length > 0) {
          const img = new Image();
          img.src = targetImageUrl;
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            if (transitionData) {
              setTargetImageElement(img);
            }
          };
          img.onerror = () => {
            // Silently fail
          };
        }
        
        // Select one random media item for background
        if (data.media.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.media.length);
          setBackgroundMedia(data.media[randomIndex]);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load work:', error);
      console.error('Work ID:', id);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    }
  }, [id, transitionData]);
  
  // Reset calculation flag when transition data changes
  useEffect(() => {
    const currentTransitionId = transitionData ? `${id}-${transitionData.sourceImage}` : null;
    if (currentTransitionId !== transitionIdRef.current) {
      morphTargetCalculatedRef.current = null;
      transitionIdRef.current = currentTransitionId;
      // Reset morph target when new transition starts
      setMorphTarget(null);
    }
  }, [transitionData, id]);

  // Load source image (thumbnail) for transition
  // Phase 1.3: Image loading verification
  useEffect(() => {
    if (transitionData?.sourceImage) {
      const img = new Image();
      img.src = transitionData.sourceImage;
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        console.log('🖼️ Source image loaded:', {
          src: img.src,
          width: img.naturalWidth,
          height: img.naturalHeight,
          complete: img.complete,
        });
        setSourceImageElement(img);
      };
      img.onerror = () => {
        console.error('❌ Source image failed to load:', transitionData.sourceImage);
        setSourceImageElement(null);
      };
    } else {
      setSourceImageElement(null);
    }
  }, [transitionData?.sourceImage]);

  // Phase 1.3: Target image loading verification
  useEffect(() => {
    if (targetImageElement) {
      console.log('🖼️ Target image loaded:', {
        src: targetImageElement.src,
        width: targetImageElement.naturalWidth,
        height: targetImageElement.naturalHeight,
        complete: targetImageElement.complete,
      });
      
      // Verify images are different
      if (sourceImageElement && targetImageElement) {
        const areDifferent = sourceImageElement.src !== targetImageElement.src;
        console.log('🔍 Images are different:', areDifferent);
        if (!areDifferent) {
          console.warn('⚠️ Source and target images are the same!');
        }
      }
    }
  }, [targetImageElement, sourceImageElement]);

  // Store image elements in refs to avoid dependency issues
  useEffect(() => {
    sourceImageRef.current = sourceImageElement;
  }, [sourceImageElement]);
  
  useEffect(() => {
    targetImageRef.current = targetImageElement;
  }, [targetImageElement]);
  
  useEffect(() => {
    // Only proceed if we have transition data
    if (!transitionData) {
      // Clean up when no transition data
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      isAnimatingRef.current = false;
      animationStartedRef.current = false;
      return;
    }

    // Don't start Perlin transition until morph is complete
    if (!morphComplete) {
      return;
    }

    // Check refs instead of state to avoid dependency issues
    if (!sourceImageRef.current || !targetImageRef.current) {
      return;
    }

    // Prevent multiple animation loops - only start once
    if (isAnimatingRef.current || animationStartedRef.current) {
      return;
    }

    // Mark as started immediately to prevent re-triggering
    animationStartedRef.current = true;

    // Wait 0.3s after morph completes, then start Perlin noise transition
    pauseTimeoutRef.current = setTimeout(() => {
      const duration = prefersReducedMotion ? 0 : 1000; // 1 second transition
      const startTime = performance.now();
      setTransitionProgress(0);
      isAnimatingRef.current = true;

      const animate = (currentTime: number) => {
        if (!isAnimatingRef.current) {
          return; // Stop if animation was cancelled
        }
        
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1.0);
        
        setTransitionProgress(progress);

        if (progress < 1.0) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Transition complete
          isAnimatingRef.current = false;
          setTransitionProgress(1.0);
          requestAnimationFrame(() => {
            setTransitionComplete(true);
          });
        }
      };

      // Small delay to ensure WebGL is ready
      setTimeout(() => {
        if (isAnimatingRef.current) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      }, 50);
    }, 300); // 0.3s pause after morph

    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      isAnimatingRef.current = false;
    };
  }, [morphComplete, transitionData, prefersReducedMotion]); // Removed image element dependencies

  // Ensure background image stays loaded and prevent crashes
  useEffect(() => {
    if (backgroundMedia?.type === 'image' && backgroundImageRef.current) {
      // Force image to stay loaded by checking if it's complete
        if (backgroundImageRef.current.complete && backgroundImageRef.current.naturalWidth > 0) {
          if (!backgroundImageLoaded) {
            setBackgroundImageLoaded(true);
          }
        }
    }
  }, [backgroundMedia, backgroundImageLoaded]);

  // Prevent background from being removed on scroll
  useEffect(() => {
    // Keep background media loaded even during scroll
    if (backgroundMedia?.type === 'image' && backgroundImageRef.current) {
      // Ensure image stays in DOM
      const img = backgroundImageRef.current;
      if (img && !img.complete) {
        img.onload = () => {
          setBackgroundImageLoaded(true);
        };
      }
    }
  }, [backgroundMedia, activeMediaIndex]);

  // Handle wheel scroll for image transitions with accumulation
  useEffect(() => {
    if (!work || !containerRef.current) return;

    const SCROLL_THRESHOLD = 150; // Pixels of scroll needed to trigger transition
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      if (isTransitioning) return;
      
      const delta = e.deltaY;
      const newAccumulator = scrollAccumulator + delta;
      
      // Clamp accumulator to prevent excessive accumulation
      const clampedAccumulator = Math.max(-SCROLL_THRESHOLD, Math.min(SCROLL_THRESHOLD, newAccumulator));
      
      // Check if we've accumulated enough scroll to trigger a transition
      if (Math.abs(clampedAccumulator) >= SCROLL_THRESHOLD) {
        let newIndex = activeMediaIndex;
        
        if (clampedAccumulator > 0) {
          // Scroll down - next image
          newIndex = activeMediaIndex < work.media.length - 1 
            ? activeMediaIndex + 1 
            : 0; // Loop to first
        } else {
          // Scroll up - previous image
          newIndex = activeMediaIndex > 0 
            ? activeMediaIndex - 1 
            : work.media.length - 1; // Loop to last
        }
        
        if (newIndex !== activeMediaIndex) {
          setIsTransitioning(true);
          setActiveMediaIndex(newIndex);
          setScrollAccumulator(0); // Reset accumulator after transition
          
          // Reset transitioning flag after animation
          setTimeout(() => {
            setIsTransitioning(false);
          }, 600);
        } else {
          // Same image, just reset accumulator
          setScrollAccumulator(0);
        }
      } else {
        // Accumulate scroll but don't transition yet - this creates visible scroll movement
        setScrollAccumulator(clampedAccumulator);
      }
    };

    const container = containerRef.current;
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [work, activeMediaIndex, isTransitioning, scrollAccumulator]);

  // 6. useCallback hooks - all grouped together
  // Calculate morph target dimensions - called from image onLoad callback
  const calculateMorphTarget = useCallback(() => {
    // Create a unique ID for this transition
    const currentTransitionId = transitionData ? `${id}-${transitionData.sourceImage}` : null;
    
    // Only calculate once per transition
    if (morphTargetCalculatedRef.current === currentTransitionId) {
      return;
    }
    
    if (!transitionData || !firstImageRef.current) {
      return;
    }
    
    const img = firstImageRef.current;
    
    // Get the ACTUAL rendered image dimensions (not container)
    const imgRect = img.getBoundingClientRect();
    
    // Use actual rendered dimensions - the image element already has correct size from CSS
    const displayedWidth = imgRect.width;
    const displayedHeight = imgRect.height;
    
    if (displayedWidth === 0 || displayedHeight === 0) {
      return; // Image not rendered yet
    }
    
    // Calculate center position from actual image position
    const centerX = imgRect.left + displayedWidth / 2;
    const centerY = imgRect.top + displayedHeight / 2;

    // Set morph target for transition - use actual rendered image size
    const target = {
      centerX,
      centerY,
      targetWidth: displayedWidth,
      targetHeight: displayedHeight,
    };
    
    // Mark as calculated BEFORE setting state to prevent re-triggering
    morphTargetCalculatedRef.current = currentTransitionId;
    transitionIdRef.current = currentTransitionId;
    setMorphTarget(target);
  }, [transitionData, id]);

  // Handle back button click - navigate to home and scroll to works section
  const handleBackClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate('/', { replace: false });
    // Scroll to works section after navigation
    setTimeout(() => {
      const viewportHeight = window.innerHeight;
      const worksStartPosition = viewportHeight * 0.3; // Works section appears at 30% scroll
      window.scrollTo({
        top: worksStartPosition + 200, // Center first work item
        behavior: 'smooth'
      });
    }, 100);
  }, [navigate]);

  // 7. useMemo hooks - all grouped together
  // Constants for calculations
  const IMAGE_SPACING = 100; // 100vh spacing between images
  const CENTER_OFFSET = 50; // Center of viewport (50vh from top)

  // Memoize translateY calculation for performance
  const translateY = useMemo(() => {
    return -(activeMediaIndex * IMAGE_SPACING + CENTER_OFFSET);
  }, [activeMediaIndex]);

  // Split work and media to ensure stable hook execution order
  // This prevents React from detecting changes in hook order
  // CRITICAL: Always call useMemo with same dependencies structure
  const workMedia = work?.media ?? null;
  const workMediaLength = workMedia?.length ?? 0;
  
  // ALWAYS call useMemo - never conditionally skip it
  // Split the condition check to ensure hook is always called
  const imageStyles = useMemo(() => {
    // Early return inside useMemo is OK - the hook itself is always called
    if (!workMedia || workMediaLength === 0) {
      return [];
    }
    return workMedia.map((_, index) => {
      const distanceFromCenter = Math.abs(index - activeMediaIndex);
      
      if (distanceFromCenter === 0) {
        return { opacity: 1, scale: 1 };
      } else if (distanceFromCenter === 1) {
        return { opacity: 0.3, scale: 0.85 };
      } else {
        return { opacity: 0, scale: 0.85 };
      }
    });
  }, [workMedia, workMediaLength, activeMediaIndex]); // Stable dependencies

  // ============================================================================
  // ALL HOOKS COMPLETE - Now component logic and render
  // ============================================================================

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/1acbd97f-c512-4a91-abe9-1f4a4f189617',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkDetailPage.tsx:458',message:'Before conditional returns',data:{hasWork:!!work,hasTransitionData:!!transitionData,hookCount:'all-hooks-called'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  // CRITICAL: Always render the component to allow transitions to show
  // Only show error AFTER transitions complete (if work is still null)
  // This ensures morph + Perlin transitions run smoothly without interruption

  return (
    <div className="work-detail-page" ref={containerRef}>
      {/* Burgundy background layer - shows during morph phase as fallback if home background fails */}
      {transitionData && !morphComplete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#3A182B',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Phase 1: Morph Animation - thumbnail moves to center and matches target size */}
      {transitionData && !morphComplete && morphTarget && (
        <motion.div
          className="work-detail-morph-overlay"
          initial={{
            x: transitionData.sourceRect.x,
            y: transitionData.sourceRect.y,
            width: transitionData.sourceRect.width,
            height: transitionData.sourceRect.height,
            opacity: 1,
          }}
          animate={{
            x: morphTarget.centerX - morphTarget.targetWidth / 2,
            y: morphTarget.centerY - morphTarget.targetHeight / 2,
            width: morphTarget.targetWidth,
            height: morphTarget.targetHeight,
            opacity: 1,
          }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.8,
            ease: [0.4, 0, 0.2, 1],
          }}
          onAnimationStart={() => {
            console.log('📐 Phase 1: Morph animation started');
            console.log('📸 Thumbnail image:', transitionData.sourceImage);
            console.log('📍 Starting position:', transitionData.sourceRect);
            console.log('🎯 Target position:', morphTarget);
          }}
          onAnimationComplete={() => {
            console.log('✅ Phase 1: Morph animation complete');
            console.log('⏸️ Pausing for 0.3s before Phase 2...');
            // Morph complete - wait 0.3s, then start Perlin noise
            setTimeout(() => {
              console.log('🚀 Phase 2: Starting Perlin noise transition...');
              setMorphComplete(true);
            }, 300);
          }}
          style={{
            position: 'fixed',
            zIndex: 10, // Above burgundy background
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <img
            src={transitionData.sourceImage}
            alt="Transition"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </motion.div>
      )}

      {/* Phase 2: Perlin Noise Transition - starts from center, spreads outward */}
      {transitionData && morphComplete && !transitionComplete && sourceImageElement && targetImageElement && 
        sourceImageElement.src !== targetImageElement.src && (
        <TransitionOverlay
          fromImage={sourceImageElement}
          toImage={targetImageElement}
          progress={transitionProgress}
          onComplete={() => {
            // Transition complete - reveal final state
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setTransitionComplete(true);
              });
            });
          }}
          duration={prefersReducedMotion ? 0 : 1000}
          smoothness={0.5}
          centerX={morphTarget?.centerX || window.innerWidth / 2}
          centerY={morphTarget?.centerY || window.innerHeight / 2}
        />
      )}

      {/* Keep morph overlay visible during Perlin transition to prevent blank screen */}
      {/* Fades out as Perlin becomes visible (after 20% progress) */}
      {transitionData && morphComplete && !transitionComplete && morphTarget && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ 
            opacity: transitionProgress < 0.2 ? 1 : Math.max(0, 1 - (transitionProgress - 0.2) * 5) 
          }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'fixed',
            left: morphTarget.centerX - morphTarget.targetWidth / 2,
            top: morphTarget.centerY - morphTarget.targetHeight / 2,
            width: morphTarget.targetWidth,
            height: morphTarget.targetHeight,
            zIndex: 10, // Same as morph overlay, below Perlin (12)
            pointerEvents: 'none',
          }}
        >
          <img
            src={transitionData.sourceImage}
            alt="Transition"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </motion.div>
      )}
      {/* Blurred background - fixed random media, doesn't change on scroll - Only visible after transition */}
      {/* DELAYED: Don't render work detail background until transition complete to keep home page background visible */}
      <div 
        className="work-detail-background-container"
        style={{ 
          opacity: transitionComplete || !transitionData ? 1 : 0, // Only visible after transition
          zIndex: 0,
          transition: transitionData && !transitionComplete ? 'opacity 0.3s ease-out' : 'none',
        }}
      >
        {/* Show error only after transition completes (if work is still null) */}
        {!work && (transitionComplete || !transitionData) && (
          <div className="work-detail-error" style={{ 
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 100,
            textAlign: 'center',
            color: 'white',
            padding: '2rem',
            backgroundColor: 'rgba(58, 24, 43, 0.9)',
            borderRadius: '8px'
          }}>
            <h1>Work not found</h1>
            <Link to="/" onClick={handleBackClick} style={{ color: 'white', textDecoration: 'underline' }}>Return to Home</Link>
          </div>
        )}
        
        {backgroundMedia && (transitionComplete || !transitionData) && work && (
          <div
            className="work-detail-background work-detail-background-active"
            style={{ opacity: 1 }}
          >
            {backgroundMedia.type === 'image' ? (
              <>
                {backgroundMedia.url && (
                  <img
                    ref={backgroundImageRef}
                    src={backgroundMedia.url}
                    alt={backgroundMedia.alt || work.name}
                    className="background-image"
                    style={{ display: 'none' }}
                  onLoad={() => {
                    setBackgroundImageLoaded(true);
                  }}
                    onError={() => {
                      console.error('Background image failed to load');
                      setBackgroundImageLoaded(false);
                    }}
                  />
                )}
                {backgroundImageLoaded && backgroundImageRef.current && backgroundImageRef.current.complete && (
                  <BlurOverlay
                    key={`blur-image-${id}-${backgroundMedia.id}`}
                    imageElement={backgroundImageRef.current}
                    blurIntensity={1.0}
                    blurRadius={40.0}
                    burgundyIntensity={0}
                    className="work-detail-blur-overlay"
                  />
                )}
              </>
            ) : (
              <>
                {backgroundMedia.url && (
                  <video
                    ref={backgroundVideoRef}
                    src={backgroundMedia.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="background-video"
                    style={{ display: 'none' }}
                    onLoadedData={() => {
                      // Video is ready
                    }}
                    onError={() => {
                      console.error('Background video failed to load');
                    }}
                  />
                )}
                {backgroundVideoRef.current && backgroundVideoRef.current.readyState >= 2 && (
                  <BlurOverlay
                    key={`blur-video-${id}-${backgroundMedia.id}`}
                    videoElement={backgroundVideoRef.current}
                    blurIntensity={1.0}
                    blurRadius={40.0}
                    burgundyIntensity={0}
                    className="work-detail-blur-overlay"
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Back arrow - Always clickable, above everything */}
      <Link 
        to="/" 
        onClick={handleBackClick}
        className="work-detail-back-arrow" 
        style={{ 
          opacity: transitionComplete || !transitionData ? 1 : 0,
          zIndex: 20, // Always above everything
          pointerEvents: 'auto', // Always clickable
          transition: transitionData && !transitionComplete ? 'opacity 0.3s ease-out' : 'none',
        }}
      >
        <img src={backArrowIcon} alt="Back" />
      </Link>

      {/* Left panel - Metadata - Only text fades during transition */}
      {work && (
        <div 
          className="work-detail-left-panel"
          style={{ 
            opacity: transitionComplete || !transitionData ? 1 : 0, // Text fades during transition
            zIndex: transitionData && !transitionComplete ? 11 : 2,
            transition: transitionData && !transitionComplete ? 'opacity 0.3s ease-out' : 'none',
          }}
        >
          <div className="work-detail-info">
            <h1 className="work-detail-title">{work.name}</h1>
            <p className="work-detail-info-item">{work.medium}</p>
            <p className="work-detail-info-item">{work.dimensions}</p>
            <p className="work-detail-info-item">{work.year}</p>
          </div>
        </div>
      )}

      {/* Center area - Vertical carousel with all images - Only fades during transition */}
      {work && (
        <div 
          className="work-detail-center"
          style={{ 
            opacity: transitionComplete || !transitionData ? 1 : 0, // Content fades during transition
            zIndex: transitionData && !transitionComplete ? 11 : 1,
            transition: transitionData && !transitionComplete ? 'opacity 0.3s ease-out' : 'none',
          }}
        >
          <div 
            className="work-detail-carousel-container"
            style={{
              transform: `translate3d(0, ${translateY}vh, 0)`, // Use translate3d for GPU acceleration
              transition: prefersReducedMotion ? 'none' : 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'transform',
            }}
          >
            {workMedia && workMedia.map((mediaItem, index) => {
            const style = imageStyles[index] || { opacity: 0, scale: 0.85 };
            const isActive = index === activeMediaIndex;
            const isFirstImage = index === 0;
            
            return (
              <div
                key={`media-${index}`}
                ref={isFirstImage ? firstImageContainerRef : undefined}
                className="work-detail-media-item"
                style={{
                  position: 'absolute',
                  top: `${index * IMAGE_SPACING + CENTER_OFFSET}vh`,
                  left: '50%',
                  transform: `translateX(-50%) scale(${style.scale})`,
                  opacity: style.opacity,
                  transition: prefersReducedMotion ? 'none' : 'opacity 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: isActive ? '60vh' : '40vh',
                  height: '100vh',
                  willChange: isFirstImage && transitionData && !transitionComplete ? 'transform, opacity' : 'auto',
                }}
              >
                {mediaItem.type === 'image' ? (
                  mediaItem.url ? (
                    <LazyImage
                      ref={isFirstImage ? firstImageRef : undefined}
                      src={mediaItem.url}
                      alt={mediaItem.alt || work?.name || ''}
                      className="work-detail-media"
                      responsive
                      widths={[640, 768, 1024, 1280, 1920]}
                      onLoad={isFirstImage ? () => {
                        // Defer calculation to next frame to prevent infinite loops
                        requestAnimationFrame(() => {
                          requestAnimationFrame(() => {
                            // Calculate morph target when first image loads
                            calculateMorphTarget();
                            
                            // Set target image element for transition if not already set
                            if (firstImageRef.current && transitionData && !targetImageElement) {
                              const img = new Image();
                              img.src = mediaItem.url;
                              img.crossOrigin = 'anonymous';
                              img.onload = () => {
                                setTargetImageElement(img);
                              };
                            }
                          });
                        });
                      } : undefined}
                    />
                  ) : null
                ) : (
                  mediaItem.url ? (
                    <LazyVideo
                      src={mediaItem.url}
                      autoplay={isActive}
                      loop
                      muted
                      className="work-detail-media"
                      onLoadedData={isFirstImage ? () => {
                      } : undefined}
                    />
                  ) : null
                )}
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Right panel - Writings - scrolls with carousel - Only text fades during transition */}
      {work && (
        <div 
          className="work-detail-right-panel"
          style={{ 
            opacity: transitionComplete || !transitionData ? 1 : 0, // Text fades during transition
            zIndex: transitionData && !transitionComplete ? 11 : 2,
            transition: transitionData && !transitionComplete ? 'opacity 0.3s ease-out' : 'none',
          }}
        >
          <div 
            className="work-detail-writings-container"
            style={{
              transform: `translateY(${translateY}vh)`,
              transition: prefersReducedMotion ? 'none' : 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {workMedia && workMedia.map((mediaItem, index) => {
            const style = imageStyles[index] || { opacity: 0, scale: 0.85 };
            const writings = mediaItem.writings;
            
            return (
              <div
                key={`writings-${index}`}
                className="work-detail-writings-item"
                style={{
                  position: 'absolute',
                  top: `${index * IMAGE_SPACING + CENTER_OFFSET}vh`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  opacity: style.opacity,
                  transition: prefersReducedMotion ? 'none' : 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100vh',
                }}
              >
                <div className="work-detail-writings">
                  {writings ? (
                    <p className="work-detail-writings-text">{writings}</p>
                  ) : (
                    <p className="work-detail-writings-placeholder">
                      Writings if any
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

    </div>
  );
}
