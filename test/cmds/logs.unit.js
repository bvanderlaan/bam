'use strict';

const chai = require('chai');
const fs = require('fs');
const nconf = require('nconf');
const readline = require('readline');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const commandExecutor = require('../../lib/commandExecutor');
const logs = require('../../lib/cmds/logs');

const expect = chai.expect;
chai.use(sinonChai);

describe('Logs Command', () => {
  before(() => {
    sinon.stub(fs, 'accessSync');
    sinon.stub(fs, 'readFileSync').returns('version: "3.2"\nservices:\n  fredrick:\nports:\n    - "8080:8080"');
  });
  after(() => {
    fs.accessSync.restore();
    fs.readFileSync.restore();
  });
  beforeEach(() => sinon.stub(commandExecutor, 'execProcess'));
  afterEach(() => commandExecutor.execProcess.restore());

  it('should require an environment', () => {
    expect(logs.fixedEnv).to.be.undefined;
  });

  describe('when no service is provided', () => {
    beforeEach(() => sinon.stub(nconf, 'get').returns(undefined));
    afterEach(() => nconf.get.restore());

    it('should execute docker-compose logs command without a service', () => {
      logs('docker-compose.mine.yml');
      expect(commandExecutor.execProcess)
        .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.mine.yml logs --follow --no-color');
    });

    describe('and --tail is given', () => {
      it('should include the tail flag with given value', () => {
        logs('docker-compose.mine.yml', ['--tail=50']);
        expect(commandExecutor.execProcess)
          .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.mine.yml logs --follow --no-color --tail=50');
      });
    });

    describe('and --tail is not given but a default is set', () => {
      beforeEach(() => {
        nconf.get.restore();
        sinon.stub(nconf, 'get').returns(100);
      });

      it('should include the tail flag with default value', () => {
        logs('docker-compose.mine.yml');
        expect(commandExecutor.execProcess)
          .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.mine.yml logs --follow --no-color --tail=100');
      });
    });

    describe('and --tail is not given but a default is set to zero', () => {
      beforeEach(() => {
        nconf.get.restore();
        sinon.stub(nconf, 'get').returns(0);
      });

      it('should not include the tail flag', () => {
        logs('docker-compose.mine.yml');
        expect(commandExecutor.execProcess)
          .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.mine.yml logs --follow --no-color');
      });
    });

    describe('and --tail is not given but a default is set to not a number', () => {
      beforeEach(() => {
        nconf.get.restore();
        sinon.stub(nconf, 'get').returns('hello');
      });

      it('should not include the tail flag', () => {
        logs('docker-compose.mine.yml');
        expect(commandExecutor.execProcess)
          .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.mine.yml logs --follow --no-color');
      });
    });
  });

  describe('when a service is provided', () => {
    beforeEach(() => sinon.stub(nconf, 'get').returns(undefined));
    afterEach(() => nconf.get.restore());

    it('should execute docker-compose logs command with a service', () => {
      logs('docker-compose.mine.yml', ['my-service']);
      expect(commandExecutor.execProcess)
        .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.mine.yml logs --follow --no-color my-service');
    });

    describe('and --tail is given', () => {
      it('should include the tail flag with given value', () => {
        logs('docker-compose.mine.yml', ['my-service', '--tail=50']);
        expect(commandExecutor.execProcess)
          .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.mine.yml logs --follow --no-color my-service --tail=50');
      });
    });

    describe('and --tail is not given but a default is set', () => {
      beforeEach(() => {
        nconf.get.restore();
        sinon.stub(nconf, 'get').returns(100);
      });

      it('should include the tail flag with given value', () => {
        logs('docker-compose.mine.yml', ['my-service']);
        expect(commandExecutor.execProcess)
          .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.mine.yml logs --follow --no-color --tail=100 my-service');
      });
    });

    describe('and --tail is not given but a default is set to zero', () => {
      beforeEach(() => {
        nconf.get.restore();
        sinon.stub(nconf, 'get').returns(0);
      });

      it('should not include the tail flag', () => {
        logs('docker-compose.mine.yml', ['my-service']);
        expect(commandExecutor.execProcess)
          .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.mine.yml logs --follow --no-color my-service');
      });
    });

    describe('and --tail is not given but a default is set to not a number', () => {
      beforeEach(() => {
        nconf.get.restore();
        sinon.stub(nconf, 'get').returns('hello');
      });

      it('should not include the tail flag', () => {
        logs('docker-compose.mine.yml', ['my-service']);
        expect(commandExecutor.execProcess)
          .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.mine.yml logs --follow --no-color my-service');
      });
    });
  });

  describe('when clear flag is provided', () => {
    beforeEach(() => {
      sinon.stub(nconf, 'get').returns(undefined);
      sinon.stub(process, 'exit');
    });
    afterEach(() => {
      nconf.get.restore();
      process.exit.restore();
    });

    describe('and user cancels request', () => {
      beforeEach(() => {
        sinon.stub(readline, 'createInterface').returns({
          question: sinon.stub().yields('n'),
          close: sinon.stub(),
        });
      });
      afterEach(() => {
        readline.createInterface.restore();
      });

      it('should not execute any commands', () => {
        logs('docker-compose.mine.yml', ['my-service', '--clear']);
        expect(commandExecutor.execProcess).to.have.not.been.called;
      });
    });

    describe('and user confirms request', () => {
      beforeEach(() => {
        sinon.stub(readline, 'createInterface').returns({
          question: sinon.stub().yields('y'),
          close: sinon.stub(),
        });
      });
      afterEach(() => readline.createInterface.restore());

      describe('and container ID was not found', () => {
        beforeEach(() => {
          commandExecutor.execProcess.returns({ stdout: '', stderr: '' });
        });
        afterEach(() => commandExecutor.execProcess.reset());

        it('should execute docker-compose command to fetch container id', () => {
          logs('docker-compose.mine.yml', ['my-service', '--clear']);
          expect(commandExecutor.execProcess).to.have.been.calledOnce;
          expect(commandExecutor.execProcess)
            .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.mine.yml ps -q my-service', { stdio: 'pipe' });
        });

        it('should exit with a non-zero', () => {
          logs('docker-compose.mine.yml', ['my-service', '--clear']);
          expect(process.exit).to.have.been.calledWith(1);
        });
      });

      describe('and error looking up container ID', () => {
        beforeEach(() => {
          commandExecutor.execProcess.returns({ stdout: 'myId', stderr: 'ERROR: boom' });
        });
        afterEach(() => commandExecutor.execProcess.reset());

        it('should execute docker-compose command to fetch container id', () => {
          logs('docker-compose.mine.yml', ['my-service', '--clear']);
          expect(commandExecutor.execProcess).to.have.been.calledOnce;
          expect(commandExecutor.execProcess)
            .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.mine.yml ps -q my-service', { stdio: 'pipe' });
        });

        it('should exit with a non-zero', () => {
          logs('docker-compose.mine.yml', ['my-service', '--clear']);
          expect(process.exit).to.have.been.calledWith(1);
        });
      });

      describe('and container log path was not found', () => {
        beforeEach(() => {
          commandExecutor.execProcess
            .withArgs('docker-compose -f ./docker-compose.yml -f docker-compose.mine.yml ps -q my-service', sinon.match.object)
            .returns({ stdout: 'myId', stderr: '' });

          commandExecutor.execProcess
            .withArgs('docker inspect -f {{.LogPath}} myId', sinon.match.object)
            .returns({ stdout: '', stderr: '' });
        });
        afterEach(() => commandExecutor.execProcess.reset());

        it('should execute docker-compose command to fetch container log path', () => {
          logs('docker-compose.mine.yml', ['my-service', '--clear']);
          expect(commandExecutor.execProcess).to.have.been.calledWith('docker inspect -f {{.LogPath}} myId', { stdio: 'pipe' });
        });

        it('should exit with a non-zero', () => {
          logs('docker-compose.mine.yml', ['my-service', '--clear']);
          expect(process.exit).to.have.been.calledWith(1);
        });
      });

      describe('and error looking up container log path', () => {
        beforeEach(() => {
          commandExecutor.execProcess
            .withArgs('docker-compose -f ./docker-compose.yml -f docker-compose.mine.yml ps -q my-service', sinon.match.object)
            .returns({ stdout: 'myId', stderr: '' });

          commandExecutor.execProcess
            .withArgs('docker inspect -f {{.LogPath}} myId', sinon.match.object)
            .returns({ stdout: 'my/log/path', stderr: 'Error: boom' });
        });
        afterEach(() => commandExecutor.execProcess.reset());

        it('should execute docker-compose command to fetch container log path', () => {
          logs('docker-compose.mine.yml', ['my-service', '--clear']);
          expect(commandExecutor.execProcess)
            .to.have.been.calledWith('docker inspect -f {{.LogPath}} myId', { stdio: 'pipe' });
        });

        it('should exit with a non-zero', () => {
          logs('docker-compose.mine.yml', ['my-service', '--clear']);
          expect(process.exit).to.have.been.calledWith(1);
        });
      });

      describe('and successfully cleared logs', () => {
        beforeEach(() => {
          commandExecutor.execProcess
            .withArgs('docker-compose -f ./docker-compose.yml -f docker-compose.mine.yml ps -q my-service', sinon.match.object)
            .returns({ stdout: 'myId', stderr: '' });

          commandExecutor.execProcess
            .withArgs('docker inspect -f {{.LogPath}} myId', sinon.match.object)
            .returns({ stdout: 'my/log/path', stderr: '' });

          sinon.stub(commandExecutor, 'execShell');
        });
        afterEach(() => {
          commandExecutor.execProcess.reset();
          commandExecutor.execShell.restore();
        });

        it('should execute command to clear path', () => {
          logs('docker-compose.mine.yml', ['my-service', '--clear']);
          expect(commandExecutor.execShell).to.have.been.calledOnce;
          expect(commandExecutor.execShell).to.have.been.calledWith('sudo /bin/sh -c \'echo -n "" > my/log/path\'');
        });

        it('should exit with a non-zero', () => {
          logs('docker-compose.mine.yml', ['my-service', '--clear']);
          expect(process.exit).to.have.been.calledWith(0);
        });
      });
    });
  });
});
