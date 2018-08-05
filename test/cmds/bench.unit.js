'use strict';

const chai = require('chai');
const fs = require('fs');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const commandExecutor = require('../../lib/commandExecutor');
const bench = require('../../lib/cmds/bench');

const expect = chai.expect;
chai.use(sinonChai);

describe('Bench Command', () => {
  before(() => {
    sinon.stub(fs, 'accessSync').returns(true);
    sinon.stub(fs, 'readFileSync').returns('version: "3.2"\nservices:\n  lochlyn:\nports:\n    - "8080:8080"');
  });
  after(() => {
    fs.accessSync.restore();
    fs.readFileSync.restore();
  });

  describe('when service is provided', () => {
    before(() => {
      sinon.stub(commandExecutor, 'execProcess')
        .withArgs('docker-compose -f ./docker-compose.yml -f docker-compose.test.yml config --services')
        .returns({ stdout: 'my-service' });
    });
    after(() => commandExecutor.execProcess.restore());

    it('should run bench docker-compose command', () => {
      bench(undefined, ['my-service']);
      expect(commandExecutor.execProcess)
        .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.test.yml run --rm my-service script/bench');
    });
  });

  describe('when environment is provided', () => {
    before(() => {
      sinon.stub(commandExecutor, 'execProcess')
        .withArgs('docker-compose -f ./docker-compose.yml -f docker-compose.test.yml config --services')
        .returns({ stdout: 'my-service' });
    });
    after(() => commandExecutor.execProcess.restore());

    it('should run bench docker-compose command', () => {
      bench(undefined, ['my-service', '--prod']);
      expect(commandExecutor.execProcess)
        .to.have.been.calledWith('docker-compose -f ./docker-compose.yml -f docker-compose.test.yml run --rm my-service script/bench --prod');
    });
  });
});
