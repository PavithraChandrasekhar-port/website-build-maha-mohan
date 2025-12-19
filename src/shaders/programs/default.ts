/**
 * Default shader program configuration
 * Example of how to structure shader programs
 */

import passthroughVertex from '../vertex/passthrough.glsl?raw';
import gradientFragment from '../fragment/gradient.glsl?raw';
import noiseFragment from '../fragment/noise.glsl?raw';

export const defaultShaderConfig = {
  vertex: passthroughVertex,
  fragment: gradientFragment,
  uniforms: ['u_time', 'u_resolution', 'u_mouse'],
  attributes: ['a_position', 'a_texCoord'],
};

export const noiseShaderConfig = {
  vertex: passthroughVertex,
  fragment: noiseFragment,
  uniforms: ['u_time', 'u_resolution', 'u_mouse'],
  attributes: ['a_position', 'a_texCoord'],
};

