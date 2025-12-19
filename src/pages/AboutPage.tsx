import { useEffect, useState } from 'react';
import { getArtistInfo } from '@/utils/cms/service';
import type { ArtistInfo } from '@/types/cms';

export default function AboutPage() {
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
    return <div>Loading...</div>;
  }

  if (!artistInfo) {
    return <div>Artist information not available</div>;
  }

  return (
    <div>
      <h1>{artistInfo.name}</h1>
      <p>{artistInfo.introduction}</p>
      
      <div>
        <h2>Social Links</h2>
        <ul>
          {artistInfo.socials.map((social, index) => (
            <li key={index}>
              <a href={social.url} target="_blank" rel="noopener noreferrer">
                {social.platform}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2>Downloads</h2>
        <a href={artistInfo.artistStatement.url} download>
          Artist Statement (PDF)
        </a>
        <br />
        <a href={artistInfo.resume.url} download>
          Resume (PDF)
        </a>
      </div>
    </div>
  );
}

