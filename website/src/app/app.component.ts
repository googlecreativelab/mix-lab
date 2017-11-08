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

import { Component, AfterViewInit, Renderer2, HostListener } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { EventsService } from './services/events.service';
import { FallbackService } from './services/fallback.service';
import {Angulartics2GoogleAnalytics} from "angulartics2";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  containerClass: string;
  isTouch = false;
  fallback = {
    supported: true,
    message: 'This browser does not support the features included in this app.',
  };

  @HostListener('visibilitychange') onVisibilityChange() {
    this.checkFocus();
  }

  @HostListener('window:focus') onFocus() {
    this.checkFocus();
  }

  @HostListener('window:blur') onBlur() {
    this.checkFocus();
  }

  constructor(
    private _router: Router,
    private render: Renderer2,
    public eventsService: EventsService,
    private fallbackService: FallbackService,
    public angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics
  ) {
    this.isTouch = 'ontouchstart' in document.documentElement;
    this._router.events.subscribe((event: any) => {
      // On route change:
      // add page class for component-component styling
      if (event instanceof NavigationEnd ) {
        const slug = event.url.split('/').slice(1)[0];
        slug ? this.setPageClass(slug) : this.setPageClass('/');
      }
    });

    // Check browser support from service
    this.fallbackService.checkBrowserSupport().then(res => {
      this.fallback = ((res) ? res : null);
    });
  }

  setPageClass(slug) {
    if (slug === '/') {
      this.containerClass = 'state-home';
    } else {
      this.containerClass = `state-${slug.replace(/\//g, '-')}`;
    }
  }

  checkFocus() {
    this.eventsService.broadcast('songPause', document.hasFocus());
  }

  // Show/Hide controls based on location
  ngAfterViewInit() {
    const body = document.querySelector('.dg');
    this.render.setStyle(body, 'visibility', 'hidden');

    if (window.location.hostname === 'localhost') {
      this.render.removeStyle(body, 'visibility');
    }
  }
}
