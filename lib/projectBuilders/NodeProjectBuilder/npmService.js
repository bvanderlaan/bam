'use strict';

module.exports = {
  addDependencies(dependencies, latestVersion) {
    return Promise.all(dependencies.map(d => latestVersion(d)))
      .then(versions => (
        dependencies.reduce((hash, value, index) => {
          // eslint-disable-next-line no-param-reassign
          hash[value] = `^${versions[index]}`;
          return hash;
        }, {})
      ));
  },
};
