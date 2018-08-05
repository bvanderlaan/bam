'use strict';


const chai = require('chai');
const childProcess = require('child_process');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const commandExecutor = require('../lib/commandExecutor');

const { expect } = chai;
chai.use(sinonChai);

describe('Command Executor Module', () => {
  describe('execShell', () => {
    describe('with trailing whitespace', () => {
      beforeEach(() => sinon.stub(childProcess, 'execSync'));
      afterEach(() => childProcess.execSync.restore());

      it('should strip trailing whitespace', () => {
        commandExecutor.execShell('command --argument ');
        expect(childProcess.execSync).to.have.been.calledWith('command --argument');
      });
    });
  });

  describe('execProcess', () => {
    describe('with trailing whitespace', () => {
      beforeEach(() => sinon.stub(childProcess, 'spawnSync'));
      afterEach(() => childProcess.spawnSync.restore());

      it('should strip trailing whitespace', () => {
        commandExecutor.execProcess('command --argument ');
        expect(childProcess.spawnSync)
          .to.have.been.calledWith('command', ['--argument'], { stdio: 'inherit' });
      });
    });
  });
});
