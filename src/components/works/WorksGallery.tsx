import { useEffect, useRef, useState, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { LazyImage } from '@/components/media/LazyImage';
import { selectPortraitImage } from '@/utils/media/portraitSelector';
import { getWorkById } from '@/utils/works/workData';
import { getProjects } from '@/utils/cms/service';
import '@/styles/works.css';

interface Work {
  id: string;
  number: number;
  title: string;
  image: string;
  thumbnail?: string;
}

interface WorksGalleryProps {
  isActive: boolean;
  onWorksCountChange?: (count: number) => void; // Callback to pass works count to parent
  onLastWorkActive?: (isActive: boolean, workPosition: number) => void; // Callback when last work is active
}

const WorksGallery = forwardRef<HTMLElement, WorksGalleryProps>(
  ({ isActive, onWorksCountChange, onLastWorkActive }, ref) => {
  const navigate = useNavigate();
  const galleryRef = useRef<HTMLDivElement>(null);
  const workRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [portraitThumbnails, setPortraitThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const projects = await getProjects();
        if (cancelled) return;
        const list: Work[] = projects.map((p, i) => ({
          id: p.id,
          number: i + 1,
          title: p.name,
          image: p.coverImage.url,
          thumbnail: p.coverImage.url,
        }));
        setWorks(list);
      } catch (e) {
        console.error('WorksGallery: failed to load projects', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (works.length > 0 && activeIndex === null) {
      setActiveIndex(0);
    }
  }, [works.length, activeIndex]);

  // Notify parent of works count
  useEffect(() => {
    if (onWorksCountChange) {
      onWorksCountChange(works.length);
    }
  }, [onWorksCountChange, works.length]);

  // Load portrait thumbnails for each work
  useEffect(() => {
    if (works.length === 0) return;

    const loadPortraitThumbnails = async () => {
      const thumbnails: Record<string, string> = {};
      
      for (const work of works) {
        try {
          // Get work data to access all media
          const workData = getWorkById(work.id);
          if (workData && workData.media.length > 0) {
            // Get all image URLs from media
            const imageUrls = workData.media
              .filter(media => media.type === 'image' && media.url)
              .map(media => media.url);
            
            if (imageUrls.length > 0) {
              // Select first portrait image
              const portraitUrl = await selectPortraitImage(imageUrls);
              if (portraitUrl) {
                thumbnails[work.id] = portraitUrl;
              } else {
                // Fallback to first image if no portrait found
                thumbnails[work.id] = imageUrls[0];
              }
            } else {
              // Fallback to original thumbnail
              thumbnails[work.id] = work.thumbnail || work.image;
            }
          } else {
            // Fallback to original thumbnail
            thumbnails[work.id] = work.thumbnail || work.image;
          }
        } catch (error) {
          console.warn(`Failed to load portrait thumbnail for ${work.id}:`, error);
          // Fallback to original thumbnail
          thumbnails[work.id] = work.thumbnail || work.image;
        }
      }
      
      setPortraitThumbnails(thumbnails);
    };
    
    loadPortraitThumbnails();
  }, [works]);

  useEffect(() => {
    if (works.length === 0) return;
    // Use Intersection Observer for work highlighting
    const observers: IntersectionObserver[] = [];
    
    const timeoutId = setTimeout(() => {
      workRefs.current.forEach((ref, index) => {
        if (!ref) return;

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              // Check if work is in center 50% of viewport
              const rect = entry.boundingClientRect;
              const viewportCenter = window.innerHeight / 2;
              const workCenter = rect.top + rect.height / 2;
              
              // Work is active when its center is within 25% of viewport center
              const isInCenter = Math.abs(workCenter - viewportCenter) < window.innerHeight * 0.25;
              
              if (entry.isIntersecting && isInCenter) {
                setActiveIndex(index);
              }
            });
          },
          {
            threshold: [0, 0.25, 0.5, 0.75, 1],
            rootMargin: '-25% 0px -25% 0px', // Only trigger when in center 50% of viewport
          }
        );

        observer.observe(ref);
        observers.push(observer);
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observers.forEach((observer) => observer.disconnect());
    };
  }, [works.length]);

  // Set project 1 as active when works section becomes active
  useEffect(() => {
    if (isActive && activeIndex === null && works.length > 0) {
      setActiveIndex(0);
    }
  }, [isActive, activeIndex, works.length]);

  // Track last values to prevent unnecessary callback calls
  const lastActiveIndexRef = useRef<number | null>(null);
  const lastPositionRef = useRef<number>(0);

  // Notify parent when last work is active and calculate its position
  useEffect(() => {
    if (works.length === 0) return;
    const lastWorkIndex = works.length - 1;
    const isLastWorkActive = activeIndex === lastWorkIndex;
    const wasLastWorkActive = lastActiveIndexRef.current === lastWorkIndex;
    
    // Only proceed if state actually changed
    if (isLastWorkActive === wasLastWorkActive && isLastWorkActive) {
      // Still active - check if position changed significantly
      if (workRefs.current[lastWorkIndex]) {
        const lastWorkRef = workRefs.current[lastWorkIndex];
        if (lastWorkRef) {
          const rect = lastWorkRef.getBoundingClientRect();
          const workCenterY = rect.top + rect.height / 2;
          const scrollY = window.scrollY;
          const workCenterPosition = workCenterY + scrollY;
          
          // Only call callback if position changed significantly (avoid micro-updates)
          if (Math.abs(workCenterPosition - lastPositionRef.current) > 5) {
            lastPositionRef.current = workCenterPosition;
            if (onLastWorkActive) {
              onLastWorkActive(true, workCenterPosition);
            }
          }
        }
      }
      return; // No state change, skip
    }
    
    // State changed - update accordingly
    if (isLastWorkActive && onLastWorkActive && workRefs.current[lastWorkIndex]) {
      const lastWorkRef = workRefs.current[lastWorkIndex];
      if (lastWorkRef) {
        const rect = lastWorkRef.getBoundingClientRect();
        const workCenterY = rect.top + rect.height / 2;
        const scrollY = window.scrollY;
        const workCenterPosition = workCenterY + scrollY;
        
        lastActiveIndexRef.current = lastWorkIndex;
        lastPositionRef.current = workCenterPosition;
        onLastWorkActive(true, workCenterPosition);
      }
    } else if (onLastWorkActive && wasLastWorkActive) {
      // Was active, now not active
      lastActiveIndexRef.current = null;
      lastPositionRef.current = 0;
      onLastWorkActive(false, 0);
    }
  }, [activeIndex, onLastWorkActive, works.length]);

  const handleWorkClick = (workId: string, e: React.MouseEvent, workIndex: number) => {
    // Prevent navigation if clicking on the "view" link (it has its own Link)
    if ((e.target as HTMLElement).closest('.work-view-link')) {
      return;
    }
    
    // Capture the clicked work item's position and size for morph transition
    const workItem = workRefs.current[workIndex];
    const thumbnail = workItem?.querySelector('.work-thumbnail') as HTMLImageElement;
    
    if (workItem && thumbnail) {
      const thumbnailRect = thumbnail.getBoundingClientRect();
      const work = works[workIndex];
      const sourceImage = portraitThumbnails[workId] || work.thumbnail || work.image;
      
      // Pass transition data via location state
      navigate(`/works/${workId}`, {
        state: {
          transition: {
            type: 'morph',
            sourceRect: {
              x: thumbnailRect.left,
              y: thumbnailRect.top,
              width: thumbnailRect.width,
              height: thumbnailRect.height,
            },
            sourceImage: sourceImage,
            workId: workId,
          }
        }
      });
    } else {
      // Fallback: navigate without transition data
      navigate(`/works/${workId}`);
    }
  };

  return (
    <section 
      ref={(node: HTMLElement | null) => {
        galleryRef.current = node as HTMLDivElement | null;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as any).current = node;
        }
      }}
      className={`works-gallery ${isActive ? 'active' : ''}`}
    >
      <div className="works-container">
        {works.map((work, index) => (
          <motion.div
            key={work.id}
            ref={(el) => {
              workRefs.current[index] = el;
            }}
            className={`work-item ${index === activeIndex ? 'active' : ''}`}
            onClick={(e) => handleWorkClick(work.id, e, index)}
            style={{ cursor: 'pointer' }}
            animate={{
              opacity: index === activeIndex ? 1 : 0.4,
              scale: index === activeIndex ? 1 : 0.95,
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="work-content">
              <div className="work-title-section">
                <span className="work-number">{work.number}.</span>
                <span className="work-title">{work.title}</span>
              </div>
              
              <div className="work-image-container">
                {index === activeIndex && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  >
                    <LazyImage
                      src={portraitThumbnails[work.id] || work.thumbnail || work.image}
                      alt={work.title}
                      responsive
                      widths={[250, 320, 480, 640]}
                      className="work-thumbnail"
                    />
                  </motion.div>
                )}
              </div>
              
              <Link to={`/works/${work.id}`} className="work-view-link">
                view
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
});

WorksGallery.displayName = 'WorksGallery';

export default WorksGallery;
