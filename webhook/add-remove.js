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

const { getStemsFromLookup, getSongFromLookup } = require('./lookup')
const { logDebug, logError, log } = require('./logging')

const { firebaseDB }= require("./firebasedatabase.js");

// ARGs related to our entities in DialogFlow, here are the four types we use add/remove intents
const ARG_GENRE = 'genre'
const ARG_INSTRUMENT = 'instrument'
const ARG_SOLO = 'solo'
const ARG_SFX = 'sfx'

/**
 * Argument for the genres list object from allInstruments intent
 */
const ARG_GENRES = 'genres'

/**
 * Main call from an Dialogflow Intent to Add an Instrument to our session.
 */
exports.addInstrumentToSession = (app, currentSession, sessionId) => {
	// Create object of requested instrument
	let requestedStem = getRequestedStemFromApp(app)

    firebaseDB.log(sessionId, "wh_addInstrument", requestedStem)

    log('addInstrumentToSession', requestedStem, currentSession ? currentSession.stems : 'stems:[]')

    // addSong intent can trigger without any guaranteed instrument or genre, so we need to catch those
	// empty sessions and fallback gracefully
	if(isEmptyStem(requestedStem)) {
		logError('addInstrumentToSession.emptyStem', app.getRawInput())
		return response.makeUnknownAddResponse(app)
	}

    // If we have other stems, make sure we match bpm
    if(currentSession && currentSession.stems.length > 0) {
        requestedStem.bpm = currentSession.stems[0].bpm
    }

    // Add stem to session for lookup
    currentSession.stems.push(requestedStem)

	getStemsFromLookup(currentSession)
		.then(lookupResult => {
			// set current session to the result
			currentSession.stems = lookupResult

            firebaseDB.log(sessionId, "wh_addInstrument_success")

            ChirpSessionManager.updateSession(sessionId, currentSession, app)
                .then(updatedEnt => response.makeAudioResponse(app, currentSession))
		})
		.catch(lookupError => {
            firebaseDB.error(sessionId, "wh_addInstrument_error")

			if(lookupError.suggestions) {
				handleSuggestions(app, currentSession, sessionId, lookupError.suggestions)
			} else {
                logError('addInstrumentToSession', 'getStemsFromLookup catch', lookupError)
			}
		})
}

/**
 * Main call from an Dialogflow Intent to Remove an Instrument from our session.
 */
exports.removeInstrumentFromSession = (app, currentSession, sessionId) => {
	let requestedStem = getRequestedStemFromApp(app)
	let removedStem = tryToRemoveStemFromSession(requestedStem, currentSession)

    firebaseDB.log(sessionId, "wh_removeInstrument", requestedStem)

    // You just removed the last one
	if(removedStem && currentSession.stems.length === 0) {
		return ChirpSessionManager.updateSession(sessionId, currentSession, app)
			.then(response => {
				// TODO(atripaldi) now that we have stem instead of boolean we can get cutesie here
				return app.ask("Well, you've removed everything. Now what?")
			})
	}

	// There's only one now, lets kill bpm so our lookup will get the original speed
	if(removedStem && currentSession.stems.length === 1) {
		delete currentSession.stems[0].bpm
	}

	getStemsFromLookup(currentSession)
		.then(lookupResult => {
            // set current session to the result
			currentSession.stems = lookupResult

            firebaseDB.log(sessionId, "wh_removeInstrument_success")

            ChirpSessionManager.updateSession(sessionId, currentSession, app)
                .then(updatedEnt => response.makeAudioResponse(app, currentSession))
		})
		.catch(lookupError => {
            firebaseDB.error(sessionId, "wh_removeInstrument_error")
			logError('removeInstrumentFromSessio::StemLookup', lookupError)
			return app.ask('Error looking up tracks, please try again!')
		})
}

/**
 * Main call from Dialogflow to Replace Instrument intent handler, for when a user wants to try a different instrument
 */
exports.replaceInstrumentInSession = (app, currentSession, sessionId) => {
	logDebug('replaceInstrumentInSession', currentSession)

	let specificInstrument = app.getArgument(ARG_INSTRUMENT)

	if(currentSession.stems.length === 0) {
		if(specificInstrument) {
            // they want a replacement of a specific instrument, but have nothing there
            return addInstrumentToSession(app, currentSession, sessionId)
        } else {
			return app.ask('Sorry, you haven\'t given me anything to replace yet!')
		}
	}
	
	// both options modify current session to remove the stem we want to replace
	let stemToReplace = specificInstrument ? getStemByInstrument(specificInstrument, currentSession) : currentSession.stems.pop()

	// our lookup currently pulls out the request object for re-use, so we need to update
	// that object, rather than the top level lookup return stem
	if(stemToReplace) {
		if(stemToReplace.request.exclude) {
			stemToReplace.request.exclude.push(stemToReplace.id)
		} else {
			stemToReplace.request['exclude'] = [stemToReplace.id]
		}
		// delete the id from stem so exclude can do its magic
		delete stemToReplace.request.id

		// add it back onto stack for lookup
		currentSession.stems.push(stemToReplace)
	} else {
		// they tried to replace something that wasn't in the list
		return app.ask('Well, you can\'t replace something that is not already there. Try again.')
	}

	logDebug('stemToReplace::afterUpdate', stemToReplace, currentSession.stems)

    firebaseDB.log(sessionId, "wh_replaceInstrument", stemToReplace)

	getStemsFromLookup(currentSession)
		.then(lookupResult => {
            currentSession.stems = lookupResult

            firebaseDB.log(sessionId, "wh_replaceInstrument_success")

            ChirpSessionManager.updateSession(sessionId, currentSession, app)
                .then(updatedEnt => response.makeAudioResponse(app, currentSession))
		})
		.catch(lookupError => {
            firebaseDB.error(sessionId, "wh_replaceInstrument_error")

			if(lookupError.suggestions) {
				return handleSuggestions(app, currentSession, sessionId, lookupError.suggestions, true)			
			} else {
				// Other error, what could it be?
				logError('replaceInstrumentInSession() getStemsFromLookup', lookupError)
				return app.ask("Sorry, I didn't catch that")
			}
		})
}

