'use strict';

const { LibraryProjectDecorator } = require('./LibraryProjectDecorator');
const { ServiceProjectDecorator } = require('./ServiceProjectDecorator');
const { CassandraProjectDecorator } = require('./CassandraProjectDecorator');
const { MongoProjectDecorator } = require('./MongoProjectDecorator');
const { PassportProjectDecorator } = require('./PassportProjectDecorator');

module.exports = {
  CassandraProjectDecorator,
  MongoProjectDecorator,
  LibraryProjectDecorator,
  ServiceProjectDecorator,
  PassportProjectDecorator,
};
