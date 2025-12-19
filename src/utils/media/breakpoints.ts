/**
 * Responsive image breakpoints and utilities
 */

export const breakpoints = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
  ultrawide: 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Generate srcset string for responsive images
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [640, 768, 1024, 1280, 1920]
): string {
  return widths
    .map((width) => {
      // Assuming URL pattern supports width parameter
      // Adjust based on your CDN/image service
      const url = baseUrl.includes('?') 
        ? `${baseUrl}&w=${width}`
        : `${baseUrl}?w=${width}`;
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(defaultSize: string = '100vw'): string {
  return `(max-width: ${breakpoints.mobile}px) 100vw,
          (max-width: ${breakpoints.tablet}px) 90vw,
          (max-width: ${breakpoints.desktop}px) 80vw,
          ${defaultSize}`;
}

/**
 * Get appropriate image size based on viewport
 */
export function getImageSize(breakpoint: Breakpoint): number {
  return breakpoints[breakpoint];
}

