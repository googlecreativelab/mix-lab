Overview
===

[MixLab] is an experiment that makes it easier for anyone to create music, using simple voice commands. It's part of the [Experiments With Google] platform, launching as part of our newest category - [Voice Experiments].

![Mix Lab Website](https://github.com/googlecreativelab/mix-lab/raw/master/images/mixlab.jpg)

Just say things like "Play me a funky bass," or "Add some jazz drums”, and [Dialogflow] will parse your intent into an actionable response, creating interesting songs at your command.

MixLab is available on the Google Home and all Assistant platforms using [Actions on Google], so you can start making music by saying "Hey Google, talk to Mix Lab".

And you can jam out with some fun visuals in our web experience, available at [g.co/MixLab](g.co/MixLab).

This is an experiment, not an official Google product. We will do our best to support and maintain this experiment but your mileage may vary.


What do we have here?
---

As with most of our experiments, this repo has 3 parts of the production system available to you:

### Dialogflow - Intents and Entities

Dialogflow allows for easy exporting and importing of projects in json format to help facilitate
both versioning and sharing, [as explained here](https://dialogflow.com/docs/best-practices/import-export-for-versions).

Included is a slightly modified version of our MixLab app, leaving specific project and webhook id's to be updated by you, the developer. 

### The Website

Fairly self-explanatory, the website/directory contains all the code and instructions for running
your own version of MixLab locally. We've even spun up a development music lookup API available through localhost so you can use the same music and database we use in production. See below.

Dialogflow voice input is passed in, then reacts and responds based on intent action and parameters.

### The Webhook

Finally, the webhook is where we add advanced handling to Dialogflow, using the [Actions on Google NodeJS implementation](https://github.com/actions-on-google/actions-on-google-nodejs).

When a request comes in from the Assistant (via Home or on device or website), Dialogflow parses intent like normal, passing us intent action and specific parameters based on that intent. 

For example, the `addInstrument` intent will likely pass along a `genre` or `instrument` value that
can be used to create a proper call to our `/lookup` API to find stems to play.

This code is meant as an overview on how to handle AoG, but <b>won't work out of the box</b>.

But Why?
---

This is due to not including the `/stitching` API, which is a processor-intense service 
responsible for mixing our music stems together before returning to the Home to play.

The stitching service uses [Rubberband] for changing tempos and [SoX] for combining 
and looping audio files.  

#### If you want to set this up on your own:
Create your own stitching service, and replace the link on line 36 of `response.js`
This should be able to injest the stem array from our [dev /lookup API](http://mixlab-dev.appspot.com/)
Update package.json to point at your app id for staging buckets
Push your webhook to your Google Cloud App, and then use the link to that webhook in the Webhook section of Dialogflow, in the Fulfillment tab.

Then once you test it out on Dialogflow, most intents will be routed to your webhook, which you can follow along in either Firebase Functions or Google Cloud Functions logs.

#### Dev Lookup API

http://mixlab-dev.appspot.com/ - top level is test html for `/lookup` POST calls, check out the Inspector to see how it works. This is open to localhost:8080 for you to use while testing.

* [/song](http://mixlab-dev.appspot.com/song) GET is test like above, POST is actual service
* [/hash](http://mixlab-dev.appspot.com/hash) GET is test like above, POST is actual service

Who?
---

#### Built by

[Anthony Tripaldi](https://github.com/trippedout), [Maya Man](https://github.com/mayaman),
[Prit Patel](http://pritpatelfanclub.com/), [Yotam Mann](https://github.com/tambien), [Use All Five](https://useallfive.com/),
and friends at Google Creative Lab.

#### Music by

[Blake Straus](http://blakestraus.com/) - Composer & Musical Director

Alek Fin - Producer/Engineer

#### Musicians:

[Blake Straus](http://blakestraus.com/) - Fretted instruments, basses, keyboards

Dylan Meek - Keyboards

Roland Gajate Garcia - Drumkit and percussion

DD Horns - Brass and woodwinds

Morgan Paros - Violins

Andrew Synowiec - Fretted instruments

Corbin Jones - Basses and sousaphone

Alison Balbag - Harp

Ian Mallitz - Didgeridoo

##### Additional Production Assistance:

Daniel Braunstein, Christopher Dwyer, Zac Sager, Mashadi Maximus

Recorded, Mixed, and Mastered at Pro Audio LA

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

Final Thoughts
---

We encourage open sourcing projects as a way of learning from each other. Please respect our and other creators’ rights, including copyright and trademark rights when present, when sharing these works and creating derivative work. 

If you want more info on Google's policy, you can find that [here](https://www.google.com/policies/).


[MixLab]: https://mixlab.withgoogle.com
[Experiments With Google]: https://experiments.withgoogle.com
[Voice Experiments]: https://experiments.withgoogle.com/voice
[Actions on Google]: https://developers.google.com/actions/ 
[Dialogflow]: https://www.dialogflow.com
[Rubberband]: http://rubberbandaudio.com/
[SoX]: http://sox.sourceforge.net/
