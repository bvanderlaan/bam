'use strict';

const chai = require('chai');
const fs = require('fs');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const commandExecutor = require('../../lib/commandExecutor');
const up = require('../../lib/cmds/up');


const expect = chai.expect;
chai.use(sinonChai);

describe('Up Command', () => {
  before(() => {
    sinon.stub(fs, 'accessSync');
    sinon.stub(fs, 'readFileSync').returns('version: "3.2"\nservices:\n  simon:\nports:\n    - "8080:8080"');
  });
  after(() => {
    fs.accessSync.restore();
    fs.readFileSync.restore();
  });
  beforeEach(() => sinon.stub(commandExecutor, 'execProcess'));
  afterEach(() => commandExecutor.execProcess.restore());

  it('should not be a fixed environment', () => {
    expect(up.fixedEnv).to.be.undefined;
  });

  describe('when service provided', () => {
    it('should execute up command for just the service', () => {
      up('docker-compose.development.yml', ['my-service']);

      expect(commandExecutor.execProcess).to.have.been.calledOnce;
      expect(commandExecutor.execProcess)
        .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.development.yml up -d my-service');
    });
  });

  describe('when no service provided', () => {
    it('should execute up command for just the service', () => {
      up('docker-compose.development.yml', []);

      expect(commandExecutor.execProcess).to.have.been.calledOnce;
      expect(commandExecutor.execProcess)
        .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.development.yml up -d');
    });
  });

  describe('when service and argument is provided', () => {
    it('should execute up command for just the service and include the extra arguments', () => {
      up('docker-compose.development.yml', ['--remove-orphans', 'my-service']);
      expect(commandExecutor.execProcess).to.have.been.calledOnce;
      expect(commandExecutor.execProcess)
        .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.development.yml up -d --remove-orphans my-service');
    });
  });

  describe('when service is not provided but argument is provided', () => {
    it('should execute up command for all services in compose file and include extra arguments', () => {
      up('docker-compose.development.yml', ['--remove-orphans']);
      expect(commandExecutor.execProcess).to.have.been.calledOnce;
      expect(commandExecutor.execProcess)
        .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.development.yml up -d --remove-orphans');
    });
  });
});
