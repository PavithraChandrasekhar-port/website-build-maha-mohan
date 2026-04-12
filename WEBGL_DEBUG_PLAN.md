# WebGL Perlin Transition - Structured Debugging Plan (2-3 hours)

## Overview
Systematic approach to debug why the Perlin noise transition isn't visible. Follow steps in order, document findings, and fix issues as they're discovered.

---

## Phase 1: Initial Verification (15-20 minutes)

### Step 1.1: Verify Component Rendering
**Goal:** Confirm `TransitionOverlay` is actually mounting and rendering

**Actions:**
1. Add console log at component mount:
   ```typescript
   useEffect(() => {
     console.log('🎬 TransitionOverlay mounted');
     console.log('📊 Props:', { fromImage, toImage, progress, centerX, centerY });
     return () => console.log('🎬 TransitionOverlay unmounted');
   }, []);
   ```

2. Check if component renders in React DevTools
3. Verify canvas element exists in DOM: `document.querySelector('canvas')`

**Expected Result:** Component mounts, props are valid, canvas exists in DOM

**If Failed:** Component not rendering → Check conditional rendering logic in `WorkDetailPage.tsx`

---

### Step 1.2: Verify Canvas Visibility
**Goal:** Ensure canvas is visible and positioned correctly

**Actions:**
1. Inspect canvas element in browser DevTools
2. Check computed styles:
   ```javascript
   const canvas = document.querySelector('canvas');
   console.log('Canvas styles:', {
     display: getComputedStyle(canvas).display,
     visibility: getComputedStyle(canvas).visibility,
     opacity: getComputedStyle(canvas).opacity,
     zIndex: getComputedStyle(canvas).zIndex,
     position: getComputedStyle(canvas).position,
     width: canvas.width,
     height: canvas.height,
     clientWidth: canvas.clientWidth,
     clientHeight: canvas.clientHeight,
   });
   ```

3. Verify canvas fills viewport: `width: 100vw, height: 100vh`

**Expected Result:** Canvas is visible, has correct dimensions, proper z-index (12)

**If Failed:** Fix CSS positioning/visibility issues

---

### Step 1.3: Verify Image Elements
**Goal:** Confirm source and target images are loaded and valid

**Actions:**
1. Add logs in `WorkDetailPage.tsx` when images are set:
   ```typescript
   useEffect(() => {
     if (sourceImageElement) {
       console.log('🖼️ Source image loaded:', {
         src: sourceImageElement.src,
         width: sourceImageElement.naturalWidth,
         height: sourceImageElement.naturalHeight,
         complete: sourceImageElement.complete,
       });
     }
   }, [sourceImageElement]);
   
   useEffect(() => {
     if (targetImageElement) {
       console.log('🖼️ Target image loaded:', {
         src: targetImageElement.src,
         width: targetImageElement.naturalWidth,
         height: targetImageElement.naturalHeight,
         complete: targetImageElement.complete,
       });
     }
   }, [targetImageElement]);
   ```

2. Verify images are different: `sourceImageElement.src !== targetImageElement.src`
3. Check image dimensions are > 0

**Expected Result:** Both images loaded, complete, have dimensions, are different

**If Failed:** Fix image loading logic in `WorkDetailPage.tsx`

---

## Phase 2: WebGL Context & Initialization (20-30 minutes)

### Step 2.1: Verify WebGL Context Creation
**Goal:** Ensure WebGL context is successfully created

**Actions:**
1. Add detailed logs in `initWebGL`:
   ```typescript
   const initWebGL = useCallback(() => {
     console.log('🔧 Initializing WebGL...');
     
     if (!canvasRef.current) {
       console.error('❌ Canvas ref is null');
       return;
     }
     
     if (!isWebGLSupported()) {
       console.error('❌ WebGL not supported');
       return;
     }
     
     const gl = canvasRef.current.getContext('webgl', {
       alpha: true,
       premultipliedAlpha: false,
     });
     
     if (!gl) {
       console.error('❌ Failed to get WebGL context');
       return;
     }
     
     console.log('✅ WebGL context created:', {
       version: gl.getParameter(gl.VERSION),
       shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
       maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
       maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
     });
     
     glRef.current = gl;
     // ... rest of initialization
   }, []);
   ```

