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

const { getStemsFromLookup } = require('./lookup')
const { logDebug, logError } = require('./logging')

const MINIMUM_BPM_CHANGE = 10
const MIN_BPM = 60
const MAX_BPM = 160

exports.speedUp = (app, currentSession, sessionId) => {
    // duh
    if(currentSession.stems.length === 0) {
        return app.ask('Sorry, something needs to be playing to change its speed. Try adding an instrument.')
    }

    let bpm = getBpmFromApp(app, currentSession)
    updateSpeed(app, currentSession, sessionId, bpm)
}

exports.slowDown = (app, currentSession, sessionId) => {
    // duh
    if(currentSession.stems.length === 0) {
        return app.ask('Sorry, how can you slow down nothing? That\'s like dividing by zero!')
    }

    // the bpm we get back will be positive, so slow it down
    let bpm = getBpmFromApp(app, currentSession) * -1
    updateSpeed(app, currentSession, sessionId, bpm)
}

exports.handleSuperSpeed = (app, currentSession, sessionId, isFast) => {
    if(currentSession.stems.length === 0) {
        if(isFast) {
            return app.ask('WARP SPEED cannot be enabled without any tracks!')
        } else {
            return app.ask('You\'re telling me to slow down? You haven\'t even added anything yet.')
        }
    }

    let bpm = isFast ? MAX_BPM : MIN_BPM
    setStemsBpm(app, currentSession, sessionId, bpm)
}

exports.setOriginalSpeed = (app, currentSession, sessionId) => {
    // if startingBpm is 0 then we havent made any updates
    if(currentSession.startingBpm === 0) {
        return app.ask('You haven\'t made any speed changes yet! What else can I try?')
    }

    // Store and reset starting bpm in our current session
    let startingBpm = currentSession.startingBpm
    currentSession.startingBpm = 0

    setStemsBpm(app, currentSession, sessionId, startingBpm, false)
}

const getBpmFromApp = (app, currentSession) => {
    // let's see if we have a percentage we can update by
    let percentArg = app.getArgument('percentage')
    if(percentArg) {
        return (parseFloat(percentArg) / 100.0) * currentSession.stems[0].bpm
    } else {
        return MINIMUM_BPM_CHANGE
    }
}

const updateSpeed = (app, currentSession, sessionId, bpmChange) => {
    //get our updated bpm
    let newBpm = currentSession.stems[0].bpm + bpmChange

    if(newBpm % 5 !== 0) {
        newBpm = Math.round(newBpm / 5) * 5
    }

    if(newBpm > MAX_BPM) {
        newBpm = MAX_BPM
    } else if(newBpm < MIN_BPM) {
        newBpm = MIN_BPM
    }

    return setStemsBpm(app, currentSession, sessionId, newBpm)
}

const setStemsBpm = (app, currentSession, sessionId, newBpm, checkStartingBpm = true) => {
    if(checkStartingBpm && currentSession.startingBpm === 0) {
        // assume we are doing this for first time
        currentSession.startingBpm = currentSession.stems[0].bpm
    }

    // loop through stems and update bpm
    currentSession.stems.forEach(stem => {
        stem.request.bpm = newBpm
    })

    logDebug('setStemsBpm', newBpm, currentSession.stems)

    getStemsFromLookup(currentSession)
        .then(lookupResult => {
            currentSession.stems = lookupResult

            ChirpSessionManager.updateSession(sessionId, currentSession, app)
                .then(updatedEnt => response.makeAudioResponse(app, currentSession))
        })
        .catch(lookupError => {
            logError('setStemsBpm()', lookupError)

            if(lookupError.suggestions) {
                // TODO(atripaldi) handle? we shouldnt have suggestions if bpm is never wrong
                app.tell(`failure! bpm is ${newBpm}`)
            }
        })
}
