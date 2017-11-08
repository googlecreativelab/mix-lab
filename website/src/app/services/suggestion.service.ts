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
import {SuggestedGenres, SuggestedInstruments, SuggestedModifires, SuggestedSfx} from "../mock/suggestions";

@Injectable()
export class SuggestionService {
  public MODIFIERS = SuggestedModifires;
  public GENRES = SuggestedGenres;
  public INSTRUMENTS = SuggestedInstruments;
  public SOUND_FX = SuggestedSfx;
  public modifiers: Array<any>;
  public genres: Array<any>;
  public instruments: Array<any>;
  public sfx: Array<any>;
  public addedInstrumentTypes: Array<any> = [];
  public actionCount: number = 0;

  constructor() {
    this.instruments = this.INSTRUMENTS.slice();
    this.genres = this.GENRES.slice();
    this.modifiers = this.MODIFIERS.slice();
    this.sfx = this.SOUND_FX.slice();
  }

  getSuggestions() {
    let suggestionCount: number = 4;
    let suggestions: Array<any> = [];
    let showFxOdds = Math.floor(Math.random() * 2) + 1;
    let showModifierOdds = Math.floor(Math.random() * 2) + 1;
    let showBonusTrackOdds = Math.floor(Math.random() * 2) + 1;
    let showBonusTrack = (suggestionCount > 0 && showBonusTrackOdds === 2);
    let tracks = this.getEmptyTracks(showBonusTrack);

    tracks.forEach((instrument: string) => {
      let suggestedInstrument = this.getInstrumentSuggestion(instrument);
      if (suggestedInstrument) {
        suggestions.push(suggestedInstrument);
        suggestionCount--;
      }
    });

    if (suggestionCount > 0 && showModifierOdds === 2 && this.actionCount > 1) {
      // Get a modifier
      let suggestedModifer = this.getModifierSuggestion();
      if (suggestedModifer) {
        suggestions.push(suggestedModifer);
        suggestionCount--;
      }
    }

    if (suggestionCount > 0 && showFxOdds === 2 && this.actionCount > 2) {
      // Get a sound effect
      let soundFx = this.getSoundFx();
      if (soundFx) {
        suggestions.push(soundFx);
        suggestionCount--;
      }
    }

    //Fill up the rest with change genres for current tracks
    this.addedInstrumentTypes.forEach((name) => {
      let suggestion = this.getGenreSuggestion(name);
      if (suggestion && suggestionCount > 0) {
        suggestions.push(suggestion);
        suggestionCount--;
      }
    });
    return suggestions;
  }

  addHistory(history) {
    this.actionCount++;
    if (history.action === 'replaceInstrument' || history.action === 'addInstrument') {
      let match = this.instruments.findIndex((suggestion) => {
        return (
          suggestion.instrument === history.instrument &&
          suggestion.tag === history.genre
        );
      });
      if (match !== -1) {
        this.instruments.splice(match, 1);
        if (this.instruments.length === 0) {
          this.reloadInstruments();
        }
      }
      let matchGenre = this.genres.findIndex((suggestion) => {
        return (
          suggestion.instrument === history.instrument &&
          suggestion.tag === history.genre
        );
      });
      if (matchGenre !== -1) {
        this.genres.splice(match, 1);
        if (this.genres.length === 0) {
          this.reloadGenres();
        }
      }
    } else if (history.action === 'sfx') {
      let match = this.sfx.findIndex((suggestion) => {
        return (
          suggestion.sfx === history.sfx
        );
      });
      if (match !== -1) {
        this.sfx.splice(match, 1);
        if (this.sfx.length === 0) {
          this.reloadSfx();
        }
      }
    } else {
      let match = this.modifiers.findIndex((suggestion) => {
        return (suggestion.action === history.action);
      });

      if (match !== -1) {
        this.modifiers.splice(match, 1);
        if (this.modifiers.length === 0) {
          this.reloadModifiers();
        }
      }
    }
  }

  getInstrumentSuggestion(name: string, modify: boolean = false) {
    this.shuffle(this.instruments);
    return this.instruments.find((suggestion) => {
      return suggestion.type === name;
    });
  }

  getGenreSuggestion(name: string, modify: boolean = false) {
    this.shuffle(this.genres);
    return this.genres.find((suggestion) => {
      return suggestion.type === name;
    });
  }

  getSoundFx() {
    if (this.sfx.length > 0) {
      return this.sfx[Math.floor(Math.random() * this.sfx.length)];
    } else {
      return false;
    }
  }

  getModifierSuggestion() {
    if (this.modifiers.length > 0) {
      return this.modifiers[Math.floor(Math.random() * this.modifiers.length)];
    } else {
      return false;
    }
  }

  addInstrument(name: string) {
    this.removeInstrument(name);
    this.addedInstrumentTypes.push(name);
  }

  removeInstrument(name) {
    let index = this.addedInstrumentTypes.findIndex((track) => {
      return name === track;
    });
    if (index !== -1) {
      this.addedInstrumentTypes.splice(index, 1);
    }
  }

  getEmptyTracks(bonus: boolean = false) {
    let types = ['guitar', 'drums', 'bass', 'keyboard'];
    if (bonus) {
      types.push('bonus');
    }
    this.addedInstrumentTypes.forEach((track) => {
      let index = types.findIndex((name) => {
        return name === track;
      });
      if (index !== -1) {
        types.splice(index, 1);
      }
    });
    return types;
  }

  reloadSfx() {
    this.sfx = this.SOUND_FX.slice();
  }

  reloadInstruments() {
    this.instruments = this.INSTRUMENTS.slice();
  }

  reloadGenres() {
    this.genres = this.GENRES.slice();
  }

  reloadModifiers() {
    this.modifiers = this.MODIFIERS.slice();
  }

  shuffle(a: Array<any>) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  }
}