2. Check browser console for WebGL errors
3. Verify context is not lost: `gl.isContextLost()`

**Expected Result:** WebGL context created successfully, no errors

**If Failed:** 
- Check browser WebGL support
- Try `webgl2` context
- Check for context loss events

---

### Step 2.2: Verify Shader Compilation
**Goal:** Ensure vertex and fragment shaders compile without errors

**Actions:**
1. Add detailed shader compilation logs:
   ```typescript
   const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
   if (!vertexShader) {
     console.error('❌ Vertex shader compilation failed');
     const error = gl.getShaderInfoLog(vertexShader);
     console.error('Error log:', error);
     return;
   }
   console.log('✅ Vertex shader compiled');
   
   const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
   if (!fragmentShader) {
     console.error('❌ Fragment shader compilation failed');
     const error = gl.getShaderInfoLog(fragmentShader);
     console.error('Error log:', error);
     return;
   }
   console.log('✅ Fragment shader compiled');
   ```

2. Check shader source is loaded correctly
3. Verify shader source doesn't have syntax errors

**Expected Result:** Both shaders compile successfully

**If Failed:** 
- Check shader source files are imported correctly
- Verify GLSL syntax
- Check for browser-specific shader issues

---

### Step 2.3: Verify Program Linking
**Goal:** Ensure shader program links successfully

**Actions:**
1. Add program linking logs:
   ```typescript
   const program = createShaderProgram(gl, vertexShader, fragmentShader);
   if (!program) {
     console.error('❌ Program linking failed');
     const error = gl.getProgramInfoLog(program);
     console.error('Link error:', error);
     return;
   }
   console.log('✅ Shader program linked');
   ```

2. Verify all attributes and uniforms are accessible:
   ```typescript
   console.log('📍 Attributes:', {
     a_position: gl.getAttribLocation(program, 'a_position'),
     a_texCoord: gl.getAttribLocation(program, 'a_texCoord'),
   });
   
   console.log('📍 Uniforms:', {
     u_fromTexture: gl.getUniformLocation(program, 'u_fromTexture'),
     u_toTexture: gl.getUniformLocation(program, 'u_toTexture'),
     u_progress: gl.getUniformLocation(program, 'u_progress'),
     u_resolution: gl.getUniformLocation(program, 'u_resolution'),
     u_smoothness: gl.getUniformLocation(program, 'u_smoothness'),
     u_center: gl.getUniformLocation(program, 'u_center'),
   });
   ```

**Expected Result:** Program links, all uniforms/attributes found

**If Failed:** 
- Check uniform/attribute names match shader
- Verify shader source has correct declarations

---

## Phase 3: Texture Loading & Setup (30-40 minutes)

### Step 3.1: Verify Texture Creation
**Goal:** Ensure textures are created and bound correctly

**Actions:**
1. Add texture creation logs:
   ```typescript
   fromTextureRef.current = createTexture(gl);
   toTextureRef.current = createTexture(gl);
   
   console.log('🖼️ Textures created:', {
     fromTexture: fromTextureRef.current,
     toTexture: toTextureRef.current,
   });
   
   // Check for errors
   const error = gl.getError();
   if (error !== gl.NO_ERROR) {
     console.error('❌ WebGL error after texture creation:', error);
   }
   ```

2. Verify texture objects are not null
3. Check texture parameters are set correctly

**Expected Result:** Textures created, no WebGL errors

**If Failed:** Check `createTexture` utility function

---

### Step 3.2: Verify Image Data Upload
**Goal:** Ensure image data is uploaded to textures correctly

