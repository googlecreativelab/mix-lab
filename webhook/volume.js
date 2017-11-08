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

const ARG_INSTRUMENT = 'instrument'

const PROP_VOLUME = 'volume'

const MULTIPLIER = 2.0;
const DIVISOR = 0.5;

const MULTIPLIER_POS = 1.5

exports.handleVolumeUp = (app, currentSession, sessionId) => {
    if(currentSession.stems.length === 0) {
        return app.ask('Sorry, volume changes need music to change! Try adding an instrument first.')
    }
    let instrument = app.getArgument(ARG_INSTRUMENT)

    logDebug('handleVolumeUp', instrument, currentSession.stems ? currentSession.stems : [])

    if(instrument && instrument !== '') {
        return updateByInstrument(app, currentSession, sessionId, MULTIPLIER)
    }

    return updateAllStems(app, currentSession, sessionId, MULTIPLIER)
}

exports.handleVolumeDown = (app, currentSession, sessionId) => {
    if(currentSession.stems.length === 0) {
        return app.ask('Sorry, volume changes need music to change! Try adding an instrument first.')
    }
    let instrument = app.getArgument(ARG_INSTRUMENT)

    logDebug('handleVolumeDown', instrument, currentSession.stems ? currentSession.stems : [])

    if(instrument) {
        return updateByInstrument(app, currentSession, sessionId, DIVISOR)
    }

    return updateAllStems(app, currentSession, sessionId, DIVISOR)
}

const updateByInstrument = (app, currentSession, sessionId, amount) => {
    logDebug('updateByInstrument')
    let stem = getStemByInstrument(app.getArgument(ARG_INSTRUMENT), currentSession)

    if(stem) {
        stem = updateStemVolume(stem, amount)
        currentSession.stems.push(stem)

        ChirpSessionManager.updateSession(sessionId, currentSession, app)
            .then(entity => response.makeAudioResponse(app, currentSession))
    } else {
        // no stem available, so can't do shit
        response.makeAudioResponse(app, currentSession)
    }
}

const updateAllStems = (app, currentSession, sessionId, amount) => {
    logDebug('updateAllStems', amount)
    for(let i = 0; i < currentSession.stems.length; i++) {
        let stem = updateStemVolume(currentSession.stems.shift(), amount)
        currentSession.stems.push(stem)
    }

    ChirpSessionManager.updateSession(sessionId, currentSession, app)
        .then(entity => response.makeAudioResponse(app, currentSession))
}

const updateStemVolume = (stem, amount) => {
    let base = 1.0

    if(stem[PROP_VOLUME]) {
        base = stem[PROP_VOLUME]
    }

    if(base >= 1 && amount >= MULTIPLIER) {
        stem[PROP_VOLUME] = base * MULTIPLIER_POS
    } else {
        stem[PROP_VOLUME] = base * amount
    }

    return stem
}

/**
 * Get the requested stem by instrument, returning it by REMOVING it from the currentSession
 */
const getStemByInstrument = (instrument, currentSession) => {
    for(let i = 0; i < currentSession.stems.length; i++) {
        let stem = currentSession.stems[i]

        if(stem.instrument === instrument ||
            stem.instrumentCategory === instrument) {
            return currentSession.stems.splice(i, 1)[0]
        }
    }

    return null
}