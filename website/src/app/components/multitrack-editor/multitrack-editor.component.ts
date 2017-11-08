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

import {Component, ElementRef, OnInit, AfterViewInit, ViewChild, Output, EventEmitter } from '@angular/core';
import {StemPlayer} from "../../classes/stem-player";
import {VisualTracks} from "../visual-tracks/visual-tracks";
import {GUI} from 'dat.gui';
import {Stem} from "../../classes/stem"
import {Track} from "../../interfaces/track";
import {EventsService} from "../../services/events.service";
import {Intent} from "../../interfaces/intent";
import {StemService} from "../../services/stem.service";
import {SuggestionService} from "../../services/suggestion.service";
import {Angulartics2} from "angulartics2";
import indefiniteArticle from "indefinite-article"

declare var window;

// Constants
const SFXInterval = 5000;

@Component({
  selector: 'app-multitrack-editor',
  templateUrl: './multitrack-editor.component.html',
  styleUrls: ['./multitrack-editor.component.scss']
})
export class MultitrackEditorComponent implements OnInit, AfterViewInit {
  @ViewChild('visualTracksCanvas') canvasRef: ElementRef;
  public NUM_TRACKS: number = 4;
  public MAX_VOLUME: number = 10;
  public MIN_VOLUME: number = -25;
  public FEEDBACK_TIME: number = 1700;
  public multitracks;
  public visualTracks;
  public addedStems = [];
  public addedSFX = [];
  public tracks: Array<Track>;
  public volume: number = 0;
  public fifthTrackShowing: boolean;
  public button;
  public voiceButtonVisible: boolean = false;
  public isTouch: boolean;
  public showMobilePlay = false;
  public numberOfSuccessfulRequests: number = 0;
  public numberOfUnSuccessfulRequests: number = 0;
  public sfxTimeouts: Array<any> = [];
  public hideCanvas = false;
  public canAutoplay: boolean;

  constructor(
    public eventsService: EventsService,
    public stemService: StemService,
    public suggestionsService: SuggestionService,
    public angulartics2: Angulartics2
  ) {
    this.isTouch = 'ontouchstart' in document.documentElement;
    let AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioContextTest = new AudioContext();
    this.canAutoplay = (audioContextTest && audioContextTest.state === 'running');
  }