**Actions:**
1. Add detailed texture upload logs in `render` function:
   ```typescript
   // Before uploading
   console.log('📤 Uploading textures:', {
     fromImage: {
       src: fromImage.src,
       width: fromImage.naturalWidth,
       height: fromImage.naturalHeight,
       complete: fromImage.complete,
     },
     toImage: {
       src: toImage.src,
       width: toImage.naturalWidth,
       height: toImage.naturalHeight,
       complete: toImage.complete,
     },
   });
   
   // Upload fromImage
   gl.activeTexture(gl.TEXTURE0);
   gl.bindTexture(gl.TEXTURE_2D, fromTextureRef.current);
   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fromImage);
   
   // Check for errors
   let error = gl.getError();
   if (error !== gl.NO_ERROR) {
     console.error('❌ Error uploading fromImage texture:', error);
   } else {
     console.log('✅ fromImage texture uploaded');
   }
   
   // Upload toImage
   gl.activeTexture(gl.TEXTURE1);
   gl.bindTexture(gl.TEXTURE_2D, toTextureRef.current);
   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, toImage);
   
   error = gl.getError();
   if (error !== gl.NO_ERROR) {
     console.error('❌ Error uploading toImage texture:', error);
   } else {
     console.log('✅ toImage texture uploaded');
   }
   ```

2. Verify images have `crossOrigin = 'anonymous'` if needed
3. Check texture dimensions match image dimensions

**Expected Result:** Both textures upload successfully, no errors

**If Failed:** 
- Check CORS issues
- Verify image format is supported
- Check texture size limits

---

### Step 3.3: Verify Texture Binding
**Goal:** Ensure textures are bound to correct texture units

**Actions:**
1. Add texture binding verification:
   ```typescript
   // After binding
   const boundTexture0 = gl.getParameter(gl.TEXTURE_BINDING_2D);
   console.log('🔗 Texture bindings:', {
     TEXTURE0: boundTexture0 === fromTextureRef.current,
     TEXTURE1: gl.getParameter(gl.TEXTURE_BINDING_2D) === toTextureRef.current,
   });
   ```

2. Verify active texture unit is correct
3. Check texture parameters (min/mag filter, wrap mode)

**Expected Result:** Textures bound to correct units

**If Failed:** Fix texture binding order

---

## Phase 4: Uniform & Attribute Setup (20-30 minutes)

### Step 4.1: Verify Uniform Values
**Goal:** Ensure all uniforms are set with correct values

**Actions:**
1. Add uniform setting logs:
   ```typescript
   console.log('🎛️ Setting uniforms:', {
     u_progress: internalProgress,
     u_resolution: [gl.canvas.width, gl.canvas.height],
     u_smoothness: smoothness,
     u_center: [
       centerX !== undefined ? centerX / gl.canvas.width : 0.5,
       centerY !== undefined ? centerY / gl.canvas.height : 0.5,
     ],
   });
   
   // Set each uniform and verify
   if (uniformsRef.current.u_progress !== null) {
     gl.uniform1f(uniformsRef.current.u_progress, internalProgress);
     console.log('✅ u_progress set to:', internalProgress);
   } else {
     console.error('❌ u_progress uniform not found');
   }
   
   // Repeat for all uniforms...
   ```

2. Verify uniform locations are not null
3. Check uniform values are in expected ranges (0-1 for progress, etc.)

**Expected Result:** All uniforms set correctly, values are valid

**If Failed:** 
- Check uniform names match shader
- Verify uniform types match (float, vec2, etc.)

---

### Step 4.2: Verify Attribute Setup
**Goal:** Ensure vertex attributes are set up correctly

**Actions:**
1. Add attribute setup logs:
   ```typescript
   // Position buffer
   if (positionBufferRef.current && positionLocationRef.current !== -1) {
     gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferRef.current);
     gl.enableVertexAttribArray(positionLocationRef.current);
     gl.vertexAttribPointer(positionLocationRef.current, 2, gl.FLOAT, false, 0, 0);
     console.log('✅ Position attribute enabled');
   } else {
     console.error('❌ Position attribute not set up');
   }
   
   // Texture coordinates buffer
   if (texCoordBufferRef.current && texCoordLocationRef.current !== -1) {
     gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBufferRef.current);
     gl.enableVertexAttribArray(texCoordLocationRef.current);
     gl.vertexAttribPointer(texCoordLocationRef.current, 2, gl.FLOAT, false, 0, 0);
     console.log('✅ Texture coordinate attribute enabled');
   } else {
     console.error('❌ Texture coordinate attribute not set up');
   }
   ```

2. Verify buffer data is correct
3. Check attribute locations are valid

