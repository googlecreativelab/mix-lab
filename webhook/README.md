Mix Lab Webhook
===

Managing conversations from Dialogflow <i>with code</i>
---

When Dialogflow by itself is not enough, and we need gather additional information to properly 
respond to our users, we need to implement a webhook. Check out the docs on Fulfillment by 
[Dialogflow](https://dialogflow.com/docs/fulfillment) and 
[Actions on Google](https://developers.google.com/actions/dialogflow/fulfillment).

What's happening here
---

Here's a high level overview of what our production webhook does for Mix Lab.

* Ingests callback from Dialogflow. 
    * If call has [metadata from website](#link-to-index.js), do nothing and allow data to pass 
    through back to website, where it's handled separately.
    * If no metadata, move on, assuming Actions on Google integration from Home or Assistant.
* [Create/grab a user session](#link to session creation) from our Datastore, using ChirpSessionManager.
* [Determine Intent Action](#link to intent-handler.js), and call the proper handler method.
* Handle action (add instrument, change speed, etc), updating our user session if necessary.
* Create proper response, with properly formatted `<audio>` tag and 'post-roll', TTS for after music completes.
* Return response to Dialogflow/Actions on Google, which then gets sent to user.

We're using the [Actions on Google NodeJS package](https://github.com/actions-on-google/actions-on-google-nodejs)
to make everything even easier, with it's built in 
[DialogflowApp class](https://developers.google.com/actions/reference/nodejs/ApiAiApp). An instance 
of this class gets passed around to most handlers for convenience, along with our 
user sessions and session ids.
 
Speaking of `sessionId` - that's literally just a property of Dialogflow's response json, which we
use as a key in our Datastore for user sessions. You can check out the json Dialogflow responds with
by using the 'Try it now' feature in Dialogflow's right column, and clicking the SHOW JSON button 
after testing an Intent.

### Gotchas

As for why this won't work for you by just uploading via gcloud, let's talk about the way AoG handles audio.

[AoG uses SSML](https://developers.google.com/actions/reference/ssml) to give users a bit more control 
over the TTS response. There aren't any direct paths to the media channel like in first-party apps, 
so we play the combined stems in an `<audio>`  tag per the specification. 

The link that we pass to `src` is actually our stitching service url with our lookup json encoded as 
url params. This often looks ridiculous with 4+ tracks but that's irrelevant since end users never see it.

The stitching service (not included) merely ingests those params, looks up the proper stems, and uses
some native processing (SoX and Rubberband) on a Flex App Engine instance to match tempos, 
and combine into a single file.

This file is returned and played immediately upon load completion (there is no streaming API).

A hacky but workable solution.

### Other stuff

More detail below, but we <i>did</i> include a development `/lookup` API for test usage. This also includes
the `/hash` endpoint in `response.js`. This is used to create simple sharing links from the Assistant
to the main web experience. We pass the same lookup json again to this method and it will return a hashed id
that can be played back on the web. It's just a simple Datastore id lookup.

Development
---

Since we're such nice people, we've actually spun up a development version of the lookup
endpoint, using our production music set. It's CORs-OK at localhost:8080 for local development, and 
for now, fine for your personal Cloud Functions as well.

You'll need to add your Google Cloud app id in [`chirp-session-manager.js`](chirp-session-manager.js), which will need to have 
Datastore APIs enabled for session storage.

We've also included `test-data.json`, a sample response copied from Dialogflow's testing tool mentioned
above, which you can pass locally with `npm run test`, as documented in `package.json`.

Any other questions, feel free to file an issue or reach out directly to @trippedout.

License
---

Copyright 2017 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. 