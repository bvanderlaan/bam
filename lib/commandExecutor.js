'use strict';

const childProcess = require('child_process');

module.exports = {
  execShell(command, options) {
    return childProcess.execSync(command.trim(), options);
  },
  execProcess(command, options) {
    const opts = options || {};
    const cmd = command.trim().split(' ');

    // Note options here are not the arguments to pass to the command
    // but options as to how to spawn the new process.
    if (!opts.stdio) {
      opts.stdio = 'inherit';
    }

    // Where as execSync takes a command with space-separated arguments
    // spawnSync takes two parameters, the first being the command and
    // the second being an array of arguments.
    return childProcess.spawnSync(cmd.shift(), cmd, opts);
  },
};
