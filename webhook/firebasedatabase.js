/*
Copyright 2017 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
"use strict";

const serviceAccount = require("./firebase_credentials.json");
const admin = require("firebase-admin");

// set up firebase config
class FirebaseDatabase {
	constructor() {
		this.config = {
			credential: admin.credential.cert(serviceAccount),
			databaseURL: "https://say-to-play.firebaseio.com/"
		};

		this.initialize()
	}

	initialize() {
		if (!admin.apps.length) {
			admin.initializeApp(this.config);
		}
		this.ref = admin.database().ref();
		this.errorsRef = this.ref.child("errors");
        this.logsRef = this.ref.child("logs");
	}

	// Log errors from fallback intent
	error(sessionId, category, label = "", action = "Intent") {
		this.currentSessionRef = this.errorsRef.child(sessionId);
		const data = {
			category: category,
			action: action,
			label: label
		};
		this.currentSessionRef.push(data);
	}

	log(sessionId, category, data = null) {
        this.currentSessionRef = this.logsRef.child(sessionId);

        const dataToLog = {
            category: category,
            action: "Intent"
        }

        if(data !== null) {
			dataToLog['data'] = data
		}

        this.currentSessionRef.push(dataToLog);
	}
}

exports.firebaseDB = new FirebaseDatabase()
