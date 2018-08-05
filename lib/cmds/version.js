'use strict';

const clc = require('cli-color');

const commandExecutor = require('../commandExecutor');
const { printTitleCard } = require('../printTitleCard');

module.exports = () => {
  printTitleCard();
  process.stdout.write(clc.move.up(1));
  commandExecutor.execProcess('docker -v');
  commandExecutor.execProcess('docker-compose -v');
  process.stdout.write('\n');
  process.exit(0);
};

module.exports.fixedEnv = true;