  ngOnInit() {
    this.eventsService.on('intent', (data: Intent) => {
      var matchingAddedStem: Stem;
      var excludedIds: string = '';
      if (data.action) {
        if (typeof data.parameters.instrument === 'string') {
          matchingAddedStem = this.addedStems.find((stem: Stem) => {
            return stem.instrument === data.parameters.instrument.toLowerCase();
          });
        }

        // Search for match by instrument if the first one didn't work
        if (!matchingAddedStem) {
          if (typeof data.parameters.instrument === 'string') {
            matchingAddedStem = this.addedStems.find((stem: Stem) => {
              return stem.type === data.parameters.instrument.toLowerCase();
            });
          }
        }

        if (data.parameters.sfx) {
          data.action = 'sfx'
        }
        let history = {action: data.action, instrument: '', genre: '', sfx: ''};
        if (data.parameters.instrument) {
          history.instrument = data.parameters.instrument;
        }
        if (data.parameters.genre) {
          history.genre = data.parameters.genre;
        }
        if (data.parameters.sfx) {
          history.sfx = data.parameters.sfx;
        }

        this.suggestionsService.addHistory(history);

        if (data.action !== 'input.unknown') {
          this.numberOfSuccessfulRequests++;
          this.angulartics2.eventTrack.next({ action: 'Intent', properties: { category: 'Successful_Action', label: this.numberOfSuccessfulRequests }});
        } else {
          this.numberOfUnSuccessfulRequests++;
          this.angulartics2.eventTrack.next({ action: 'Intent', properties: { category: 'Unsuccessful_Action', label: this.numberOfSuccessfulRequests }});
        }

        switch (data.action) {
          case 'sfx':
            this.stemService.getSfx(data.parameters.sfx).then((result) => {
              if (result && result[0].file) {
                if (!this.multitracks) {
                  this.multitracks = new StemPlayer();
                }
                this.fireAnalyticsIntentTag('SFX_Success', data, result);
                this.multitracks.playOneOff(result[0].file.mp3).then((duration) => {
                  this.showFxViz(duration);
                });
                this.addedSFX.push({
                  sfxId: result[0].sfxId,
                  loop: false,
                  tag: result[0].tag,
                });
                setTimeout(() => {
                  this.eventsService.broadcast('savedSFX', this.addedSFX);
                }, 300);
                this.eventsService.broadcast('actionHappened');
              }
            }).catch(() => {
              this.eventsService.broadcast('updateCommandText', {text: 'Couldn’t find one.', time: 1700});
              this.eventsService.broadcast('actionHappened');
              this.fireAnalyticsIntentTag('SFX_Fail', data);
            });
            break;
          case 'pause':
            this.eventsService.broadcast('updateCommandText', {text: 'You’re Paused', time: this.FEEDBACK_TIME});
            this.multitracks.pause();
            this.eventsService.broadcast('actionHappened');
            break;
          case 'resume':
            this.eventsService.broadcast('updateCommandText', {text: 'Resuming', time: this.FEEDBACK_TIME});
            this.multitracks.resume();
            this.eventsService.broadcast('actionHappened');
            break;
          case 'speedUp':
            this.eventsService.broadcast('updateCommandText', {text: 'Ok, making it faster.', time: this.FEEDBACK_TIME});
            this.stemService.increaseTempo();
            this.reloadStems();
            this.eventsService.broadcast('actionHappened');
            this.fireAnalyticsIntentTag('Speed_Up', data);
            break;
          case 'slowDown':
            this.eventsService.broadcast('updateCommandText', {text: 'Ok, making it slower.', time: this.FEEDBACK_TIME});
            this.stemService.decreaseTempo();
            this.reloadStems();
            this.eventsService.broadcast('actionHappened');
            this.fireAnalyticsIntentTag('Slow_Down', data);
            break;
          case 'superFast':
            this.eventsService.broadcast('updateCommandText', {text: 'Ok, making it as fast as I can.', time: this.FEEDBACK_TIME});
            this.stemService.tempo = this.stemService.MAX_TEMPO;
            this.reloadStems();
            this.eventsService.broadcast('actionHappened');
            this.fireAnalyticsIntentTag('Super_Fast', data);
            break;
          case 'superSlow':
            this.eventsService.broadcast('updateCommandText', {text: 'Ok, making it as slow as I can.', time: this.FEEDBACK_TIME});
            this.stemService.tempo = this.stemService.MIN_TEMPO;
            this.reloadStems();
            this.eventsService.broadcast('actionHappened');
            this.fireAnalyticsIntentTag('Super_Slow', data);
            break;
          case 'normalSpeed':
            this.eventsService.broadcast('updateCommandText', {text: 'Ok, making it back to normal speed.', time: this.FEEDBACK_TIME});
            this.stemService.tempo = this.stemService.NORMAL_TEMPO;
            this.reloadStems();
            this.eventsService.broadcast('actionHappened');
            this.fireAnalyticsIntentTag('Normal_Speed', data);
            break;
          case 'volumeUp':
            if (matchingAddedStem) {
              matchingAddedStem.increaseVolume();
              this.eventsService.broadcast('updateCommandText', {
                text: 'The ' + matchingAddedStem.track.name + '’s volume is at ' + matchingAddedStem.getDisplayVolume(),
                time: this.FEEDBACK_TIME});
              this.fireAnalyticsIntentTag('Volume_Up_Track', data, matchingAddedStem);
            } else {
              this.increaseVolume();
              this.eventsService.broadcast('updateCommandText', {
                text: 'The song’s volume is at ' + this.getDisplayVolume(),
                time: this.FEEDBACK_TIME});
              this.fireAnalyticsIntentTag('Volume_Up_Song', data);
            }
            this.eventsService.broadcast('actionHappened');
            break;
          case 'volumeDown':
            if (matchingAddedStem) {
              matchingAddedStem.decreaseVolume();
              this.eventsService.broadcast('updateCommandText', {
                text: 'The ' + matchingAddedStem.track.name + '’s volume is at ' + matchingAddedStem.getDisplayVolume(),
                time: this.FEEDBACK_TIME});
              this.fireAnalyticsIntentTag('Volume_Down_Instrument', data, matchingAddedStem);
            } else {
              this.decreaseVolume();
              this.eventsService.broadcast('updateCommandText', {
                text: 'The song’s volume is at ' + this.getDisplayVolume(),
                time: this.FEEDBACK_TIME});
              this.fireAnalyticsIntentTag('Volume_Down_Song', data);
            }
            this.eventsService.broadcast('actionHappened');
            break;
          case 'replaceInstrument':
            // replaceInstrument = 'give me a different guitar'
            if (matchingAddedStem && matchingAddedStem.id) {
              excludedIds = matchingAddedStem.id;
            }
            //continue…
          case 'addInstrument':
            let trackingPreface = (!excludedIds) ? 'Add_' : 'Replace_';
            this.stemService.getStem(data.parameters.instrument, data.parameters.genre, null, excludedIds).then((stem: Stem) => {
              this.add(stem, true, matchingAddedStem);
              this.fireAnalyticsIntentTag(trackingPreface + 'Instrument_Success', data, stem, true);
            }, (failData) => {
              this.fireAnalyticsIntentTag(trackingPreface + 'Instrument_Fail', data, null, true);
              if (failData && failData.suggestions && failData.suggestions.length > 0) {
                let firstSuggestion = failData.suggestions[0];
                let article = indefiniteArticle(firstSuggestion);
                let suggestions = `Don’t know that one. Try saying “Add ${article} ${failData.suggestions[0]}”.`;

                this.eventsService.broadcast('updateCommandText', {text: suggestions, time: 2000});
                this.eventsService.broadcast('actionHappened');
              } else {
                this.eventsService.broadcast('updateCommandText', {text: 'Don’t know that one. Try something else.', time: 1700});
                this.eventsService.broadcast('actionHappened');
              }
            });
            break;
          case 'clear':
            this.clear();
            this.eventsService.broadcast('updateCommandText', {text: 'You got it. Let’s jam again soon.', time: this.FEEDBACK_TIME});
            this.eventsService.broadcast('actionHappened');
            this.fireAnalyticsIntentTag('Clear', data);
            break;
          case 'changeGenre':
            // not supporting this anymore, maybe it tries to change genre for previous tracK
            break;
          case 'removeInstrument':
            if (matchingAddedStem) {
              this.remove(matchingAddedStem);
              this.eventsService.broadcast('updateCommandText', {text: `Ok, removed the ${matchingAddedStem.getDisplayName()}.`, time: this.FEEDBACK_TIME});
              this.eventsService.broadcast('actionHappened');
              this.fireAnalyticsIntentTag('Remove_Instrument', data, matchingAddedStem);
            } else {
              this.eventsService.broadcast('updateCommandText', {text: `Can’t remove ${data.parameters.instrument} if it’s not in play.`, time: this.FEEDBACK_TIME});
              this.eventsService.broadcast('actionHappened');
              this.fireAnalyticsIntentTag('Remove_Instrument_Fail', data);
            }
            break;
          case 'allInstruments':
            this.clear();
            this.stemService.getSong(data.parameters.genres).then((stems) => {
              let stemsGenres = '';
              let stemsIds = '';
              Object.keys(stems).forEach( key => {
                this.add(stems[key], false);
                stemsGenres += stems[key].tag +',';
                stemsIds += stems[key].id +',';
              });
              let genreList = '';
              let length = data.parameters.genres.length;
              data.parameters.genres.forEach((genre, i) => {
                genreList += genre;
                if (i + 1 !== length) {
                  genreList +=', ';
                } else {
                  genreList +=' ';
                }
              });
              this.eventsService.broadcast('updateCommandText', {text: 'Here’s a ' + genreList + 'song.', time: this.FEEDBACK_TIME});
              this.fireAnalyticsIntentTag('Make_Song', data, null, false, genreList + ';' + stemsGenres + ';' + stemsIds);
            }).catch(() => {
              this.fireAnalyticsIntentTag('Make_Song_Fail', data);

              this.eventsService.broadcast('updateCommandText', {text: 'Don’t know that one. Try something else.', time: this.FEEDBACK_TIME});
            });
            break;
          case 'singleInstrument':
            this.eventsService.broadcast('updateCommandText', {text: 'Playing a single instrument', time: this.FEEDBACK_TIME});
            this.addedStems.forEach((stem) => {
              if (
                !matchingAddedStem ||
                (matchingAddedStem && matchingAddedStem.instrument !== stem.instrument)
              ) {
                setTimeout(() => {
                  this.remove(stem);
                }, 100);
              }
            });
            this.fireAnalyticsIntentTag('Single_Instrument', data, matchingAddedStem);
            this.eventsService.broadcast('actionHappened');
            break;
          case 'input.unknown':
          default:
            this.eventsService.broadcast('updateCommandText', {text: 'I didn’t understand. Try again.', time: 2300});
            this.eventsService.broadcast('actionHappened');
            this.angulartics2.eventTrack.next({ action: 'Intent', properties: { category: 'Unknown' }});
            break;

        }
      }
    });

    this.eventsService.on('speechStart', () => {
      if (this.multitracks) {
       this.multitracks.setVolume(this.MIN_VOLUME);
      }
    });

    this.eventsService.on('speechEnd', () => {
      if (this.multitracks) {
        this.multitracks.setVolume(this.volume);
        this.eventsService.broadcast('volumeChange', false); // Unmute on add
      }
    });

    this.eventsService.on('clearTracks', () => {
      this.clear();
      this.mute();
      this.addedSFX.forEach((timeout) => {
        clearTimeout(timeout);
      })
    });

    this.eventsService.on('volumeChange', (mute) => {
      mute ? this.mute() : this.unmute();
    });

    this.eventsService.on('songPause', (state) => {
      if (this.multitracks) {
        ((!state) ? this.multitracks.pause() : this.multitracks.resume());
        ((!state) ? this.visualTracks.stopAnimation() : this.visualTracks.startAnimation());
      }
    });

    this.eventsService.on('hideVoiceButton', (state) => {
      this.voiceButtonVisible = false;
    });

    this.eventsService.on('showVoiceButton', (state) => {
      this.voiceButtonVisible = true;
    });

    // Hide canvas when tooltip shows
    // iOS bug that doesn't allow copy/paste when canvas is up
    this.eventsService.on('hideCanvas', (state) => {
      if (state) {
        this.canvasRef.nativeElement.remove();
      }
    });
  }

