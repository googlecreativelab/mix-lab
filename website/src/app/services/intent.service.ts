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
import {ApiAiClient} from 'api-ai-javascript'
import {Intent} from "../interfaces/intent";
import {Http} from "@angular/http";
import {Headers} from '@angular/http';

@Injectable()
export class IntentService {

  public client = new ApiAiClient({accessToken: '37c8208d697d4eb7afa5aa00939da9a1'});

  constructor(public http: Http) {}

  public getIntent(command: String) {
    return new Promise((resolve, reject) => {
      let headers = new Headers();
      headers.append('Content-Type', 'application/json; charset=utf-8');
      headers.append('Authorization', 'Bearer 37c8208d697d4eb7afa5aa00939da9a1');
      this.http.post(
        'https://api.dialogflow.com/v1/query?v=20170912',
        {
          query: command,
          lang: 'en',
          sessionId: this.client.getSessionId(),
          originalRequest: {
            'source': 'frontend'
          }
        },{
          headers: headers
        }
      ).map(res => res.json()).subscribe((response) => {
        if (response.result) {
          let intent: Intent = {};
          let result = response.result;

          if (
            result.parameters.genre === '' &&
            result.parameters.instrument === '' &&
            result.parameters.sfx === '' &&
            result.parameters.solo === ''
          ) {
            reject();
          } else {
            // I'm breaking these out individual, because we might not always
            // parameters, etc. for each intent.
            intent.id = result.metadata.intentId;
            intent.action = result.action;
            intent.speech = result.resolvedQuery;
            intent.parameters = {};
            if (result.parameters) {
              intent.parameters.genre = result.parameters.genre;
              intent.parameters.instrument = result.parameters.instrument;
              intent.parameters.sfx = result.parameters.sfx;
              intent.parameters.genres = result.parameters.genres;
            }
            resolve(intent);
          }
        }
      });
    });
  }
}
