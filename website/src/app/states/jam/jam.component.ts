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

import { ActivatedRoute } from '@angular/router';
import {Component, ElementRef, OnDestroy, OnInit, ViewChild, Renderer2} from '@angular/core';
import { IntentService } from '../../services/intent.service';
import { Intent } from '../../interfaces/intent';
import { EventsService } from '../../services/events.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { routerTransition } from '../../app-routing-transitions';
import {SuggestionService} from "../../services/suggestion.service";
import { FallbackService } from "../../services/fallback.service";

@Component({
  selector: 'app-jam',
  templateUrl: './jam.component.html',
  styleUrls: ['./jam.component.scss'],
  host: {'[@routerTransition]': ''},
  animations: [
    routerTransition(),
    trigger('slideUp', [
      state('down', style({
        opacity: 0,
        transform: 'translateY(150%)',
      })),
      state('up', style({
        opacity: 1,
        transform: 'translateY(0%)',
      })),
      transition('down <=> up', animate('0.4s cubic-bezier(0.165, 0.840, 0.440, 1.000)'))
    ]),
    trigger('fade', [
      state('out', style({
        opacity: '0'
      })),
      state('in', style({
        opacity: '1'
      })),
      transition('out <=> in', animate('0.3s linear'))
    ]),
  ]
})
export class JamComponent implements OnInit, OnDestroy {
  @ViewChild('message') message: any;
  public command: string;
  public listening = false;
  public showCommand : boolean;
  public timeout;
  public commandTimeouts: Array<any> = [];
  public button;
  public slideState = 'down';
  public fadeState = 'out';
  public fadeState2 = 'out';
  public loadedStems = false;
  public currentSuggestion: number = -1;
  public currentSuggestions: Array<any> = [];
  public idle: boolean;
  public suggestionsStarted: boolean;
  public profanity = ['73$68$69$74$79','62$75$6c$73$68$69$74','61$73$73','61$73$73$65$73','61$73$73$68$6f$6c$65','61$73$73$68$6f$6c$65$73','62$61$73$74$61$72$64','66$75$63','62$65$61$73$74$69$61$6c','62$65$61$73$74$69$61$6c$69$74$79','62$65$61$73$74$69$6c$69$74$79','62$65$73$74$69$61$6c','62$65$73$74$69$61$6c$69$74$79','62$69$74$63$68','62$69$74$63$68$65$72','62$69$74$63$68$65$72$73','62$69$74$63$68$65$73','62$69$74$63$68$69$6e','62$69$74$63$68$69$6e$67','62$6c$6f$77$6a$6f$62','62$6c$6f$77$6a$6f$62$73','63$6c$69$74','63$6f$63$6b','63$6f$63$6b$73','63$6f$63$6b$73$75$63$6b','63$6f$63$6b$73$75$63$6b$65$64','63$6f$63$6b$73$75$63$6b$65$72','63$6f$63$6b$73$75$63$6b$69$6e$67','63$6f$63$6b$73$75$63$6b$73','63$75$6d','63$75$6d$6d$65$72','63$75$6d$6d$69$6e$67','63$75$6d$73','63$75$6d$73$68$6f$74','63$75$6e$69$6c$69$6e$67$75$73','63$75$6e$69$6c$6c$69$6e$67$75$73','63$75$6e$6e$69$6c$69$6e$67$75$73','63$75$6e$74','63$75$6e$74$6c$69$63$6b','63$75$6e$74$6c$69$63$6b$65$72','63$75$6e$74$6c$69$63$6b$69$6e$67','63$75$6e$74$73','63$79$62$65$72$66$75$63','63$79$62$65$72$66$75$63$6b','63$79$62$65$72$66$75$63$6b$65$64','63$79$62$65$72$66$75$63$6b$65$72','63$79$62$65$72$66$75$63$6b$65$72$73','63$79$62$65$72$66$75$63$6b$69$6e$67','64$61$6d$6e','64$69$63$6b$68$65$61$64','64$69$6c$64$6f','64$69$6c$64$6f$73','64$69$6e$6b','64$69$6e$6b$73','64$69$70$73$68$69$74','65$6a$61$63$75$6c$61$74$65','65$6a$61$63$75$6c$61$74$65$64','65$6a$61$63$75$6c$61$74$65$73','65$6a$61$63$75$6c$61$74$69$6e$67','65$6a$61$63$75$6c$61$74$69$6e$67$73','65$6a$61$63$75$6c$61$74$69$6f$6e','66$61$67','66$61$67$67$69$6e$67','66$61$67$67$6f$74','66$61$67$67$73','66$61$67$6f$74','66$61$67$6f$74$73','66$61$67$73','66$61$72$74','66$61$72$74$65$64','66$61$72$74$69$6e$67','66$61$72$74$69$6e$67$73','66$61$72$74$73','66$61$72$74$79','66$65$6c$61$74$69$6f','66$65$6c$6c$61$74$69$6f','66$69$6e$67$65$72$66$75$63$6b','66$69$6e$67$65$72$66$75$63$6b$65$64','66$69$6e$67$65$72$66$75$63$6b$65$72','66$69$6e$67$65$72$66$75$63$6b$65$72$73','66$69$6e$67$65$72$66$75$63$6b$69$6e$67','66$69$6e$67$65$72$66$75$63$6b$73','66$69$73$74$66$75$63$6b','66$69$73$74$66$75$63$6b$65$64','66$69$73$74$66$75$63$6b$65$72','66$69$73$74$66$75$63$6b$65$72$73','66$69$73$74$66$75$63$6b$69$6e$67','66$69$73$74$66$75$63$6b$69$6e$67$73','66$69$73$74$66$75$63$6b$73','66$75$63$6b','66$75$63$6b$65$64','66$75$63$6b$65$72','66$75$63$6b$65$72$73','66$75$63$6b$66$61$63$65','66$75$63$6b$69$6e','66$75$63$6b$69$6e$67','66$75$63$6b$69$6e$67$73','66$75$63$6b$6d$65','66$75$63$6b$73','66$75$6b','66$75$6b$73','67$61$6e$67$62$61$6e$67','67$61$6e$67$62$61$6e$67$65$64','67$61$6e$67$62$61$6e$67$73','67$61$79$73$65$78','67$6f$64$64$61$6d$6e','68$61$72$64$63$6f$72$65$73$65$78','68$65$6c$6c','68$6f$72$6e$69$65$73$74','68$6f$72$6e$79','68$6f$74$73$65$78','6a$61$63$6b$2d$6f$66$66','6a$65$72$6b$2d$6f$66$66','6a$69$73$6d','6a$69$7a','6a$69$7a$6d','6b$6f$63$6b','6b$6f$6e$64$75$6d','6b$6f$6e$64$75$6d$73','6b$75$6d','6b$75$6d$6d$65$72','6b$75$6d$6d$69$6e$67','6b$75$6d$73','6b$75$6e$69$6c$69$6e$67$75$73','6c$75$73$74','6c$75$73$74$69$6e$67','6d$6f$74$68$61$66$75$63$6b','6d$6f$74$68$61$66$75$63$6b$61','6d$6f$74$68$61$66$75$63$6b$61$73','6d$6f$74$68$61$66$75$63$6b$61$7a','6d$6f$74$68$61$66$75$63$6b$65$64','6d$6f$74$68$61$66$75$63$6b$65$72','6d$6f$74$68$61$66$75$63$6b$65$72$73','6d$6f$74$68$61$66$75$63$6b$69$6e','6d$6f$74$68$61$66$75$63$6b$69$6e$67','6d$6f$74$68$61$66$75$63$6b$69$6e$67$73','6d$6f$74$68$61$66$75$63$6b$73','6d$6f$74$68$65$72$66$75$63$6b','6d$6f$74$68$65$72$66$75$63$6b$65$64','6d$6f$74$68$65$72$66$75$63$6b$65$72','6d$6f$74$68$65$72$66$75$63$6b$65$72$73','6d$6f$74$68$65$72$66$75$63$6b$69$6e','66$75$6b$61','66$75$6b$65$72','6d$6f$74$68$65$72$66$75$63$6b$69$6e$67','6d$6f$74$68$65$72$66$75$6b$69$6e$67','6d$6f$74$68$65$72$66$75$63$6b$69$6e$67$73','6d$6f$74$68$65$72$66$75$63$6b$73','6e$69$67$67$65$72','6e$69$67$67$65$72$73','6f$72$67$61$73$69$6d','6f$72$67$61$73$69$6d$73','6f$72$67$61$73$6d','6f$72$67$61$73$6d$73','70$68$6f$6e$65$73$65$78','70$68$75$6b','70$68$75$6b$65$64','70$68$75$6b$69$6e$67','70$68$75$6b$6b$65$64','70$68$75$6b$6b$69$6e$67','70$68$75$6b$73','70$68$75$71','70$69$73$73','70$69$73$73$65$64','70$69$73$73$65$72','70$69$73$73$65$72$73','70$69$73$73$65$73','70$69$73$73$69$6e','70$69$73$73$69$6e$67','70$69$73$73$6f$66$66','70$6f$72$6e','70$6f$72$6e$6f','70$6f$72$6e$6f$67$72$61$70$68$79','70$6f$72$6e$6f$73','70$72$69$63$6b','70$72$69$63$6b$73','70$75$73$73$69$65$73','70$75$73$73$79','70$75$73$73$79$73','73$68$69$74','73$68$69$74$65$64','73$68$69$74$66$75$6c$6c','73$68$69$74$69$6e$67','73$68$69$74$69$6e$67$73','73$68$69$74$73','73$68$69$74$74$65$64','73$68$69$74$74$65$72','73$68$69$74$74$65$72$73','73$68$69$74$74$69$6e$67','73$68$69$74$74$69$6e$67$73','73$68$69$74$74$79','73$6c$75$74','73$6c$75$74$73','73$6d$75$74','73$70$75$6e$6b','74$77$61$74','77$74$66','77$6f$70','77$68$6f$72$65','77$68$6f$61$72','77$65$74$62$61$63$6b','77$61$6e$6b','76$61$67$69$6e$61'];
  public listenerA;
  public listenerB;
  private introTime: number = 500;
  public fallback;

