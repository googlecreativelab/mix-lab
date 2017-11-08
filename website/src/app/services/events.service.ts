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

import {Injectable} from "@angular/core";
import * as Rx from 'rxjs/Rx';

@Injectable()
export class EventsService {
  public listeners;
  public eventsSubject;
  public events;

  constructor() {
    this.listeners = {};
    this.eventsSubject = new Rx.Subject();
    this.events = Rx.Observable.from(this.eventsSubject);

    this.events.subscribe(
      ({name, args}) => {
        if (this.listeners[name]) {
          for (let listener of this.listeners[name]) {
            listener(...args);
          }
        }
      });
  }

  on(name, listener) {
    if (!this.listeners[name]) {
      this.listeners[name] = [];
    }

    this.listeners[name].push(listener);
  }

  off(name, listener) {
    delete this.listeners[name];
  }

  broadcast(name, ...args) {
    this.eventsSubject.next({
      name,
      args
    });
  }
}
