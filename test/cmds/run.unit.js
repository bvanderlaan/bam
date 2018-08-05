'use strict';

const chai = require('chai');
const fs = require('fs');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const commandExecutor = require('../../lib/commandExecutor');
const run = require('../../lib/cmds/run');

const expect = chai.expect;
chai.use(sinonChai);

describe('Run Command', () => {
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

  it('should not be a fixed environment', () => {
    expect(run.fixedEnv).to.be.undefined;
  });

  it('should run service with the --rm flag', () => {
    run('docker-compose.development.yml', ['my-service', 'npm', 'install']);
    expect(commandExecutor.execProcess).to.have.been.calledOnce;
    expect(commandExecutor.execProcess)
      .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.development.yml run --rm my-service npm install');
  });
});
