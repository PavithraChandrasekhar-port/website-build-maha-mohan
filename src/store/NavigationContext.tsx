import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface NavigationState {
  currentPath: string;
  previousPath: string | null;
  isTransitioning: boolean;
  transitionDirection: 'forward' | 'back' | null;
}

type NavigationAction =
  | { type: 'NAVIGATE_START'; path: string; direction: 'forward' | 'back' }
  | { type: 'NAVIGATE_COMPLETE'; path: string }
  | { type: 'RESET' };

const initialState: NavigationState = {
  currentPath: '/',
  previousPath: null,
  isTransitioning: false,
  transitionDirection: null,
};

function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case 'NAVIGATE_START':
      return {
        ...state,
        previousPath: state.currentPath,
        isTransitioning: true,
        transitionDirection: action.direction,
      };
    case 'NAVIGATE_COMPLETE':
      return {
        ...state,
        currentPath: action.path,
        isTransitioning: false,
        transitionDirection: null,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface NavigationContextValue {
  state: NavigationState;
  dispatch: React.Dispatch<NavigationAction>;
  isTransitioning: boolean;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [state, dispatch] = useReducer(navigationReducer, initialState);

  useEffect(() => {
    const path = location.pathname;
    const direction = path > state.currentPath ? 'forward' : 'back';
    
    dispatch({ type: 'NAVIGATE_START', path, direction });
    
    // Complete transition after a short delay
    const timer = setTimeout(() => {
      dispatch({ type: 'NAVIGATE_COMPLETE', path });
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, state.currentPath]);

  return (
    <NavigationContext.Provider
      value={{
        state,
        dispatch,
        isTransitioning: state.isTransitioning,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

