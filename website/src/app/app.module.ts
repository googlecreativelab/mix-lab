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

import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { InlineSVGModule } from 'ng-inline-svg';
import { HomeComponent } from './states/home/home.component';
import { JamComponent } from './states/jam/jam.component';
import { MultitrackEditorComponent } from './components/multitrack-editor/multitrack-editor.component';
import { PolymerModule } from '@codebakery/origami';
import { IntentService} from './services/intent.service';
import { EventsService } from './services/events.service';
import {HttpModule} from "@angular/http";
import {StemService} from "./services/stem.service";
import { AboutComponent } from './states/about/about.component';
import { CloseButtonComponent } from './components/close-button/close-button.component';
import { SocialComponent } from './components/social/social.component';
import { TooltipComponent } from './components/tooltip/tooltip.component';
import { JamResolveGuard } from './guards/jam-resolve.guard';
import { VolumeButtonComponent } from './components/volume-button/volume-button.component';
import {SuggestionService} from "./services/suggestion.service";
import { FallbackComponent } from './components/fallback/fallback.component';
import { ClipboardService } from 'ng2-clipboard/ng2-clipboard';
import { LoaderComponent } from './components/loader/loader.component';
import { Angulartics2Module, Angulartics2GoogleAnalytics } from 'angulartics2';
import { FallbackService } from './services/fallback.service';
import { LinkComponent } from './states/link/link.component';
import { SafePipe } from './pipes/safe.pipe';

@NgModule({
  declarations: [
    AppComponent,
    MultitrackEditorComponent,
    HomeComponent,
    JamComponent,
    AboutComponent,
    CloseButtonComponent,
    SocialComponent,
    TooltipComponent,
    VolumeButtonComponent,
    FallbackComponent,
    LoaderComponent,
    LinkComponent,
    SafePipe,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    InlineSVGModule,
    PolymerModule.forRoot(),
    HttpModule,
    Angulartics2Module.forRoot([ Angulartics2GoogleAnalytics ]),
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    IntentService,
    EventsService,
    StemService,
    JamResolveGuard,
    SuggestionService,
    ClipboardService,
    FallbackService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
