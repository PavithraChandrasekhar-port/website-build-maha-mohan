import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { LazyImage } from '@/components/media/LazyImage';
import '@/styles/printed-matter.css';
import printedMatterData from '@/data/printed-matter.json';

// Import images from various projects/works for printed matter
import alchemyImg1 from '@/assets/media/Works/Alchemy/Divine Comedy/Divine Comedy.jpg';
import alchemyImg2 from '@/assets/media/Works/Alchemy/Once Human/Once Human.jpg';
import alchemyImg3 from '@/assets/media/Works/Alchemy/Tethered Secrets/Tethered Secrets.jpg';
import echoesImg1 from '@/assets/media/Works/Echoes of Longing/EOL.jpg';
import echoesImg2 from '@/assets/media/Works/Echoes of Longing/01 Maha Mohan.jpg';
import echoesImg3 from '@/assets/media/Works/Echoes of Longing/02 Edited.jpg';
import etherealBodiesImg1 from '@/assets/media/Works/Ethereal Bodies/Ethereal Bodies.jpg';
import etherealBodiesImg2 from '@/assets/media/Works/Ethereal Bodies/EB 1.jpg';
import iraiviImg1 from '@/assets/media/Works/Iraivi/Iraivi.jpg';
import iraiviImg2 from '@/assets/media/Works/Iraivi/Fragments.jpg';
import paradoxImg1 from '@/assets/media/Works/The Paradox of Becoming/The Paradox of Becoming.jpeg';
import paradoxImg2 from '@/assets/media/Works/The Paradox of Becoming/01.jpeg';
import paradoxImg3 from '@/assets/media/Works/The Paradox of Becoming/02.jpeg';
import ofWebsImg1 from '@/assets/media/Works/Of Webs and Whispers/Of Webs and Whisper Interface 01.jpg';
import ofWebsImg2 from '@/assets/media/Works/Of Webs and Whispers/Detail.jpg';
import oruKudamImg1 from '@/assets/media/Works/Oru Kudam/01.jpg';
import oruKudamImg2 from '@/assets/media/Works/Oru Kudam/02.jpg';
import melancholyImg1 from '@/assets/media/Works/Melancholy/01.jpg';
import melancholyImg2 from '@/assets/media/Works/Melancholy/02.jpg';
import nakedImg from '@/assets/media/Works/Naked/Naked.JPG';
import nightmareImg from '@/assets/media/Works/Nightmare/Nightmare.jpg';
import thiraiImg from '@/assets/media/Works/Thirai/Thirai.jpg';
import voicelessImg from '@/assets/media/Works/Voiceless Despair/Voiceless Despair.jpg';

interface PrintedMatterItem {
  id: string;
  image: string;
  title?: string;
}

interface PrintedMatterSectionProps {
  isVisible?: boolean;
  scrollProgress?: number;
  fadeOutProgress?: number; // 0-1: 0 = fully visible, 1 = fully faded out
}

interface ImagePosition {
  top: number;
  left: number;
  width: number;
  rotation: number;
  slideDirection: 'left' | 'right' | 'top' | 'bottom';
}

// Image mapping for imports - using images from various projects
const imageMap: Record<string, string> = {
  'alchemy1': alchemyImg1,
  'alchemy2': alchemyImg2,
  'alchemy3': alchemyImg3,
  'echoes1': echoesImg1,
  'echoes2': echoesImg2,
  'echoes3': echoesImg3,
  'etherealBodies1': etherealBodiesImg1,
  'etherealBodies2': etherealBodiesImg2,
  'iraivi1': iraiviImg1,
  'iraivi2': iraiviImg2,
  'paradox1': paradoxImg1,
  'paradox2': paradoxImg2,
  'paradox3': paradoxImg3,
  'ofWebs1': ofWebsImg1,
  'ofWebs2': ofWebsImg2,
  'oruKudam1': oruKudamImg1,
  'oruKudam2': oruKudamImg2,
  'melancholy1': melancholyImg1,
  'melancholy2': melancholyImg2,
  'naked': nakedImg,
  'nightmare': nightmareImg,
  'thirai': thiraiImg,
  'voiceless': voicelessImg,
};

// Seeded random number generator for consistent layout
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

