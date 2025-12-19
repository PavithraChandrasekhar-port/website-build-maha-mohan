import { useEffect, useRef, useState, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { selectPortraitImage } from '@/utils/media/portraitSelector';
import { getWorkById } from '@/utils/works/workData';
import '@/styles/works.css';

// Import work images
import alchemyImg from '@/assets/media/Works/Alchemy/Divine Comedy/Divine Comedy.jpg';
import doIExistImg from '@/assets/media/Works/Do I exist/Do I exist.jpg';
import echoesImg from '@/assets/media/Works/Echoes of Longing/EOL.jpg';
import etherealBodiesImg from '@/assets/media/Works/Ethereal Bodies/Ethereal Bodies.jpg';
import iraiviImg from '@/assets/media/Works/Iraivi/Iraivi.jpg';
import melancholyImg from '@/assets/media/Works/Melancholy/01.jpg';
import nakedImg from '@/assets/media/Works/Naked/Naked.JPG';
import nightmareImg from '@/assets/media/Works/Nightmare/Nightmare.jpg';
import ofWebsImg from '@/assets/media/Works/Of Webs and Whispers/Of Webs and Whisper Interface 01.jpg';
import oruKudamImg from '@/assets/media/Works/Oru Kudam/01.jpg';
import paradoxImg from '@/assets/media/Works/The Paradox of Becoming/The Paradox of Becoming.jpeg';
import thiraiImg from '@/assets/media/Works/Thirai/Thirai.jpg';
import voicelessImg from '@/assets/media/Works/Voiceless Despair/Voiceless Despair.jpg';
import whisperImg from '@/assets/media/Works/Whisper/Whisper.jpg';

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
}

// Real works data from assets/media/Works folders
const mockWorks: Work[] = [
  {
    id: 'alchemy',
    number: 1,
    title: 'Alchemy',
    image: alchemyImg,
    thumbnail: alchemyImg,
  },
  {
    id: 'do-i-exist',
    number: 2,
    title: 'Do I Exist',
    image: doIExistImg,
    thumbnail: doIExistImg,
  },
  {
    id: 'echoes-of-longing',
    number: 3,
    title: 'Echoes of Longing',
    image: echoesImg,
    thumbnail: echoesImg,
  },
  {
    id: 'ethereal-bodies',
    number: 4,
    title: 'Ethereal Bodies',
    image: etherealBodiesImg,
    thumbnail: etherealBodiesImg,
  },
  {
    id: 'iraivi',
    number: 5,
    title: 'Iraivi',
    image: iraiviImg,
    thumbnail: iraiviImg,
  },
  {
    id: 'melancholy',
    number: 6,
    title: 'Melancholy',
    image: melancholyImg,
    thumbnail: melancholyImg,
  },
  {
    id: 'naked',
    number: 7,
    title: 'Naked',
    image: nakedImg,
    thumbnail: nakedImg,
  },
  {
    id: 'nightmare',
    number: 8,
    title: 'Nightmare',
    image: nightmareImg,
    thumbnail: nightmareImg,
  },
  {
    id: 'of-webs-and-whispers',
    number: 9,
    title: 'Of Webs and Whispers',
    image: ofWebsImg,
    thumbnail: ofWebsImg,
  },
  {
    id: 'oru-kudam',
    number: 10,
    title: 'Oru Kudam',
    image: oruKudamImg,
    thumbnail: oruKudamImg,
  },
  {
    id: 'the-paradox-of-becoming',
    number: 11,
    title: 'The Paradox of Becoming',
    image: paradoxImg,
    thumbnail: paradoxImg,
  },
  {
    id: 'thirai',
    number: 12,
    title: 'Thirai',
    image: thiraiImg,
    thumbnail: thiraiImg,
  },
  {
    id: 'voiceless-despair',
    number: 13,
    title: 'Voiceless Despair',
    image: voicelessImg,
    thumbnail: voicelessImg,
  },
  {
    id: 'whisper',
    number: 14,
    title: 'Whisper',
    image: whisperImg,
    thumbnail: whisperImg,
  },
];

const WorksGallery = forwardRef<HTMLElement, WorksGalleryProps>(
  ({ isActive, onWorksCountChange }, ref) => {
  const navigate = useNavigate();
  const galleryRef = useRef<HTMLDivElement>(null);
  const workRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(0); // Start with project 1 (index 0)
  const [portraitThumbnails, setPortraitThumbnails] = useState<Record<string, string>>({});

  // Notify parent of works count
  useEffect(() => {
    if (onWorksCountChange) {
      onWorksCountChange(mockWorks.length);
    }
  }, [onWorksCountChange]);

  // Load portrait thumbnails for each work
  useEffect(() => {
    const loadPortraitThumbnails = async () => {
      const thumbnails: Record<string, string> = {};
      
      for (const work of mockWorks) {
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
  }, []);

  useEffect(() => {
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
  }, []);

  // Set project 1 as active when works section becomes active
  useEffect(() => {
    if (isActive && activeIndex === null) {
      setActiveIndex(0); // Project 1 (Alchemy)
    }
  }, [isActive, activeIndex]);

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
      const work = mockWorks[workIndex];
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
        {mockWorks.map((work, index) => (
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
                  <motion.img 
                  src={portraitThumbnails[work.id] || work.thumbnail || work.image} 
                  alt={work.title}
                  loading="lazy"
                  className="work-thumbnail"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                />
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
