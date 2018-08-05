'use strict';

const clc = require('cli-color');
const { name, version } = require('../package.json');

module.exports = {
  printTitleCard() {
    console.log(clc.blue(`
    __________                 ._.
    \\______   \\_____    _____  | |
    |    |  _/\\__  \\  /     \\  | |
    |    |   \\ / __ \\|  Y Y  \\  \\|
    |______  /(____  /__|_|  /  __
            \\/      \\/      \\   \\/`));
    console.log(`\n${name} CLI: ${version}`);
    console.log(`Node: ${process.versions.node}\n`);
  },
};
