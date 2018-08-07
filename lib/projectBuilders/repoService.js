'use strict';

const { stripIndent } = require('common-tags');
const git = require('simple-git/promise')();

const { name, version } = require('../../package.json');

module.exports = {
  createRepo() {
    const commit = stripIndent`
    [chore]: initial commit from ${name}\

    __________                 ._.
    \\______   \\_____    _____  | |
    |    |  _/\\__  \\  /     \\  | |
    |    |   \\ / __ \\|  Y Y  \\  \\|
    |______  /(____  /__|_|  /  __
      \\/      \\/      \\   \\/

    ${name} CLI: ${version}`;

    return git.init()
      .then(() => git.add('./*'))
      .then(() => git.commit(commit, {
        '--author': '"Bam <bam@notrealemail.com>"',
      }))
      .catch((err) => {
        throw new Error(`FailedToCreateGitRepo: ${err.message}`);
      });
  },
};