  constructor(
    public intentService: IntentService,
    public eventsService: EventsService,
    public fallbackService: FallbackService,
    public suggestionsService: SuggestionService,
    private route: ActivatedRoute,
  ) {
  }

  setCommand(command) {
    if (
      !this.command ||
      (this.command && this.command.indexOf(command) === -1)
    ) {
      if (typeof command !== 'undefined') {
        this.command = this.filterCommand(command);
        this.showCommand = true;
      } else {
        this.fadeText();
      }
    } else if (!command) {
      this.fadeText();
    }
  }

  // Replaces words like base->bass, and profanity to ****
  filterCommand(command) {
    command = command.replace(new RegExp('base', 'gi'), 'bass');
    this.profanity.forEach((word) => {
      // from https://glot.io/snippets/eb693wuy5w
      let arr = word.split('$');
      let deobfuscate = arr.map(function(c) {
        return String.fromCharCode(parseInt(c, 16))
      }).reduce(function(a, b) {return a  + b});
      let count = deobfuscate.length;
      let stars = '';
      while(count--) {
        stars += '*';
      }
      command = command.replace(new RegExp("\\b" + deobfuscate + "\\b", 'gi'), stars);
    });
    return command;
  }

  makeIntent(command) {
    this.intentService.getIntent(command).then((response: Intent) => {
      this.setCommand(response.speech);
      this.eventsService.broadcast('intent', response);
    }).catch(() => {
      this.eventsService.broadcast('intent', {action: 'input.unknown', parameters: {instrument: null, genre: null, sfx: null}});
    });
  }