**Expected Result:** All attributes enabled and configured

**If Failed:** Fix buffer/attribute setup

---

## Phase 5: Rendering & Draw Calls (30-40 minutes)

### Step 5.1: Verify Render Loop
**Goal:** Ensure render loop is active and running

**Actions:**
1. Add render loop logs:
   ```typescript
   const renderLoop = () => {
     if (!isActive) {
       console.log('⏹️ Render loop stopped');
       return;
     }
     
     const frameStart = performance.now();
     render();
     const frameTime = performance.now() - frameStart;
     
     if (frameTime > 16) {
       console.warn('⚠️ Slow frame:', frameTime, 'ms');
     }
     
     if (internalProgress < 1.0) {
       animationFrameRef.current = requestAnimationFrame(renderLoop);
     } else {
       console.log('✅ Render loop complete');
     }
   };
   ```

2. Verify `requestAnimationFrame` is being called
3. Check render is called every frame

**Expected Result:** Render loop runs continuously until progress = 1.0

**If Failed:** Fix render loop logic

---

### Step 5.2: Verify Draw Call
**Goal:** Ensure `gl.drawArrays` is called and succeeds

**Actions:**
1. Add draw call logs:
   ```typescript
   // Before draw
   console.log('🎨 Drawing frame:', {
     progress: internalProgress,
     vertexCount: 4,
   });
   
   // Clear and draw
   gl.clear(gl.COLOR_BUFFER_BIT);
   gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
   
   // Check for errors
   const error = gl.getError();
   if (error !== gl.NO_ERROR) {
     console.error('❌ WebGL error after draw:', error);
   } else {
     console.log('✅ Draw call succeeded');
   }
   ```

2. Verify viewport is set correctly: `gl.viewport(0, 0, width, height)`
3. Check clear color is transparent: `gl.clearColor(0, 0, 0, 0)`

**Expected Result:** Draw call succeeds, no errors

**If Failed:** 
- Check viewport dimensions
- Verify draw mode and count
- Check for WebGL state issues

---

### Step 5.3: Test Simple Rendering
**Goal:** Verify basic rendering works (bypass Perlin shader)

**Actions:**
1. Create a simple test shader that just displays `toImage`:
   ```glsl
   // Simple passthrough fragment shader for testing
   precision mediump float;
   uniform sampler2D u_toTexture;
   varying vec2 v_texCoord;
   
   void main() {
     gl_FragColor = texture2D(u_toTexture, v_texCoord);
   }
   ```

2. If this works, the issue is in the Perlin shader
3. If this fails, the issue is in setup/rendering

**Expected Result:** Simple shader displays target image

**If Failed:** Fix basic rendering setup first

**If Passed:** Issue is in Perlin shader logic

---

## Phase 6: Shader Debugging (40-50 minutes)

### Step 6.1: Verify Shader Uniforms
**Goal:** Ensure Perlin shader receives correct uniform values

**Actions:**
1. Add uniform debugging in shader (use color output to visualize):
   ```glsl
   // Temporarily modify shader to visualize uniforms
   void main() {
     vec2 uv = v_texCoord;
     
     // Visualize progress
     float progress = u_progress;
     gl_FragColor = vec4(progress, progress, progress, 1.0);
     
     // Or visualize center
     // float dist = distance(uv, u_center);
     // gl_FragColor = vec4(dist, dist, dist, 1.0);
   }
   ```

2. Verify progress animates from 0 to 1
3. Verify center coordinates are correct

**Expected Result:** Uniforms are being passed correctly

**If Failed:** Fix uniform passing

---

### Step 6.2: Test Perlin Noise Function
**Goal:** Verify Perlin noise generates correctly

**Actions:**
1. Test noise function in isolation:
   ```glsl
   void main() {
     vec2 uv = v_texCoord;
     vec2 noiseCoord = uv * 8.0;
     float noise = fbm(noiseCoord);
     
     // Visualize noise
     gl_FragColor = vec4(noise, noise, noise, 1.0);
   }
   ```

2. Should see grayscale noise pattern
3. If not visible, check noise function implementation

**Expected Result:** Noise pattern visible

