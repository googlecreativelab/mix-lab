import { Injectable } from '@angular/core';

@Injectable()
export class FallbackService {

  constructor() { }

  // Check audio context/audio playback support
  public checkWebRTC() {
    let audioCtx = window.AudioContext || webkitAudioContext;
    if (audioCtx) {
      return true;
    }
    return false;
  }

  public checkMic() {
    if (this.checkWebRTC() &&
      (navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      return true;
    }
    return false;
  }

  // Check WebGL support
  public checkWebGL() {
    // Check for the WebGL rendering context
    if (!!WebGLRenderingContext) {
      let canvas = document.createElement('canvas'),
        names = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"],
        context;

      for (let i in names) {
        try {
          context = canvas.getContext(names[i]);
          if (context && typeof context.getParameter === 'function') {
            // WebGL is enabled.
            return 1;
          }
        } catch (e) {
          console.log(e);
        }
      }

      // WebGL is supported, but disabled.
      return 0;
    }

    // WebGL not supported.
    return -1;
  }

  // Get the SpeechRecognition object, while handling browser prefixes
  public checkSpeechRecognition() {
    const SpeechRecognition = window['SpeechRecognition'] ||
      window['webkitSpeechRecognition'] ||
      window['mozSpeechRecognition'] ||
      window['msSpeechRecognition'] ||
      window['oSpeechRecognition'];

    if (typeof SpeechRecognition !== 'undefined') {
      return true;
    }
    return false;
  }

  // Check browser support for our purposes on MixLab
  public checkBrowserSupport(checkSpeech?: boolean): Promise<any> {
    let response = {};

    return new Promise((resolve, reject) => {
      if (checkSpeech && checkSpeech === true) {

        if (this.checkSpeechRecognition() || (this.checkMic() && this.checkWebRTC())) {
          response = {
            supported: true,
            message: 'AudioContext | WebGL | SpeechRecognition is supported.'
          };
          resolve(response);
        }

        response = {
          supported: false,
          message: 'This browser doesn’t support speech recognition. Bummer!<br><br> Try using a different browser, such as <a href="https://www.google.com/chrome/" target="_blank">Google Chrome</a> for Desktop or Android.',
        };
        resolve(response);
      } else {
        let ua = navigator.userAgent || navigator.vendor;
        if ((ua.indexOf('FBAN') > -1) || (ua.indexOf('FBAV') > -1)) {
          response = {
            supported: false,
            message: 'Facebook browser does not support Mic recording.',
          };
          resolve(response);
        } else if (this.checkWebRTC() && this.checkWebGL() === 1) {
          response = {
            supported: true,
            message: 'AudioContext | WebGL is supported.',
          };
          resolve(response);
        } else if (!this.checkWebRTC()) {
          response = {
            supported: false,
            message: 'This browser does not support audio playback.',
          };
          resolve(response);
        } else if (this.checkWebGL() === 0 || -1) {
          response = {
            supported: false,
            message: 'This browser does not support WebGL.',
          };
          resolve(response);
        } else {
          response = {
            supported: false,
            message: 'Whoa! Nothing is supported, this app is basically useless.',
          };
          resolve(response);
        }
      }
    });
  }

  // Check Mobile Safari chrome
  public checkMobileChrome(): Promise<any> {
    return new Promise((resolve, reject) => {
      let response = {};
      if (navigator.userAgent.match('CriOS') && !(this.checkSpeechRecognition() || this.checkMic())) {
        response = {
          supported: false,
          message: 'This browser doesn’t support speech recognition. Bummer! Try using a different browser, such as <a href="https://www.google.com/chrome/" target="_blank">Google Chrome</a> for Desktop or Android, Safari for iOS 11+ or Desktop 11+, Firebox 55+, or Edge 15+.',
        };
        resolve(response);
      }
    });
  }

}
