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

const IS_DEBUG = true

/**
 * Use this logging for development purposes, as it will be disabled once we push live.
 *
 * @param args just like any other console.log(...) message.
 */
exports.logDebug = (...args) => {
    if(IS_DEBUG) {
        console.log.apply(this, args);
    }
}

/**
 * log all fallback and breaking errors here, with fallback mostly used for updating synonyms
 *
 * @param args Preferred to use format logError(functionName|tag, ...errors) - this will help with filtering
 */
exports.logError = (...args) => {
    console.error.apply(this, args);
}

/**
 * Use this logging for all 'analytic'-style events. For easier searching later, additional tag is required.
 *
 * @param tag Tag used for filtering in searches
 * @param args
 */
exports.log = (tag, ...args) => {
    let arr = Array.prototype.slice.call(args)
    arr.unshift(tag + " ")
    console.log.apply(this, arr)
}