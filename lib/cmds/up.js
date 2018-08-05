'use strict';

const { isAskingForHelp } = require('../isAskingForHelp');
const { buildDockerComposeCommand } = require('../dockerComposeBuilder');
const commandExecutor = require('../commandExecutor');

const upHelp = `
Up Command
Usage:
\tbam up --env=[ENVIRONMENT]
\tbam up [app] --env=[ENVIRONMENT]
\tbam up --help --env=[ENVIRONMENT]

Will bring up a set of containers.
This command will read from the docker compose file and bring
  up the defined containers. If the containers are already
  running than this command has no effect.

You can specify which container in the compose file to bring up
  via the optional app argument. If none is provided all
  containers defined in the file will be brought up.

Note you need to run this command from the project root so that
  it can find the compose file.
`;

module.exports = (composeFile, args) => {
  if (isAskingForHelp(args)) {
    console.log(upHelp);
    process.exit(0);
  }

  const myArgs = ['-d', ...args];
  commandExecutor.execProcess(buildDockerComposeCommand(composeFile, myArgs, 'up'));
};

module.exports.summary = '\tCreate and start a container';
