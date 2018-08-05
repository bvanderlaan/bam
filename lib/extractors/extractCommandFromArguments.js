'use strict';

module.exports = {
  extractCommandFromArguments(args) {
    const justArgs = [...args];
    let cmd;

    if (justArgs.length) {
      cmd = justArgs.shift().toString().toLowerCase();
    }

    if (cmd === '--help' || cmd === '-h') {
      cmd = 'help';
    } else if (cmd === '--version' || cmd === '-v') {
      cmd = 'version';
    }

    return {
      cmd,
      args: justArgs,
    };
  },
};
