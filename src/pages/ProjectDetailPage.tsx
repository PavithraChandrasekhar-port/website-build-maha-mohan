import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProject } from '@/utils/cms/service';
import type { Project } from '@/types/cms';
import { LazyImage } from '@/components/media/LazyImage';
import { LazyVideo } from '@/components/media/LazyVideo';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProject() {
      if (!id) return;
      
      try {
        const data = await getProject(id);
        setProject(data);
      } catch (error) {
        console.error('Failed to load project:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [id]);

  if (loading) {
    return <div>Loading project...</div>;
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <div>
      <h1>{project.name}</h1>
      <p>{project.shortDescription}</p>
      <p>Studio: {project.studio}</p>
      <p>Date: {new Date(project.date).toLocaleDateString()}</p>
      
      <div style={{ display: 'grid', gap: '2rem', marginTop: '2rem' }}>
        {project.media.map((item) => (
          <div key={item.id}>
            {item.type === 'image' ? (
              <LazyImage
                src={item.url}
                alt={item.alt || item.caption || ''}
                responsive
                widths={[640, 768, 1024, 1280, 1920]}
              />
            ) : (
              <LazyVideo
                src={item.url}
                poster={item.thumbnail}
                autoplay
                loop
                muted
              />
            )}
            {item.caption && <p>{item.caption}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

