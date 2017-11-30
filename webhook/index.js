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

"use strict";

const DialogflowApp = require("actions-on-google").DialogflowApp;

const { handleIntent } = require("./intent-handler");
const { handleFollowups } = require("./followups");
const { logDebug, logError } = require("./logging");

const { firebaseDB }= require("./firebasedatabase.js");

/**
* Main webhook export. If not from website, passes request along for all Actions on Google integration handling
*
* Deploying manually:
* 	gcloud beta functions deploy webhook --trigger-http --stage-bucket your.stagingbucket.appspot.com
*/
exports.webhook = (req, res) => {
	initialize(req, res)
}

// Helper to export separate function for testing in dev environment
exports.webhookStaging = (req, res) => {
	initialize(req, res)
}

const initialize = (req, res) => {
    // Our main app website should pass along an extra var with Dialogflow request letting us know
    // where its coming from. Lacking this variable means coming from Home, Dialogflow, Web Simulator etc
    let requestFromFrontend =
        (req.body.originalRequest && req.body.originalRequest["source"] && req.body.originalRequest["source"] === "frontend") || false;

    if (requestFromFrontend) {
        // frontend doesn't yet need any fancy processing, pass the result along from Dialogflow straight back to frontend
        // so they can handle on their own
        res.send(req.body);
    } else if (req.body.result) {
        // we have a result so lets process all this good stuff
        new DialogflowApp({ request: req, response: res }).handleRequest(app => {
            logDebug("handleWebhook() result", req.body.result.fulfillment, req.body.result);
            logDebug("handleWebhook() originalRequest", req.body.originalRequest);

            if (req.body.originalRequest && req.body.originalRequest.data && isHealthCheck(req.body.originalRequest.data)) {
                // send original body through so we don't create anything in datastore
                logDebug("isHealthCheck() true - exiting.");
                return res.send(JSON.stringify(req.body));
            }

            let action = app.getIntent();

            if (action === "input.unknown") {
                handleFallback(req, res);
            } else if (action.includes("followup.")) {
                handleFollowups(app, req.body, res);
            } else {
                handleIntent(app, req.body);
            }
        });
    } else {
        // only fires if malformed request from Dialogflow / local webserver that doesn't handle frontend var
        res.send(JSON.stringify({ displayText: "thank you for testing!" }));
    }
}

/**
 * https://developers.google.com/actions/console/actions-health-check
 * Health checks were triggering proper WELCOME intents, which were creating many, many empty
 * sessions in our datastore. This checks to see if it's a health check, which will then just respond
 * as if it were the website or a fallback.
 */
const isHealthCheck = originalRequestData => {
	let args = originalRequestData.inputs[0].arguments; // args = [Object]
	let isCheck = false;
	if (args !== undefined && args.length > 0) {
		args.forEach((item, i) => {
			logDebug(`isHealthCheck() args[${i}].item`, item, item.name, item.name === "is_health_check");
			if (item.name === "is_health_check") {
				isCheck = true;
			}
		});
	}

	return isCheck;
};

const handleFallback = (req, res) => {
	// Send the info straight back to site after logging
	logError("handleFallback", req.body.result.resolvedQuery);
	logError("handleFallback.full", req.body.result);

	try {
        firebaseDB.error(req.body.sessionId, "wh_fallback", req.body.result.resolvedQuery);
		res.send(JSON.stringify(req.body));
	} catch (exception) {
		logError("track error", exception);
		res.send(JSON.stringify(req.body));
	}
};
