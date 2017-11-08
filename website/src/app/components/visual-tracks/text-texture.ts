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

import objectAssign from 'object-assign';

const DEFAULTS = {
  background: 'black',
  color: 'red',
  fontFamily: '\'Poppins\', Helvetica, Arial, sans-serif', // Font family string
  fontSize: 50, // px
  fontWeight: 500,
  letterSpacing: 0, // px
  x: 2,
  y: 3,
};

export class TextTexture {
  public dpi = 1;
  public width;
  public height;
  public canvas;
  public ctx;
  public text = '';

  constructor(opts = {width: 512, height: 512, dpi: 1}) {
    if (opts.dpi !== undefined) {
      this.dpi = opts.dpi;
    }
    if (opts.width !== undefined) {
      this.width = opts.width;
    }
    if (opts.height !== undefined) {
      this.height = opts.height;
    }
    this.makeCanvas();
  }

  makeCanvas() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = this.width * this.dpi;
    this.canvas.height = this.height * this.dpi;
    this.fillColor();
    // Debug
    // window.document.body.appendChild(this.canvas);
    // this.canvas.style.position = 'fixed';
    // this.canvas.style.top = '0px';
    // this.canvas.style.left = '0px';
    // this.canvas.style.opacity = 0.5;
  }

  setDPI(dpi) {
    this.dpi = dpi;
    this.canvas.width = this.width * this.dpi;
    this.canvas.height = this.height * this.dpi;
  }

  fillColor(background = DEFAULTS.background) {
    // Fill in with black
    this.ctx.fillStyle = background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setText(text = '', options = {}) {
    this.text = text;
    // Options
    const opts = objectAssign({}, DEFAULTS, options);

    // Clear Drawing Space
    this.fillColor(opts.background);

    // Style Settings
    this.ctx.font = `${opts.fontWeight} ${opts.fontSize * this.dpi}px ${opts.fontFamily}`;
    this.ctx.fillStyle = opts.color;
    this.ctx.textBaseline = 'top';

    // Starting Position
    let x = opts.x * this.dpi;
    let y = opts.y * this.dpi;
    for (let i = 0; i < text.length; i++) {
      const c = text.charAt(i);
      this.ctx.fillText(c, x, y);
      x += this.ctx.measureText(c).width + opts.letterSpacing;
    }

    // Explicitly clear the top and right edges
    this.ctx.fillStyle = opts.background;
    this.ctx.fillRect(0, 0, this.canvas.width, 1);
    this.ctx.fillRect(this.canvas.width - 1, 0, 1, this.canvas.height);
  }
}