  // First add must be called on a user action (like a click)
  add(stem: Stem, showResponse: boolean = false, previousStem: Stem = null) {

    if (!this.multitracks) {
      this.multitracks = new StemPlayer();
    }

    if (showResponse) {
      let title = stem.getDisplayName();


      this.eventsService.broadcast('updateCommandText', {
        text: 'Adding ' + title,
        time: this.FEEDBACK_TIME});
    }

    this.multitracks.loadTrack(stem).then((data) => {
      let removing = false;
      let slot = stem.track.slot;
      let i = this.addedStems.length;
      while(i--) {
        if (this.addedStems[i].track.slot === stem.track.slot) {
          this.remove(this.addedStems[i]);
          removing = true;
        }
      }
      let timeoutLen = (removing) ? 500 : 0;
      setTimeout(() => {
        this.addedStems.push(stem);
        let style = 'flat';
        if (slot === 5) {
          style = 'gradient';
          if (!this.fifthTrackShowing) {
            this.visualTracks.showFiveTracks();
            this.fifthTrackShowing = true;
          }
        }

        if (previousStem) {
          style = 'gradient';
          setTimeout(() => {
            this.visualTracks.tracks[slot].set({ fillType: 'flat' });
          }, 3500);
        }

        this.visualTracks.tracks[slot].set({
          type: stem.type,
          analyser: data.analyser,
          name: stem.getDisplayName(),
          fillType: style
        });
        this.suggestionsService.addInstrument(stem.type);
        this.eventsService.broadcast('actionHappened');

      }, timeoutLen);

      // Broadcast stems to share service
      this.eventsService.broadcast('savedStems', this.addedStems);
    });
  }

