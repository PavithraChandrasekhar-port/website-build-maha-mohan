import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects } from '@/utils/cms/service';
import type { Project } from '@/types/cms';
import { LazyImage } from '@/components/media/LazyImage';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  if (loading) {
    return <div>Loading projects...</div>;
  }

  return (
    <div>
      <h1>Projects</h1>
      <div style={{ display: 'grid', gap: '2rem' }}>
        {projects.map((project) => (
          <Link key={project.id} to={`/projects/${project.id}`}>
            <article>
              <LazyImage
                src={project.coverImage.url}
                alt={project.imageAltText}
                responsive
                widths={[640, 768, 1024, 1280]}
              />
              <h2>{project.name}</h2>
              <p>{project.shortDescription}</p>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}

