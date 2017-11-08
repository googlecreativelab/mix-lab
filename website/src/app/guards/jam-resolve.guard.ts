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

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Resolve, Router } from '@angular/router';
import { StemService } from '../services/stem.service';

@Injectable()
export class JamResolveGuard implements Resolve<any> {
  constructor(
    private router: Router,
    private stemService: StemService
  ) {};

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<any> {
    return this.stemService.load(route.params.hashID).then(res => {
      // If response is empty
      if (typeof res === 'undefined') {
        this.router.navigate(['/not-found']);
        return null;
      } else {
        return res;
      }
    });
  };
}
