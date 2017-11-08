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

import {TweenMax, TimelineMax, Power2, Power3, Power4} from 'gsap';
import objectAssign from 'object-assign';
import {
  PlaneBufferGeometry, DataTexture, Vector2,
  Vector3, Vector4, RGBFormat, ShaderMaterial, TextureLoader, Color,
  Mesh, UnsignedByteType, UVMapping, RepeatWrapping,
  LinearFilter, Texture, CanvasTexture } from 'three';
import SimplexNoise from 'simplex-noise';
import {vertexShader} from './visual-track-vert';
import {gradientFragmentShader} from './visual-track-fragment';
import {EventsService} from '../../services/events.service';
import {PRESETS} from './visual-track-presets';
import {TextTexture} from './text-texture';

const SHOW_EQ = false;

export class VisualTrack {
  public options;
  public id;
  public layer;
  public name;
  public color;
  public gradient;
  public renderer;
  public scene;
  public displayObject;
  public uniforms;
  public analyser;
  public fftArray;
  public shader;
  public guiData;
  public guiFolder;
  public speedOffset;
  public average;
  public bufferLength = 1024;
  public amplitude = PRESETS.default.amplitude;
  public range1 = new Vector4(0, 1, 0, 0.7);
  public range2 = new Vector4(0, 0, 0, 0);
  public lowcut = PRESETS.default.lowcut;
  public resolution = PRESETS.default.resolution;
  public opacity = PRESETS.default.opacity;
  public period = PRESETS.default.period;
  public speed = PRESETS.default.speed;
  public stillHeight = PRESETS.default.stillHeight;
  public offsetHeight = PRESETS.default.offsetHeight;
  public smoothing = PRESETS.default.smoothing;
  public fake = {
    state: PRESETS.default.fake,
    value: PRESETS.default.fake
  };
  public fillType = 'flat';
  public materials = {};
  public bubbleAnim;

  public simplex = new SimplexNoise();
  public state = 'intro'; // Can be ['default', 'on', 'intro']
  public state_secondary = '';
  public has_bonus = false;
  public titleTexture;
  public titleSize = new Vector2(1024, 128);
  public titleColor = PRESETS.default.titleColor;

  constructor(options, private eventsService?: EventsService) {
    this.options = options || {};
    this.id = options.id || null;
    this.layer = options.layer || this.id;
    this.name = options.name || '';
    this.color = options.color || PRESETS.default.color;
    this.gradient = options.gradient || PRESETS.default.gradient;
    this.renderer = options.renderer || null;
    this.scene = options.scene;
    this.speedOffset = Math.random() * 2.0;
    this.init();
  }

