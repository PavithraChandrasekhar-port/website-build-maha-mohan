/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CMS_API_URL?: string;
  readonly VITE_CMS_API_KEY?: string;
  readonly VITE_CDN_URL?: string;
  readonly VITE_ENABLE_WEBGL?: string;
  readonly VITE_ENABLE_ANALYTICS?: string;
  readonly VITE_BUILD_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Declare module for image file extensions
declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.JPG' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

