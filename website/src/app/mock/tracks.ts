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

import {Track} from "../interfaces/track";

export const MockTracks: Track[] = [
  {
    slug: 'keyboard',
    name: 'Keyboard',
    color: '#00ff00',
    slot: 4
  },
  {
    slug: 'bass',
    name: 'Bass',
    color: '#FFD356',
    slot: 3
  },
  {
    slug: 'drums',
    name: 'Drums',
    color: '#F900FA',
    slot: 2
  },
  {
    slug: 'guitar',
    name: 'Guitar',
    color: '#00A6FF',
    slot: 1
  },
  {
    slug: 'bonus',
    name: 'Bonus',
    color: '#00A6FF',
    slot: 5
  }
];
