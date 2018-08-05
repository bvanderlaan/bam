'use strict';

const chai = require('chai');
const fs = require('fs');
const nconf = require('nconf');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const commandExecutor = require('../../lib/commandExecutor');
const test = require('../../lib/cmds/test');

const expect = chai.expect;
chai.use(sinonChai);

describe('Test Command', () => {
  before(() => {
    sinon.stub(fs, 'accessSync').returns(true);
    sinon.stub(fs, 'readFileSync').returns('version: "3.2"\nservices:\n  lochlyn:\nports:\n    - "8080:8080"');
    sinon.stub(nconf, 'get')
      .withArgs('cleanTest')
      .returns('false');
  });
  after(() => {
    fs.accessSync.restore();
    fs.readFileSync.restore();
    nconf.get.restore();
  });

  describe('when service is provided', () => {
    before(() => {
      sinon.stub(commandExecutor, 'execProcess')
        .withArgs('docker-compose -f ./docker-compose.yml -f docker-compose.test.yml config --services')
        .returns({ stdout: 'my-service' });
    });
    after(() => commandExecutor.execProcess.restore());

    it('should run test docker-compose command', () => {
      test(undefined, ['my-service']);
      expect(commandExecutor.execProcess)
        .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.test.yml run --rm my-service script/test');
    });
  });

  describe('when environment is provided', () => {
    before(() => {
      sinon.stub(commandExecutor, 'execProcess')
        .withArgs('docker-compose -f ./docker-compose.yml -f docker-compose.test.yml config --services')
        .returns({ stdout: 'my-service' });
    });
    after(() => commandExecutor.execProcess.restore());

    it('should run test docker-compose command', () => {
      test(undefined, ['my-service', '--prod']);
      expect(commandExecutor.execProcess)
        .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.test.yml run --rm my-service script/test --prod');
    });
  });

  describe('when --rm is provided', () => {
    before(() => {
      sinon.stub(commandExecutor, 'execProcess')
        .withArgs('docker-compose -f ./docker-compose.yml -f docker-compose.test.yml config --services')
        .returns({ stdout: 'my-service' });
    });
    after(() => commandExecutor.execProcess.restore());

    it('should run test docker-compose command', () => {
      test(undefined, ['my-service', '--rm']);
      expect(commandExecutor.execProcess)
        .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.test.yml run --rm my-service script/test');
      expect(commandExecutor.execProcess)
        .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.test.yml stop');
      expect(commandExecutor.execProcess)
        .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.test.yml rm --force');
    });
  });

  describe('when compose file postfixed service with -test', () => {
    before(() => {
      sinon.stub(commandExecutor, 'execProcess')
        .withArgs('docker-compose -f ./docker-compose.yml -f docker-compose.test.yml config --services')
        .returns({ stdout: 'my-service-test' });
    });
    after(() => commandExecutor.execProcess.restore());

    it('should run test docker-compose command', () => {
      test(undefined, ['my-service']);
      expect(commandExecutor.execProcess)
        .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.test.yml run --rm my-service-test script/test');
    });
  });
});
