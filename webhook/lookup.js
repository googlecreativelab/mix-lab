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

const fetch = require('node-fetch');

const { logDebug, logError } = require('./logging')

const STEM_LOOKUP_SERVICE = 'https://mixlab-dev.appspot.com/lookup'
const SONG_LOOKUP_SERVICE = 'https://mixlab-dev.appspot.com/song'

/**
 * Calls our Lookup Service to get stems based on our previous requests and stems added to our session
 *
 * @param currentSession
 * @returns {Promise}
 */
exports.getStemsFromLookup = currentSession => {
    return new Promise((resolve, reject) => {
        // get an array of the previous requests made, or just use simple one (typically from add/remove)
        let lookupRequest = currentSession.stems.map(stem => stem.request ? stem.request : stem)

        logDebug('lookupStems', lookupRequest)
        lookupStems(lookupRequest)
            .then(lookupResult => {
                logDebug('lookupResult', lookupResult)

                // Make sure the latest stem isn't failure,
                let lookupError = checkLookupResultsForError(lookupResult)
                if(lookupError) {
                    // TODO(atripaldi) this seems to be the only rejection, but should not be
                    // design a better reject object for the different types of potential failures
                    return reject(lookupError)
                }

                // Replace stem if overlapping an instrument that already exists
                if(lookupResult.length > 1) {
                    lookupResult = replaceInstrumentWithLatestIfPossible(lookupResult)
                }

                // return successful lookup
                resolve(lookupResult)
            })
            .catch(err => {
                logError('LookupFailure', err)
                reject(err)
            })
    })
}

exports.getSongFromLookup = genresArr => {
    return new Promise((resolve, reject) => {
        let options = {
            method: 'POST' ,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(genresArr)
        }

        fetch(SONG_LOOKUP_SERVICE, options)
            .then(response => response.json())
            .then(json => {
                resolve(json)
            })
            .catch(err => reject(err))
    })
}

const lookupStems = requestedStem => {
    return fetch(
        STEM_LOOKUP_SERVICE,
        {
            method: 'POST' ,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(requestedStem)
        }
    ).then(response => response.json())
}

/**
 * Checks to see if most recent object in lookup is an error. If so, returns
 * the suggestions
 */
const checkLookupResultsForError = lookupResult => {
    let lastAddedStem = lookupResult[lookupResult.length - 1]

    if(lastAddedStem.error) {
        logDebug('checkLookupResultsForError()', lastAddedStem.error)
        return lookupResult.pop()
    }

    return null
}

const replaceInstrumentWithLatestIfPossible = lookupResult => {
    const latestStem = lookupResult.pop()
    let foundReplacement = false

    logDebug('replaceIfPossible 1', lookupResult)

    // check each object in array
    for(let i = 0; i < lookupResult.length; i++) {
        let stem = lookupResult[i];

        logDebug('replaceIfPossible 1.5', stem.instrumentCategory, latestStem.instrumentCategory)

        if(stem.instrumentCategory === latestStem.instrumentCategory) {
            lookupResult.splice(i, 1, latestStem)
            foundReplacement = true
            break
        }
    }

    if(!foundReplacement) {
        // no need to replace, so just put back on result
        lookupResult.push(latestStem)
    }

    logDebug('replaceIfPossible 2', lookupResult)

    return lookupResult
}