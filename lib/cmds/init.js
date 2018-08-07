'use strict';

const Promise = require('bluebird');
const clc = require('cli-color');
const { stripIndent } = require('common-tags');
const fs = Promise.promisifyAll(require('fs'));
const prompt = Promise.promisifyAll(require('prompt'));
const path = require('path');

const { NodeProjectBuilder } = require('../projectBuilders');
const { printTitleCard } = require('../printTitleCard');
const { isAskingForHelp } = require('../isAskingForHelp');

const help = `
Init Command
Usage:
\tbam init
\tbam init --help

Runs an utility for generating a new empty project.
It will prompt you with questions as to what features your project
  will require so that it can build up the correct project structure.

Proper uses of this tool is to first create an empty directory,
  navigate into said directory then run the init command.
`;

const isCurrentDirEmpty = () => (
  fs.readdirAsync(process.cwd())
    .then(files => (files.length === 0))
);

const promptUser = () => {
  const schema = {
    properties: {
      name: {
        pattern: /^[a-zA-Z\s-]+$/,
        message: 'Name must be only letters, spaces, or dashes',
        required: true,
        default: path.basename(process.cwd()),
      },
      version: {
        pattern: /^(\d+\.)?(\d+\.)?(\*|\d+)$/,
        message: 'Version must be only numbers and dots (M.m.p)',
        required: true,
        default: '1.0.0',
      },
      description: {
        pattern: /^.+/,
        message: 'Must provide a simple description of the project',
        required: true,
      },
      keywords: {
        pattern: /^\S*$/,
        message: 'If you have more then one keyword use CSV syntax',
        default: '',
      },
      language: {
        required: true,
        message: 'What type of project do you want to create\nSupported types are: node',
        default: 'node',
      },
      isService: {
        pattern: /^y(?:es)?|n(?:o)?$/i,
        description: 'Is this an Endpoint (i.e. a micro-service)',
        message: 'Must be yes or no',
        default: 'yes',
      },
    },
  };

  prompt.message = '';
  prompt.start();

  return prompt.getAsync(schema);
};

const getBuilder = (options) => {
  const type = options.language.toLowerCase();

  if (type.includes('node')) {
    return Promise.resolve(new NodeProjectBuilder(options));
  }

  return Promise.reject(new Error(`UnsupportedProjectType: ${type}`));
};

module.exports = (_, args) => {
  printTitleCard();

  if (isAskingForHelp(args)) {
    console.log(help);
    return process.exit(0);
  }

  console.log(clc.yellow('This utility will walk you through creating a new empty project.'));

  return isCurrentDirEmpty()
    .then(isEmpty => (!isEmpty ? Promise.reject(new Error('DirNotEmpty')) : undefined))
    .then(promptUser)
    .then(getBuilder)
    .then((builder) => {
      console.log(clc.greenBright('We\'re generating your project now, please stand by...'));
      return builder.build();
    })
    .then(() => {
      console.log(clc.cyan('All done, enjoy your new project.'));
      return process.exit(0);
    })
    .catch((err) => {
      if (err.message === 'DirNotEmpty') {
        console.log(stripIndent`
          ${clc.red.bold('Error:')} ${clc.red('This directory is not empty.')}
          This tool is meant to generate a brand new empty project.
          Please navigate to an empty directory and try again.`);
      } else {
        console.log(stripIndent`
          ${clc.red.bold('Error:')} ${clc.red(err.message)}`);
      }

      process.exit(1);
    });
};

module.exports.fixedEnv = true;
module.exports.summary = 'Initializes a new empty project';
