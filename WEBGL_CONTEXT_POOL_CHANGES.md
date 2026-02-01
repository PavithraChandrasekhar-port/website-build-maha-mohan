# WebGL Context Pool Management - Changes Summary

## Problem
The website was creating too many WebGL contexts, exceeding the browser limit of 16 contexts. This caused warnings: "Too many active WebGL contexts. Oldest context will be lost."

## Solution
Implemented a centralized WebGL context pool manager that:
- Tracks all active WebGL contexts
- Enforces a maximum of 16 contexts
- Prevents creating new contexts when the limit is reached
- Properly cleans up contexts when components unmount

## Files Changed

### 1. `src/utils/webgl/context.ts` - Core Context Pool Manager

**Added:**
- `ContextEntry` interface to track context metadata
- `activeContexts` Map to store all active contexts
- `MAX_CONTEXTS = 16` constant
- `getActiveContextCount()` - Returns current number of active contexts
- `canCreateContext()` - Checks if we can create a new context
- `registerContext(gl, canvas)` - Registers a new context in the pool
- `unregisterContext(id)` - Unregisters a context by ID
- `unregisterContextByGL(gl)` - Unregisters a context by the WebGL context object

**Modified:**
- `createWebGLContext()` - Now checks pool limit before creating context and automatically registers it
- `trackContextCreated()` / `trackContextDestroyed()` - Deprecated (now no-ops), kept for backward compatibility

**Key Changes:**
```typescript
// Before: Simple counter that only warned
let activeContextCount = 0;
export function trackContextCreated(): void {
  activeContextCount++;
  if (activeContextCount > MAX_CONTEXTS) {
    console.warn(...);
  }
}

// After: Pool manager that prevents exceeding limit
const activeContexts = new Map<string, ContextEntry>();
export function createWebGLContext(canvas, options): WebGLRenderingContext | null {
  if (!canCreateContext()) {
    console.error('Cannot create WebGL context: limit reached');
    return null; // Prevents creation instead of just warning
  }
  const gl = canvas.getContext('webgl', options);
  registerContext(gl, canvas); // Automatically tracks
  return gl;
}
```

### 2. `src/components/webgl/BlurOverlay.tsx`

**Changed:**
- Replaced direct `canvas.getContext('webgl')` with `createWebGLContext()`
- Removed `trackContextCreated()` call
- Added `unregisterContextByGL(gl)` in cleanup

**Before:**
```typescript
const gl = canvas.getContext('webgl', {...}) as WebGLRenderingContext | null;
glRef.current = gl;
trackContextCreated();
```

**After:**
```typescript
const gl = createWebGLContext(canvas, {...});
glRef.current = gl;
// In cleanup:
unregisterContextByGL(gl);
```

### 3. `src/components/webgl/ExhibitsBackground.tsx`

**Changed:**
- Replaced direct `canvas.getContext('webgl')` with `createWebGLContext()`
- Added `unregisterContextByGL(gl)` in cleanup

**Before:**
```typescript
const gl = canvas.getContext('webgl', {...}) as WebGLRenderingContext | null;
```

**After:**
```typescript
const gl = createWebGLContext(canvas, {...});
// In cleanup:
unregisterContextByGL(gl);
```

### 4. `src/components/webgl/TransitionOverlay.tsx`

**Changed:**
- Replaced direct `canvas.getContext('webgl')` with `createWebGLContext()`
- Added `unregisterContextByGL(gl)` in cleanup

**Before:**
```typescript
const gl = canvas.getContext('webgl', {...}) as WebGLRenderingContext | null;
```

**After:**
```typescript
const gl = createWebGLContext(canvas, {...});
// In cleanup:
unregisterContextByGL(gl);
```

### 5. `src/components/webgl/ExhibitImageShader.tsx`

**Changed:**
- Replaced direct `canvas.getContext('webgl')` with `createWebGLContext()`
- Removed `trackContextCreated()` call
- Replaced `trackContextDestroyed()` with `unregisterContextByGL(gl)`

**Before:**
```typescript
const gl = canvas.getContext('webgl', {...}) as WebGLRenderingContext | null;
glRef.current = gl;
trackContextCreated();
// In cleanup:
trackContextDestroyed();
```

**After:**
```typescript
const gl = createWebGLContext(canvas, {...});
glRef.current = gl;
// In cleanup:
unregisterContextByGL(gl);
```

### 6. `src/hooks/useWebGL.ts`

**Changed:**
- Already using `createWebGLContext()`, but added cleanup
- Added `unregisterContextByGL(gl)` in cleanup

**Before:**
```typescript
// No context unregistration
```

**After:**
```typescript
// In cleanup:
unregisterContextByGL(gl);
```

## How It Works

1. **Context Creation:**
   - All components now use `createWebGLContext()` instead of direct `canvas.getContext()`
   - The function checks if we're under the 16-context limit before creating
   - If at limit, returns `null` and logs an error (prevents creation)
   - If under limit, creates context and automatically registers it in the pool

2. **Context Tracking:**
   - Each context is assigned a unique ID and stored in `activeContexts` Map
   - The pool manager automatically cleans up lost contexts when checking counts

3. **Context Cleanup:**
   - When components unmount, they call `unregisterContextByGL(gl)` to remove the context from the pool
   - This ensures the pool count stays accurate

4. **Warnings:**
   - Warns when context usage exceeds 75% of limit (12 contexts)
   - Errors when trying to create beyond the limit (16 contexts)

## Benefits

1. **Prevents Context Overflow:** No more warnings about too many contexts
2. **Centralized Management:** All context creation goes through one function
3. **Automatic Tracking:** Contexts are automatically registered/unregistered
4. **Better Error Handling:** Clear errors when limit is reached
5. **No Effect Changes:** All visual effects remain unchanged, only context management improved

## Testing

To verify the fix works:
1. Open browser DevTools console
2. Navigate through pages with WebGL components
3. Check that you don't see "Too many active WebGL contexts" warnings
4. The maximum number of contexts should never exceed 16

