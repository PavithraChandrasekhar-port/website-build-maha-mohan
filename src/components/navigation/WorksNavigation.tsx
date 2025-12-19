import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import '@/styles/navigation.css';

interface WorksNavigationProps {
  isVisible: boolean;
  activeSection?: 'home' | 'works'; // Active section based on scroll
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
  { path: '/studio', label: 'STUDIO' },
  { path: '/about', label: 'ABOUT' },
];

export default function WorksNavigation({ isVisible, activeSection }: WorksNavigationProps) {
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
      
      if (item.path === '/') {
        // Scroll to top (home/landing section)
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      } else if (item.path === '/works') {
        // Scroll to works section
        const viewportHeight = window.innerHeight;
        const worksStartPosition = viewportHeight * 0.3; // Works section starts at 30vh
        window.scrollTo({
          top: worksStartPosition,
          behavior: 'smooth'
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

