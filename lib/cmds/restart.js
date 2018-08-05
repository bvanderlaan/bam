'use strict';

const stop = require('./stop');
const up = require('./up');
const { isAskingForHelp } = require('../isAskingForHelp');

const restartHelp = `
Restart Command
Usage:
\tbam restart --env=[ENVIRONMENT]
\tbam restart [app] --env=[ENVIRONMENT]
\tbam restart --help --env=[ENVIRONMENT]

Will stop a running container then bring it up again.
This command will read from the docker compose file and restarts
  the defined containers. If the containers are already
  stopped than this command will just bring it up.

You can specify which container in the compose file to restart
  via the optional app argument. If none is provided all
  containers defined in the file will be restarted.

Note you need to run this command from the project root so that
  it can find the compose file.

This command differs from the built in docker restart command in
  that it will actual stop then start the container. This way it
  will re-load the environment variables picking up any changes.
`;

module.exports = (composeFile, args) => {
  if (isAskingForHelp(args)) {
    console.log(restartHelp);
    process.exit(0);
  }

  stop(composeFile, args);
  up(composeFile, args);
};

module.exports.summary = 'Restart a container';
