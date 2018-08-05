'use strict';

const { buildDockerComposeCommand } = require('../dockerComposeBuilder');
const commandExecutor = require('../../lib/commandExecutor');

module.exports = (composeFile, args = []) => {
  commandExecutor.execProcess(buildDockerComposeCommand(composeFile, [...args, '/bin/bash'], 'exec'));
};

module.exports.summary = 'Attach to a running container';