  init() {
    const dpi = this.renderer.getPixelRatio();
    this.titleTexture = new TextTexture({
      width: this.titleSize.x,
      height: this.titleSize.y,
      dpi: dpi,
    });

    this.eventsService.on('setTrackState', (data) => {
      this.updateState(data.state, data.secondary);
    });

    this.uniforms = {
      tAudioData: { value: this.makeDataTexture(this.resolution) },
      tEqData: { value: this.makeDataTexture(this.bufferLength) },
      iResolution: { value: new Vector2( this.renderer.domElement.width, this.renderer.domElement.height ) } ,
      iGlobalTime: { type: 'f', value: Math.random() * 10 },
      amplitude: { type: 'f', value: this.amplitude },
      numBins: { type: 'f', value: this.resolution },
      layer: { type: 'f', value: this.layer },
      colorA: { type: 'vec3', value: new Vector3(this.color[0], this.color[1], this.color[2]) },
      colorB: { type: 'vec3', value: new Vector3(this.color[0], this.color[1], this.color[2]) },
      stillHeight: { type: 'f', value: this.stillHeight },
      offsetHeight: { type: 'f', value: this.offsetHeight },
      range1: { type: 'vec4', value: this.range1 },
      range2: { type: 'vec4', value: this.range2 },
      lowcut: { type: 'f', value: this.lowcut },
      showeq: { type: 'f', value: 0 },
      opacity: { type: 'f', value: this.opacity },
      period: { type: 'f', value: this.period },
      speed: { type: 'f', value: this.speed + this.speedOffset },
      nameDampDur: { type: 'f', value: 0.35 },
      nameDampMin: { type: 'f', value: 0.3 },
      bubble_pos: { type: 'vec2', value: new Vector2(0.5, -0.1) },
      bubble_r: { type: 'f', value: 0 },
      bubble_a: { type: 'f', value: 0 },
      // Title
      tTitle: {value: new CanvasTexture(this.titleTexture.canvas)},
      titleSize: { type: 'vec2', value: new Vector2(this.titleSize.x * dpi, this.titleSize.y * dpi) },
      titlePos: { type: 'vec2', value: new Vector2(0, 0) },
      titleColor: { type: 'vec4', value: new Vector4(
        this.titleColor[0],
        this.titleColor[1],
        this.titleColor[2],
        this.titleColor[3],
      )}, // Controls both color and opacity
      titleSpeed: { type: 'f', value: 1.0 },
    };
    this.uniforms.tTitle.value.needsUpdate = true;

    // Update name now that uniforms are defined
    this.updateName(this.name);

    this.materials = {
      gradient: new ShaderMaterial({
        transparent: true,
        uniforms: this.uniforms,
        vertexShader: vertexShader,
        fragmentShader: gradientFragmentShader(SHOW_EQ),
      })
    };

    // create the displayobject for this track
    const geometry = new PlaneBufferGeometry( 10, 10 );
    const plane = new Mesh(geometry, this.getMaterial('gradient'));
    plane.position.set(0, 0, -.01 * this.layer);

    plane.rotation.set(Math.PI / 180 * 1, 0, 0);
    this.displayObject = plane;

    if (this.options.gui) {
      this.setupGui();
    }

    // Apply the presets
    this.applyPreset(true);
  }

  getMaterial(fillType) {
    // TODO: Remove if we're not switching between material types
    // Material from dictionary
    if (this.materials[fillType]) {
      return this.materials[fillType];
    }
    // Return first material current fill type does not exist
    const keys = Object.keys(this.materials);
    if (keys.length) {
      return this.materials[keys[0]];
    }
    // No materials
    return null;
  }

  makeDataTexture(width, height = 1) {
    return new DataTexture(
      new Uint8Array(width * height * 3),
      width,
      height,
      RGBFormat,
      UnsignedByteType,
      UVMapping,
      RepeatWrapping,
      RepeatWrapping,
      LinearFilter,
      LinearFilter,
    );
  }

