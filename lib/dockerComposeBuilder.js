'use strict';

const fs = require('fs');
const path = require('path');

const { verifyComposeFileExists } = require('./verifyComposeFileExists');

module.exports = {
  buildDockerComposeCommand(composeFile, args, cmd) {
    verifyComposeFileExists(composeFile);

    const compose = fs.readFileSync(composeFile);

    if (/version:\s*['"]3.*['"]/.test(compose)) {
      const base = path.dirname(composeFile);
      const baseComposeFile = `${base}/docker-compose.yml`;
      verifyComposeFileExists(baseComposeFile);

      return `docker-compose -f ${baseComposeFile} -f ${composeFile} ${cmd} ${args.join(' ')}`.trim();
    }

    return `docker-compose -f ${composeFile} ${cmd} ${args.join(' ')}`.trim();
  },
};
