import { LazyImage } from '@/components/media/LazyImage';
import { LazyVideo } from '@/components/media/LazyVideo';

/**
 * Playground component for testing media loading strategies
 */
export default function MediaTest() {
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Media Loading Test Playground</h2>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Lazy Loaded Images</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <div key={num} style={{ minHeight: '200px', background: '#f0f0f0' }}>
              <LazyImage
                src={`https://via.placeholder.com/400x300?text=Image+${num}`}
                alt={`Test image ${num}`}
                responsive
                widths={[400, 800, 1200]}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Lazy Loaded Video</h3>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <LazyVideo
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            poster="https://via.placeholder.com/800x450?text=Video+Poster"
            autoplay={false}
            loop
            muted
            controls
          />
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Responsive Image with Breakpoints</h3>
        <LazyImage
          src="https://via.placeholder.com/1920x1080?text=Responsive+Image"
          alt="Responsive test image"
          responsive
          widths={[640, 768, 1024, 1280, 1920]}
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
    </div>
  );
}

