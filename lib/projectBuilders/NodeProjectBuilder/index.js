'use strict';

const Promise = require('bluebird');
const latestVersion = require('latest-version');
const mkdirp = Promise.promisify(require('mkdirp'));

const { NodeProjectTemplate } = require('./NodeProjectTemplate');
const {
  LibraryProjectDecorator,
  ServiceProjectDecorator,
  CassandraProjectDecorator,
  MongoProjectDecorator,
  PassportProjectDecorator,
} = require('./decorators');

const repoService = require('../repoService');
const fileWriter = require('../fileWriter');

// /////////////////////////////////////////
// Private Functions
// /////////////////////////////////////////

const isFile = content => (typeof content === 'string');

function createFiles(files, writer, root = '.') {
  return Object.keys(files).reduce((promise, name) => (
    promise
      .then(() => {
        const path = `${root}/${name}`;

        if (isFile(files[name])) {
          return writer(path, files[name]);
        }

        return mkdirp(path)
          .then(() => createFiles(files[name], writer, path));
      })
  ), Promise.resolve());
}

// /////////////////////////////////////////
// Public Functions
// /////////////////////////////////////////

class NodeProjectBuilder {
  constructor(options) {
    const defaults = {
      isService: 'yes',
      cassandra: 'no',
      mongo: 'no',
      passport: 'no',
    };

    const opt = Object.assign({}, defaults, options);
    const isService = opt.isService.toLowerCase().startsWith('y');
    const needsCassandra = opt.cassandra.toLowerCase().startsWith('y');
    const needsMongo = opt.mongo.toLowerCase().startsWith('y');
    const needsPassport = opt.passport.toLowerCase().startsWith('y');

    let template = new NodeProjectTemplate(options, latestVersion);
    if (isService) {
      template = new ServiceProjectDecorator(template, latestVersion);
    } else {
      template = new LibraryProjectDecorator(template, latestVersion);
    }

    if (needsCassandra) {
      const cassieOptions = {
        keyspaces: opt.cassandra_keyspace,
        needsUsers: needsPassport,
      };
      template = new CassandraProjectDecorator(template, latestVersion, cassieOptions);
    }

    if (needsMongo) {
      const mongoOptions = {
        needsUsers: needsPassport,
      };
      template = new MongoProjectDecorator(template, latestVersion, mongoOptions);
    }

    if (needsPassport) {
      template = new PassportProjectDecorator(template, latestVersion);
    }

    Object.defineProperty(this, 'template', {
      enumerable: true,
      value: template,
    });
  }

  build() {
    return this.template.build()
      .then(({ files, executables }) => (
        Promise.all([
          createFiles(files, fileWriter.write),
          createFiles(executables, fileWriter.writeExecutable),
        ])
      ))
      .then(repoService.createRepo);
  }
}

module.exports = {
  NodeProjectBuilder,
};
