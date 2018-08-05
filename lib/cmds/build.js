'use strict';

const { buildDockerComposeCommand } = require('../dockerComposeBuilder');
const commandExecutor = require('../../lib/commandExecutor');

module.exports = (composeFile, args, cmd) => {
  commandExecutor.execProcess(buildDockerComposeCommand(composeFile, args, cmd));
};

module.exports.summary = 'Build or rebuild a container';
