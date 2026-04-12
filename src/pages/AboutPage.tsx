import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { getArtistInfo } from '@/utils/cms/service';
import type { ArtistInfo } from '@/types/cms';
import WorksNavigation from '@/components/navigation/WorksNavigation';
import mahaMohanImage from '@/assets/media/Other/Maha-Mohan.jpg';
import '@/styles/about.css';

export default function AboutPage() {
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

  if (loading) {
    return (
      <div className="about-page">
        <div className="about-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="about-page">
      <WorksNavigation isVisible={true} activeSection="about" />

      <motion.div
        className="about-content-column about-page-column"
        initial={prefersReducedMotion ? {} : { opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
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
                Her work is a conversation thread across time, memory, and selfhood, holding both the childhood longings that were never met and the present desire for care, intimacy, and emotional resonance.
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
      </motion.div>
    </div>
  );
}
