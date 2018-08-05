'use strict';

const { buildDockerComposeCommand } = require('../dockerComposeBuilder');
const commandExecutor = require('../../lib/commandExecutor');

module.exports = (composeFile, args) => {
  commandExecutor.execProcess(buildDockerComposeCommand(composeFile, args, 'stop'));
};

module.exports.summary = 'Stop a container';
