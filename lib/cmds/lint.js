'use strict';

const { isAskingForHelp } = require('../isAskingForHelp');
const run = require('./run');

const lintHelp = `
Lint Command
Usage:
\tbam lint [app]
\tbam lint [app] path/to/file.js
\tbam lint [app] path/to/file.js path/to/other/file.js
\tbam lint --help

Runs linting checks against a service, a new container
  will be created to host the service and once the command
  completes the container will be removed.

This command expects that the service has a npm command called
  lint and will execute that (npm run lint) against the service.

You can specify which files you want to lint by passing relative
  paths to the files after the command.
`;

module.exports = (_, args) => {
  if (isAskingForHelp(args) || args.length === 0) {
    if (args.length === 0) {
      console.error('ERROR: Missing service name to lint or invalid arguments.');
    }

    console.log(lintHelp);
    if (args.length === 0 || args.length > 1) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }

  const justArgs = args.concat([]);
  const service = justArgs.shift();
  const composeFile = 'docker-compose.test.yml';

  if (justArgs.length > 0) {
    run(composeFile, [service, 'node', 'node_modules/eslint/bin/eslint.js', '--', ...justArgs]);
  } else {
    run(composeFile, [service, 'npm', 'run', 'lint']);
  }
};

module.exports.fixedEnv = true;
module.exports.summary = 'Bring up a new container and run the NPM lint command on it';