  // Clear all active stems
  clear() {
    let i = this.addedStems.length;
    while(i--) {
      this.remove(this.addedStems[i]);
    }
    this.stemService.tempo = null;
  }

  // Get loaded stem data from /jam state guard
  ngAfterViewInit() {
    this.visualTracks = new VisualTracks({
      canvas: this.canvasRef.nativeElement,
      numberTracks: this.NUM_TRACKS
    }, this.eventsService);

    this.eventsService.on('loadedStems', (data) => {
      if (data) {
        setTimeout(() => {
          let stemArray = [];
          let sfxArray = [];
          console.log('Loaded Saved Jam: ' + window.location.pathname.replace('/jam/', ''));
          // Get loaded track data then add them each to mulitrack
          if (data.tracks) {
            data.tracks.forEach((track) => {
              let newStem = {
                bpm: track.bpm,
                id: track.id,
                volume: track.volume,
              };
              stemArray.push(newStem);
            });

            this.stemService.getSavedStems(stemArray).then((stems: any[]) => {
              stems.forEach((data) => {
                this.add(data, false);
              });
            });
          }

          // Play sounds effects
          if (data.sfx) {
            data.sfx.forEach((track, index) => {
              this.playSFX(index, track, data.sfx.length);
            });
          }

        }, 900);

        // Show mobile play overlay
        if (!this.canAutoplay) {
          this.showMobilePlay = true;
        }
      }
    });
  }

  // Retrieve SFX data and play based on saved SFX phrase
  playSFX(index, track, total) {
    this.stemService.getSfx(track.tag).then((result: any[]) => {
      if (!this.multitracks) {
        this.multitracks = new StemPlayer();
      }

      this.sfxTimeouts.push(setTimeout(() => {
        this.multitracks.playOneOff(result[0].file.mp3);
        this.showFxViz();

      }, SFXInterval * (index + 1)));
    });
  }