  setupGui() {
    const gui = this.options.gui;
    const material_keys = Object.keys(this.materials);
    this.guiData = {
      amplitude: this.amplitude,
      rangeX1: this.range1.x,
      rangeX2: this.range1.y,
      rangeY1: this.range1.z,
      rangeY2: this.range1.w,
      lowcut: this.lowcut,
      rangeX1_2: this.range2.x,
      rangeX2_2: this.range2.y,
      rangeY1_2: this.range2.z,
      rangeY2_2: this.range2.w,
      stillHeight: this.stillHeight,
      offsetHeight: this.offsetHeight,
      resolution: this.resolution,
      showeq: !!this.uniforms.showeq.value,
      smoothing: this.smoothing,
      fillType: material_keys.length ? material_keys[0] : '',
    };

    const _this = this;
    function effectChanger() {
      // update shader uniforms
      _this.set({
        amplitude: _this.guiData.amplitude,
        rangeX1: _this.guiData.rangeX1,
        rangeX2: _this.guiData.rangeX2,
        rangeY1: _this.guiData.rangeY1,
        rangeY2: _this.guiData.rangeY2,
        lowcut: _this.guiData.lowcut,
        rangeX1_2: _this.guiData.rangeX1_2,
        rangeX2_2: _this.guiData.rangeX2_2,
        rangeY1_2: _this.guiData.rangeY1_2,
        rangeY2_2: _this.guiData.rangeY2_2,
        stillHeight: _this.guiData.stillHeight,
        offsetHeight: _this.guiData.offsetHeight,
        resolution: _this.guiData.resolution,
        showeq: _this.guiData.showeq,
        fillType: _this.guiData.fillType,
      });
    }

    function smoothingChanger() {
      _this.smoothing = _this.guiData.smoothing;
    }

    // add folders per track
    const f = gui.addFolder('Track ' + this.id);
    f.add(this.guiData, 'amplitude', 0.0, 1.0, .001).onChange( effectChanger );
    f.add(this.guiData, 'rangeX1', 0.0, 1.0, .001).onChange( effectChanger );
    f.add(this.guiData, 'rangeX2', 0.0, 1.0, .001).onChange( effectChanger );
    f.add(this.guiData, 'rangeY1', 0.0, 1.0, .001).onChange( effectChanger );
    f.add(this.guiData, 'rangeY2', 0.0, 1.0, .001).onChange( effectChanger );
    f.add(this.guiData, 'lowcut', 0.0, 1.0, .001).onChange( effectChanger );
    f.add(this.guiData, 'rangeX1_2', 0.0, 1.0, .001).onChange( effectChanger );
    f.add(this.guiData, 'rangeX2_2', 0.0, 1.0, .001).onChange( effectChanger );
    f.add(this.guiData, 'rangeY1_2', 0.0, 1.0, .001).onChange( effectChanger );
    f.add(this.guiData, 'rangeY2_2', 0.0, 1.0, .001).onChange( effectChanger );
    f.add(this.guiData, 'stillHeight', 0.0, 0.25, .001).onChange( effectChanger );
    f.add(this.guiData, 'offsetHeight', 0.0, 0.5, 0.001).onChange( effectChanger );
    f.add(this.guiData, 'resolution', [2, 4, 8, 16, 32, 64, 128, 256]).onChange( effectChanger );
    f.add(this.guiData, 'showeq').onChange( effectChanger );
    f.add(this.guiData, 'smoothing', 0.0, 1.0, 0.001).onChange( smoothingChanger );
    f.add(this.guiData, 'fillType', Object.keys(this.materials)).onChange( effectChanger );
    this.guiFolder = f;
  }

  getPreset() {
    // Find Preset
    let key = 'guitar';
    if (this.id === 2) {
      key = 'drums';
    } else if (this.id === 3) {
      key = 'bass';
    } else if (this.id === 4) {
      key = 'keyboard';
    } else if (this.id === 5) {
      key = 'bonus';
    }
    const keyDefault = (PRESETS[key] && PRESETS[key].default) ? PRESETS[key].default : {};
    const keyState = (PRESETS[key] && PRESETS[key][this.state]) ? PRESETS[key][this.state] : {};
    const keyStateSecondary = (this.state_secondary
      && PRESETS[key]
      && PRESETS[key][this.state_secondary])
        ? PRESETS[key][this.state_secondary] : {};
    const preset = objectAssign({}, PRESETS.default, keyDefault, keyState, keyStateSecondary);
    return preset;
  }

  applyPreset(hard = false) {
    const preset = this.getPreset();
    // Apply Preset
    this.set(preset, hard);

    // UPDATE GUI
    if (this.guiFolder) {
      this.guiData.amplitude = this.amplitude;
      this.guiData.rangeX1 = this.range1.x;
      this.guiData.rangeX2 = this.range1.y;
      this.guiData.rangeY1 = this.range1.z;
      this.guiData.rangeY2 = this.range1.w;
      this.guiData.lowcut = this.lowcut;
      this.guiData.rangeX1_2 = this.range2.x;
      this.guiData.rangeX2_2 = this.range2.y;
      this.guiData.rangeY1_2 = this.range2.z;
      this.guiData.rangeY2_2 = this.range2.w;
      this.guiData.stillHeight = this.stillHeight;
      this.guiData.offsetHeight = this.offsetHeight;
      this.guiData.resolution = this.resolution;
      this.guiData.showeq = !!this.uniforms.showeq.value;
      this.guiData.smoothing = this.smoothing;
      this.guiData.fillType = this.fillType;
      for (let i = 0; i < this.guiFolder.__controllers.length; i++) {
        this.guiFolder.__controllers[i].updateDisplay();
      }
    }
  }