exports.handleAllInstruments = (app, currentSession, sessionId) => {
	let genresArr = app.getArgument(ARG_GENRES)

	logDebug('handleAllInstruments', genresArr)

    firebaseDB.log(sessionId, "wh_allInstruments", genresArr)

	getSongFromLookup(genresArr)
		.then(lookupResult => {
            // potential for some empty result arrays, or if return comes back with { error: 'msg' } (bug for @tambien)
            if( (lookupResult && lookupResult.length === 0) ||
                (typeof lookupResult === 'object' && lookupResult.hasOwnProperty('error')) )  {
                return app.ask('Sorry, I couldn\'t find anything for that. Can you try something else?')
            }

			currentSession.stems = lookupResult

            firebaseDB.log(sessionId, "wh_allInstruments_success")

            ChirpSessionManager.updateSession(sessionId, currentSession, app)
                .then(updatedEnt => response.makeAudioResponse(app, currentSession))
		})
		.catch(lookupError => {
            firebaseDB.error(sessionId, "wh_allInstruments_error")
            logError('handleAllInstruments() getSongFromLookup', lookupError)
            return app.ask("Sorry, I didn't catch that")
		})
}

// ---------------------------------------------------------------------------------------------------------
// internal methods
// ---------------------------------------------------------------------------------------------------------

const tryToRemoveStemFromSession = (requestedStem, currentSession) => {
	for(let i = 0; i < currentSession.stems.length; i++) {
		let stem = currentSession.stems[i]

		// test against instrument or instrumentCategory, could be either depending on specificity of request
		if(stem.instrument === requestedStem.instrument ||
			stem.instrumentCategory === requestedStem.instrument) {
			return currentSession.stems.splice(i, 1)
		}
	}
	return null
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

const handleSuggestions = (app, currentSession, sessionId, suggestions, justPlaySuggestion = false) => {
    logDebug('handleSuggestions', suggestions, currentSession.stems)

    // There is possibility of no suggestions, so deal with it
    if(suggestions.length) {
        if(justPlaySuggestion) {
            // Suggestions don't come with request object, so take it off the last call
            // we've made and add it on so we can have it for future excludes
            let stemToAdd = suggestions[0]
            stemToAdd['request'] = currentSession.stems.pop().request
            currentSession.stems.push(stemToAdd)

            ChirpSessionManager.updateSession(sessionId, currentSession, app)
				.then(entity => response.makeAudioResponse(app, currentSession))
        } else {
            return app.ask(makeSuggestion(suggestions))
        }
    } else {
        return response.makeEmptySuggestionsResponse(app)
    }
}

const makeSuggestion = suggestions => {
	if(suggestions.length) {
        let instrument1 = suggestions[0].instrument
        let tag1 = suggestions[0].tag

        let SUGGESTION_CHOICES = [
            `Sorry, I don’t have that one, but I’ve got a ${tag1} ${instrument1}`,
            `I can’t play that, but why not try a ${tag1} ${instrument1}`,
            `I haven’t learned that one yet, but try a ${tag1} ${instrument1}`
        ]

		if(suggestions.length >= 2) {
            let instrument2 = suggestions[1].instrument
            let tag2 = suggestions[1].tag

            SUGGESTION_CHOICES = [
                `Sorry, I don’t have that one, but I’ve got a ${tag1} ${instrument1} or ${tag2} ${instrument2}.`,
                `I can’t play that, but why not try a ${tag1} ${instrument1} or ${tag2} ${instrument2}.`,
                `I haven’t learned that one yet, but try a ${tag1} ${instrument1} or ${tag2} ${instrument2} instead.`
            ]
        }

		return SUGGESTION_CHOICES[Math.floor(Math.random()*SUGGESTION_CHOICES.length)]
	} else {
		return "Sorry, I don't have that. Try something else."
	}
}

const getRequestedStemFromApp = app => {
	return getRequestedStem(
		app.getArgument(ARG_INSTRUMENT),
		app.getArgument(ARG_GENRE),
		app.getArgument(ARG_SFX),
		app.getArgument(ARG_SOLO)

	)
}

/**
 * Return the singular data object needed to append to our session and stem lookup arrays
 * 
 * @param  {String} instrument	Required instrument entity from Dialogflow
 * @param  {String} tag        	Optional genre entity from Dialogflow
 * @param  {String} sfx        	Optional sfx entity from Dialogflow for sound effects
 * @param  {String} solo       	Optional solo entity from Dialogflow - if exists, loop = false and stitcher will add single event
 *
 * @return {Object}            	stem object to use with lookup
 */
const getRequestedStem = (instrument, tag=null, sfx=null, solo=null) => {
	let data = {}

	if(instrument) { data['instrument'] = instrument.toLowerCase() }
	if(tag) 	{ data['tag'] = tag.toLowerCase() }
	if(sfx) 	{ data['sfx'] = sfx.toLowerCase() }

	// loop takes a boolean but Dialogflow will return a string or null
	data['loop'] = solo === null

	return data
}


const isEmptyStem = requestedStem => {
    return requestedStem.instrument === undefined &&
        requestedStem.tag === undefined &&
        requestedStem.sfx === undefined
}

