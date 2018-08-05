'use strict';

const chai = require('chai');
const fs = require('fs');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const commandExecutor = require('../../lib/commandExecutor');
const lint = require('../../lib/cmds/lint');

const expect = chai.expect;
chai.use(sinonChai);

describe('Lint Command', () => {
  before(() => {
    sinon.stub(fs, 'accessSync');
    sinon.stub(fs, 'readFileSync').returns('version: "3.2"\nservices:\n  fredrick:\nports:\n    - "8080:8080"');
  });
  after(() => {
    fs.accessSync.restore();
    fs.readFileSync.restore();
  });

  it('should be a fixed environment', () => {
    expect(lint.fixedEnv).to.be.true;
  });

  describe('when no file path provided', () => {
    before(() => sinon.stub(commandExecutor, 'execProcess'));
    after(() => commandExecutor.execProcess.restore());

    before(() => lint(null, ['my-service']));

    it('should execute lint command', () => {
      expect(commandExecutor.execProcess).to.have.been.calledOnce;
      expect(commandExecutor.execProcess)
        .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.test.yml run --rm my-service npm run lint');
    });
  });

  describe('when no file path provided', () => {
    before(() => sinon.stub(commandExecutor, 'execProcess'));
    after(() => commandExecutor.execProcess.restore());

    before(() => lint(null, ['my-service', 'my/file.js']));

    it('should execute lint command', () => {
      expect(commandExecutor.execProcess).to.have.been.calledOnce;
      expect(commandExecutor.execProcess)
        .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.test.yml run --rm my-service node node_modules/eslint/bin/eslint.js -- my/file.js');
    });
  });
});

