# React Hooks Order Fix - Comprehensive Solution

## Problem
"React has detected a change in the order of Hooks called by [Component]"

This error occurs when hooks are called in different orders between renders.

## Root Causes Identified

### 1. Conditional Hook Calls
Hooks must ALWAYS be called in the same order, regardless of conditions.

### 2. Early Returns Before Hooks
All hooks must be called BEFORE any early returns.

### 3. Dynamic Dependencies
Hooks with dependencies that change structure can confuse React.

## Fixes Applied

### WorkDetailPage.tsx

#### Fix 1: Split `work?.media` Access
**Before:**
```typescript
const imageStyles = useMemo(() => {
  if (!work?.media) return [];
  // ...
}, [work?.media, activeMediaIndex]);
```

**After:**
```typescript
// Split to stable variables
const workMedia = work?.media ?? null;
const workMediaLength = workMedia?.length ?? 0;
const hasWorkMedia = workMedia !== null && workMediaLength > 0;

// Always call useMemo with stable dependencies
const imageStyles = useMemo(() => {
  if (!workMedia || workMediaLength === 0) {
    return [];
  }
  // ...
}, [workMedia, workMediaLength, activeMediaIndex]);
```

**Why:** Ensures `useMemo` always receives the same dependency structure, preventing React from seeing different hook patterns.

### TransitionOverlay.tsx

#### Fix 2: Early Return After All Hooks
**Before:**
```typescript
// Hooks here...
if (!fromImage || !toImage) {
  return null; // Early return
}
```

**After:**
```typescript
// ALL hooks called first
// ...
// Early return AFTER all hooks
if (!fromImage || !toImage) {
  return null;
}
```

**Why:** Ensures all hooks are always called before any early returns.

## Verification Checklist

For each component, verify:

- [ ] All `useState` calls are at the top, before any logic
- [ ] All `useRef` calls are at the top, before any logic
- [ ] All `useEffect` calls are before early returns
- [ ] All `useMemo` calls are before early returns
- [ ] All `useCallback` calls are before early returns
- [ ] All custom hooks are before early returns
- [ ] No hooks inside `if` statements
- [ ] No hooks inside loops
- [ ] No hooks inside callbacks
- [ ] Early returns are AFTER all hooks
- [ ] Hook dependencies are stable (not conditionally structured)

## Testing

1. Open browser console
2. Navigate through the app
3. Check for hook order warnings
4. If warnings persist, check the stack trace to identify the exact component

## Common Patterns to Avoid

### ❌ BAD: Conditional Hook
```typescript
if (condition) {
  const [state, setState] = useState(); // ❌
}
```

### ✅ GOOD: Always Call Hook
```typescript
const [state, setState] = useState(); // ✅ Always called
const value = condition ? state : null; // ✅ Conditionally use
```

### ❌ BAD: Early Return Before Hooks
```typescript
if (loading) return <Loading />; // ❌
const [data, setData] = useState(); // ❌ Won't run if loading
```

### ✅ GOOD: Hooks Before Early Return
```typescript
const [data, setData] = useState(); // ✅ Always called
if (loading) return <Loading />; // ✅ OK after hooks
```

### ❌ BAD: Dynamic Hook Dependencies
```typescript
const deps = condition ? [a, b] : [a]; // ❌
useEffect(() => {}, deps); // ❌ Different dependency arrays
```

### ✅ GOOD: Stable Hook Dependencies
```typescript
const depA = a;
const depB = condition ? b : null; // ✅
useEffect(() => {}, [depA, depB]); // ✅ Always same structure
```

## Next Steps

1. Test the application
2. Check console for any remaining hook order warnings
3. If warnings persist, check the stack trace to identify the exact component
4. Apply the same fixes to that component

