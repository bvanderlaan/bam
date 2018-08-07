'use strict';

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));

const markAsExecutable = fileName => (
  fs.chmodAsync(fileName, '755')
    .catch((err) => {
      throw new Error(`FailedToSetExecutableBit: ${fileName}: ${err.message}`);
    })
);

module.exports = {
  write(fileName, contents) {
    return fs.writeFileAsync(fileName, `${contents}\n`)
      .catch((err) => {
        throw new Error(`FailedToWriteFile: ${fileName}: ${err.message}`);
      });
  },

  writeExecutable(fileName, contents) {
    return module.exports.write(fileName, contents)
      .then(() => markAsExecutable(fileName));
  },
};
