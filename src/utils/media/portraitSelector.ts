/**
 * Utility to detect and select portrait images
 * Portrait images have height > width (aspect ratio < 1)
 */

/**
 * Check if an image is portrait orientation
 * @param imageUrl - URL of the image to check
 * @returns Promise<boolean> - true if portrait, false if landscape
 */
export async function isPortraitImage(imageUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const isPortrait = img.height > img.width;
      resolve(isPortrait);
    };
    img.onerror = () => {
      // Default to false if image fails to load
      resolve(false);
    };
    img.src = imageUrl;
  });
}

/**
 * Select the first portrait image from an array of image URLs
 * @param imageUrls - Array of image URLs to check
 * @returns Promise<string | null> - First portrait image URL, or null if none found
 */
export async function selectPortraitImage(imageUrls: string[]): Promise<string | null> {
  for (const url of imageUrls) {
    const isPortrait = await isPortraitImage(url);
    if (isPortrait) {
      return url;
    }
  }
  // If no portrait found, return first image as fallback
  return imageUrls[0] || null;
}