  onResize() {
    const dpi = this.renderer.getPixelRatio();
    this.uniforms.iResolution.value.x = this.renderer.domElement.width;
    this.uniforms.iResolution.value.y = this.renderer.domElement.height;
    this.uniforms.titleSize.value.x = this.titleSize.x * dpi;
    this.uniforms.titleSize.value.y = this.titleSize.y * dpi;
    this.updateName(this.name);
  }

  set(options, hard = false) {
    // console.log('Set options track id', this.id, options);
    options = options || {};

    // chack gradient fill and reassign
    if (options.name) {
      this.updateName(options.name);
    }

    if (options.analyser) {
      this.analyser = options.analyser;
      const bufferLength = this.analyser.frequencyBinCount;
      // this.analyser.minDecibels = -100;
      this.analyser.maxDecibels = 0;
      this.analyser.smoothingTimeConstant = 0.94;
      this.fftArray = new Uint8Array(bufferLength);
      this.bufferLength = bufferLength;
      this.state = 'on';
      this.applyPreset();
    }

    if (options.resolution) {
      const resolution = parseInt(options.resolution, 10);
      if (this.resolution !== resolution) {
        this.resolution = resolution;
        this.uniforms.tAudioData.value = this.makeDataTexture(this.resolution);
        this.uniforms.numBins.value = this.resolution;
      }
    }

    if (options.amplitude !== undefined) {
      this.amplitude = options.amplitude;
      this.tweenShaderAmplitude(hard ? 0 : undefined);
    }

    if (options.color) {
      this.color = options.color;
      this.tweenShaderColors(hard ? 0 : undefined);
    }

    if (options.gradient) {
      this.gradient = options.gradient;
      this.tweenShaderColors(hard ? 0 : undefined);
    }

    if (options.titleColor) {
      this.titleColor = options.titleColor;
      this.tweenShaderTitleColor(hard ? 0 : undefined);
    }

    if (options.opacity !== undefined) {
      this.opacity = options.opacity;
      this.tweenShaderOpacity(hard ? 0 : undefined);
    }

    if (options.stillHeight !== undefined) {
      this.stillHeight = options.stillHeight;
      // this.uniforms.stillHeight.value = options.stillHeight;
      this.tweenShaderStillHeight(hard ? 0 : undefined);
    }

    if (options.offsetHeight !== undefined) {
      this.offsetHeight = options.offsetHeight;
      // this.uniforms.offsetHeight.value = options.offsetHeight;
      this.tweenShaderOffsetHeight(hard ? 0 : undefined);
    }

    if (options.rangeX1 !== undefined) {
      this.range1.x = options.rangeX1;
    }

    if (options.rangeX2 !== undefined) {
      this.range1.y = options.rangeX2;
    }

    if (options.rangeY1 !== undefined) {
      this.range1.z = options.rangeY1;
    }

    if (options.rangeY2 !== undefined) {
      this.range1.w = options.rangeY2;
    }

    if (options.fillType !== undefined) {
      if (this.fillType !== options.fillType) {
        this.fillType = options.fillType;
        this.tweenShaderColors();
      }
    }

    if (options.lowcut !== undefined) {
      this.lowcut = options.lowcut;
      this.tweenShaderLowcut(hard ? 0 : undefined);
    }

    if (options.rangeX1_2 !== undefined) {
      this.range2.x = options.rangeX1_2;
    }

    if (options.rangeX2_2 !== undefined) {
      this.range2.y = options.rangeX2_2;
    }

    if (options.rangeY1_2 !== undefined) {
      this.range2.z = options.rangeY1_2;
    }

    if (options.rangeY2_2 !== undefined) {
      this.range2.w = options.rangeY2_2;
    }

    if (options.showeq !== undefined) {
      this.uniforms.showeq.value = options.showeq ? 1 : 0;
    }

    if (options.period !== undefined) {
      this.period = options.period;
      this.tweenShaderPeriod();
    }

    if (options.speed !== undefined) {
      this.speed = options.speed;
      this.tweenShaderSpeed();
    }

    if (options.smoothing !== undefined) {
      this.smoothing = options.smoothing;
    }

    if (options.titleSpeed !== undefined) {
      this.tweenShaderTitleSpeed(options.titleSpeed);
    }

    if (options.fake !== undefined) {
      if (this.fake.state !== options.fake) {
        this.tweenFake(options.fake);
      }
    }
  }

