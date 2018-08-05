'use strict';

module.exports = {
  isAskingForHelp(args) {
    if (args === undefined) return false;
    return args.filter(arg => /(^-{1,2}h$)|(^-{1,2}help$)/i.test(arg)).length > 0;
  },
};
