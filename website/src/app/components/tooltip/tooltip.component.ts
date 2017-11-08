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

import { Component, AfterViewInit, Input, HostListener, ElementRef, ViewChild } from '@angular/core';
import { EventsService } from '../../services/events.service';

const DELAY = 1300;

@Component({
  selector: 'app-tooltip',
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.scss']
})
export class TooltipComponent implements AfterViewInit {
  @ViewChild('textarea') textarea: ElementRef
  @Input() autoshow: boolean = false;
  @Input() tooltip: string;
  loader = false;

  // Close tooltip if clicking anywhere else besides tooltip
  @HostListener('document:click', ['$event'])
    onClick(event) {
    // Wont work if clicking on any SVG/link tag
    if (this.el.nativeElement !== event.target &&
      event.target.localName !== 'span' &&
      event.target.localName !== 'svg' &&
      event.target.localName !== 'path' &&
      event.target.localName !== 'a' &&
      event.target.localName !== 'app-social' &&
      event.target.localName !== 'textarea' &&
      event.target.localName !== 'app-tooltip'
    ) {
      this.eventsService.broadcast('tooltipState', 'out');
    }
  }

  @HostListener('document:touchstart', ['$event'])
    onTouch(event) {
    // Wont work if clicking on any SVG/link tag
    if (this.el.nativeElement !== event.target &&
      event.target.localName !== 'span' &&
      event.target.localName !== 'svg' &&
      event.target.localName !== 'path' &&
      event.target.localName !== 'a' &&
      event.target.localName !== 'app-social' &&
      event.target.localName !== 'textarea' &&
      event.target.localName !== 'app-tooltip'
    ) {
      this.eventsService.broadcast('tooltipState', 'out');
    }
  }

  constructor(
    public eventsService: EventsService,
    private el: ElementRef,
  ) {}

  ngAfterViewInit() {
    if (!this.autoshow) {
      this.checkLocalStorage();
    } else {
      this.showTooltip();
    }
  }

  textClick() {
    this.textarea.nativeElement.select();
  }

  // Show tooltip
  showTooltip() {
    setTimeout(() => {
      this.eventsService.broadcast('tooltipState', 'in');
    }, DELAY);
  }

  checkLocalStorage(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let tooltipStorage = localStorage.getItem('tooltip');
      if (typeof(Storage) !== "undefined") {
        if (!tooltipStorage) {
          this.eventsService.broadcast('tooltipState', 'out');
          localStorage.setItem('tooltip', 'true');
          resolve(false);
        } else {
          if (tooltipStorage === 'true') {
            resolve(true);
          }
        }
      } else {
        resolve(false);
      }
    });
  }


}