  // tween the stillHeight property to flatten out the curve wave
  removeWaveCurve() {
    this.state_secondary = 'maxout';
    this.applyPreset();
  }

  lowcutTweenComplete() {
    setTimeout(function() {
      this.state_secondary = this.has_bonus ? 'bonus' : '';
      this.applyPreset();
    }.bind(this), 300);
  }

  // tween to show 5 tracks
  showFiveTracks() {
    this.state_secondary = 'bonus';
    this.has_bonus = true;
    if ( this.id === 5 ) {
      this.scene.add( this.displayObject );
    } else {
      this.applyPreset();
    }
  }

  hideFiveTracks() {
    this.state_secondary = '';
    this.has_bonus = false;
    if ( this.id === 5 ) {
      this.updateName('');
    } else {
      // Restore to regular position
      this.applyPreset();
    }
  }

  onHideFiveTracksComplete() {
    if ( this.id === 5 ) {
      this.scene.remove( this.displayObject );
    }
  }

  pickColors() {
    if (this.fillType === 'flat') {
      return [this.color, this.color];
    } else if (this.fillType === 'gradient') {
      return this.gradient;
    }
  }


  releaseBubble(x = 0.5, duration = 3.0) {
    if (this.bubbleAnim) {
      this.bubbleAnim.kill();
    }

    const anim = new TimelineMax();
    anim.set(this.uniforms.bubble_pos.value, { x: x });

    anim.fromTo(this.uniforms.bubble_pos.value, duration,
      {
        y: -0.1
      }, {
        y: 1.1,
        ease: Power2.easeInOut,
      }, 0);

    anim.fromTo(this.uniforms.bubble_r, duration,
      {
        value: 0
      }, {
        value: 0.055,
        ease: Power2.easeOut,
      }, 0);

    this.bubbleAnim = anim;
  }

  tweenShaderColors(duration = 7.3, ease = Power4.easeOut) {
    // Kill Existing Tweens
    TweenMax.killTweensOf(this.uniforms.colorA.value);
    TweenMax.killTweensOf(this.uniforms.colorB.value);
    // Pick Colors
    const colors = this.pickColors();
    // Animation Settings
    const settingsA = {
      x: colors[0][0],
      y: colors[0][1],
      z: colors[0][2],
      ease,
    };
    const settingsB = {
      x: colors[1][0],
      y: colors[1][1],
      z: colors[1][2],
      ease,
    };
    // Animate
    TweenMax.to(this.uniforms.colorA.value, duration, settingsA);
    TweenMax.to(this.uniforms.colorB.value, duration, settingsB);
  }

  tweenShaderTitleColor(duration = 3.5, ease = Power4.easeOut) {
    // Kill Existing Tweens
    TweenMax.killTweensOf(this.uniforms.titleColor.value);
    // Animate
    TweenMax.to(this.uniforms.titleColor.value, duration, {
      x: this.titleColor[0],
      y: this.titleColor[1],
      z: this.titleColor[2],
      w: this.titleColor[3],
      ease,
    });
  }

  tweenShaderAmplitude(duration = 7.3, ease = Power4.easeOut) {
    // Kill Existing Tweens
    TweenMax.killTweensOf(this.uniforms.amplitude);
    // Animate
    TweenMax.to(this.uniforms.amplitude, duration, {
      value: this.amplitude,
      ease,
    });
  }

  tweenShaderOpacity(duration = 7.3, ease = Power4.easeOut) {
    // Kill Existing Tweens
    TweenMax.killTweensOf(this.uniforms.opacity);
    // Animate
    TweenMax.to(this.uniforms.opacity, duration, {
      value: this.opacity,
      ease,
    });
  }

