import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import '@/styles/navigation.css';

interface WorksNavigationProps {
  isVisible: boolean;
  activeSection?: 'home' | 'works' | 'exhibits' | 'printed-matter' | 'about'; // Active section based on scroll
  worksEndPosition?: number; // Works section end position for scrolling
  lastWorkCenterPosition?: number; // Last work item center position for scrolling to exhibits
  exhibitsStartScroll?: number; // Scroll position when exhibits first appeared (for printed matter navigation)
  onNavSectionClick?: (section: 'home' | 'works' | 'exhibits' | 'printed-matter' | 'about') => void; // Called on click so nav can update immediately
}

interface NavItem {
  path: string;
  label: string;
  scrollTarget?: () => void; // Custom scroll handler
}

const navItems: NavItem[] = [
  { path: '/', label: 'HOME' },
  { path: '/works', label: 'WORKS' },
  { path: '/exhibits', label: 'EXHIBITS' },
  { path: '/printed-matter', label: 'PRINTED MATTER' },
  { path: '/about', label: 'ABOUT' },
];

// Module-level log to verify file is loaded

export default function WorksNavigation({ isVisible, activeSection, worksEndPosition = 0, lastWorkCenterPosition = 0, exhibitsStartScroll: _exhibitsStartScroll = 0, onNavSectionClick }: WorksNavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Don't show navigation on home page until works section is visible
  if (isHomePage && !isVisible) {
    return null;
  }

  // Determine active item based on route or scroll position
  const getActiveItem = (): string => {
    // On home page, use activeSection prop if provided (primary source)
    if (isHomePage && activeSection) {
      if (activeSection === 'home') return '/';
      if (activeSection === 'works') return '/works';
      if (activeSection === 'exhibits') return '/exhibits';
      if (activeSection === 'printed-matter') return '/printed-matter';
      if (activeSection === 'about') return '/about';
    }
    // On home page, if works section is visible but no activeSection provided, WORKS is active (fallback)
    if (isHomePage && isVisible && !activeSection) {
      return '/works';
    }
    // On home page, if works section is not visible, HOME is active
    if (isHomePage && !isVisible) {
      return '/';
    }
    // Otherwise, use current route
    return location.pathname;
  };

  const activePath = getActiveItem();

  const getItemState = (itemPath: string): 'hovered' | 'selected' | 'inactive' => {
    if (hoveredItem === itemPath) {
      return 'hovered';
    }
    if (activePath === itemPath) {
      return 'selected';
    }
    return 'inactive';
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => {
    // If on home page, handle scroll behavior
    if (isHomePage) {
      e.preventDefault();

      // Update active section immediately so nav highlights correctly
      const sectionFromPath: Record<string, 'home' | 'works' | 'exhibits' | 'printed-matter' | 'about'> = {
        '/': 'home',
        '/works': 'works',
        '/exhibits': 'exhibits',
        '/printed-matter': 'printed-matter',
        '/about': 'about',
      };
      const targetSection = sectionFromPath[item.path];
      if (targetSection !== undefined && onNavSectionClick) {
        onNavSectionClick(targetSection);
      }
      
      if (item.path === '/') {
        // Scroll to top (home/landing section)
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
        [100, 300, 500].forEach(delay => {
          setTimeout(() => window.dispatchEvent(new Event('scroll')), delay);
        });
      } else if (item.path === '/works') {
        // Scroll to works section - start at first visible item
        const viewportHeight = window.innerHeight;
        const worksStartPosition = viewportHeight; // Works section starts at 100vh (margin-top: 100vh)
        window.scrollTo({
          top: worksStartPosition,
          behavior: 'smooth'
        });
        [100, 300, 500, 800].forEach(delay => {
          setTimeout(() => window.dispatchEvent(new Event('scroll')), delay);
        });
      } else if (item.path === '/exhibits') {
        // Scroll to exhibits section (past last work item center)
        const viewportHeight = window.innerHeight;
        let targetPosition: number;
        
        if (lastWorkCenterPosition > 0) {
          // Use actual last work center position
          const delayThreshold = viewportHeight * 0.1; // 10vh delay
          const blurRange = viewportHeight * 0.3; // Blur range
          const exhibitsStart = delayThreshold + (blurRange * 0.3); // Exhibits start position
          targetPosition = lastWorkCenterPosition + exhibitsStart;
        } else if (worksEndPosition > 0) {
          // Fallback to works end position if last work position not available
          const delayThreshold = viewportHeight * 0.1;
          targetPosition = worksEndPosition + delayThreshold;
        } else {
          // Final fallback estimate
          const worksStartPosition = viewportHeight;
          const worksEstimatedEnd = worksStartPosition + (viewportHeight * 3); // 300vh
          targetPosition = worksEstimatedEnd + (viewportHeight * 0.2);
        }
        
        const scrollToExhibits = () => {
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
          
          [600, 1000, 1500].forEach(delay => {
            setTimeout(() => window.dispatchEvent(new Event('scroll')), delay);
          });
        };
        scrollToExhibits();
      } else if (item.path === '/printed-matter') {
        // Scroll to printed matter section - simplified calculation
        const viewportHeight = window.innerHeight;
        let targetPosition: number;
        
        // Calculate: exhibits end position + 100vh (printed matter trigger)
        if (lastWorkCenterPosition > 0) {
          const delayThreshold = viewportHeight * 0.1;
          const blurRange = viewportHeight * 0.3;
          const exhibitsStart = delayThreshold + (blurRange * 0.3);
          const scrollRange = viewportHeight * 2.0; // Match HomePage logic
          const exhibitsEnd = lastWorkCenterPosition + exhibitsStart + scrollRange;
          const printedMatterTrigger = viewportHeight * 1.0; // 100vh after exhibits ends
          targetPosition = exhibitsEnd + printedMatterTrigger + (viewportHeight * 0.15); // Add small buffer
        } else if (worksEndPosition > 0) {
          const delayThreshold = viewportHeight * 0.1;
          const blurRange = viewportHeight * 0.3;
          const exhibitsStart = delayThreshold + (blurRange * 0.3);
          const scrollRange = viewportHeight * 2.0;
          const exhibitsEnd = worksEndPosition + exhibitsStart + scrollRange;
          const printedMatterTrigger = viewportHeight * 1.0;
          targetPosition = exhibitsEnd + printedMatterTrigger + (viewportHeight * 0.15);
        } else {
          // Fallback estimate
          const worksStart = viewportHeight;
          const worksEnd = worksStart + (viewportHeight * 3);
          const delayThreshold = viewportHeight * 0.1;
          const blurRange = viewportHeight * 0.3;
          const exhibitsStart = delayThreshold + (blurRange * 0.3);
          const scrollRange = viewportHeight * 2.0;
          const exhibitsEnd = worksEnd + exhibitsStart + scrollRange;
          targetPosition = exhibitsEnd + viewportHeight * 1.15;
        }
        
        console.log('🖱️ Clicking printed matter, scrolling to:', Math.round(targetPosition));
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        [600, 1000, 1500].forEach(delay => {
          setTimeout(() => window.dispatchEvent(new Event('scroll')), delay);
        });
      } else if (item.path === '/about') {
        // Scroll to bottom so About overlay is in view (About shown immediately via onNavSectionClick)
        const viewportHeight = window.innerHeight;
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
        window.scrollTo({
          top: maxScroll,
          behavior: 'smooth'
        });
        [800, 1200, 1800].forEach(delay => {
          setTimeout(() => window.dispatchEvent(new Event('scroll')), delay);
        });
      } else {
        // For other routes, navigate normally
        navigate(item.path);
      }
    }
    // If not on home page, let Link handle navigation normally
  };

  return (
    <nav className="works-navigation">
      <ul className="works-nav-menu">
        {navItems.map((item) => {
          const state = getItemState(item.path);
          const isSelected = state === 'selected';
          const displayLabel = isSelected ? `/${item.label}` : item.label;

          return (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`nav-link ${state}`}
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={(e) => handleNavClick(e, item)}
              >
                {displayLabel}
              </Link>
        </li>
          );
        })}
      </ul>
    </nav>
  );
}

