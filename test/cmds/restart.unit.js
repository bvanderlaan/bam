'use strict';

const chai = require('chai');
const fs = require('fs');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const commandExecutor = require('../../lib/commandExecutor');
const restart = require('../../lib/cmds/restart');


const expect = chai.expect;
chai.use(sinonChai);

describe('Restart Command', () => {
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
    expect(restart.fixedEnv).to.be.undefined;
  });

  it('should execute the stop and up commands', () => {
    restart('docker-compose.development.yml', ['my-service']);

    expect(commandExecutor.execProcess).to.have.been.calledTwice;
    expect(commandExecutor.execProcess)
      .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.development.yml stop my-service');
    expect(commandExecutor.execProcess)
      .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.development.yml up -d my-service');
  });
});
