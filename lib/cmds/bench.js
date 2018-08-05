'use strict';

const { isAskingForHelp } = require('../isAskingForHelp');
const { buildDockerComposeCommand } = require('../dockerComposeBuilder');
const commandExecutor = require('../../lib/commandExecutor');
const run = require('./run');

const benchHelp = `
Bench Command
Usage:
\tbam bench [app]
\tbam bench [app] [benchmarkTestFile]
\tbam bench api-node test/users/users.bench.js
\tbam bench --help

Runs the benchmark tests against a service. A new container
  will be created to host the service and will be removed
  after the tests are completed.

It is expected that the service as a set of executable scripts
  under the project root in a script folder. This command will
  look for and execute the ./script/bench script to perform
  the bench mark tests. It is up to the ./script/bench script
  to actually perform the benchmark tests.

Specify a single file to execute instead of the whole suite
  by appending the file to the end of the command.
`;

function getServiceName(name) {
  const listServices = buildDockerComposeCommand('docker-compose.test.yml', ['--services'], 'config');
  const { stdout } = commandExecutor.execProcess(listServices, { stdio: ['pipe', 'pipe', 'pipe'] });

  const services = (stdout && stdout.toString().split('\n')) || [];

  const serviceName = services.filter(s => s.startsWith(name))[0];

  if (!serviceName) {
    throw new Error('MissingService');
  }

  return serviceName;
}
module.exports = (_, args) => {
  // The bench command ignores the environment flag and always uses the test compose file.
  // It runs a container executing the bench script and supports optional arguments.
  // We insert the bench script instead of appending because we need to pass arguments to it:
  // Example:
  //   bam bench api-node test/users/users.bench.js
  // This will be turned into:
  //   docker-compose -f docker-compose.yml -f docker-compose.test.yml run
  //     --rm api-node script/bench test/users/users.bench.js
  // where script/bench is the command we want to execute and test/users/users.bench.js is the
  // argument we want to pass to the command.

  if (isAskingForHelp(args) || args.length === 0) {
    if (args.length === 0) {
      console.error('ERROR: Missing name of service to benchmark.');
    }

    console.log(benchHelp);

    if (args.length === 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }

  const myArgs = [...args];
  myArgs.splice(1, 0, 'script/bench');

  try {
    myArgs[0] = getServiceName(myArgs[0]);
  } catch (e) {
    console.error(`ERROR: Could not run tests: ${e.message}`);
    process.exit(1);
  }

  run('docker-compose.test.yml', myArgs);
};

module.exports.fixedEnv = true;
module.exports.summary = 'Bring up a new container and run benchmark tests';