  fadeText() {
    clearTimeout(this.timeout);
    this.showCommand = false;
    this.timeout = setTimeout(() => {
      this.command = '';
    }, 300);
  }

  ngOnInit() {
    this.eventsService.broadcast('clearTracks');
    this.button = document.querySelector('voice-button');
    setTimeout(() => {
      // briefly delay the record button appearing
      this.eventsService.broadcast('showVoiceButton');
    }, 300);

    // Get loaded jam hashID from route params
    this.route.data.map(r => r.loaded).subscribe((jam) => {
      if (jam) {
        this.loadedStems = true;
        this.eventsService.broadcast('loadedStems', jam);
      } else {
        this.currentSuggestions = this.suggestionsService.getSuggestions();
        this.makeSuggestion();
        this.showIntro();
      }
    });

    // Check browser support from service
    this.fallbackService.checkBrowserSupport(true).then(res => {
      this.fallback = ((res) ? res : null);
    });

    this.eventsService.on('actionHappened', this.onActionHappened.bind(this));

    setTimeout(() => {
      this.fadeState = 'in';
    }, 300);

    setTimeout(() => {
      this.slideState = 'up';
    }, 1000);

    setTimeout(() => {
      this.fadeState2 = 'in';
    }, 0);

    setTimeout(() => {
      this.eventsService.broadcast('setTrackState', {
        state: 'default'
      });
    }, 400);

    this.listenerA = this.onSpeechButtonStateChange.bind(this);
    this.listenerB = this.onSpeechButtonSpeech.bind(this);
    this.button.addEventListener('onStateChange',  this.listenerA);
    this.button.addEventListener('onSpeech', this.listenerB);
    this.eventsService.on('updateCommandText', this.onUpdateCommandText.bind(this));
  }

