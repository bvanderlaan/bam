'use strict';

const chai = require('chai');
const fs = require('fs');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const commandExecutor = require('../../lib/commandExecutor');
const rm = require('../../lib/cmds/rm');

const expect = chai.expect;
chai.use(sinonChai);

describe('RM Command', () => {
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
    expect(rm.fixedEnv).to.be.false;
  });

  describe('when no service name provided', () => {
    beforeEach(() => sinon.stub(commandExecutor, 'execShell'));
    afterEach(() => commandExecutor.execShell.restore());

    it('should execute rm command', () => {
      rm('docker-compose.development.yml');

      expect(commandExecutor.execProcess).to.have.been.calledOnce;
      expect(commandExecutor.execProcess)
        .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.development.yml rm -v');
    });

    describe('but an option is', () => {
      it('should execute rm command', () => {
        rm('docker-compose.development.yml', ['--stop']);

        expect(commandExecutor.execProcess).to.have.been.calledOnce;
        expect(commandExecutor.execProcess)
          .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.development.yml rm -v --stop');
      });
    });
  });

  describe('when a service name is provided', () => {
    describe('but that service is not found in compose file', () => {
      before(() => sinon.stub(commandExecutor, 'execShell').throws(new Error('service not found')));
      after(() => commandExecutor.execShell.restore());

      it('should execute rm command', () => {
        expect(() => rm('docker-compose.development.yml', ['my-service']))
          .to.not.throw();

        expect(commandExecutor.execProcess).to.have.been.calledOnce;
        expect(commandExecutor.execProcess)
          .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.development.yml rm -f -v my-service');
      });
    });

    describe('and the service is found in compose file', () => {
      before(() => sinon.stub(commandExecutor, 'execShell').returns(new Buffer('    myservice_node_modules\n')));
      after(() => commandExecutor.execShell.restore());

      it('should execute rm and volume rm commands', () => {
        expect(() => rm('docker-compose.development.yml', ['my-service']))
          .to.not.throw();

        expect(commandExecutor.execProcess).to.have.been.calledOnce;
        expect(commandExecutor.execProcess)
          .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.development.yml rm -f -v my-service');

        expect(commandExecutor.execShell)
          .to.have.been.calledWith('docker volume rm myservice_node_modules');
      });
    });
  });
});
