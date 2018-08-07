'use strict';

const yaml = require('yamljs');

function removeQuotesFromVolumes(match, group) {
  return `volumes:\n${group.replace(/'/g, '')}`;
}

module.exports = {
  toJson(composeYAML) {
    return yaml.parse(composeYAML);
  },

  toCompose(json) {
    return yaml.stringify(json, 4, 2)
      .replace(/image: '(.+)'/g, 'image: $1')
      .replace(/volumes:\s((?:^ {6}- '.+'\s)*)/gm, removeQuotesFromVolumes)
      .replace(/: null/g, ':');
  },
};
