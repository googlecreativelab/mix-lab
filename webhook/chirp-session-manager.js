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

const { logDebug } = require('./logging')

/**
 * Reference to our project id for our datastore, where we will be storing our sessions from Actions on Google
 */
const datastore = require('@google-cloud/datastore')({
    projectId: 'your-project-id'
});

const KIND_SESSION = 'Session'

const PROP_CREATED_AT = 'createdAt'
const PROP_UPDATED_AT = 'updatedAt'
const PROP_SESSION_COUNT = 'sessionCount'
const PROP_STARTING_BPM = 'startingBpm'
const PROP_DURATION = 'duration'
const PROP_STEMS = 'stems'

const DEFAULT_DURATION = 15
const DEFAULT_EXCLUDES = ['stems', 'duration']

/**
 * Creates a new user session. Typically called from WELCOME intents from Dialogflow, 
 * but can also be called in case of extreme error, during add/remove/etc if WELCOME
 * never fires.
 */
const createSession = id => {
    return new Promise((resolve, reject) => {
        let now = new Date()

        let entityForSaving = {
            key: datastore.key([KIND_SESSION, id]),
            data: [
                {
                    name: PROP_CREATED_AT,
                    value: now
                },
                {
                    name: PROP_UPDATED_AT,
                    value: now
                },
                {
                    name: PROP_SESSION_COUNT,
                    value: datastore.int(0),
                    excludeFromIndexes: true
                },
                {
                    name: PROP_STARTING_BPM,
                    value: datastore.int(0),
                    excludeFromIndexes: true
                },
                {
                    name: PROP_DURATION,
                    value: datastore.int(DEFAULT_DURATION),
                    excludeFromIndexes: true
                },
                {
                    name: PROP_STEMS,
                    value: [],
                    excludeFromIndexes: true
                }
            ]
        }

        datastore.save(entityForSaving)
            .then(response => {
                logDebug('createSession', response)
                resolve()
            })  
            .catch(error => {
                reject(error)
            })
    })
}

/**
 * Gets a users currently active session on the Home.
 * 
 * @param  {String} id  sessionId returned from Dialogflow/Actions on Google
 * @return {Promise}    Promise with the session entity
 */
const getSession = id => {
    return new Promise((resolve, reject) => {
        let key = datastore.key([KIND_SESSION, id])

        datastore.get(key)
            .then(response => {
                resolve(response[0])
            })
            .catch(error => {
                reject(error)
            })
    })
}

/**
 * Updates a session after making adjustments to the currently playing tracks, such as adding,
 * removing or changing tempo.
 *
 * We also added the ApiAiApp instance as a catch-all for all datastore errors. This is merely a convenience,
 * so that in all the places we call update from, they can deal with the separate updates on their own, but
 * all will have the same general error if this fails (it shouldn't).
 * 
 * @param  {String} id    sessionId returned from Dialogflow/Actions on Google
 * @param  {Object} data  data object we create from lookup 
 * @param  {ApiAiApp} app fallback to catch all potential datastore errors and use the same error
 * @return {Promise}      Google Datastore promise with the saved information (mostly useless)
 */
const updateSession = (id, data, app) => {
    return new Promise((resolve, reject) => {
        data[PROP_UPDATED_AT] = new Date()

        let key = datastore.key([KIND_SESSION, id])
        let entityForSaving = {
            key: key,
            data: data,
            method: 'update'
        }

        logDebug("ChirpSessionManager::updateSession()", id, data)

        datastore.save(entityForSaving)
            .then(entity => {
                resolve(entity)
            })
            .catch(error => {
                app.ask('Sorry, could not store session, please try again')
                reject(error)
            })
    })
}

const clearSession = (id, session, app) => {
    session[PROP_STARTING_BPM] = datastore.int(0)
    session[PROP_DURATION] = datastore.int(DEFAULT_DURATION)
    session[PROP_STEMS] = []

    return updateSession(id, session, app)
}

module.exports = {
    createSession,
    getSession,
    updateSession,
    clearSession,
    PROP_SESSION_COUNT,
    PROP_DURATION,
    PROP_STEMS,
    PROP_STARTING_BPM,
    DEFAULT_DURATION
}
