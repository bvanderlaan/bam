'use strict';

const chai = require('chai');
const nconf = require('nconf');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const config = require('../../lib/cmds/config');

const expect = chai.expect;
chai.use(sinonChai);

describe('Config Command', () => {
  it('should be a fixed environment', () => {
    expect(config.fixedEnv).to.be.true;
  });

  describe('GET', () => {
    before(() => sinon.stub(nconf, 'get'));
    after(() => nconf.get.restore());

    before(() => config(null, ['get', 'my-id']));

    it('should have called nconf.get', () => {
      expect(nconf.get).to.have.been.calledOnce;
      expect(nconf.get).to.have.been.calledWith('my-id');
    });
  });

  describe('SET', () => {
    before(() => {
      sinon.stub(nconf, 'set');
      sinon.stub(nconf, 'save');
    });
    after(() => {
      nconf.set.restore();
      nconf.save.restore();
    });

    before(() => config(null, ['set', 'my-id', '42']));

    it('should have called nconf.set', () => {
      expect(nconf.set).to.have.been.calledOnce;
      expect(nconf.set).to.have.been.calledWith('my-id', '42');
    });

    it('should have saved the configuration', () => {
      expect(nconf.save).to.have.been.calledOnce;
    });
  });

  describe('LIST', () => {
    const orgStores = nconf.stores;
    before(() => {
      sinon.spy(console, 'log');
      nconf.stores = {
        '.bamrc': {
          store: {
            logTail: 100,
            hello: 'world',
          },
        },
        defaults: {
          store: {
            logTail: 200,
            fu: 'bar',
          },
        },
      };
    });
    after(() => {
      console.log.restore();
      nconf.stores = orgStores;
    });

    before(() => config(null, ['list']));

    it('should log each value', () => {
      expect(console.log).to.have.been.calledThrice;
      expect(console.log).to.have.been.calledWith('logTail ==> 100');
      expect(console.log).to.have.been.calledWith('hello ==> world');
      expect(console.log).to.have.been.calledWith('fu ==> bar');
    });
  });
});

