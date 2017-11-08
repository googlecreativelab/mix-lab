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


/**
 * response.js
 *
 * We handle all potential responses through Actions on Google & Dialogflow here. Specifically, in most cases,
 * we use the built in Response functionality from Dialogflow for easier editability by our writers, replacing
 * and removing pieces on the fly based on conditions.
 */

const fetch = require('node-fetch');

const { logDebug, logError } = require('./logging')
const { makeCard } = require('./sharing-card')

/**
 * Url to our stitching service that creates mp3s for Assistant to play on the fly
 *
 * This service is not part of our OSS release. It used Sox and Rubberband to combine base stems (WAVs) on the fly,
 * using the same json schema we used in our /lookup calls. It ran on a quite beefy flex app engine instance.
 */
const AUDIO_STITCHER_SERVICE = 'your-stitcher-url'

/**
 * Minimum number of 'sessions' we want to go thru before we start showing the card
 * that links out to the website
 */
const NUM_SESSIONS_B4_CARD = 3

/**
 * Combined with above, we'll only show the card every N sessions after we initially allow it
 * so we don't spam users
 */
const SESSIONS_BETWEEN_CARDS = 3

const MIN_SESSION_B4_EXTENDING_OUTRO = 2

const PARAM_INSTRUMENT = '$instrument'

const POST_ROLL_ADD_STUFF_SUGGS = [
    `This is sounding good. Try adding ${PARAM_INSTRUMENT}?`,
    `This is my jam. Try throwing in ${PARAM_INSTRUMENT}.`,
    'This sounds great. Why not try changing the speed?',
    `That sounds tasty. Maybe try adding ${PARAM_INSTRUMENT}?`
]

const POST_ROLL_EXTEND_DURATION_SUGGS = [
    'This is sounding good. Keep it going by saying "play this longer".',
    'This is my jam. Loop longer by saying "keep this going".',
    'This sounds great. Keep it going by saying "play this longer".'
]

const NO_INPUT_RESPONSES = [
    "Did you say something? I don’t think I heard you.",
    "If you want to keep jamming, you’ll need to say something.",
    "Are you still there? You haven’t said anything."
]

const EMPTY_SUGGESTION_RESPONSES = [
    "I'm sorry, I don’t think I have anything like that. Please try something different.",
    "I don't think I have that one yet, please try something else.",
    "Checked the library and couldn't find anything for that. Try something else.",
    "Dusted off my records and couldn't find that, why don't you try something else?"
]

const UNKNOWN_ADD_RESPONSES = [
    'I\'m sorry, I don\'t think I have anything like that. Please try something different.',
    'I don\'t think I have that one yet, please try something else.',
    'Checked the library and couldn\'t find anything for that. Try something else.',
    'Dusted off my records and couldn\'t find that, why don\'t you try something else?'
]

const INSTRUMENT_TYPES = ['guitar', 'bass', 'drums', 'keyboard', 'wind', 'strings']
const INSTRUMENT_SUGGS = ['a guitar', 'a bass', 'some drums', 'a keyboard', 'some winds', 'some strings']

/**
 * Service to hit for creating share links to the website, creating a hash of our currentSession object
 * and returning that string.
 */
const HASH_SERVICE = 'https://mixlab-dev.appspot.com/hash'

/**
 * Hopefully you never hear this. If for some reason the stitcher fails or if stem object is broken, the <audio>
 * tag will play this rather than any audio, typically followed by one of the above POST_ROLL suggestions... Whoops.
 */
const WHOOPS_AUDIO_ERROR = "Whoops, there's supposed to be audio playing. Please ignore what I'm about to say."

/**
 * Creates the proper response for when a user adds a new instrument to our current session.
 *
 * On Dialogflow there should be two response objects returned in our RichResponse.items:
 * @item SimpleResponse 	this has all the successful responses, where we append our ssml to play
 * 							NOTE this needs both text and audio for it to autopopulate displayText on return, in most
 * 							cases this is already filled in as $filler, which is ignored and removed with ssml
 *
 * @param app
 * @param currentSession
 */
exports.makeAudioResponse = (app, currentSession) => {
    let sessionCount = currentSession.sessionCount

    // determine when to show our sharing card
    if(app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)) {
        let showCard = sessionCount === NUM_SESSIONS_B4_CARD ||
            (sessionCount > NUM_SESSIONS_B4_CARD &&
                sessionCount % SESSIONS_BETWEEN_CARDS === 0)

        if(showCard) {
            let modifiedSession = Object.assign({}, currentSession)

            // move stems
            modifiedSession['tracks'] = modifiedSession.stems
            delete modifiedSession.stems

            // move sfx
            modifiedSession = moveSfx(modifiedSession)

            // Build rich response with custom sharing card using modified session object
            // to conform with the structure of website (.tracks instead of .stems - oops)
            getHash(modifiedSession)
                .then(hash => {
                    finishAudioResponse(app, currentSession, sessionCount, makeCard(app, hash))
                })
                .catch(error => {
                    logError('getHash error', error)
                    finishAudioResponse(app, currentSession, sessionCount)
                })

        } else {
            // quickly return without calling hash API
            finishAudioResponse(app, currentSession, sessionCount)
        }
    } else {
        // just respond quickly, its on the Home, not a device with a screen
        finishAudioResponse(app, currentSession, sessionCount)
    }
}

