'use strict';

const { isAskingForHelp } = require('../isAskingForHelp');
const { buildDockerComposeCommand } = require('../dockerComposeBuilder');
const commandExecutor = require('../commandExecutor');

const listHelp = `
List Command
Usage:
\tbam list --env=[ENVIRONMENT]
\tbam ls --env=[ENVIRONMENT]
\tbam list --help --env=[ENVIRONMENT]
\tbam ls --help --env=[ENVIRONMENT]

Display the services defined in the environments docker-compose file.
This command will tell you what names to use when issuing other bam commands.

Example:
  Lets say you want to see the logs for one of the containers but don't know
  the name of the container in the docker-compose file.

  First use the list command to find out the names of the services:
    > bam ls --env=development
    > redis
    > database
    > api-node
  Now you can look at the logs via the logs command:
    > bam log --tail 50 api-node --env=development
`;

module.exports = (composeFile, args) => {
  if (isAskingForHelp(args)) {
    console.log(listHelp);
    process.exit(0);
  }

  commandExecutor.execProcess(buildDockerComposeCommand(composeFile, ['--services'], 'config'));
};

module.exports.summary = 'List the services defined in the compose file.';