  tweenShaderPeriod(duration = 7.3, ease = Power4.easeOut) {
    // Kill Existing Tweens
    TweenMax.killTweensOf(this.uniforms.period);
    // Animate
    TweenMax.to(this.uniforms.period, duration, {
      value: this.period,
      ease,
    });
  }

  tweenShaderSpeed(duration = 7.3, ease = Power4.easeOut) {
    // Kill Existing Tweens
    TweenMax.killTweensOf(this.uniforms.speed);
    // Animate
    const speed = this.speed + this.speedOffset;
    TweenMax.to(this.uniforms.speed, duration, {
      value: speed,
      ease,
    });
  }

  tweenShaderOffsetHeight(duration = 1.0, ease = Power3.easeOut, onComplete = () => {}) {
    // Kill Existing Tweens
    TweenMax.killTweensOf(this.uniforms.offsetHeight);

    // Overwrite Defaults
    // All of state transition details should be settable via presets
    if (this.id === 5 && this.offsetHeight === 0.08) {
      duration = 1.5;
      onComplete = this.onHideFiveTracksComplete.bind(this);
    }

    // Animate
    TweenMax.to(this.uniforms.offsetHeight, duration, {
      value: this.offsetHeight,
      ease,
      onComplete,
    });

    // Make sure the name is the right size
    this.updateName(this.name);
  }

  tweenShaderTitleSpeed(to, duration = 1.0, ease = Power3.easeInOut) {
    this.uniforms.titleSpeed.value = to;
    return;
    // Kill Existing Tweens
    // TweenMax.killTweensOf(this.uniforms.titleSpeed);
    // Animate
    // TweenMax.to(this.uniforms.titleSpeed, duration, {
    //   value: to,
    //   ease,
    // });
  }

  tweenShaderStillHeight(duration = 1.0, ease = Power3.easeOut) {
    // Kill Existing Tweens
    TweenMax.killTweensOf(this.uniforms.stillHeight);
    // Animate
    TweenMax.to(this.uniforms.stillHeight, duration, {
      value: this.stillHeight,
      ease,
    });
  }

  tweenShaderLowcut(duration = 0.5, ease = Power2.easeOut, onComplete = () => {}) {
    // Kill Existing Tweens
    TweenMax.killTweensOf(this.uniforms.lowcut);
    let delay = 0;
    if (this.lowcut === 0) {
      delay = 0.5;
    } else {
      onComplete = this.lowcutTweenComplete.bind(this);
    }
    // Animate
    TweenMax.to(this.uniforms.lowcut, duration, {
      value: this.lowcut,
      ease: ease,
      onComplete,
      delay,
    });
  }

  tweenFake(val, duration = 1.5, ease = Power3.easeOut) {
    this.fake.state = val;

    // Kill Existing Tweens
    TweenMax.killTweensOf(this.fake);
    /*
      The bass track looks better at resolution 8 when it has real data,
      and at resolution 32 when it has fake data. Switch resolution at:
      - End of animation if going from 1 to 0
      - Before the animation if going from 0 to 1
    */
    let onComplete  = function() {};
    if (this.id === 3 && val === 0) {
      onComplete = function() {
        this.set({ resolution: 8 });
      }.bind(this);
    }
    if (this.id === 3 && val === 1) {
      this.set({ resolution: 32 });
    }
    // Animate
    TweenMax.to(this.fake, duration, {
      value: val,
      ease,
      onComplete: onComplete
    });
  }


  reset() {
    this.analyser = false;
    this.state = 'default';
    // Get this track's default:
    this.applyPreset();
  }

  easeAudioTexture() {
    for ( let i = 0; i < this.resolution; i++ ) {
      const c = this.uniforms.tAudioData.value.image.data[ i * 3 ];
      const v = 0;
      this.uniforms.tAudioData.value.image.data[ i * 3 ] += (v - c) * this.smoothing ;
    }
  }

