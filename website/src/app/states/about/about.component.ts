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

import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { routerTransition } from '../../app-routing-transitions';
import { EventsService } from '../../services/events.service';

const DELAY = 0;

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  host: {'[@routerTransition]': ''},
  animations: [routerTransition()],
})
export class AboutComponent implements OnInit {
  @ViewChild('video') video: ElementRef;
  @Input() status: boolean;
  @Output() modalNotify: EventEmitter<any> = new EventEmitter<any>();
  fadeState = 'out';
  videoID = 'rSc3VoXWMHc';

  constructor(
    private el: ElementRef,
    private eventsService: EventsService
  ) { }

  ngOnInit() {
    setTimeout(() => {
      this.fadeState = 'in';
    }, DELAY);

    this.eventsService.broadcast('setTrackState', {
      state: 'intro',
      secondary: 'greyout'
    });
  }

  toggle($event) {
    this.fadeState = 'out';

    setTimeout(() => {
      this.status = $event;
      this.modalNotify.emit($event);
    }, DELAY);
  }

}
