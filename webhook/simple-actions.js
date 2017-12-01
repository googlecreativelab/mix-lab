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

const response = require('./response')

const { logDebug } = require('./logging')

const DURATION_INCR = ChirpSessionManager.DEFAULT_DURATION // for now
const DURATION_MAX = ChirpSessionManager.DEFAULT_DURATION + (DURATION_INCR * 6)

exports.clearSession = (app, currentSession, sessionId) => {
	if(currentSession.stems.length === 0) {
		return response.makeClearResponse(app, true)
	}

	ChirpSessionManager.clearSession(sessionId, currentSession)
		.then(entity => {
            return response.makeClearResponse(app)
		})
		.catch(err => {
			return app.ask('Sorry, I\'m broken, try again.')
		})
}

exports.playSingleInstrument = (app, currentSession, sessionId) => {
	//instrument is required so grab it
	let instrument = app.getArgument('instrument')
	let stemToKeep = null

	for(let i = 0; i < currentSession.stems.length; i++) {
		let stem = currentSession.stems[i]

		if(stem.instrument === instrument ||
			stem.instrumentCategory === instrument) {
			stemToKeep = stem
			break
		}
	}

	if(!stemToKeep) {
		return app.ask("You can't keep something you have not yet added. Please try again.")
	}

	currentSession.stems = [stemToKeep]

	ChirpSessionManager.updateSession(sessionId, currentSession, app)
		.then(entity => response.makeAudioResponse(app, currentSession))
}

exports.increaseDuration = (app, currentSession, sessionId) => {
    if(currentSession.stems.length === 0) {
        return response.makeCantIncreaseDurationResponse(app)
    }

	let newDuration = currentSession[ChirpSessionManager.PROP_DURATION] + DURATION_INCR
	if(newDuration > DURATION_MAX) {
        newDuration = DURATION_MAX
	}

	currentSession[ChirpSessionManager.PROP_DURATION] = newDuration

    ChirpSessionManager.updateSession(sessionId, currentSession, app)
        .then(entity => response.makeAudioResponse(app, currentSession))
}

exports.playAgain = (app, currentSession, sessionId) => {
    if(currentSession.stems.length === 0) {
        return response.makePlayWhatAgainResponse(app)
    }

    // just do it again!
    response.makeAudioResponse(app, currentSession)
}
