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

'use strict';

const ChirpSessionManager = require('./chirp-session-manager')

const { handleWelcome } = require('./welcome')
const { addInstrumentToSession, removeInstrumentFromSession, replaceInstrumentInSession, handleAllInstruments } = require('./add-remove')
const { clearSession, playSingleInstrument, increaseDuration, playAgain } = require('./simple-actions')
const { speedUp, slowDown, setOriginalSpeed, handleSuperSpeed } = require('./speed')
const { handleVolumeUp, handleVolumeDown } = require('./volume')
const { logDebug, logError } = require('./logging')

/**
 * All the Action names of our Intents on Dialogflow
 */
const ACTION_WELCOME = 'welcome'
const ACTION_ADD_INSTRUMENT = 'addInstrument'
const ACTION_REMOVE_INSTRUMENT = 'removeInstrument'
const ACTION_REPLACE_INSTRUMENT = 'replaceInstrument'
const ACTION_ALL_INSTRUMENTS = 'allInstruments'
const ACTION_CLEAR = 'clear'
const ACTION_SINGLE_INSTRUMENT = 'singleInstrument'
const ACTION_SPEED_UP = 'speedUp'
const ACTION_SUPER_FAST = 'superFast'
const ACTION_SLOW_DOWN = 'slowDown'
const ACTION_SUPER_SLOW = 'superSlow'
const ACTION_NORMAL_SPEED = 'normalSpeed'
const ACTION_INCREASE_DURATION = 'increaseDuration'
const ACTION_VOLUME_UP = 'volumeUp'
const ACTION_VOLUME_DOWN = 'volumeDown'
const ACTION_PLAY_AGAIN = 'playAgain'

exports.handleIntent = (app, reqBody) => {
	let sessionId = reqBody.sessionId

	// Welcome is called on the start of every new session on the Assistant, whether on phones or Home
	if(app.getIntent() === ACTION_WELCOME) {
		return handleWelcome(app, sessionId, reqBody.originalRequest)
	} else {
		ChirpSessionManager.getSession(sessionId)
			.then(currentSession => {
				// increase our session count, which later determines what kind of responses
				// we want to give users at different points of our dialog on the assistant
				currentSession[ChirpSessionManager.PROP_SESSION_COUNT] += 1
                logDebug('ChirpSessionManager.getSession()', currentSession)

				return handleIntentWithSession(app, currentSession, sessionId)
			})
			.catch(error => {
				logError('getSession', error)
				return app.tell('Sorry, I couldn\'t create your session. Please try again.')
			})
	}
}

const handleIntentWithSession = (app, currentSession, sessionId) => {
	switch (app.getIntent()) {
		case ACTION_ADD_INSTRUMENT:
			return addInstrumentToSession(app, currentSession, sessionId)

		case ACTION_REMOVE_INSTRUMENT:
			return removeInstrumentFromSession(app, currentSession, sessionId)

		case ACTION_REPLACE_INSTRUMENT:
			return replaceInstrumentInSession(app, currentSession, sessionId)

		case ACTION_CLEAR:
			return clearSession(app, currentSession, sessionId)

		case ACTION_SINGLE_INSTRUMENT:
			return playSingleInstrument(app, currentSession, sessionId)

		case ACTION_SPEED_UP:
			return speedUp(app, currentSession, sessionId)

		case ACTION_SLOW_DOWN:
			return slowDown(app, currentSession, sessionId)

		case ACTION_NORMAL_SPEED:
			return setOriginalSpeed(app, currentSession, sessionId)

		case ACTION_SUPER_FAST:
			return handleSuperSpeed(app, currentSession, sessionId, true)

        case ACTION_SUPER_SLOW:
            return handleSuperSpeed(app, currentSession, sessionId, false)

		case ACTION_INCREASE_DURATION:
			return increaseDuration(app, currentSession, sessionId)

		case ACTION_ALL_INSTRUMENTS:
			return handleAllInstruments(app, currentSession, sessionId)

		case ACTION_VOLUME_UP:
			return handleVolumeUp(app, currentSession, sessionId)

		case ACTION_VOLUME_DOWN:
            return handleVolumeDown(app, currentSession, sessionId)

		case ACTION_PLAY_AGAIN:
			return playAgain(app, currentSession, sessionId)
	}
}
