# React Hooks Order Audit & Fix Guide

## Problem
React error: "React has detected a change in the order of Hooks called by [Component]"

## Root Cause
Hooks must be called in the **exact same order** on every render. Any conditional hook calls, early returns before hooks, or hooks inside loops/conditionals will cause this error.

## Systematic Fix Process

### Step 1: Identify All Hooks in Component
List ALL hooks in the order they appear:
1. `useState` calls
2. `useRef` calls  
3. `useEffect` calls
4. `useMemo` calls
5. `useCallback` calls
6. Custom hooks

### Step 2: Check for Violations

#### ❌ BAD: Early return before all hooks
```typescript
function Component() {
  if (someCondition) return null; // ❌ BAD - hooks below won't run
  const [state, setState] = useState();
}
```

#### ✅ GOOD: All hooks before early returns
```typescript
function Component() {
  const [state, setState] = useState();
  if (someCondition) return null; // ✅ GOOD - all hooks already called
}
```

#### ❌ BAD: Conditional hook calls
```typescript
function Component() {
  const [state1, setState1] = useState();
  if (condition) {
    const [state2, setState2] = useState(); // ❌ BAD - hook called conditionally
  }
}
```

#### ✅ GOOD: Always call hooks, conditionally use values
```typescript
function Component() {
  const [state1, setState1] = useState();
  const [state2, setState2] = useState(); // ✅ GOOD - always called
  const value = condition ? state2 : null; // ✅ GOOD - conditionally use, not call
}
```

#### ❌ BAD: Hooks in loops
```typescript
function Component() {
  items.map(item => {
    const [state, setState] = useState(); // ❌ BAD - hook in loop
  });
}
```

#### ❌ BAD: Hooks in callbacks
```typescript
function Component() {
  const handleClick = () => {
    const [state, setState] = useState(); // ❌ BAD - hook in callback
  };
}
```

## WorkDetailPage Hook Audit

### Current Hook Order (Lines 17-503)
1. ✅ `useParams` (line 17)
2. ✅ `useLocation` (line 18)
3. ✅ `useNavigate` (line 19)
4. ✅ `useState` - work (line 20)
5. ✅ `useState` - loading (line 21)
6. ✅ `useState` - activeMediaIndex (line 22)
7. ✅ `useState` - isTransitioning (line 23)
8. ✅ `useState` - scrollAccumulator (line 24)
9. ✅ `useState` - backgroundMedia (line 25)
10. ✅ `useState` - transitionComplete (line 26)
11. ✅ `useRef` - containerRef (line 27)
12. ✅ `useRef` - backgroundImageRef (line 28)
13. ✅ `useRef` - backgroundVideoRef (line 29)
14. ✅ `useState` - backgroundImageLoaded (line 30)
15. ✅ `useRef` - firstImageRef (line 31)
16. ✅ `useRef` - firstImageContainerRef (line 32)
17. ✅ `useState` - sourceImageElement (line 33)
18. ✅ `useState` - targetImageElement (line 34)
19. ✅ `useState` - transitionProgress (line 35)
20. ✅ `useState` - morphComplete (line 36)
21. ✅ `useState` - morphTarget (line 37)
22. ✅ `useReducedMotion` (line 38) - Custom hook
23. ✅ `useEffect` - Load work data (line 53)
24. ✅ `useRef` - morphTargetCalculatedRef (line 156)
25. ✅ `useRef` - transitionIdRef (line 157)
26. ✅ `useCallback` - calculateMorphTarget (line 160)
27. ✅ `useEffect` - Reset morph target (line 205)
28. ✅ `useEffect` - Load source image (line 217)
29. ✅ `useEffect` - Target image verification (line 241)
30. ✅ `useRef` - animationFrameRef (line 262)
31. ✅ `useRef` - isAnimatingRef (line 263)
32. ✅ `useRef` - animationStartedRef (line 264)
33. ✅ `useRef` - pauseTimeoutRef (line 265)
34. ✅ `useRef` - sourceImageRef (line 266)
35. ✅ `useRef` - targetImageRef (line 267)
36. ✅ `useEffect` - Store source image in ref (line 270)
37. ✅ `useEffect` - Store target image in ref (line 274)
38. ✅ `useEffect` - Perlin transition (line 278)
39. ✅ `useEffect` - Background image loaded (line 364)
40. ✅ `useEffect` - Prevent background removal (line 376)
41. ✅ `useEffect` - Wheel scroll handler (line 390)
42. ✅ `useMemo` - translateY (line 458)
43. ✅ `useMemo` - imageStyles (line 474)
44. ✅ `useCallback` - handleBackClick (line 484)

### Early Returns (Lines 508-527)
✅ All hooks are called BEFORE early returns - This is CORRECT

### Potential Issues Found

1. **Line 217-238**: `useEffect` with conditional logic inside
   - The effect always runs, but sets state conditionally
   - This is OK - the hook itself is always called

2. **Line 241-259**: `useEffect` that depends on `targetImageElement` and `sourceImageElement`
   - Both are state variables that might change
   - This is OK - hooks are always called

3. **Line 278-361**: Complex `useEffect` with multiple early returns
   - The hook is always called, but has conditional logic inside
   - This is OK - the hook itself is always called

## Fix Strategy

The issue might be that React sees different numbers of hooks being called due to:
1. Conditional rendering of components that use hooks
2. Dynamic hook calls based on data
3. Hooks in child components that are conditionally rendered

Let me check for conditional component rendering that might include hooks.

