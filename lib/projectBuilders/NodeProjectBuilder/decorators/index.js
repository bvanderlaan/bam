'use strict';

const { LibraryProjectDecorator } = require('./LibraryProjectDecorator');
const { ServiceProjectDecorator } = require('./ServiceProjectDecorator');
const { CassandraProjectDecorator } = require('./CassandraProjectDecorator');
const { PassportProjectDecorator } = require('./PassportProjectDecorator');

module.exports = {
  CassandraProjectDecorator,
  LibraryProjectDecorator,
  ServiceProjectDecorator,
  PassportProjectDecorator,
};
