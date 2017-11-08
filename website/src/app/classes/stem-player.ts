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

import {Tone, Synth, Sampler, Sequence, Player, Transport, TransportTime, Analyser, Time, Master, now} from 'tone'
import TweenMax from 'gsap';
import {Stem} from "./stem"

export class StemPlayer {

  public synth;
  public stems: Object = {};
  private volumeTimeout;

  constructor() {
    this.synth = new Synth().toMaster();
    Transport.start();
    //this.synth.triggerAttackRelease('C4', 0.5);
  }

  loadTrack(stem: Stem) {
    return new Promise((resolve) => {
      let fft = new Analyser('waveform', 1024);
      stem.player = new Player(
        stem.url, () => {
          stem.player.loopStart = stem.loopStart;
          stem.player.loopEnd = stem.loopEnd;
          stem.player.loop = stem.loop;
          if (Transport.state === 'stopped') {
            Transport.start(now() + stem.loopStart, 0);
            stem.player.start(now(), 0);
          } else {
            stem.player.volume.value = -100;
            stem.player.volume.rampTo(stem.volume, 1);
            const offset = Transport.seconds % stem.loopDuration;
            stem.player.start(now(), offset + stem.loopStart);
          }
          this.stems[stem.slug] = stem;
          resolve({stem: stem, analyser: fft._analyser});
        }).fan(fft).toMaster();
    });
  }

  playOneOff(url: string) {
    return new Promise((resolve) => {
      let player = new Player({url: url, autostart: true, onload: () => {
        resolve(player.buffer.duration);
      }}).toMaster();
    });
  }

  remove(stem: Stem) {
    stem.setVolume(stem.MIN_VOLUME, 1.3).then(() => {
      stem.player.dispose();
      delete this.stems[stem.slug];
    });
  }

  getTracksByType(type, currentTrackSlug) {
    let matches = [];
    Object.entries(this.stems).forEach(([key, stem]) => {
      if (
        stem.type === type &&
        stem.slug !== currentTrackSlug
      ) {
        matches.push(stem);
      }
    });
    return matches;
  }

  setVolume(volume: number) {
    TweenMax.to(Master.volume, 0.5, {value: volume});
  }

  pause() {
    clearTimeout(this.volumeTimeout);
    Object.entries(this.stems).forEach(([key, stem]) => {
      stem.player.volume.rampTo(-100, 0.5);
    });
    this.volumeTimeout = setTimeout(() => {
      Object.entries(this.stems).forEach(([key, stem]) => {
        stem.player.stop();
        stem.playing = false;
      });
    }, 500);
  }

  resume() {
    clearTimeout(this.volumeTimeout);
    Object.entries(this.stems).forEach(([key, stem]) => {
      const offset = Transport.seconds % stem.loopDuration;
      stem.player.start(now(), offset + stem.loopStart);
      stem.player.volume.value = -100;
      stem.player.volume.rampTo(stem.volume, 0.5);
    });
  }

}
