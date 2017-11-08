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

import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { EventsService } from '../../services/events.service';
import { FallbackService } from '../../services/fallback.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { routerTransition } from '../../app-routing-transitions';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  host: {'[@routerTransition]': ''},
  animations: [
    routerTransition(),
    trigger('fade', [
      state('out', style({
        opacity: '0'
      })),
      state('in', style({
        opacity: '1'
      })),
      transition('out <=> in', animate('0.5s linear'))
    ]),
    trigger('peek', [
      state('out', style({
        opacity: '0',
        'pointer-events': 'none',
        transform: 'translateY(20px) translateX(-50%)',
      })),
      state('in', style({
        opacity: '1',
        'pointer-events': 'auto',
        transform: 'translateY(0px) translateX(-50%)',
      })),
      transition('out <=> in', animate('0.4s cubic-bezier(0.165, 0.840, 0.440, 1.000)'))
    ]),
  ],
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('googlehome') googlehome: ElementRef;
  @ViewChild('bubble') bubble: ElementRef;
  public modalStatus = false;
  public peekState = 'out';
  public fadeState = 'out';
  public command: string = 'Make music using voice commands on your Google Home.';
  public showCommand: boolean = true;
  public timeout;
  public introTime: number = 0;
  public commandTimeouts: Array<any> = [];
  public fallback;
  public scrollPos = 0;
  public adjustButton = false;
  public songCheckInterval;

  @HostListener('window:resize') onResize($event) {
    this.positionBubble();
  }

  // Special case for scrolling button on landscape mobile
  @HostListener('window:scroll', ['$event']) onScroll($event) {
    this.positionButton($event);
  }

  constructor(
    public eventsService: EventsService,
    public fallbackService: FallbackService,
    public el: ElementRef,
    public route: Router,
  ) {}

  ngOnInit() {
    // Clear playing tracks
    this.eventsService.broadcast('clearTracks');
    this.songCheckInterval = setInterval(() => {
      this.eventsService.broadcast('clearTracks');
      this.eventsService.broadcast('setTrackState', {
        state: 'intro',
      });

    }, 1000);

    setTimeout(() => {
      this.fadeState = 'in';
    }, 300);

    // Revert to default intro state of tracks
    setTimeout(() => {
      this.eventsService.broadcast('setTrackState', {
        state: 'intro',
      });
    }, 400);

    this.startSuggestions();

    // Check browser support from service
    this.fallbackService.checkBrowserSupport(true).then(res => {
      this.fallback = ((res) ? res : null);
    });

    // TEMP: Check mobile chrome support, but will be removed eventually
    this.fallbackService.checkMobileChrome().then(res => {
      this.fallback = ((res) ? res : null);
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.positionBubble();
    }, 500);

    setTimeout(() => {
      this.peekState = 'in';
    }, 700);
  }

  startSuggestions() {
    this.introTime = 0;
    this.addIntroItem('Make music using voice commands on your Google Home.');
    this.addIntroItem('“Add a funky beat.”');
    this.addIntroItem('“Give me a punk bass.”');
    this.addIntroItem('“Give me an air horn.”');
    this.addIntroItem('“Add a cheering crowd.”');
    this.addIntroItem('“Give me a happy guitar.”', 3);
    this.commandTimeouts.push(setTimeout(this.startSuggestions.bind(this), this.introTime));
  }


  toggleModal() {
    this.modalStatus = true;
    this.route.config.push({path: '/about'});
  }

  fadeText() {
    clearTimeout(this.timeout);
    this.showCommand = false;
    this.timeout = setTimeout(() => {
      this.command = '-';
    }, 300);
  }

  setCommand(text: string, time: number = 2500) {
    this.command = text;
    this.showCommand = true;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      if (this.command === text) {
        this.fadeText();
      }
    }, time);

  }

  addIntroItem(text, showTime: number = 2.5) {
    const transitionTime = 0.9;
    const showTimeMs = (showTime * 1000);
    this.introTime = this.introTime + showTimeMs + (transitionTime * 1000);
    this.commandTimeouts.push(setTimeout(() => {
      this.setCommand(text, showTimeMs);
    }, this.introTime));
  }

  clearIntroTimeouts() {
    this.commandTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
  }

  // Position bubble above size of google home
  positionBubble() {
    const home = this.googlehome.nativeElement;
    const bubble = this.bubble.nativeElement;
    bubble.style.bottom = `${home.offsetHeight}px`;
  }

  // Special case for scrolling button on landscape mobile
  positionButton($event?: any) {
    let st;
    if ($event) {
      st = $event.target.scrollingElement.scrollTop;
    } else {
      st = document.scrollingElement.scrollTop;
    }

    if (window.innerWidth <= 768 && window.innerHeight <= 400) {
      if (st > this.scrollPos) {
        this.adjustButton = false;
      } else {
        this.adjustButton = true;
      }
    } else {
      this.adjustButton = false;
    }
  }

  ngOnDestroy() {
    this.clearIntroTimeouts();
    clearTimeout(this.timeout);
    clearInterval(this.songCheckInterval);
  }

}
