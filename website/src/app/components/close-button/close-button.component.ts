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

import { Component, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

const DELAY = 300;

@Component({
  selector: 'app-close-button',
  templateUrl: './close-button.component.html',
  styleUrls: ['./close-button.component.scss'],
  animations: [
    trigger('spin', [
      state('out', style({
        opacity: 0,
        transform: 'rotate(-280deg)',
      })),
      state('in', style({
        opacity: 1,
        transform: 'rotate(0deg)',
      })),
      transition('out <=> in', animate('0.6s cubic-bezier(0.165, 0.840, 0.440, 1.000)'))
    ]),
  ]
})
export class CloseButtonComponent implements AfterViewInit {
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  spinState = 'out';

  constructor() { }

  ngAfterViewInit() {
    setTimeout(() => {
      this.spinState = 'in';
    }, DELAY);
  }

  close() {
    this.spinState = 'out';
    this.notify.emit(false);
  }
}
