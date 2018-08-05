/* eslint-disable no-console */

'use strict';

const path = require('path');
const COMMANDS = require('include-all')({
  dirname: path.join(__dirname, 'lib/cmds'),
  excludeDirs: /^\.(git)$/,
  filter: /(.*)\.js$/,
});

const { extractCommandFromArguments, extractEnvironmentFromArguments } = require('./lib/extractors');
const help = require('./lib/cmds/help');

const isFixedEnvironmentCommand = cmdName => (COMMANDS[cmdName] && COMMANDS[cmdName].fixedEnv);
const isKnownCommand = cmd => Object.prototype.hasOwnProperty.call(COMMANDS, cmd);
const exitIfNotValidCommand = (cmd) => {
  if ((!cmd) || (!isKnownCommand(cmd))) {
    console.error('ERROR: Unknown command');
    console.log(); // Adds a space between the error the the help text
    help();
    process.exit(1);
  }
};

const displayEnvironment = (cmd, env) => {
  // Stand alone commands ignore the environment flag
  // so only log environment used if not a stand alone command
  if (!isFixedEnvironmentCommand(cmd)) {
    console.log('Executing in environment:', env);
  }
};

module.exports = (args) => {
  const { cmd, args: justArgs } = extractCommandFromArguments(args);

  exitIfNotValidCommand(cmd);

  const { env, args: cmdArgs } = extractEnvironmentFromArguments(justArgs);

  if (!isFixedEnvironmentCommand(cmd) && (!env)) {
    console.error('Please specify an environment with --env=[environment]');
    process.exit(1);
  }

  const environment = env;
  const composeFile = `docker-compose.${environment}.yml`;

  displayEnvironment(cmd, environment);

  COMMANDS[cmd](composeFile, cmdArgs, cmd);
};