/**
 * Used for when we trigger the clear intent.
 *
 * On Dialogflow there should be two response objects returned in our RichResponse.items:
 * @item SimpleResponse 	this has all the successful responses, where we append our ssml to play
 * @item SimpleResponse 	this has responses for when you tried to clear an empty stem array
 *
 * @param app
 * @param wasAlreadyClear	whether or not to use the second SimpleResponse
 */
exports.makeClearResponse = (app, wasAlreadyClear = false) => {
    let richResponse = app.getIncomingRichResponse()

    if(wasAlreadyClear) {
        richResponse.items.splice(0, 1)
    } else {
        richResponse.items.pop()
    }

    return app.ask(richResponse, NO_INPUT_RESPONSES)
}

// TODO(atripaldi) make arrays of potential responses for use on these one-off use-cases or build them to pull from
// Dialogflow responses, which would require removal from intent handling in make audio response

exports.makeCantIncreaseDurationResponse = (app) => {
	return app.ask("How can we increase the duration of literally nothing? Try adding some instruments!", NO_INPUT_RESPONSES)
}

exports.makePlayWhatAgainResponse = (app) => {
    return app.ask("Play what again? There's nothing here! Try adding some instruments!", NO_INPUT_RESPONSES)
}

exports.makeUnknownAddResponse = (app) => {
    return app.ask(getRandomItem(UNKNOWN_ADD_RESPONSES), NO_INPUT_RESPONSES)
}

exports.makeEmptySuggestionsResponse = app => {
    return app.ask(getRandomItem(EMPTY_SUGGESTION_RESPONSES), NO_INPUT_RESPONSES)
}

// ------------------------------------------------------------------------------------------------
// Internal Methods
// ------------------------------------------------------------------------------------------------

const finishAudioResponse = (app, currentSession, sessionCount, card = null) => {
    let richResponse = app.getIncomingRichResponse()
    let url = getAudioURL(currentSession)
    let suggestion = getSuggestionPostRoll(sessionCount, currentSession)

    // hack hack hack since 'speech' or replacing 'textToSpeech' does nothing, need 'ssml' and  to remove 'textToSpeech'
    richResponse.items[0].simpleResponse['ssml'] = getSpeechResponse(url, suggestion)
    delete richResponse.items[0].simpleResponse.textToSpeech

    // add the card if we got one
    if(card) {
        richResponse.addBasicCard(card)
        logDebug('richResponse', card)
    }

    return app.ask(richResponse, NO_INPUT_RESPONSES)
}

const getHash = currentSession => {
    return fetch(
        HASH_SERVICE,
        {
            method: 'POST' ,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(currentSession)
        }
    ).then(response => response.text())
}

/**
 * hacky workaround #2 for matching schema of webhook with what is being used for sharing in website
 */
const moveSfx = session => {
    let sfx = []

    for(let i = session.tracks.length-1; i >= 0; i--) {
        let item = session.tracks[i]

        if(item.instrumentCategory === 'sfx') {
            sfx = session.tracks.splice(i,1)
            break
        }
    }

    if(sfx.length > 0) {
        session['sfx'] = sfx
    }

    return session
}

const getSuggestionPostRoll = (sessionCount, currentSession) => {
     if(sessionCount >= MIN_SESSION_B4_EXTENDING_OUTRO && sessionCount % 2 === 0) {
        return getRandomItem(POST_ROLL_EXTEND_DURATION_SUGGS)
     } else {
         return getRandomItem(POST_ROLL_ADD_STUFF_SUGGS)
             .replace(PARAM_INSTRUMENT, getInstrumentNotPlaying(currentSession))
    }
}

const getInstrumentNotPlaying = currentSession => {
    let instruments = INSTRUMENT_TYPES.slice()
    let suggestions = INSTRUMENT_SUGGS.slice()

    for(let i = currentSession.stems.length-1; i >= 0; i--) {
        let item = currentSession.stems[i]

        if(instruments.includes(item.instrumentCategory)) {
            instruments.splice(i,1)
            suggestions.splice(i,1)
        }
    }

    logDebug('getInstrumentNotPlaying', instruments, currentSession.stems)

    if(suggestions.length > 1) {
        return getRandomItem(suggestions)
    } else if (suggestions.length === 1) {
        return suggestions[0]
    } else {
        // we've used them all (great!) so why not just pick something random
        return getRandomItem(INSTRUMENT_SUGGS)
    }
}

const getSpeechResponse = (stemsUrl, optionalSuggestion='', optionalPreRoll='') => {
    let prerollBreak = optionalPreRoll !== '' ? '<break time="1s"/>' : ''
    return `<speak>${optionalPreRoll} ${prerollBreak} <audio src="${stemsUrl}">${WHOOPS_AUDIO_ERROR}</audio> ${optionalSuggestion}</speak>`
}

const getAudioURL = currentSession => {
    return AUDIO_STITCHER_SERVICE + `/${encodeURIComponent(JSON.stringify(currentSession.stems))}/${currentSession.duration}`
}

const getRandomItem = array => array[Math.floor(Math.random()*array.length)];
