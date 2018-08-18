'use strict';

const { CassandraProjectDecorator } = require('./CassandraProjectDecorator');
const { FrontEndProjectDecorator } = require('./FrontEndProjectDecorator');
const { LibraryProjectDecorator } = require('./LibraryProjectDecorator');
const { MongoProjectDecorator } = require('./MongoProjectDecorator');
const { PassportProjectDecorator } = require('./PassportProjectDecorator');
const { ServiceProjectDecorator } = require('./ServiceProjectDecorator');

module.exports = {
  CassandraProjectDecorator,
  FrontEndProjectDecorator,
  LibraryProjectDecorator,
  MongoProjectDecorator,
  PassportProjectDecorator,
  ServiceProjectDecorator,
};
