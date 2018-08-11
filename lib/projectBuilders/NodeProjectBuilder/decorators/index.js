'use strict';

const { LibraryProjectDecorator } = require('./LibraryProjectDecorator');
const { ServiceProjectDecorator } = require('./ServiceProjectDecorator');
const { CassandraProjectDecorator } = require('./CassandraProjectDecorator');

module.exports = {
  CassandraProjectDecorator,
  LibraryProjectDecorator,
  ServiceProjectDecorator,
};
