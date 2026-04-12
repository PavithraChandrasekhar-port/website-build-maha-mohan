import { useState, useEffect } from 'react';
import WorksNavigation from '@/components/navigation/WorksNavigation';
import PrintedMatterSection from '@/components/printed-matter/PrintedMatterSection';

export default function PrintedMatterPage() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const maxScroll = document.documentElement.scrollHeight - viewportHeight;
      const progress = maxScroll > 0 ? Math.min(scrollY / maxScroll, 1.0) : 0;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <WorksNavigation 
        isVisible={true} 
        activeSection="printed-matter"
      />
      <PrintedMatterSection 
        isVisible={true}
        scrollProgress={scrollProgress}
      />
    </>
  );
}
