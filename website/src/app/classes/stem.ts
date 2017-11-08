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

import Player from 'tone';
import {Track} from "../interfaces/track";
import {TweenMax} from 'gsap';
import {MockTracks} from "../mock/tracks";

export class Stem {
  public id: string;
  public slug: string;
  public type: string;
  public name: string;
  public genre: string;
  public url: string;
  public bars: number;
  public tempo: number;
  public currentPosition: number;
  public playing: boolean;
  public track: Track;
  public player: Player;
  public loaded: boolean;
  public volume: number = 0;
  public MAX_VOLUME: number = 10;
  public MIN_VOLUME: number = -55;
  public tracks: Array<Track>;
  public loop: boolean;
  public loopStart: number = 0;
  public loopEnd: number;
  public loopDuration: number;
  public instrument: string;
  public tag: string;

  constructor(data) {
    this.tracks = MockTracks;
    this.slug = data.slug || null;
    this.id = data.id || null;
    this.type = data.type || null;
    this.name = data.name || null;
    this.genre = data.genre || null;
    this.url = data.url || null;
    this.bars = data.bars || null;
    this.tempo = data.tempo || null;
    this.loopEnd = data.loopEnd || null;
    this.loopStart = data.loopStart || 0;
    this.loop = data.loop || true;
    this.loopDuration = data.loopDuration || true;
    this.instrument = data.instrument || 'bonus';
    this.tag = data.tag || null;
    this.volume = data.volume || 0;

    this.track = this.tracks.find((track: Track) => {
      return track.slug === this.type;
    });
  }

  setVolume(volume, fadeTime: number = 0.25): Promise<any> {
    return new Promise((resolve) => {
      this.volume = volume;
      TweenMax.to(this.player.volume, fadeTime, {
        value: volume,
        onComplete: resolve
      });
    });
  }

  getDisplayName() {
    // let tag = (this.tag) ? this.capitalizeFirstLetter(this.tag) + ' ' : '';
    // let intrument = this.capitalizeFirstLetter(this.instrument);
    // if (this.tag === this.instrument) {
    //   return tag;
    // }
    //return tag + intrument;
    return this.instrument;
  }

  getDisplayVolume() {
    let map = (x, in_min, in_max, out_min, out_max) => {
      return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    };

    let volume = map(this.volume, this.MIN_VOLUME, this.MAX_VOLUME, 0, 100);
    //round to nearest 5th:
    return Math.ceil(volume / 5) * 5;
  }

  increaseVolume() {
    this.volume += 10;
    this.volume = (this.volume < this.MAX_VOLUME) ? this.volume : this.MAX_VOLUME;
    this.setVolume(this.volume);
  }

  decreaseVolume() {
    this.volume -= 10;
    this.volume = (this.volume > this.MIN_VOLUME) ? this.volume : this.MIN_VOLUME;
    this.setVolume(this.volume);
  }

  mute() {
    if (this.player) {
      TweenMax.to(this.player.volume, 0.25, {value: this.MIN_VOLUME});
    }
  }

  unmute() {
    if (this.player) {
      TweenMax.to(this.player.volume, 0.25, {value: this.volume});
    }
  }

  getQuarterNotes(): number {
    return this.bars * 4;
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}