// Linear interpolation function for smooth mouse movement
function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

// Helper function to check spacing between images - Cosmos-style breathing room
function hasEnoughSpace(
  newPos: { left: number; top: number; width: number },
  existingPositions: ImagePosition[],
  minDistance: number
): boolean {
  return existingPositions.every(pos => {
    const dx = (newPos.left + newPos.width / 2) - (pos.left + pos.width / 2);
    const dy = (newPos.top + newPos.width / 2) - (pos.top + pos.width / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist > minDistance;
  });
}

// Top-left reserve for nav menu: no images placed here; bottom-left and center-left remain available
const NAV_RESERVE_LEFT_PX = 200;
const NAV_RESERVE_TOP_RATIO = 0.22; // 22% of container height
// Maximum width for printed matter images (keeps items compact)
const MAX_ITEM_WIDTH_PX = 140;

function overlapsTopLeftReserve(
  left: number,
  top: number,
  width: number,
  reserveLeft: number,
  reserveTop: number
): boolean {
  const right = left + width;
  const bottom = top + width; // use width as height for overlap check (square approx)
  return left < reserveLeft && right > 0 && top < reserveTop && bottom > 0;
}

// Manual position overrides for specific items (itemId -> {top, left, width})
// Positions are stored as percentages (0-100) for responsive layout
// Reference viewport: ~1162px width, ~1229px height (150vh)
const manualPositions: Record<string, { topPercent: number; leftPercent: number; widthPercent?: number; maxWidthPx?: number }> = {
  '5': { topPercent: (200 / 1229) * 100, leftPercent: (834 / 1162) * 100, maxWidthPx: 156 }, // ~16.3% top, slightly larger
  '11': { topPercent: (235 / 1229) * 100, leftPercent: (697 / 1162) * 100 }, // ~19.1% top, ~60.0% left
  '8': { topPercent: (687 / 1229) * 100, leftPercent: (887 / 1162) * 100 }, // ~55.9% top, ~76.3% left
  '2': { topPercent: (805 / 1229) * 100, leftPercent: (1015 / 1162) * 100 }, // ~65.5% top, ~87.4% left
  '4': { topPercent: (758 / 1229) * 100, leftPercent: (646 / 1162) * 100 }, // ~61.6% top, ~55.6% left
  '10': { topPercent: (280 / 1229) * 100, leftPercent: (196 / 1162) * 100 }, // ~22.8% top, ~16.9% left
  '12': { topPercent: (366 / 1229) * 100, leftPercent: (657 / 1162) * 100 }, // ~29.8% top, ~56.5% left
  '3': { topPercent: (464 / 1229) * 100, leftPercent: (892 / 1162) * 100 }, // ~37.7% top, ~76.8% left
  '6': { topPercent: (242 / 1229) * 100, leftPercent: (290 / 1162) * 100 }, // ~19.7% top, ~25.0% left
  '9': { topPercent: (793 / 1229) * 100, leftPercent: (567 / 1162) * 100 }, // ~64.5% top, ~48.8% left
};

// Cosmos-inspired organic layout function - completely redesigned for better balance
function generateOrganicLayout(
  containerWidth: number,
  containerHeight: number,
  count: number,
  items: PrintedMatterItem[]
): ImagePosition[] {
  const positions: ImagePosition[] = [];
  const rng = new SeededRandom(12345); // Fixed seed ensures same layout every time
  
  // Refined size variation: scale with viewport width (vw) so images expand/shrink and fill/fit the page
  const baseSizeUnit = Math.min(containerWidth, window.innerWidth) / 10; // ~10vw as base unit
  const sizes = {
    small: baseSizeUnit * 0.95,   // ~9.5% of viewport width
    medium: baseSizeUnit * 1.38,  // ~13.8% of viewport width
    large: baseSizeUnit * 1.9,    // ~19% of viewport width
    xlarge: baseSizeUnit * 2.58,  // ~25.8% of viewport width (Hero focal pieces)
  };
  
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  // Responsive title reserve radius - scales with viewport
  const titleReserveRadius = Math.min(containerWidth, containerHeight) * 0.21; // ~21% of smaller dimension

  // Top-left reserve for nav menu (bottom-left and center-left can still hold images)
  const navReserveLeft = Math.min(NAV_RESERVE_LEFT_PX, containerWidth * 0.18);
  const navReserveTop = containerHeight * NAV_RESERVE_TOP_RATIO;
  
  // Define vertical sections with proper margins - responsive
  const topMargin = containerHeight * 0.12; // 12% of container height
  const bottomMargin = containerHeight * 0.12; // 12% of container height
  const usableHeight = containerHeight - topMargin - bottomMargin;
  
  // Create a grid-like structure for balanced placement (4 columns x 3 rows)
  const cols = 4;
  const rows = 3;
  const colWidth = containerWidth / cols;
  const rowHeight = usableHeight / rows;
  
  // Define which cells to use (avoid center for title)
  const cells: Array<{col: number, row: number, sizeCategory: 'small' | 'medium' | 'large' | 'xlarge'}> = [
    // Top row
    { col: 0, row: 0, sizeCategory: 'large' },
    { col: 1, row: 0, sizeCategory: 'medium' },
    { col: 2, row: 0, sizeCategory: 'small' },
    { col: 3, row: 0, sizeCategory: 'xlarge' },
    
    // Middle row - avoid center cells
    { col: 0, row: 1, sizeCategory: 'medium' },
    { col: 3, row: 1, sizeCategory: 'large' },
    
    // Bottom row
    { col: 0, row: 2, sizeCategory: 'small' },
    { col: 1, row: 2, sizeCategory: 'xlarge' },
    { col: 2, row: 2, sizeCategory: 'medium' },
    { col: 3, row: 2, sizeCategory: 'small' },
    
    // Additional scattered items for organic feel
    { col: 0.3, row: 0.5, sizeCategory: 'small' },
    { col: 2.7, row: 0.4, sizeCategory: 'medium' },
    { col: 0.5, row: 1.6, sizeCategory: 'small' },
    { col: 3.2, row: 1.5, sizeCategory: 'medium' },
    { col: 1.8, row: 2.3, sizeCategory: 'small' },
  ];
  
  // Shuffle cells for variety while maintaining balance
  const shuffledCells = [...cells];
  for (let i = shuffledCells.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [shuffledCells[i], shuffledCells[j]] = [shuffledCells[j], shuffledCells[i]];
  }
  
  // Place images based on the cell structure with organic offset
  for (let i = 0; i < Math.min(count, shuffledCells.length); i++) {
    const cell = shuffledCells[i];
    const currentItem = items[i];
    
    // Check if this item has a manual position override
    if (currentItem && manualPositions[currentItem.id]) {
      const manualPos = manualPositions[currentItem.id];
      let baseWidth = sizes[cell.sizeCategory];
      
      // Reduce "Alchemy - Once Human" by responsive amount if it's xlarge
      if (currentItem.title === "Alchemy - Once Human" && cell.sizeCategory === 'xlarge') {
        const reduction = baseSizeUnit * 1.29; // ~12.9% of viewport width reduction
        baseWidth = Math.max(sizes.small, baseWidth - reduction);
      }
      
      const variation = baseWidth * 0.15;
      let width = manualPos.widthPercent 
        ? (manualPos.widthPercent / 100) * containerWidth 
        : (baseWidth + (rng.next() - 0.5) * variation);
      const maxW = manualPos.maxWidthPx ?? MAX_ITEM_WIDTH_PX;
      width = Math.min(width, maxW);
      
      // Convert percentages to pixel values based on container dimensions
      let top = (manualPos.topPercent / 100) * containerHeight;
      let left = (manualPos.leftPercent / 100) * containerWidth;

      // Nudge out of top-left nav reserve (bottom-left and center-left stay)
      if (overlapsTopLeftReserve(left, top, width, navReserveLeft, navReserveTop)) {
        if (left < navReserveLeft) left = navReserveLeft;
        if (top < navReserveTop) top = navReserveTop;
      }
      
      // Determine slide direction
      const itemCenterX = left + width / 2;
      const itemCenterY = top + width / 2;
      const dx = itemCenterX - centerX;
      const dy = itemCenterY - centerY;
      let slideDirection: 'left' | 'right' | 'top' | 'bottom';
      if (Math.abs(dx) > Math.abs(dy)) {
        slideDirection = dx > 0 ? 'right' : 'left';
      } else {
        slideDirection = dy > 0 ? 'bottom' : 'top';
      }
      
      positions.push({
        top,
        left,
        width,
        rotation: 0,
        slideDirection,
      });
      continue; // Skip the automatic placement for this item
    }
    
    let attempts = 0;
    let position: ImagePosition | null = null;
    
    while (!position && attempts < 100) {
      // Get size based on category with small variation
      let baseWidth = sizes[cell.sizeCategory];
      
      // Reduce "Alchemy - Once Human" by responsive amount if it's xlarge
      if (currentItem && currentItem.title === "Alchemy - Once Human" && cell.sizeCategory === 'xlarge') {
        const reduction = baseSizeUnit * 1.29; // ~12.9% of viewport width reduction
        baseWidth = Math.max(sizes.small, baseWidth - reduction);
      }
      
      const variation = baseWidth * 0.15;
      const width = Math.min(baseWidth + (rng.next() - 0.5) * variation, MAX_ITEM_WIDTH_PX);
      
      // Calculate base position from cell
      const baseCellX = cell.col * colWidth;
      const baseCellY = cell.row * rowHeight + topMargin;
      
      // Add organic offset within cell (but not too much) - reduced for better balance
      const offsetX = (rng.next() - 0.5) * colWidth * 0.4; // Reduced from 0.6 for less spread
      const offsetY = (rng.next() - 0.5) * rowHeight * 0.4; // Reduced from 0.6 for less spread
      
      let left = baseCellX + offsetX;
      let top = baseCellY + offsetY;
      
      // Clamp to boundaries
      left = Math.max(0, Math.min(containerWidth - width, left));
      top = Math.max(topMargin, Math.min(containerHeight - bottomMargin - width, top));
      // Keep top-left clear for nav: nudge right/down if in reserve
      if (left < navReserveLeft && top < navReserveTop) {
        left = Math.max(left, navReserveLeft);
        top = Math.max(top, navReserveTop);
      }
      
      const itemCenterX = left + width / 2;
      const itemCenterY = top + width / 2;
      
      // Check distance from center (avoid title area)
      const distanceFromCenter = Math.sqrt(
        Math.pow(itemCenterX - centerX, 2) + Math.pow(itemCenterY - centerY, 2)
      );
      
      if (distanceFromCenter > titleReserveRadius) {
        // No images in top-left reserve (nav menu); bottom-left and center-left allowed
        if (overlapsTopLeftReserve(left, top, width, navReserveLeft, navReserveTop)) {
          attempts++;
          continue;
        }
        // Dynamic spacing based on image size - increased for better balance
        const minSpacing = width * 0.5; // Increased from 0.4 to prevent clutter
        
        // Check spacing against both existing positions and manual positions
        const allPositions = [...positions];
        if (hasEnoughSpace({ left, top, width }, allPositions, minSpacing)) {
          const rotation = 0; // No rotation - images appear straight
          
          // Determine slide direction
          const dx = itemCenterX - centerX;
          const dy = itemCenterY - centerY;
          let slideDirection: 'left' | 'right' | 'top' | 'bottom';
          if (Math.abs(dx) > Math.abs(dy)) {
            slideDirection = dx > 0 ? 'right' : 'left';
          } else {
            slideDirection = dy > 0 ? 'bottom' : 'top';
          }
          
          position = {
            top,
            left,
            width,
            rotation,
            slideDirection,
          };
        }
      }
      attempts++;
    }
    
    if (position) {
      positions.push(position);
    }
  }
  
  return positions;
}

export default function PrintedMatterSection({ isVisible = false, scrollProgress: _scrollProgress = 0, fadeOutProgress = 0 }: PrintedMatterSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [printedMatterItems, setPrintedMatterItems] = useState<PrintedMatterItem[]>([]);
  const [positions, setPositions] = useState<ImagePosition[]>([]);
  const [selectedImage, setSelectedImage] = useState<PrintedMatterItem | null>(null);
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const [currentMousePosition, setCurrentMousePosition] = useState({ x: 0, y: 0 });
  
  // Refs for smooth mouse interpolation (Cosmos-style)
  const targetMousePositionRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  
  // Load printed matter items from JSON
  useEffect(() => {
    try {
      const data = printedMatterData as { items: Array<{ id: string; image: string; title?: string }> };
      const items = (data.items || []).map(item => {
        const imagePath = imageMap[item.image];
        if (!imagePath) {
          console.warn(`Image not found for key: ${item.image}`);
        }
        return {
          id: item.id,
          image: imagePath || '',
          title: item.title,
        };
      }).filter(item => item.image);
      
      // Display 7-8 images within the existing layout
      const targetCount = Math.min(8, Math.max(7, items.length));
      const limitedItems = items.slice(0, targetCount);
      setPrintedMatterItems(limitedItems);
    } catch (error) {
      console.error('Failed to load printed matter data:', error);
      setPrintedMatterItems([]);
    }
  }, []);

  // Initialize positions when items are loaded
  useEffect(() => {
    if (printedMatterItems.length === 0) return;
    
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight * 1.5;
    
    const itemsToUse = printedMatterItems;
    
    const newPositions = generateOrganicLayout(
      containerWidth,
      containerHeight,
      itemsToUse.length,
      itemsToUse
    );
    
    setPositions(newPositions);
  }, [printedMatterItems.length]);

  // Show all items when section is visible
  useEffect(() => {
    if (isVisible && printedMatterItems.length > 0) {
      const allItemIds = new Set(printedMatterItems.map(item => item.id));
      setVisibleItems(allItemIds);
    } else if (!isVisible) {
      setVisibleItems(new Set());
    }
  }, [isVisible, printedMatterItems]);

  // Cosmos-style smooth mouse movement with requestAnimationFrame and lerp
  useEffect(() => {
    if (!isVisible || prefersReducedMotion) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      targetMousePositionRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    // Smooth interpolation loop using requestAnimationFrame
    const animate = () => {
      const lerpFactor = 0.15; // Smoothness factor
      
      setCurrentMousePosition(prev => {
        const newX = lerp(prev.x, targetMousePositionRef.current.x, lerpFactor);
        const newY = lerp(prev.y, targetMousePositionRef.current.y, lerpFactor);
        return { x: newX, y: newY };
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isVisible, prefersReducedMotion]);

  const handleImageClick = (item: PrintedMatterItem) => {
    setSelectedImage(item);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
    document.body.style.overflow = '';
  };

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage) {
        handleCloseModal();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedImage]);

  return (
    <>
      <motion.section
        ref={containerRef}
        className={`printed-matter-section ${isVisible ? 'visible' : ''}`}
        initial={prefersReducedMotion ? {} : { opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        style={{
          display: 'block',
          pointerEvents: isVisible ? 'auto' : 'none',
        }}
      >
        <div className="printed-matter-container">
          {positions.length === 0 ? (
            <div style={{ padding: '2rem', color: 'white' }}>Loading printed matter...</div>
          ) : (
            <div className="printed-matter-grid">
              <AnimatePresence>
                {printedMatterItems.map((item, index) => {
                  const position = positions[index];
                  const itemVisible = visibleItems.has(item.id) || prefersReducedMotion || isVisible;
                  
                  if (!position) return null;

                  // Calculate item center position
                  const itemCenterX = position.left + position.width / 2;
                  const itemCenterY = position.top + position.width / 2;
                  
                  // Enhanced Cosmos-style magnetic effect with quadratic falloff
                  const mouseX = currentMousePosition.x;
                  const mouseY = currentMousePosition.y;
                  const distanceX = mouseX - itemCenterX;
                  const distanceY = mouseY - itemCenterY;
                  const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
                  
                  // Enhanced magnetic parameters - visible magnetic pull
                  const maxMagneticDistance = 500; // Increased radius for more noticeable effect
                  const magneticForce = 0.4; // Increased for visible effect
                  
                  // Calculate magnetic translation with quadratic falloff
                  let magneticX = 0;
                  let magneticY = 0;
                  
                  if (!prefersReducedMotion && distance < maxMagneticDistance && distance > 0) {
                    // Quadratic falloff for more natural, organic feel
                    const normalizedDistance = distance / maxMagneticDistance;
                    const force = magneticForce * Math.pow(1 - normalizedDistance, 2);
                    magneticX = (distanceX / distance) * force * 40; // Increased multiplier for visible movement
                    magneticY = (distanceY / distance) * force * 40;
                  }
                  
                  // Scroll parallax - images move and fade as you scroll past printed matter
                  const scrollParallaxIntensity = 100;
                  const scrollParallaxX = fadeOutProgress * scrollParallaxIntensity * (index % 2 === 0 ? 1 : -1);
                  const scrollParallaxY = fadeOutProgress * scrollParallaxIntensity * (index % 3 === 0 ? 1 : -1);
                  
                  // Combine magnetic effect with scroll parallax
                  const finalParallaxX = magneticX + scrollParallaxX;
                  const finalParallaxY = magneticY + scrollParallaxY;
                  
                  // Fade out opacity based on scroll
                  const baseOpacity = itemVisible ? 1 : 0;
                  const fadeOutOpacity = baseOpacity * (1 - fadeOutProgress);
                  
                  // Staggered delay for initial reveal
                  const delay = prefersReducedMotion ? 0 : index * 0.05;

                  return (
                    <motion.div
                      key={item.id}
                      data-item-id={item.id}
                      className="printed-matter-item"
                      initial={prefersReducedMotion ? {} : { 
                        opacity: 0,
                        scale: 0.8 
                      }}
                      animate={{
                        opacity: fadeOutOpacity,
                        x: itemVisible ? finalParallaxX : 0,
                        y: itemVisible ? finalParallaxY : 0,
                        scale: itemVisible ? 1 : 0.8,
                        rotate: position.rotation, // Static rotation only
                      }}
                      exit={prefersReducedMotion ? {} : {
                        opacity: 0,
                        scale: 0.8,
                        transition: { duration: 1.5, ease: [0.4, 0, 0.2, 1] }
                      }}
                      transition={{
                        // Spring physics for magnetic movement - more responsive for visible effect
                        x: { type: "spring", stiffness: 150, damping: 12 },
                        y: { type: "spring", stiffness: 150, damping: 12 },
                        rotate: { type: "spring", stiffness: 100, damping: 10 },
                        // Spring for scale
                        scale: { type: "spring", stiffness: 200, damping: 20 },
                        // Smooth opacity
                        opacity: { duration: 0.4, ease: "easeOut" },
                        // Delay for staggered entrance
                        delay: delay,
                      }}
                      whileHover={prefersReducedMotion ? {} : {
                        scale: 1.05,
                        transition: { 
                          type: "spring",
                          stiffness: 300,
                          damping: 15
                        },
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (itemVisible) {
                          handleImageClick(item);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                        width: `${position.width}px`,
                        zIndex: 5,
                        pointerEvents: itemVisible ? 'auto' : 'none',
                      }}
                    >
                      <LazyImage
                        src={item.image}
                        alt={item.title || 'Printed matter'}
                        responsive
                        widths={[320, 480, 640, 768, 1024]}
                        style={{ 
                          pointerEvents: 'none',
                          width: '100%',
                          height: 'auto',
                          objectFit: 'contain',
                          display: 'block'
                        }}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Centered "PRINTED MATTER" Heading with Subtitle */}
          <motion.div
            className="printed-matter-heading-container"
            initial={prefersReducedMotion ? {} : { opacity: 0 }}
            animate={{ 
              opacity: isVisible ? 1 : 0,
            }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'fixed',
              top: '50vh',
              left: '50vw',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              pointerEvents: 'none',
              textAlign: 'center',
              width: 'auto',
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <h2 className="printed-matter-heading">
              PRINTED MATTER
            </h2>
            <p className="printed-matter-subtitle">
              A collection of print making and publications
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Modal/Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="printed-matter-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleCloseModal}
          >
            <motion.div
              className="printed-matter-modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="printed-matter-modal-close"
                onClick={handleCloseModal}
                aria-label="Close"
              >
                ×
              </button>
              <LazyImage
                src={selectedImage.image}
                alt={selectedImage.title || 'Printed matter'}
                responsive
                widths={[640, 768, 1024, 1280, 1920]}
              />
              {selectedImage.title && (
                <div className="printed-matter-modal-title">{selectedImage.title}</div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
