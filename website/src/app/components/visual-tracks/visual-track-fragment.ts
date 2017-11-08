/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const eq_draw = `
// Draw eq.
float eqLeftBound = 0.05;
float eqWidth = 0.2;
float eqBottomBound = -0.15;
float eqHeight = 0.1;
if(uv.x > eqLeftBound
  && uv.x < eqLeftBound + eqWidth
  && uv.y > eqBottomBound
  && uv.y < eqBottomBound + eqHeight && showeq > 0.5) {
  a = 1.0;
  vec3 eqCol = vec3(0.5);
  vec2 equv = vec2(uv.x - eqLeftBound, uv.y - eqBottomBound) / vec2(eqWidth, eqHeight);
  float eqFreq = texture2D(tEqData, vec2(equv.x, 0)).x;
  eqFreq *= step(0.0, eqFreq - lowcut);
  eqCol *= (1.0 - step(eqFreq, equv.y));
  eqCol += vec3(0.5, 0.0, 0.0) * step(range1.x, equv.x) * step(equv.x, range1.y)
    * step(range1.z, equv.y) * step(equv.y, range1.w);
    eqCol += vec3(0.0, 0.0, 0.75) * step(range2.x, equv.x) * step(equv.x, range2.y)
      * step(range2.z, equv.y) * step(equv.y, range2.w);
  colA = eqCol;
}
`;

const eq_uniforms = `
uniform sampler2D tEqData;
uniform vec4 range1;
uniform vec4 range2;
`;


export function gradientFragmentShader(show_eq) {
  return `
uniform float amplitude;
uniform float freqFactor;
uniform float iGlobalTime;
uniform float nameDampDur;
uniform float nameDampMin;
uniform float numBins;
uniform float layer;
uniform float stillHeight;
uniform float offsetHeight;
uniform float lowcut;
uniform float showeq;
uniform float opacity;
uniform float period;
uniform float speed;
uniform float bubble_r;
uniform float titleSpeed;
uniform vec2 iResolution;
uniform sampler2D tAudioData;
uniform sampler2D tTitle;
uniform vec2 bubble_pos;
uniform vec2 titleSize;
uniform vec2 titlePos;
uniform vec3 colorA;
uniform vec3 colorB;
uniform vec4 titleColor;
${show_eq ? eq_uniforms : ''}

#define M_PI 3.1415926535897932384626433832795

float dist(float a,float b,float c,float d) {
  return sqrt(float((a - c) * (a - c) + (b - d) * (b - d)));
}

float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float spline(float p0, float p1, float p2, float p3, float t) {
  return 0.5 * ((2.0 * p1) + t * ((-p0 + p2) + t * ((2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) + t * (-p0 + 3.0 * p1 - 3.0 * p2 + p3))));
}

vec3 blendNormal(vec3 base, vec3 blend) {
	return blend;
}

vec3 blendNormal(vec3 base, vec3 blend, float opacity) {
	return (blendNormal(base, blend) * opacity + base * (1.0 - opacity));
}

vec2 spline(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {
  return 0.5 * ((2.0 * p1) + t * ((-p0 + p2) + t * ((2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) + t * (-p0 + 3.0 * p1 - 3.0 * p2 + p3))));
}

float sdfDisc(vec2 uv, vec2 pos, float radius) {
  // return 1.0 + radius - dot(uv - pos, uv - pos);
  return 1.0 + radius - distance(uv, pos);
}

void main() {
  float time = iGlobalTime * 0.6;
  float aspect = iResolution.x / iResolution.y;
  vec2 uv = gl_FragCoord.xy / iResolution.xy;

  // Adjust which window of the timeline we are looking at
  vec2 lookup = vec2(uv.x + time * speed * 0.05, 0);

  // Normalize to screen ratio
  uv.x *= aspect;
  // Shift up
  uv.y -= layer * offsetHeight;

  // Spline
  // Which bin are we in?
  float binLookup = lookup.x * numBins;
  float binIndex = floor(binLookup) / numBins;
  float nextBinIndex = ceil(binLookup) / numBins;
  float binSize = nextBinIndex - binIndex;
  float p0 = texture2D(tAudioData, vec2(binIndex - binSize, 0)).x;
  float p1 = texture2D(tAudioData, vec2(binIndex, 0)).x;
  float p2 = texture2D(tAudioData, vec2(nextBinIndex, 0)).x;
  float p3 = texture2D(tAudioData, vec2(nextBinIndex + binSize, 0)).x;
  float freq = spline(p0, p1, p2, p3, clamp((lookup.x - binIndex) / binSize, 0.0, 1.0));
  float freq_orig = freq;
  // Amplitude Dampner (to keep track names legible)
  float damp = clamp(0.0, 1.0, uv.x / nameDampDur);
  damp = damp * damp * (3. - 2. * damp); // Ease In Out
  damp = nameDampMin + (1.0 - nameDampMin) * damp;

  // Multiply Height
  freq *= amplitude * damp;

  // Add Rest Wave in
  freq += sin(period * M_PI * uv.x + time * speed) * stillHeight;

  // Color in gradient and flat
  vec3 colA = mix(colorA, colorB, uv.x);

  // Bubble
  float b1_t = mod(iGlobalTime, 2.) / 2.;
  vec2 b1_pos = bubble_pos * vec2(aspect, 1.0);
  float sdf_b1 = pow(max(0.0, sdfDisc(uv, b1_pos, bubble_r)), 20.0);
  float sdf_wave = max(0.0, pow(1.0 + freq - uv.y, 20.0));
  float sdf_total = sdf_b1 + sdf_wave;
  float in_wave = smoothstep(1.0, 1.04, sdf_wave);
  float in_bubble = smoothstep(1.0, 1.04, sdf_b1);
  float in_wave_and_bubble = smoothstep(1.0, 1.04, sdf_total);
  float inside = in_wave_and_bubble - in_bubble * in_wave;

  // Inner Shadow
  float inner_shadow = 1.0 - min(1.0, max((sdf_total - 1.0), 0.0) / 1.2);
  colA = blendNormal(colA, vec3(1.0), inner_shadow * 0.3);

  // Add In Black
  colA = blendNormal(colA, vec3(0.0), 1.0 - in_wave_and_bubble);
  // Clip opacity
  // float a = mix(0., opacity, inside);

  // Drop Shadow
  float drop_shadow = min(sdf_total, 1.04) - 0.4;
  // // colA *= inside; // Replace shadow color with black
  float a = mix(drop_shadow * 0.1, opacity, smoothstep(1.0, 1.06, sdf_total) - in_bubble * in_wave); // Unclip opacity with drop shadow
  // colA = vec3(0., drop_shadow, 0.);
  // float a = 0.8;
  // float a = opacity * drop_shadow;

  ${show_eq ? eq_draw : ''}

  // Move the title up or down
  vec2 title_pos = titlePos + vec2(0, 0. * sin(period * M_PI * uv.x + time * speed * titleSpeed));
  // title
  vec2 title_uv = (gl_FragCoord.xy + vec2(-title_pos.x, title_pos.y + titleSize.y - layer * offsetHeight * iResolution.y))/ titleSize.xy;
  // Mix title color In
  colA = blendNormal(colA, titleColor.rgb, texture2D(tTitle, title_uv).r * titleColor.a);

  gl_FragColor = vec4(colA, a); //vec4(mix(bottom, top, position.y) ); //vec4(colA, a);
}`;
};
