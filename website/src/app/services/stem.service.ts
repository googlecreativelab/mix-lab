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

import {Injectable} from "@angular/core";
import {Http} from "@angular/http";
import {Stem} from "../classes/stem";
import {environment} from "../../environments/environment";


@Injectable()
export class StemService {

  constructor(public http: Http) {}
  public API_URL: string = environment.look_up_api_path;
  public MAX_TEMPO: number = 160;
  public MIN_TEMPO: number = 60;
  public NORMAL_TEMPO: number = 115;
  public tempo: number = this.NORMAL_TEMPO;
  public genre: string = '';
  public stemLoadedCount: number = 0;

  getStem(instrument: string, genre: string = null, id: string = null, exclude: string = '') {
    let targetGenre;

    return new Promise((resolve, reject) => {
      //targetGenre = (!genre) ? this.genre: genre;

      this.http.post(
        this.API_URL + 'lookup',
        [{
          instrument: instrument,
          tag: genre,
          bpm: this.tempo,
          id: id,
          exclude: exclude,
          loop: true
        }]
      ).map(res => res.json()).subscribe((response) => {
        if (response.length > 0) {

          if (response[0].error && response[0].error === 'NO MATCHING RESULTS') {
            let suggestions = [];
            if (response[0].suggestions) {
              response[0].suggestions.forEach((suggestion) => {
                let tag = suggestion.tag;
                tag = (tag === 'r and b') ? 'r&b' : tag;
                suggestions.push(tag + ' ' + suggestion.instrument);
              });
            }
            reject({suggestions: suggestions});
          }

          genre = (genre) ? genre.toLowerCase() : '';
          if (
              response[0].file &&
              response[0].file.mp3 &&
              response[0].file.mp3 !== ''
          ) {
            if (genre) {
              this.genre = genre
            }
            this.stemLoadedCount++;

            // if (response[0].instrumentCategory.toLowerCase() === 'drums') {
            //   response[0].instrumentCategory = 'solo';
            // }
            this.tempo = response[0].bpm;
            let instrumentCategory = response[0].instrumentCategory.toLowerCase();
            instrumentCategory = (instrumentCategory === 'strings' || instrumentCategory === 'wind') ? 'bonus' : instrumentCategory;
            let stem : Stem = new Stem({
              id: response[0].id,
              slug: response[0].id + this.tempo + this.stemLoadedCount,
              type: instrumentCategory,
              instrument: response[0].instrument,
              genre: genre,
              tempo: response[0].bpm,
              bars: (response[0].bpm/60) * response[0].loopDuration /4,
              url: response[0].file.mp3,
              loop: response[0].loop,
              loopStart: response[0].loopStart,
              loopEnd: response[0].loopEnd,
              loopDuration: response[0].loopDuration,
              tag: response[0].tag
            });
            resolve(stem);
          } else {
            reject();
          }
        } else {
          reject();
        }
      });
    });
  }

  getSfx(phrase) {
    return new Promise((resolve) => {
      this.http.post(
        this.API_URL + 'lookup',
        [{
          sfx: phrase
        }]
      ).map(res => res.json()).subscribe((response) => {
        resolve(response);
      });
    });
  }

  // Return array of saved stems
  getSavedStems(stems: Array<any>) {
    return new Promise((resolve, reject) => {
      this.http.post(
        this.API_URL + 'lookup',
        stems
      ).map(res => res.json()).subscribe((response) => {
        if (response.length > 0) {
          let newStems = [];

          response.forEach((res, key) => {
            let instrumentCategory = res.instrumentCategory.toLowerCase();
            instrumentCategory = (instrumentCategory === 'strings' || instrumentCategory === 'wind') ? 'bonus' : instrumentCategory;
            this.tempo = res.bpm;
            let stem : Stem = new Stem({
              id: res.id,
              slug: res.id + this.tempo + this.stemLoadedCount,
              type: instrumentCategory,
              instrument: res.instrument,
              genre: res.genre,
              tempo: res.bpm,
              bars: (res.bpm/60) * res.loopDuration /4,
              url: res.file.mp3,
              loop: res.loop,
              loopStart: res.loopStart,
              loopEnd: res.loopEnd,
              loopDuration: res.loopDuration,
              tag: res.tag,
              volume: stems[key].volume || 0
            });
            newStems.push(stem);
          });
          resolve(newStems);
        } else {
          reject();
        }
      });
    });
  }

  getSong(tags: Array<string> ) {
    return new Promise((resolve, reject) => {
      this.http.post(
        this.API_URL + 'song',
        tags
      ).map(res => res.json()).subscribe((response) => {
        if (response.length > 0) {
          let newStems = [];
          response.forEach(res => {
            let instrumentCategory = res.instrumentCategory.toLowerCase();
            instrumentCategory = (instrumentCategory === 'strings' || instrumentCategory === 'wind') ? 'bonus' : instrumentCategory;
            this.tempo = res.bpm;
            let stem : Stem = new Stem({
              id: res.id,
              slug: res.id + this.tempo + this.stemLoadedCount,
              type: instrumentCategory,
              instrument: res.instrument,
              genre: res.genre,
              tempo: res.bpm,
              bars: (res.bpm/60) * res.loopDuration /4,
              url: res.file.mp3,
              loop: res.loop,
              loopStart: res.loopStart,
              loopEnd: res.loopEnd,
              loopDuration: res.loopDuration,
              tag: res.tag
            });
            newStems.push(stem);
          });
          resolve(newStems);
        } else {
          reject();
        }
      });
    });
  }

  // Save stems to hash
  save(stems, sfx?): Promise<any> {
    return new Promise((resolve, reject) => {
      // Reject if no stems
      if (!stems) { reject(); }

      let savedStem = {
        bpm: stems[0].tempo,
        volume: 0,
        loop: true,
        tracks: [],
        sfx: sfx,
      };

      stems.forEach((stem) => {
        let newStem = {
          id: stem.id,
          bpm: stem.tempo,
          volume: stem.volume
        };

        savedStem.tracks.push(newStem);
      });

      this.http.post(
        this.API_URL + 'hash',
        savedStem
      ).subscribe(res => {
        const hash = res.text();
        if (hash && hash.length > 0) {
          resolve(hash)
        }
      });
    });
  }

  // Load stems from hash
  load(hashID): Promise<any> {
    return new Promise((resolve, reject) => {
      // Reject if no stems
      if (!hashID) { reject(); }

      this.http.get(
        this.API_URL + `hash/${hashID}`
      ).subscribe((res) => {
        if (res) {
          const result = res.json();
          resolve(result);
        }
      })
    });
  }

  decreaseTempo() {
    this.tempo -= 15;
    this.tempo = (this.tempo >= this.MIN_TEMPO) ? this.tempo : this.MIN_TEMPO;
  }

  increaseTempo() {
    this.tempo += 15;
    this.tempo = (this.tempo <= this.MAX_TEMPO) ? this.tempo : this.MAX_TEMPO;
  }
}
