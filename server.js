#!/usr/bin/env node
var server = require('./lib/server.js');
server.start(server.parseArgs(process.argv.slice(2)));
