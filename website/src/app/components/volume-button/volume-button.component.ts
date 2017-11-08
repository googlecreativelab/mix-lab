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

import { Component, OnInit, Input } from '@angular/core';
import { EventsService } from '../../services/events.service';

@Component({
  selector: 'app-volume-button',
  templateUrl: './volume-button.component.html',
  styleUrls: ['./volume-button.component.scss']
})
export class VolumeButtonComponent implements OnInit {
  @Input() mute: boolean;

  constructor(
    private eventsService: EventsService
  ) { }

  ngOnInit() {
    this.eventsService.on('volumeChange', (mute) => {
      this.mute = mute;
    });
  }

  toggleVolume() {
    this.mute = this.mute === true ? false : true;
    this.eventsService.broadcast('volumeChange', this.mute);
  }

}
