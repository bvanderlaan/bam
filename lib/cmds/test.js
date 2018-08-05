'use strict';

const nconf = require('nconf');

const { isAskingForHelp } = require('../isAskingForHelp');
const run = require('./run');
const { buildDockerComposeCommand } = require('../dockerComposeBuilder');
const commandExecutor = require('../../lib/commandExecutor');

const testHelp = `
Test Command
Usage:
\tbam test [app] [options]
\tbam test [app] [testfile] [options]
\tbam test my-api mytest.js
\tbam test my-api mytest.js --rm
\tbam test --help

Runs the automation tests against a service, a new container
  will be created to host the service and once the tests
  complete the container will be removed.

You can specify a single test file to execute instead of running
  the whole suite by appending the file to the end of the command.

Supporting containers will also be started when executing this command,
  those containers will be left running after the tests complete. If you
  don't want the supporting test containers to be left running you can
  use the --rm flag to have them automatically stopped and removed.

If you always want the supporting test containers cleaned up and don't
  want to keep passing in the --rm flag you can save this mode using the
  command:
    bam config set cleanTest true
`;

function getCleanTestFlag(args) {
  const cleanTest = (nconf.get('cleanTest') === 'true');

  if (args.includes('--rm')) {
    return {
      cleanTest: true,
      args: args.filter(a => a !== '--rm'),
    };
  }

  return { cleanTest, args };
}

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
  // The test command ignores the environment flag and always uses the test compose file.
  // The test command will run a container executing the test script but it also supports
  // optional arguments for the test script. This is why we are inserting the test script
  // instead of just appending it, because we expect arguments we need to pass into the
  // script.
  // Example:
  //   bam test my-api testFileAlpha.js
  // This will be turned into:
  //   docker-compose -f docker-compose.yaml -f docker-compose.test.yml run
  //     --rm my-api script/test testFileAlpha.js
  //
  // Where script/test is the command we want to executed and testFileAlpha.js is the argument
  // we want to pass to the command.

  if (isAskingForHelp(args) || args.length === 0) {
    if (args.length === 0) {
      console.error('ERROR: Missing name of service to test.');
    }

    console.log(testHelp);

    if (args.length === 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }

  const { cleanTest, args: myArgs } = getCleanTestFlag([...args]);
  myArgs.splice(1, 0, 'script/test');

  try {
    myArgs[0] = getServiceName(myArgs[0]);
  } catch (e) {
    console.error(`ERROR: Could not run tests: ${e.message}`);
    process.exit(1);
  }

  run('docker-compose.test.yml', myArgs);

  if (cleanTest) {
    // the rm --stop flag does not work (at least on OSX) in docker-compose v1.13
    // Its been fixed in docker-compose v1.14 (https://github.com/docker/compose/issues/4774)
    // so once we update we should change the below to a single command (rm --stop --force)
    commandExecutor.execProcess(buildDockerComposeCommand('docker-compose.test.yml', [], 'stop'));
    commandExecutor.execProcess(buildDockerComposeCommand('docker-compose.test.yml', ['--force'], 'rm'));
  }
};

module.exports.fixedEnv = true;
module.exports.summary = 'Bring up a new container and run the test script';
