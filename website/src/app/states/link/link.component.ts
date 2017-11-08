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

import { Component, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EventsService } from "../../services/events.service";

@Component({
  selector: 'app-link',
  templateUrl: './link.component.html',
  styleUrls: ['./link.component.scss'],
})
export class LinkComponent implements AfterViewInit {
  public url: string;
  public text = 'Copy to clipboard';

  constructor(
    private route: ActivatedRoute,
    public eventsService: EventsService,
  ) { }

  ngAfterViewInit() {
    this.eventsService.broadcast('hideCanvas', true);
    this.route.queryParams.subscribe(param => {
      if (param && param.song) {
        this.url = `${this.getURL() + param.song}`;
      }
    });
  }

  getURL() {
    let url;
    const port = window.location.port;
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    if (protocol && protocol === 'https:') {
      url = `${protocol}//${hostname}/jam/`;
    } else if (port && port !== '') {
      url = `${protocol}//${hostname}:${port}/jam/`;
    } else {
      url = window.location.origin + '/';
    }
    return url;
  }

  copy(url) {
    let textArea,
      copy,
      range,
      selection;

    textArea = document.createElement('textArea');
    textArea.style.height = "0px";
    textArea.style.left = "-100px";
    textArea.style.opacity = "0";
    textArea.style.fontSize = "16px";
    textArea.style.position = "fixed";
    textArea.style.top = "-100px";
    textArea.style.width = "0px";
    textArea.value = url;
    document.body.appendChild(textArea);

    if (navigator.userAgent.match(/ipad|iphone/i)) {
      range = document.createRange();
      range.selectNodeContents(textArea);
      selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      textArea.setSelectionRange(0, 999999);
    } else {
      textArea.select();
    }

    document.execCommand('copy');
    document.body.removeChild(textArea);

    this.text = 'Link copied to clipboard';
  }

}
