import { createContext, useContext, useReducer, ReactNode } from 'react';

interface MediaState {
  loadedImages: Set<string>;
  loadingImages: Set<string>;
  failedImages: Set<string>;
  preloadedImages: Set<string>;
}

type MediaAction =
  | { type: 'IMAGE_LOADING'; url: string }
  | { type: 'IMAGE_LOADED'; url: string }
  | { type: 'IMAGE_FAILED'; url: string }
  | { type: 'IMAGE_PRELOADED'; url: string }
  | { type: 'RESET' };

const initialState: MediaState = {
  loadedImages: new Set(),
  loadingImages: new Set(),
  failedImages: new Set(),
  preloadedImages: new Set(),
};

function mediaReducer(state: MediaState, action: MediaAction): MediaState {
  switch (action.type) {
    case 'IMAGE_LOADING':
      return {
        ...state,
        loadingImages: new Set([...state.loadingImages, action.url]),
      };
    case 'IMAGE_LOADED':
      return {
        ...state,
        loadedImages: new Set([...state.loadedImages, action.url]),
        loadingImages: new Set([...state.loadingImages].filter(url => url !== action.url)),
        failedImages: new Set([...state.failedImages].filter(url => url !== action.url)),
      };
    case 'IMAGE_FAILED':
      return {
        ...state,
        failedImages: new Set([...state.failedImages, action.url]),
        loadingImages: new Set([...state.loadingImages].filter(url => url !== action.url)),
      };
    case 'IMAGE_PRELOADED':
      return {
        ...state,
        preloadedImages: new Set([...state.preloadedImages, action.url]),
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface MediaContextValue {
  state: MediaState;
  dispatch: React.Dispatch<MediaAction>;
  isImageLoaded: (url: string) => boolean;
  isImageLoading: (url: string) => boolean;
  isImagePreloaded: (url: string) => boolean;
}

const MediaContext = createContext<MediaContextValue | undefined>(undefined);

export function MediaProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(mediaReducer, initialState);

  const isImageLoaded = (url: string) => state.loadedImages.has(url);
  const isImageLoading = (url: string) => state.loadingImages.has(url);
  const isImagePreloaded = (url: string) => state.preloadedImages.has(url);

  return (
    <MediaContext.Provider
      value={{
        state,
        dispatch,
        isImageLoaded,
        isImageLoading,
        isImagePreloaded,
      }}
    >
      {children}
    </MediaContext.Provider>
  );
}

export function useMedia() {
  const context = useContext(MediaContext);
  if (context === undefined) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return context;
}

