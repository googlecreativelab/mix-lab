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

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from "./states/home/home.component";
import { AboutComponent } from "./states/about/about.component";
import { JamComponent } from "./states/jam/jam.component";
import { JamResolveGuard } from './guards/jam-resolve.guard';
import { MultitrackEditorComponent } from "./components/multitrack-editor/multitrack-editor.component";
import { LinkComponent } from "./states/link/link.component";

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'jam',
    component: JamComponent
  },
  {
    path: 'about',
    component: AboutComponent,
  },
  {
    path: 'jam/:hashID',
    component: JamComponent,
    resolve: {
      loaded: JamResolveGuard
    }
  },
  {
    path: 'link',
    component: LinkComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
