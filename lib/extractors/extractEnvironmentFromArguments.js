'use strict';

const detectFlag = (arg) => {
  /**
   * If --env=xxx then return group 4 (i.e. xxx)
   * Otherwise if group 4 is undefined the flag must be in the --test form
   * thus return group 2
   *
   * --env=test => ['--env=test', 'env', 'env', '=test', 'test']
   * --test => ['--test', 'test', 'test']
   * --development => ['--development', 'development', 'dev']
   */
  const environmentFlag = /^--((env|dev|prod|test)[^=\s]*)(=(.+))?$/i.exec(arg);
  return environmentFlag && (environmentFlag[4] || environmentFlag[2]);
};

const normalizeEnvironment = (env = '') => {
  let normalizedEnv = '';

  if (/^env/.test(env)) {
    normalizedEnv = '';
  } else if (/^dev/i.test(env)) {
    normalizedEnv = 'development';
  } else if (/^test/.test(env)) {
    normalizedEnv = 'test';
  } else if (/^prod/i.test(env)) {
    normalizedEnv = 'production';
  } else {
    normalizedEnv = env;
  }

  return normalizedEnv;
};

module.exports = {
  extractEnvironmentFromArguments(args) {
    const justArgs = args.filter(arg => !detectFlag(arg));
    const envFlags = args.map(arg => detectFlag(arg))
      .filter(f => f);

    if (envFlags.length > 1) {
      // eslint-disable-next-line no-console
      console.warn('More then one environment flag used, going to use the first one.');
    }

    return {
      env: normalizeEnvironment(envFlags[0]),
      args: justArgs,
    };
  },
};
