/* eslint-disable no-console */
/* eslint-disable global-require */

'use strict';

function buildHelpText() {
  const COMMANDS = require('include-all')({
    dirname: __dirname,
    excludeDirs: /^\.(git)$/,
    filter: /(.*)\.js$/,
  });

  let masterHelp = `
  Execute various commands to simplify development

  Usage:
    bam [COMMAND] [ARGS...] [--env=ENVIRONMENT]
    bam --help
    bam logs my-service --dev

  Options:
    -h, --help                Display Bam help
    -v, --version             Print version and exit

  Commands:\n`;


  Object.keys(COMMANDS).forEach((name) => {
    if (COMMANDS[name].summary) {
      masterHelp += `    ${name}\t\t${COMMANDS[name].summary}\n`;
    }
  });

  masterHelp += `
  Environments:
    development        Traditional developer environment
    test               Automated testing configuration
    production         Production builds

    Custom environments can be added via the --env flag,
    the name of the environment will be used to locate
    the correct docker-compose file.

    For example:
      --env=multi-site => docker-compose.multi-site.yml
  `;

  return masterHelp;
}

module.exports = () => {
  console.log(buildHelpText());
};

module.exports.fixedEnv = true;
