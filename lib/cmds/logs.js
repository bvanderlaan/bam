'use strict';

const readline = require('readline');
const nconf = require('nconf');

const { isAskingForHelp } = require('../isAskingForHelp');
const { buildDockerComposeCommand } = require('../dockerComposeBuilder');
const { verifyComposeFileExists } = require('../verifyComposeFileExists');
const commandExecutor = require('../commandExecutor');

const logHelp = `
Logs Command
Usage:
\tbam logs [app] --env=[ENVIRONMENT]
\tbam log [app] --env=[ENVIRONMENT]
\tbam logs --tail=50 [app] --env=[ENVIRONMENT]
\tbam log --tail=50 [app] --env=[ENVIRONMENT]
\tbam logs [app] --clear --env=[ENVIRONMENT]
\tbam log [app] --clear --env=[ENVIRONMENT]
\tbam logs [app] --help --env=[ENVIRONMENT]
\tbam log [app] --help --env=[ENVIRONMENT]

View output from containers from a given environment.
You can use the optional --tail flag to specify how
  much of the end of the log to show. If you don't
  use the --tail flag all of the log will be shown.

You can set a default tail value via the
  bam config set logTail xxx command.

You can clear the logs of a given container via the --clear flag.
`;

function getContainerId(composeFile, service) {
  const composeCmd = buildDockerComposeCommand(composeFile, ['-q', service], 'ps');
  const result = commandExecutor.execProcess(composeCmd, { stdio: 'pipe' });
  const containerId = result.stdout.toString();
  const errors = result.stderr.toString()
    .split('\n')
    .filter(err => err.trim());

  if (!containerId || errors.length) {
    throw new Error(`Could not find the id:\n${errors.join('\n')}`);
  }

  return containerId;
}

function getContainerLogPath(containerId) {
  const result = commandExecutor.execProcess(`docker inspect -f {{.LogPath}} ${containerId}`,
                                            { stdio: 'pipe' });
  const logPath = result.stdout.toString();
  const errors = result.stderr.toString()
    .split('\n')
    .filter(err => err.trim());

  if (!logPath || errors.length) {
    throw new Error(`Could not find the log path:\n${errors.join('\n')}`);
  }

  return logPath;
}

function clearLogs(composeFile, args) {
  const service = args.find(item => !item.startsWith('-'));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(`Are you sure you want to clear the logs for ${service}? [y/N]: `, (answer) => {
    if (answer.toLowerCase().startsWith('y')) {
      console.log('Ok clearing the log...');

      try {
        const containerId = getContainerId(composeFile, service);
        const logPath = getContainerLogPath(containerId);

        commandExecutor.execShell(`sudo /bin/sh -c 'echo -n "" > ${logPath}'`);
      } catch (err) {
        console.error(`ERROR: ${service} - ${err.message}`);
        return process.exit(1);
      }
    } else {
      console.log('Ok never mind then.');
    }

    rl.close();
    return process.exit(0);
  });
}

const hasClearFlag = args => (args.filter(arg => /(^-{1,2}clear$)/i.test(arg)).length > 0);
const hasTailFlag = args => (args.filter(arg => /(^--tail.*)/i.test(arg)).length > 0);
const isANumber = num => !Number.isNaN(Number.parseInt(num, 10));

module.exports = (composeFile, args = []) => {
  if (isAskingForHelp(args)) {
    console.log(logHelp);
    process.exit(0);
  }

  verifyComposeFileExists(composeFile);

  if (hasClearFlag(args)) {
    return clearLogs(composeFile, args);
  }

  const logArgs = [...args];

  if (!hasTailFlag(args)) {
    const tail = nconf.get('logTail');
    if (tail && isANumber(tail)) {
      logArgs.unshift(`--tail=${tail}`);
    }
  }

  return commandExecutor.execProcess(buildDockerComposeCommand(composeFile, ['--follow', '--no-color', ...logArgs], 'logs'));
};

module.exports.summary = 'View output from a container';
