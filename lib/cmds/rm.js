'use strict';

const path = require('path');

const { buildDockerComposeCommand } = require('../dockerComposeBuilder');
const commandExecutor = require('../../lib/commandExecutor');

function getNamedVolumes(serviceName) {
  const projectName = path.basename(process.cwd()).replace('-', '');
  const containerName = `${projectName}_${serviceName}_1`;

  try {
    return commandExecutor.execShell(`docker container inspect -f "{{range .Mounts}} {{if eq .Destination \\"/usr/src/app/node_modules\\"}} {{.Name}} {{end}} {{end}}" ${containerName}`)
      .toString()
      .replace(/\r?\n|\r/g, ' ')
      .split(' ')
      .filter(a => a.length > 0);
  } catch (err) {
    // ignore errors
    return [];
  }
}

module.exports = (composeFile, args = []) => {
  const serviceName = args.filter(a => !a.startsWith('-'))[0];
  const rmArgs = ['-v', ...args];
  let namedVolumes = [];

  if (serviceName) {
    rmArgs.unshift('-f');
    namedVolumes = getNamedVolumes(serviceName);
  }

  commandExecutor.execProcess(buildDockerComposeCommand(composeFile, rmArgs, 'rm'));

  namedVolumes.forEach(volume => commandExecutor.execShell(`docker volume rm ${volume}`));
};

module.exports.summary = '\tDelete the container, must be stopped first';
module.exports.fixedEnv = false;