  fakeAudioTexture(strength) {
    // Generated Simplex Noise based data
    const max = 127;
    let speed = 0.25;
    let m = 5.0;
    let n = 9.0;
    if (this.id === 3) {
      speed = 0.4;
      m = 6.0;
      n = 28.0;
    }
    for ( let i = 0; i < this.resolution; i++ ) {
      const c = this.uniforms.tAudioData.value.image.data[ i * 3 ];
      let v = this.simplex.noise3D(m * i / this.resolution, n, this.uniforms.iGlobalTime.value * speed);
      v = (v + 1.0) / 2.0;
      if (this.id === 3) {
        v *= v;
      }
      v = max * v;
      v = v * strength;
      this.uniforms.tAudioData.value.image.data[ i * 3 ] += (v - c) * this.smoothing ;
    }
  }

  getFFTValue(p, range, w, h, l) {
    let v = 0;
    if (h > 0) {
      const index = Math.min(l - 1, Math.max(0, Math.floor(l * (range.x + p * w))));
      v = this.fftArray[ index ] / 255;
      if (v < this.lowcut) {
        v = 0;
      }
      // Cut off bottom
      v = Math.max(v - range.z, 0);
      // Scale to the new box
      v = Math.min(255 * v / h, 255);
    }
    return v;
  }

  updateAudioTexture() {
    const l =  this.fftArray.length;
    const w1 = this.range1.y - this.range1.x;
    const h1 = this.range1.w - this.range1.z;
    const w2 = this.range2.y - this.range2.x;
    const h2 = this.range2.w - this.range2.z;
    for ( let i = 0; i < this.resolution; i++ ) {
      // For each item in the resolution find a corresponding value in the fftArray
      const p = i / this.resolution;
      // Range 1
      const v1 = this.getFFTValue(p, this.range1, w1, h1, l);
      // Range 2
      const v2 = this.getFFTValue(p, this.range2, w2, h2, l);
      // Combine ranges and smooth out
      const v = Math.min(v1 + v2, 255);
      const c = this.uniforms.tAudioData.value.image.data[ i * 3 ];
      // Set value
      this.uniforms.tAudioData.value.image.data[ i * 3 ] += (v - c) * this.smoothing;
    }
  }

  tick(timeDelta) {
    this.uniforms.iGlobalTime.value = timeDelta / 1000;
    if (!this.analyser || this.fake.value) {
      if (this.fake.value > 0) {
        this.fakeAudioTexture(this.fake.value);
      } else {
        this.easeAudioTexture();
      }
      this.uniforms.tAudioData.value.needsUpdate = true;
      return;
    }

    // Get analysis data
    this.analyser.getByteFrequencyData(this.fftArray);

    // Transfer all data to our data texture so we can use it in the fragment shader
    this.updateAudioTexture();
    this.uniforms.tAudioData.value.needsUpdate = true;

    if (SHOW_EQ) {
      for ( let i = 0; i < this.fftArray.length; i ++ ) {
        this.uniforms.tEqData.value.image.data[ i * 3 ] = this.fftArray[i];
      }
      this.uniforms.tEqData.value.needsUpdate = true;
    }
  }

  updateName(name) {
    // Name Style
    name = (name.length > 0) ? name[0].toUpperCase() + name.slice(1) : '';
    this.name = name;
    this.titleTexture.setText(this.name, this.getNameStyle());
    this.uniforms.tTitle.value.needsUpdate = true;

    // Name Offset
    const offset = this.getNameOffset();
    const dpi = this.renderer.getPixelRatio();
    this.uniforms.titlePos.value.x = offset.x * dpi;
    this.uniforms.titlePos.value.y = offset.y * dpi;
  }

  getNameStyle() {
    if (window.innerWidth < 500 && window.innerHeight > window.innerWidth) {
      return {
        fontSize: 25
      };
    }

    return {
      fontSize: Math.max(18, Math.min(55, window.innerHeight * this.offsetHeight * 0.45))
    };
  }

  getNameOffset() {
    return new Vector2(
      Math.max(12, window.innerHeight * this.offsetHeight * 0.15),
      window.innerHeight * this.offsetHeight * 0.2
    );
  }

  updateState(state, secondary = '') {
    this.state = state;
    this.state_secondary = secondary;
    this.applyPreset();
  }
}
