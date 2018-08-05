'use strict';

const { isAskingForHelp } = require('../isAskingForHelp');
const { buildDockerComposeCommand } = require('../dockerComposeBuilder');
const commandExecutor = require('../../lib/commandExecutor');

const runHelp = `
Run Command
Usage:
\tbam run [app] [cmd] --env=[ENVIRONMENT]
\tbam run -e LOG_LEVEL=debug [app] [cmd] --env=[ENVIRONMENT]
\tbam run --help --env=[ENVIRONMENT]

Runs a one-time command against a service, a new container
  will be created to host the service and once the command
  completes the container will be removed.

You can set environment variables via the -e flag, you can
  use the -e flag multiple times to set multiple variables.

The intention for this command is to run actions which will
  write to persisted storage such as running npm install
  to install packages into the persisted volume or to run
  migration commands against a persisted data store.
`;

module.exports = (composeFile, args = []) => {
  if (isAskingForHelp(args)) {
    console.log(runHelp);
    process.exit(0);
  }

  commandExecutor.execProcess(buildDockerComposeCommand(composeFile, ['--rm', ...args], 'run'));
};

module.exports.summary = '\tBring up a new container and run a one-off command';
