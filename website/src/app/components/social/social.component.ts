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

import { Component, AfterViewInit, ElementRef, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Stem } from "../../classes/stem"
import { StemService } from "../../services/stem.service";
import { EventsService } from "../../services/events.service";
import { ClipboardService } from 'ng2-clipboard/ng2-clipboard';

const TIMEOUT = 600;

@Component({
  selector: 'app-social',
  templateUrl: './social.component.html',
  styleUrls: ['./social.component.scss'],
  animations: [
    trigger('slide', [
      state('in', style({
        opacity: '0',
        transform: 'scale(0.9)',
      })),
      state('out', style({
        opacity: '1',
        transform: 'scale(1)',
      })),
      transition('in <=> out', animate('0.4s cubic-bezier(0.165, 0.840, 0.440, 1.000)'))
    ]),
    trigger('peek', [
      state('out', style({
        opacity: '0',
        'pointer-events': 'none',
        transform: 'translateY(20px)',
      })),
      state('in', style({
        opacity: '1',
        'pointer-events': 'auto',
        transform: 'translateY(0px)',
      })),
      transition('out <=> in', animate('0.4s cubic-bezier(0.165, 0.840, 0.440, 1.000)'))
    ]),
    trigger('fade', [
      state('out', style({
        opacity: '0'
      })),
      state('in', style({
        opacity: '1'
      })),
      transition('out <=> in', animate('0.2s linear'))
    ]),
  ]
})
export class SocialComponent implements AfterViewInit {
  stems: Array<Stem>;
  sfx: Array<any>;
  slideState = 'in'
  peekState = 'out';
  fadeState = 'in';
  tooltip: string = '';
  shareURL: string;
  hash: string;
  copied = false;
  isTouch;

  // Close social if clicking anywhere else besides social
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
      this.slideState = 'in';
      this.fadeState = 'in';
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
      this.slideState = 'in';
      this.fadeState = 'in';
    }
  }

  constructor(
    private stemService: StemService,
    private eventsService: EventsService,
    private clipboard: ClipboardService,
    private el: ElementRef
  ) {
    this.isTouch = 'ontouchstart' in document.documentElement;
  }

  ngAfterViewInit() {
    // Saved Stems
    this.eventsService.on('savedStems', (data) => {
      setTimeout(() => {
        this.stems = data;
      }, TIMEOUT);
    });

    // Saved Sound FX
    this.eventsService.on('savedSFX', (data) => {
      setTimeout(() => {
        this.sfx = data;
      }, TIMEOUT);
    });

    // Toogle tooltip state listener
    this.eventsService.on('tooltipState', (state) => {
      this.peekState = state;
    });
  }

  toggleSocial() {
    if (this.stems && this.stems.length > 0) {
      this.fadeState = 'out';
      this.eventsService.broadcast('toggleLoader', true);
      this.stemService.save(this.stems, this.sfx).then((hash) => {
        this.hash = hash;
        this.slideState = 'out';
        this.eventsService.broadcast('toggleLoader', false);
      });
    } else {
      this.eventsService.broadcast('updateCommandText', {text: 'You do not have any tracks to share yet!', time: 2000});
    }
  }

  getURL(returnType?: boolean, mobileLink?: boolean) {
    let url;
    const port = window.location.port;
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    if (mobileLink) {
      url = `${protocol}//${hostname}${port ? ':' + port : ''}/link`;
    } else {
      if (protocol && protocol === 'https:') {
        url = `${protocol}//${hostname}/jam/`;
      } else if (port && port !== '') {
        url = `${protocol}//${hostname}:${port}/jam/`;
      } else {
        url = window.location.origin + '/';
      }
    }

    return ((!returnType) ? encodeURIComponent(url) : url);
  }

  // Create popup
  popup(url, height, width) {
    const wLeft = window.screenLeft ? window.screenLeft : window.screenX;
    const wTop = window.screenTop ? window.screenTop : window.screenY;
    const left = wLeft + (window.innerWidth / 2) - (width / 2);
    const top = wTop + (window.innerHeight / 2) - (height / 2);

    window.open(url, '_blank', 'location=yes,height=' + height + ',width=' + width + ',top=' + top + ',left=' + left + ',scrollbars=yes,status=no').focus();
  }

  // Share and create hash from stem service
  share(platform) {
    const url = this.getURL(platform === 'link' ? true : false);
    const text = 'I%20made%20a%20song%20using%20voice%20commands%20with%20MixLab.%20Feel%20free%20to%20add%20to%20it%21%20%23VoiceExperiments';

    if (platform === 'twitter') {
      const twitURL = `https://twitter.com/intent/tweet?text=${text}&url=${url}${this.hash}`;
      this.popup(twitURL, 253, 600);
    } else if (platform === 'facebook') {
      const fbURL = `https://www.facebook.com/sharer.php?u=${url}${this.hash}&quote=${text}`;
      this.popup(fbURL, 570, 520);
    } else if (platform === 'google') {
      const googleURL = `https://plus.google.com/share?url=${url}${this.hash}&prefilltext=${text}`;
      this.popup(googleURL, 500, 900);
    } else if (platform === 'link') {
      if (window.innerWidth <= 768 && this.isTouch) {
        let newURL = this.getURL(true, true);
        this.popup(`${newURL}?song=${this.hash}`, 500, 900);
      } else {
        this.peekState = 'in';
        this.shareURL = `${url}${this.hash}`;
        this.tooltip = this.shareURL;
      }
    }
  }

  // Copy link on click action of tooltip
  copyLink() {
    this.clipboard.copy(this.shareURL);
    this.copied = true;
  }

}
