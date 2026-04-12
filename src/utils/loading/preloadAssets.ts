/**
 * Utility to preload homepage assets and track progress
 */

// Import all assets that need to be preloaded
import landingVideo from '@/assets/videos/Chitramv2  (1).mp4';
import alchemyImg from '@/assets/media/Works/Alchemy/Divine Comedy/Divine Comedy.jpg';
import doIExistImg from '@/assets/media/Works/Do I exist/Do I exist.jpg';
import echoesImg from '@/assets/media/Works/Echoes of Longing/EOL.jpg';
import etherealBodiesImg from '@/assets/media/Works/Ethereal Bodies/Ethereal Bodies.jpg';
import iraiviImg from '@/assets/media/Works/Iraivi/Iraivi.jpg';
import melancholyImg from '@/assets/media/Works/Melancholy/01.jpg';
import nakedImg from '@/assets/media/Works/Naked/Naked.JPG';
import nightmareImg from '@/assets/media/Works/Nightmare/Nightmare.jpg';
import ofWebsImg from '@/assets/media/Works/Of Webs and Whispers/Of Webs and Whisper Interface 01.jpg';
import oruKudamImg from '@/assets/media/Works/Oru Kudam/01.jpg';
import paradoxImg from '@/assets/media/Works/The Paradox of Becoming/The Paradox of Becoming.jpeg';
import thiraiImg from '@/assets/media/Works/Thirai/Thirai.jpg';
import voicelessImg from '@/assets/media/Works/Voiceless Despair/Voiceless Despair.jpg';
import whisperImg from '@/assets/media/Works/Whisper/Whisper.jpg';

interface Asset {
  type: 'image' | 'video';
  src: string;
  name: string;
}

const homepageAssets: Asset[] = [
  { type: 'video', src: landingVideo, name: 'landing-video' },
  { type: 'image', src: alchemyImg, name: 'alchemy' },
  { type: 'image', src: doIExistImg, name: 'do-i-exist' },
  { type: 'image', src: echoesImg, name: 'echoes' },
  { type: 'image', src: etherealBodiesImg, name: 'ethereal-bodies' },
  { type: 'image', src: iraiviImg, name: 'iraivi' },
  { type: 'image', src: melancholyImg, name: 'melancholy' },
  { type: 'image', src: nakedImg, name: 'naked' },
  { type: 'image', src: nightmareImg, name: 'nightmare' },
  { type: 'image', src: ofWebsImg, name: 'of-webs' },
  { type: 'image', src: oruKudamImg, name: 'oru-kudam' },
  { type: 'image', src: paradoxImg, name: 'paradox' },
  { type: 'image', src: thiraiImg, name: 'thirai' },
  { type: 'image', src: voicelessImg, name: 'voiceless' },
  { type: 'image', src: whisperImg, name: 'whisper' },
];

/**
 * Preload a single asset (image or video)
 */
function preloadAsset(asset: Asset): Promise<void> {
  return new Promise((resolve) => {
    if (asset.type === 'image') {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => {
        console.warn(`Failed to preload image: ${asset.name}`);
        resolve(); // Continue even if one asset fails
      };
      img.src = asset.src;
    } else if (asset.type === 'video') {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      video.oncanplaythrough = () => resolve();
      video.onerror = () => {
        console.warn(`Failed to preload video: ${asset.name}`);
        resolve(); // Continue even if one asset fails
      };
      video.src = asset.src;
    } else {
      resolve();
    }
  });
}

/**
 * Preload all homepage assets with progress tracking
 * @param onProgress Callback with progress (0-100)
 * @param minLoadingTime Minimum time to show loading (ms) - ensures smooth UX
 */
export async function preloadHomepageAssets(
  onProgress?: (progress: number) => void,
  minLoadingTime: number = 2000
): Promise<void> {
  const startTime = Date.now();
  const totalAssets = homepageAssets.length;
  let loadedAssets = 0;

  // Update progress callback
  const updateProgress = () => {
    const progress = Math.min(95, Math.round((loadedAssets / totalAssets) * 100));
    onProgress?.(progress);
  };

  // Preload all assets
  const loadPromises = homepageAssets.map((asset) => {
    return preloadAsset(asset).then(() => {
      loadedAssets++;
      updateProgress();
    });
  });

  // Wait for all assets to load
  await Promise.all(loadPromises);

  // Ensure minimum loading time for smooth UX
  const elapsedTime = Date.now() - startTime;
  if (elapsedTime < minLoadingTime) {
    const remainingTime = minLoadingTime - elapsedTime;
    // Gradually increase progress to 100% during remaining time
    const steps = 5;
    const stepTime = remainingTime / steps;
    const stepProgress = 100 / steps;

    for (let i = 1; i <= steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, stepTime));
      onProgress?.(Math.min(100, 95 + stepProgress * i));
    }
  } else {
    // If loading took longer, just set to 100%
    onProgress?.(100);
  }

  // Small delay to show 100% before completing
  await new Promise((resolve) => setTimeout(resolve, 300));
}
