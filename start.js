'use strict';

// ------- Fitst things first --------------------------------------------------
// Load enviroment vars.
require('dotenv').config();

// New Relic. ALMOST first line.
// TODO: check if it actually breaks anything.
require('newrelic');

// ------- Imports -------------------------------------------------------------
const throng = require('throng');
const yargs = require('yargs');

const config = require('./config');
const BlinkWebApp = require('./src/app/BlinkWebApp.js');
const BlinkWorkerApp = require('./src/app/BlinkWorkerApp.js');
const BlinkTimerApp = require('./src/app/BlinkTimerApp.js');

// ------- Args parse ----------------------------------------------------------

// TODO: list workers
const argv = yargs
  .usage('Usage: node $0 <command>')
  .version(config.app.version)
  .command('web', 'Start a web app')
  .command('worker <name>', 'Start worker with the given name')
  .command('timer  <name>', 'Start timer with the given name')
  .demandCommand(1, 'Please provide a valid command')
  .help()
  .argv;

// ------- App bootstrap -------------------------------------------------------

let blinkApp;
let concurrency;
const [command] = argv._;
switch (command) {
  case 'web':
    concurrency = process.env.BLINK_CONCURRENCY_WEB;
    throng({
      workers: concurrency || 1,
      // TODO: set finite lifetime and grace shutdown period
      lifetime: Infinity,
      start: () => {
        blinkApp = new BlinkWebApp(config);
        blinkApp.start();
        // TODO: prepare shutdown.
      },
    });
    break;
  case 'worker':
    // TODO:  Workers concurrency.
    blinkApp = new BlinkWorkerApp(config, argv.name);
    blinkApp.start();
    break;
  case 'timer':
    blinkApp = new BlinkTimerApp(config, argv.name);
    blinkApp.start();
    break;
  default:
    throw new Error('Argument parsing integrity violation');
}

// ------- End -----------------------------------------------------------------
