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

'use strict'

const CARD_TITLE = 'Mix Lab';
const CARD_SUBTITLE = 'Make music using simple voice commands.';
const CARD_BODY = 'Tap here to keep this jam going in a web browser.'
const CARD_IMAGE_URL = 'https://lh3.googleusercontent.com/-CZ4syu3crCg/WdJrKk1v3xI/AAAAAAAAAe0/rhx3JcZTHnYYyO0iILI5CpY0ZlEWNicbwCMYCGAYYCw/h1080-w1920/MixLab_1920x1080%2B%25281%2529.png';
const CARD_IMAGE_ACCESS = 'Mix Lab Website Screenshot';
const CARD_BUTTON_TEXT = 'Mix Lab Web Experience';
const CARD_SITE_URL = 'https://mixlab.withgoogle.com/jam/';

const makeCard = (app, shareId = '') => {
    let buttonUrl = CARD_SITE_URL + shareId

    return app.buildBasicCard(CARD_BODY)
        .setTitle(CARD_TITLE)
        .setSubtitle(CARD_SUBTITLE)
        .setImage(CARD_IMAGE_URL, CARD_IMAGE_ACCESS)
        .addButton(CARD_BUTTON_TEXT, buttonUrl)
}

exports.makeCard = makeCard