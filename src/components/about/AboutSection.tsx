import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { getArtistInfo } from '@/utils/cms/service';
import type { ArtistInfo } from '@/types/cms';
import mahaMohanImage from '@/assets/media/Other/Maha-Mohan.jpg';
import '@/styles/about.css';

interface AboutSectionProps {
  isVisible?: boolean;
  fadeInProgress?: number; // 0-1: 0 = overlay off screen, 1 = overlay fully visible
}

export default function AboutSection({ isVisible = false, fadeInProgress = 0 }: AboutSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const [artistInfo, setArtistInfo] = useState<ArtistInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArtistInfo() {
      try {
        const data = await getArtistInfo();
        setArtistInfo(data);
      } catch (error) {
        console.error('Failed to load artist info:', error);
      } finally {
        setLoading(false);
      }
    }

    loadArtistInfo();
  }, []);

  // Overlay slides up: 0 = off bottom (translateY 100%), 1 = fully covering (translateY 0)
  const overlayProgress = fadeInProgress;
  // Content fades in only once background is visible (e.g. after overlay > 40%)
  const contentStartsAt = 0.4;
  const contentOpacity = overlayProgress <= contentStartsAt
    ? 0
    : Math.min(1, (overlayProgress - contentStartsAt) / (1 - contentStartsAt));

  return (
    <section
      className="about-section"
      style={{
        display: 'block',
        pointerEvents: isVisible && overlayProgress > 0.5 ? 'auto' : 'none',
      }}
      aria-hidden={overlayProgress < 0.01}
    >
      {/* Solid background overlay - driven 1:1 by scroll for one swift movement (no tween lag) */}
      <div
        className="about-section-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#561D3C',
          zIndex: 1,
          transform: `translateY(${(1 - overlayProgress) * 100}%)`,
        }}
      />

      {/* Content - fades in only once overlay is visible */}
      {loading ? (
        <div className="about-loading" style={{ zIndex: 2, position: 'relative' }}>
          Loading...
        </div>
      ) : (
        <motion.div
          className="about-section-content"
          initial={prefersReducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: contentOpacity }}
          transition={{
            duration: 0.6,
            ease: [0.4, 0, 0.2, 1],
            delay: prefersReducedMotion ? 0 : 0.15,
          }}
          style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            height: '100%',
            pointerEvents: contentOpacity > 0 ? 'auto' : 'none',
          }}
        >
          {/* Two equal columns: image left, name + info + get in touch right */}
          <div className="about-content-column">
            <div className="about-image-column">
              <img
                src={mahaMohanImage}
                alt="Maha Mohan"
                className="about-portrait-image"
              />
            </div>
            <div className="about-text-column">
              <p className="about-name">MAHA MOHAN</p>
              <div className="about-info-block">
                <h2 className="about-info-heading">/INFO</h2>
                <div className="about-info-text">
                  <p className="about-intro">
                    Maha is an artist, architect & writer from Madurai, based in New York City.
                  </p>
                  <p className="about-description">
                    Her work is a conversation thread across time, memory, and selfhood, holding both
                    the childhood longings that were never met and the present desire for care,
                    intimacy, and emotional resonance.
                  </p>
                </div>
                <div className="about-info-links">
                  <a href={artistInfo?.artistStatement?.url || '#'} className="about-link">
                    Artist Statement
                  </a>
                  <a href="#" className="about-link">
                    Narrative Bio
                  </a>
                  <a href={artistInfo?.resume?.url || '#'} className="about-link">
                    CV
                  </a>
                </div>
              </div>
              <div className="about-get-in-touch-block">
                <h2 className="about-get-in-touch-heading">/GET IN TOUCH</h2>
                <div className="about-get-in-touch-links">
                  {artistInfo?.socials?.map((social) => (
                    <a
                      key={social.platform}
                      href={social.url}
                      className="about-link"
                      target={social.url.startsWith('mailto:') ? undefined : '_blank'}
                      rel={social.url.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                    >
                      {social.platform}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
}
