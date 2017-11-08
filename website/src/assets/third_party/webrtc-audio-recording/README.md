# Audio Recording Using WebRTC

This repository demonstrates how it is possible to record and playback audio in most modern browsers, and most notably - Safari 11 on both Mac and IOS.

#### [Click here](https://danielstorey.github.io/webrtc-audio-recording/) for the demo

<hr>

You can also serve and work on the files locally but please note this will not work unless the site is hosted using SSL (https://)

I have included Open SSL certificates for convenience and once you have installed the necessary modules via `npm install` you can simply run `node server` and open `https://localhost:3000`  in your browser to view.

<hr>

The most important thing to note about getting this to work in IOS is that the `AudioContext` must be created within an event handler and not within an automatically running script or a Promise. This is to do with the measures that Apple has put in place to prevent audio from automatically playing when you visit a site. So as long as you call `new AudioContext()` or `new webkitAudioContext()` from within an event handler you'll be fine.

The other thing to watch out for is to make sure that this context not 'garbage collected', otherwise the audio processor will stop with no error or warning. In this example I have created a `Storage` object in the global scope and assigned the `AudioContext` as a property of this object.

<hr>

Finally I just want to say that much of my work on this has been based on, (and copied!) from [Muaz Khan's](https://github.com/muaz-khan) rather brilliant [RecordRTC](https://github.com/muaz-khan/RecordRTC) library, which includes video and gif recording as well.

This is simply a lightweight example of how recording audio can work and not necessarily a reusable library in its current state.