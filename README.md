# Maha Mohan - Artist Portfolio

Experimental artist portfolio built with React, Motion.dev (Framer Motion), and lightweight WebGL shader effects.

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and optimized builds
- **Framer Motion** (Motion.dev) for UI animations
- **React Router** for client-side routing
- **WebGL** for custom shader-based visual effects
- **Context API** for global state management

## Features

- 🎨 WebGL shader effects (no 3D models, shader-only)
- ✨ Smooth Motion.dev animations
- 📸 Lazy-loaded images and videos with responsive breakpoints
- 🚀 Code splitting and performance optimizations
- 🔄 CMS-ready data abstraction layer
- 🧪 Playground for testing shaders, animations, and media

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── animations/      # Motion.dev wrapped components
│   ├── webgl/           # WebGL canvas components
│   └── media/           # Image/video components
├── pages/               # Route-level page components
├── hooks/               # Custom React hooks
├── shaders/             # GLSL shader files
│   ├── vertex/          # Vertex shaders
│   ├── fragment/        # Fragment shaders
│   └── programs/        # Shader program configs
├── utils/               # Utility functions
│   ├── webgl/           # WebGL utilities
│   ├── media/           # Media optimization
│   └── cms/             # CMS data fetching
├── store/               # Context API stores
├── types/               # TypeScript interfaces
├── data/                # Mock JSON data
└── playground/          # Testing sandbox
```

## Key Features

### WebGL Integration

- Lightweight shader-only effects
- Automatic context management
- Performance-optimized rendering
- Graceful fallback for unsupported browsers

### Media Handling

- Lazy loading with Intersection Observer
- Responsive image breakpoints
- Video optimization with poster images
- CDN-ready structure

### Animation System

- Motion.dev for DOM animations
- Respects `prefers-reduced-motion`
- GPU-accelerated transforms
- Coordinated with WebGL effects

### CMS Integration

- Abstracted data layer (currently uses JSON)
- Easy to switch to CMS API (Contentful, Strapi, Sanity, etc.)
- Type-safe data models
- Caching and error handling

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
VITE_CMS_API_URL=          # Future CMS API URL
VITE_CDN_URL=              # CDN URL for assets
VITE_ENABLE_WEBGL=true     # Enable/disable WebGL
VITE_ENABLE_ANALYTICS=false # Analytics toggle
```

## Playground

Visit `/playground` to test:
- Shader effects
- Motion.dev animations
- Media loading strategies

## Performance

- Route-based code splitting
- Lazy-loaded components
- Optimized asset delivery
- WebGL performance monitoring
- Error boundaries

## Future CMS Integration

The data layer is abstracted for easy CMS integration. Update `src/utils/cms/fetcher.ts` to connect to your CMS API.

## License

ISC

