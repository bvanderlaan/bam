'use strict';

const fs = require('fs');

module.exports = {
  verifyComposeFileExists(composeFile) {
    try {
      // Will throw if file is not found.
      fs.accessSync(composeFile, fs.R_OK);
    } catch (err) {
      console.log(`ERROR: Failed to find the docker-compose file '${composeFile}'`);
      console.log('       Are you in the right directory?');
      process.exit(1);
    }
  },
};
