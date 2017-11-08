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

const ChirpSessionManager = require('./chirp-session-manager')

const { logError } = require('./logging')
const { makeCard } = require('./sharing-card')

/**
 * Added for testing whether or not we want to allow usage media playback via Assistant on devices.
 */
const IS_ASSISTANT_ENABLED = true

exports.handleWelcome = (app, sessionId) => {
    let hasScreen = app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)

    if(hasScreen && !IS_ASSISTANT_ENABLED) {
        // If we're in the assistant or Allo, don't do anything fun, only push users to website
        // app.tell closes the conversation so there's no followup
        return app.tell(
            app.buildRichResponse()
                .addSimpleResponse('Check out Mix Lab on the web for the full experience!')
                .addBasicCard(makeCard(app))
        )
    } else {
        // Proceed as normal, let's create a session and say hi via responses given to us on Dialogflow
        ChirpSessionManager.createSession(sessionId)
            .then(() => {
                return app.ask(app.getIncomingRichResponse())
            })
            .catch(error => {
                logError('handleWelcome', error)
                return app.tell('Sorry, I couldn\'t create your session. Please try again.')
            })
    }
}