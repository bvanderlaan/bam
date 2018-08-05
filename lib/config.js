'use strict';

const path = require('path');
const nconf = require('nconf');

const defaultConfigFile = path.join(process.env.HOME, '.bamrc');
const defaults = {
  default_env: 'development',
};

nconf.file('.bamrc', {
  file: defaultConfigFile,
})
  .defaults(defaults);

module.exports = nconf;
