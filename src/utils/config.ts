/**
 * Application configuration
 * Reads from environment variables with fallbacks
 */

export const config = {
  // CMS Configuration
  cms: {
    apiUrl: import.meta.env.VITE_CMS_API_URL || '',
    apiKey: import.meta.env.VITE_CMS_API_KEY || '',
  },

  // CDN Configuration
  cdn: {
    url: import.meta.env.VITE_CDN_URL || '',
  },

  // Feature Flags
  features: {
    webgl: import.meta.env.VITE_ENABLE_WEBGL === 'true' || true,
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true' || false,
  },

  // Build Environment
  env: import.meta.env.VITE_BUILD_ENV || import.meta.env.MODE || 'development',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;

