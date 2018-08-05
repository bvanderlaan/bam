'use strict';

const nconf = require('../config');
const { isAskingForHelp } = require('../isAskingForHelp');

const configHelp = `
Config command
Usage:
  bam config [SUBCMD] [ARGS...]

Get configuration for a given key
  bam config get [KEY]
  bam config get logTail

Set a configuration value for a key
  bam config set [KEY] [VALUE]
  bam config set logTail 100

List all saved config values
  bam config list
  bam config ls

This command allows you to modify the default configuration used by bam.
The configuration data is saved to ~/.bamrc
`;

const showHelp = () => console.log(configHelp);

const getConfig = (args) => {
  if (!args || args.length < 1) {
    console.log('ERROR: Missing arguments to get config');
    showHelp();
    process.exit(0);
  }
  const key = args.shift().toString();
  console.log(`${key} => ${nconf.get(key)}`);
};

/**
 * Updates an configuration value, and persists the change
 * to the configuration file.
 *
 * @param {any} args - an array of arguments
 *   where key is the first element, value is the second.
 */
const setConfig = (args) => {
  if (!args || args.length < 2) {
    console.log('ERROR: Missing arguments to set config');
    showHelp();
    process.exit(0);
  }
  const key = args.shift().toString();
  const value = args.shift().toString();

  console.log(`Setting config ${key} = ${value}`);
  nconf.set(key, value);

  console.log('Saving config...');
  nconf.save();

  console.log('done');
};

const listConfig = () => {
  const rcFile = nconf.stores['.bamrc'].store;
  const defaults = nconf.stores.defaults.store;
  const store = Object.assign({}, defaults, rcFile);

  Object.keys(store)
      .forEach((key) => {
        if (key !== 'type') {
          console.log(`${key} ==> ${store[key]}`);
        }
      });
};

module.exports = (composeFile, args) => {
  if (isAskingForHelp(args)) {
    showHelp();
    process.exit(0);
  }
  const myArgs = args === undefined ? [...composeFile] : [...args];
  const subCommand = myArgs.length && myArgs.shift().toString().toLowerCase();

  switch (subCommand) {
    case 'get':
      return getConfig(myArgs);
    case 'set':
      return setConfig(myArgs);
    case 'list':
    case 'ls':
      return listConfig();
    default:
      return showHelp();
  }
};

module.exports.fixedEnv = true;
module.exports.summary = 'Get and modify configuration values used by Bam';
