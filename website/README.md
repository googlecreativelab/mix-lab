# Mix Lab Website

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.3.2.

Requires Angular cli `npm install -g @angular/cli@latest`

## Development server
Run `npm install` for deps, also run `bower install` for Polymer deps.
Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Running HTTPS locally
In order to use the microphone on your local codebase on a mobile device, you'll need the browser to think it's https.
First create a certificate/key set:  `openssl genrsa -out server.key 2048; openssl req -new -x509 -sha256 -key server.key -out server.cer -days 365 -subj /CN=0.0.0.0`
Run `npm run serve-https`

Note: you'll have to bypass the "Your connection is not private" message.
In chrome, click ADVANCED —> "Proceed to [your IP address] (unsafe)" 

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `ng serve`.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Deployment
To push to a version, run: `npm run stage`
