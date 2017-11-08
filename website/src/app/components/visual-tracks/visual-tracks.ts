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

import {Scene, WebGLRenderer, PerspectiveCamera, Texture , DoubleSide,
  PlaneBufferGeometry, ShaderMaterial, Mesh} from 'three';
import {VisualTrack} from './visual-track';
import {EventsService} from '../../services/events.service';

import * as DAT from 'dat.gui/build/dat.gui.js';

export class VisualTracks {
   public options;
   public numberTracks;
   public backgroundColor;
   public canvas;
   public tracks;
   public scene;
   public renderer;
   public camera;
   public frames;
   public activeFrame;
   public images;
   public overlay;
   public isOverlayActive;
   public startTime;
   public trackNames;
   public frameCount = 0;
   public perfTime = 0;
   public raf;

  constructor(options, private eventsService?: EventsService) {
    this.options = options || {};
    this.numberTracks = 5; // options.numberTracks || 4;
    this.trackNames = ['Guitar', 'Drums', 'Bass', 'Keyboard', ''];
    this.backgroundColor = options.backgroundColor || 0x000000;
    this.canvas = options.canvas;
    this.tracks = [];
    this.scene = options.scene;
    this.renderer = options.renderer;
    this.camera = options.camera;
    this.isOverlayActive = false;
    this.init();
  }

  init() {
    // set up threejs and canvas
    this.scene = new Scene();
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
    });
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.setClearColor( this.backgroundColor );
    this.renderer.setPixelRatio( Math.min(2, window.devicePixelRatio) );
    this.camera = new PerspectiveCamera( 45, window.innerWidth / window.innerHeight, .01, 1000 );
    this.camera.position.set( 0, 0, .5 );
    // Handle WebGL lifecycle evenets
    this.renderer.domElement.addEventListener('webglcontextlost', this.stopAnimation.bind(this));
    this.renderer.domElement.addEventListener('webglcontextrestored', this.startAnimation.bind(this));

    // TODO: Do not initiate dat.gui when in production
    // set up dat.gui handler
    const gui = new DAT.GUI();
    gui.domElement.parentElement.style.zIndex = 100;

    // make tracks
    for (let i = 1; i <= this.numberTracks; i++) {
      // add tracks
      const track = new VisualTrack({
        id: i,
        layer: i,
        renderer: this.renderer,
        scene: this.scene,
        name: this.trackNames[i - 1],
        gui: gui
      }, this.eventsService);
      this.tracks[i] = track;
      // add the track to the scene
      if ( i !== 5 ) {
        this.scene.add(track.displayObject);
      }
    }
    gui.close();

    // listen for resize of window / canvas
    window.addEventListener('resize', this.onResize.bind(this));

    this.startAnimation();

    window.addEventListener('keyup', (e) => {
      if (e.key === 'b') {
        this.tracks[Math.floor(Math.random()*4) + 1.0].releaseBubble(0.1 + 0.8 * Math.random());
      }
    });
  }

  showFiveTracks() {
    for (let c = 1; c < this.tracks.length; c++) {
      this.tracks[c].showFiveTracks();
    }
  }

  hideFiveTracks() {
    for (let c = 1; c < this.tracks.length; c++) {
      this.tracks[c].hideFiveTracks();
    }
  }

  removeAllTracks() {
    for (let c = 1; c < this.tracks.length; c++) {
      this.tracks[c].removeWaveCurve();
    }
  }

  addAllTracks() {
    for (let c = 1; c < this.tracks.length; c++) {
      this.tracks[c].removeWaveCurve();
    }
  }

  onResize() {
    // assuming the canvas is the whole window, alter if it is not going to be
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    // let tracks know there is a new size
    for (let c = 1; c < this.tracks.length; c++) {
      this.tracks[c].onResize();
    }
  }

  startAnimation() {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
    }
    this.startTime = Date.now();
    this.animate();
  }

  stopAnimation() {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
    }
  }

  animate() {
    // Measure Performance
    // this.frameCount++;
    // const now = performance.now();
    // if (this.frameCount % 60 === 0) {
    //   console.log(now - this.perfTime);
    // }
    // this.perfTime = now;

    this.raf = requestAnimationFrame(this.animate.bind(this));
    const d = Date.now() - this.startTime;
    // update the uniforms of each track as required
    for (let c = 1; c < this.tracks.length; c++) {
      this.tracks[c].tick(d);
    }
    this.render();
  }

  render() {
    this.renderer.render( this.scene, this.camera );
  }

  getCanvas() {
    return this.canvas;
  }

  getFrameData() {
    const frameData = this.frames[this.activeFrame];
    if (!frameData) {
      return;
    }
    return frameData;
  }

  getImage(frameData) {
    if (!frameData) {
      return;
    }
    const imageIndex = frameData[4];
    const image = this.images[imageIndex];
    if (!image) {
      return;
    }
    return image;
  }
}