  remove(stem: Stem) {
    let trackName = (stem.track.name === 'wind' || stem.track.name === 'strings') ? '' : stem.track.name;
    this.multitracks.remove(stem);
    this.visualTracks.tracks[stem.track.slot].reset();
    this.visualTracks.tracks[stem.track.slot].updateName(trackName);
    this.suggestionsService.removeInstrument(stem.type);

    let i = this.addedStems.length;
    while(i--) {
      if (this.addedStems[i].slug === stem.slug) {
        this.addedStems.splice(i, 1);
      }
    }
    if (stem.track.slot === 5) {
      this.visualTracks.hideFiveTracks();
      this.fifthTrackShowing = false;
    }
  }

  increaseVolume() {
    this.volume += 5;
    this.volume = (this.volume < this.MAX_VOLUME) ? this.volume : this.MAX_VOLUME;
    if (this.multitracks) {
      this.multitracks.setVolume(this.volume);
    }
  }

  decreaseVolume() {
    this.volume -= 5;
    this.volume = (this.volume > this.MIN_VOLUME) ? this.volume : this.MIN_VOLUME;
    if (this.multitracks) {
      this.multitracks.setVolume(this.volume);
    }
  }

  getDisplayVolume() {
    let map = (x, in_min, in_max, out_min, out_max) => {
      return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    };

    let volume = map(this.volume, this.MIN_VOLUME, this.MAX_VOLUME, 0, 100);
    //round to nearest 5th:
    return Math.ceil(volume / 5) * 5;
  }

  reloadStems(keepStem: boolean = true) {
    this.addedStems.forEach((stem: Stem) => {
      let previousVolume = stem.volume;
      let stemId = (keepStem) ? stem.id : null;
      let genre = (keepStem) ? stem.genre : null;
      let reload = ((type, genre, id, volume) => {
        this.stemService.getStem(type, genre, id).then((stem: Stem) => {
          this.add(stem);
          stem.volume = volume;
        });
      })(stem.type, genre, stemId, previousVolume);
    });
  }

  mute() {
    if (this.multitracks) {
      this.multitracks.setVolume(-100);
    }
  }

  unmute() {
    if (this.multitracks) {
      this.multitracks.setVolume(this.volume);
    }
  }

  arrayToSentence(arr) {
    let last = arr.pop();
    return arr.join(', ') + ' or ' + last;
  }

  touchAudio() {
    if (!this.multitracks) {
      this.multitracks = new StemPlayer();
    }
  }

  // Play loaded song on mobile
  playLoaded() {
    this.showMobilePlay = false;
    if (this.multitracks) {
      this.multitracks.resume();
    }
  }

  showFxViz(time: number = 3) {
    let stem = this.addedStems[Math.floor(Math.random()*this.addedStems.length)];
    if (stem) {
      let slot = stem.track.slot;
      let adjustedTime = (time > 6) ? 6 : time;
      adjustedTime = (time < 2) ? 2 : time;
      this.visualTracks.tracks[slot].releaseBubble(0.1 + 0.8 * Math.random(), adjustedTime);
    }
  }

  fireAnalyticsIntentTag(category, intent: Intent = null, data = null, returnGenreTags = false, extra: string = null) {
    let tag: string = '';

    //requested instrument data:
    if (intent && intent.parameters && (intent.parameters.genre || intent.parameters.instrument)) {
      let intentGenre = (typeof intent.parameters.genre === 'undefined') ? '': intent.parameters.genre;
      tag += `${intent.parameters.instrument};`;
      if (returnGenreTags) {
        tag += `${intentGenre};`;
      }
    }
    //returned instrument data:
    if (data && data.id && data.instrument) {
      let stemTag = (typeof data.tag === 'undefined') ? '': data.tag;
      tag += `${data.instrument};`;
      if (returnGenreTags) {
        tag += stemTag + ';'
      }
      tag += data.id + ';';
    }

    //request sfx
    if (intent && intent.parameters && intent.parameters.sfx) {
      tag += `${intent.parameters.sfx};`;
    }

    //returned sfx:
    if (data && data[0] && data[0].sfxId) {
      let sfxTag = (typeof data[0].tag === 'undefined') ? '': data[0].tag;
      tag += `${sfxTag};${data[0].sfxId};`;
    }

    if (extra) {
      tag += extra + ';';
    }

    this.angulartics2.eventTrack.next({ action: 'Intent', properties: { category: category, label: tag }});

  }
}