**If Failed:** Fix Perlin noise implementation

---

### Step 6.3: Test Radial Mask
**Goal:** Verify radial transition mask works

**Actions:**
1. Test radial calculation:
   ```glsl
   void main() {
     vec2 uv = v_texCoord;
     vec2 center = u_center;
     vec2 toCenter = uv - center;
     float distFromCenter = length(toCenter);
     float maxDist = length(vec2(0.5, 0.5));
     float normalizedDist = distFromCenter / maxDist;
     
     // Visualize radial distance
     gl_FragColor = vec4(normalizedDist, normalizedDist, normalizedDist, 1.0);
   }
   ```

2. Should see radial gradient from center (black) to corners (white)
3. Verify center point is correct

**Expected Result:** Radial mask visible and correct

**If Failed:** Fix radial calculation

---

### Step 6.4: Test Combined Transition
**Goal:** Verify full Perlin transition works

**Actions:**
1. Gradually add complexity:
   - First: Just radial mask
   - Then: Add noise
   - Finally: Combine with images

2. Test at different progress values (0, 0.25, 0.5, 0.75, 1.0)
3. Verify smooth transition

**Expected Result:** Full transition works

**If Failed:** Debug specific step that fails

---

## Phase 7: Integration & Final Testing (20-30 minutes)

### Step 7.1: Verify Progress Animation
**Goal:** Ensure progress animates smoothly from 0 to 1

**Actions:**
1. Add progress logging:
   ```typescript
   useEffect(() => {
     console.log('📈 Progress updated:', internalProgress);
   }, [internalProgress]);
   ```

2. Verify progress updates every frame
3. Check progress reaches 1.0

**Expected Result:** Progress animates smoothly

**If Failed:** Fix progress animation logic

---

### Step 7.2: Test Complete Flow
**Goal:** Verify entire transition works end-to-end

**Actions:**
1. Click work item
2. Watch console logs through all phases
3. Verify:
   - Morph animation completes
   - 0.3s pause happens
   - Perlin transition starts
   - Progress animates
   - Transition completes
   - Final state appears

**Expected Result:** Complete transition works smoothly

**If Failed:** Debug specific phase that fails

---

### Step 7.3: Cross-Browser Testing
**Goal:** Verify works on different browsers

**Actions:**
1. Test on Chrome/Edge
2. Test on Firefox
3. Test on Safari (if available)
4. Check for browser-specific issues

**Expected Result:** Works on all browsers

**If Failed:** Add browser-specific fixes

---

## Debugging Checklist

Use this checklist to track progress:

- [ ] Phase 1: Component rendering verified
- [ ] Phase 2: WebGL context created
- [ ] Phase 3: Textures loaded
- [ ] Phase 4: Uniforms/attributes set
- [ ] Phase 5: Render loop active
- [ ] Phase 6: Shader works
- [ ] Phase 7: Complete flow works

---

## Common Issues & Solutions

### Issue: Canvas not visible
**Solution:** Check z-index, opacity, position, dimensions

### Issue: WebGL context lost
**Solution:** Handle context loss events, recreate context

### Issue: Textures not loading
**Solution:** Check CORS, image format, texture size limits

### Issue: Shader compilation fails
**Solution:** Check GLSL syntax, browser compatibility

### Issue: Uniforms not found
**Solution:** Verify uniform names match shader declarations

### Issue: Nothing renders
**Solution:** Check viewport, clear color, draw call

### Issue: Wrong colors/black screen
**Solution:** Check texture format, blending, alpha channel

### Issue: Transition not animating
**Solution:** Verify progress updates, render loop active

---

## Time Estimates

- Phase 1: 15-20 min
- Phase 2: 20-30 min
- Phase 3: 30-40 min
- Phase 4: 20-30 min
- Phase 5: 30-40 min
- Phase 6: 40-50 min
- Phase 7: 20-30 min

**Total: 2-3 hours** (depending on where issues are found)

---

## Next Steps After Debugging

1. Document all fixes made
2. Remove excessive debug logs (keep essential ones)
3. Test edge cases (different image sizes, aspect ratios)
4. Optimize if needed (reduce texture updates, etc.)
5. Add error handling for production

