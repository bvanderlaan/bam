'use strict';

const chai = require('chai');
const fs = require('fs');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const commandExecutor = require('../../lib/commandExecutor');
const list = require('../../lib/cmds/list');

const expect = chai.expect;
chai.use(sinonChai);

describe('List Command', () => {
  before(() => {
    sinon.stub(fs, 'accessSync');
    sinon.stub(fs, 'readFileSync').returns('version: "2"\nservices:\n  fredrick:\nports:\n    - "8080:8080"');
  });
  after(() => {
    fs.accessSync.restore();
    fs.readFileSync.restore();
  });
  beforeEach(() => sinon.stub(commandExecutor, 'execProcess'));
  afterEach(() => commandExecutor.execProcess.restore());

  it('should not be a fixed environment', () => {
    expect(list.fixedEnv).to.be.undefined;
  });

  it('should execute list command', () => {
    list('docker-compose.development.yml', ['my-service']);
    expect(commandExecutor.execProcess).to.have.been.calledOnce;
    expect(commandExecutor.execProcess)
      .to.have.been.calledWith('docker-compose -f docker-compose.development.yml config --services');
  });
});