  onUpdateCommandText(options) {
    this.showCommand = true;
    this.command = options.text;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      if (this.command === options.text) {
        this.fadeText();
      }
    }, options.time);
  }

  onActionHappened() {
    this.currentSuggestion = -1;
    this.currentSuggestions = this.suggestionsService.getSuggestions();
    this.makeSuggestion();
  }

  onSpeechButtonSpeech(event: any) {
    this.clearIntroTimeouts();
    this.setCommand(event.detail.speechResult);
    if (event.detail && event.detail.isFinal) {
      this.makeIntent(this.command);
      //this.commandTimeouts.push(setTimeout(this.makeSuggestion.bind(this), 1000));
    }
  }

  onSpeechButtonStateChange(event: any) {
    this.clearIntroTimeouts();
    // When you press down on the button, we'll let the app know
    // so it can turn the volume down (or do something else)
    if (event.detail && event.detail.newValue === 'listening') {
      this.listening = true;
      this.idle = false;
      this.eventsService.broadcast('speechStart');
    } else if (event.detail && event.detail.newValue === 'idle') {
      // When you let go of the button:
      this.listening = false;
      this.eventsService.broadcast('speechEnd');
      //this.commandTimeouts.push(setTimeout(this.makeSuggestion.bind(this), 1000));
    }
  }

  showIntro() {
    this.commandTimeouts.push(setTimeout(this.makeSuggestion.bind(this), this.introTime));
  }

  makeSuggestion() {
    let delay = (!this.suggestionsStarted) ? 0 : 3000;
    this.clearIntroTimeouts();

    this.currentSuggestion++;
    if (
      this.currentSuggestions &&
      this.currentSuggestion >= this.currentSuggestions.length
    ) {
      this.currentSuggestion = 0;
    }

    if (
      this.currentSuggestions &&
      this.currentSuggestions[this.currentSuggestion]
    ) {
      let suggestion = this.currentSuggestions[this.currentSuggestion].copy;
      //let name = suggestion.genre + ' ' + suggestion.instrument;
      //let text = '“' + suggestion.copy + name + '.”';
      let text = '“' + suggestion + '”';
      if (!this.suggestionsStarted) {
        this.suggestionsStarted = true;
        this.idle = false;
      }
      this.commandTimeouts.push(setTimeout(() => {
        this.eventsService.broadcast('updateCommandText', {text: text, time: 2500});
        this.makeSuggestion();
        this.idle = true;
      }, delay));
      //this.suggestions.splice(index, 1);
    }
  }

  clearIntroTimeouts() {
    this.commandTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
  }

  ngOnDestroy() {
    this.clearIntroTimeouts();
    this.button.removeEventListener('onStateChange', this.listenerA, false);
    this.button.removeEventListener('onSpeech', this.listenerB, false);
    this.eventsService.broadcast('hideVoiceButton');
    this.eventsService.off('actionHappened', this.onActionHappened.bind(this));
    this.eventsService.off('updateCommandText', this.onUpdateCommandText.bind(this));
  }
}
