import { useState } from 'react';
import { motion } from 'framer-motion';
import { AnimatedContainer } from '@/components/animations/AnimatedContainer';
import { AnimatedImage } from '@/components/animations/AnimatedImage';

/**
 * Playground component for testing Motion.dev animations
 */
export default function AnimationTest() {
  const [stagger, setStagger] = useState(false);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Animation Test Playground</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <button onClick={() => setStagger(!stagger)}>
          Toggle Stagger: {stagger ? 'ON' : 'OFF'}
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Fade In Animation</h3>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            padding: '1rem',
            background: '#f0f0f0',
            borderRadius: '8px',
          }}
        >
          This div fades in
        </motion.div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Scale Animation</h3>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          style={{
            padding: '1rem',
            background: '#e0e0e0',
            borderRadius: '8px',
            display: 'inline-block',
          }}
        >
          This div scales in
        </motion.div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Stagger Container</h3>
        <AnimatedContainer stagger={stagger} staggerDelay={0.1}>
          {[1, 2, 3, 4, 5].map((num) => (
            <div
              key={num}
              style={{
                padding: '1rem',
                margin: '0.5rem 0',
                background: '#d0d0d0',
                borderRadius: '4px',
              }}
            >
              Item {num}
            </div>
          ))}
        </AnimatedContainer>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Animated Image</h3>
        <div style={{ width: '300px', height: '200px', overflow: 'hidden' }}>
          <AnimatedImage
            src="https://via.placeholder.com/300x200"
            alt="Test image"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>
    </div>
  );
}

