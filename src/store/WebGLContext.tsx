import { createContext, useContext, useReducer, ReactNode } from 'react';
import { isWebGLSupported } from '@/utils/webgl/context';

interface WebGLState {
  isSupported: boolean;
  activeCanvases: Set<string>;
  isInitialized: boolean;
  error: string | null;
}

type WebGLAction =
  | { type: 'CANVAS_ADDED'; id: string }
  | { type: 'CANVAS_REMOVED'; id: string }
  | { type: 'INITIALIZED' }
  | { type: 'ERROR'; error: string }
  | { type: 'RESET' };

const initialState: WebGLState = {
  isSupported: isWebGLSupported(),
  activeCanvases: new Set(),
  isInitialized: false,
  error: null,
};

function webGLReducer(state: WebGLState, action: WebGLAction): WebGLState {
  switch (action.type) {
    case 'CANVAS_ADDED':
      return {
        ...state,
        activeCanvases: new Set([...state.activeCanvases, action.id]),
      };
    case 'CANVAS_REMOVED':
      return {
        ...state,
        activeCanvases: new Set([...state.activeCanvases].filter(id => id !== action.id)),
      };
    case 'INITIALIZED':
      return {
        ...state,
        isInitialized: true,
        error: null,
      };
    case 'ERROR':
      return {
        ...state,
        error: action.error,
        isInitialized: false,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface WebGLContextValue {
  state: WebGLState;
  dispatch: React.Dispatch<WebGLAction>;
  isSupported: boolean;
  hasActiveCanvases: boolean;
}

const WebGLContext = createContext<WebGLContextValue | undefined>(undefined);

export function WebGLProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(webGLReducer, initialState);

  const hasActiveCanvases = state.activeCanvases.size > 0;

  return (
    <WebGLContext.Provider
      value={{
        state,
        dispatch,
        isSupported: state.isSupported,
        hasActiveCanvases,
      }}
    >
      {children}
    </WebGLContext.Provider>
  );
}

export function useWebGLContext() {
  const context = useContext(WebGLContext);
  if (context === undefined) {
    throw new Error('useWebGLContext must be used within a WebGLProvider');
  }
  return context;
}

