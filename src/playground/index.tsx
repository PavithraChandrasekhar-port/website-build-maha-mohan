import { useState } from 'react';
import ShaderTest from './ShaderTest';
import AnimationTest from './AnimationTest';
import MediaTest from './MediaTest';

type PlaygroundTab = 'shader' | 'animation' | 'media';

/**
 * Main playground component with tab navigation
 */
export default function Playground() {
  const [activeTab, setActiveTab] = useState<PlaygroundTab>('shader');

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <div style={{ 
        padding: '1rem', 
        borderBottom: '1px solid #ccc',
        display: 'flex',
        gap: '1rem'
      }}>
        <button 
          onClick={() => setActiveTab('shader')}
          style={{ 
            padding: '0.5rem 1rem',
            background: activeTab === 'shader' ? '#007bff' : '#f0f0f0',
            color: activeTab === 'shader' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Shader Test
        </button>
        <button 
          onClick={() => setActiveTab('animation')}
          style={{ 
            padding: '0.5rem 1rem',
            background: activeTab === 'animation' ? '#007bff' : '#f0f0f0',
            color: activeTab === 'animation' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Animation Test
        </button>
        <button 
          onClick={() => setActiveTab('media')}
          style={{ 
            padding: '0.5rem 1rem',
            background: activeTab === 'media' ? '#007bff' : '#f0f0f0',
            color: activeTab === 'media' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Media Test
        </button>
      </div>

      <div>
        {activeTab === 'shader' && <ShaderTest />}
        {activeTab === 'animation' && <AnimationTest />}
        {activeTab === 'media' && <MediaTest />}
      </div>
    </div>
  );
}

