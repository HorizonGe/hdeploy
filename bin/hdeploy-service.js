#!/usr/bin/env node
import minimist from 'minimist';

import Service from '../src/service.js';

const service = new Service();

const rawArgv = process.argv.slice(2);
// const args = require('minimist')(rawArgv)
const args = minimist(rawArgv);
const command = args._[0];

service.run(command, args, rawArgv);
