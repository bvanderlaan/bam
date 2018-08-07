'use strict';

const chai = require('chai');
const fs = require('fs');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');
const prompt = require('prompt');

const { NodeProjectBuilder } = require('../../lib/projectBuilders');

const init = require('../../lib/cmds/init');

const { expect } = chai;
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('Init Command', () => {
  beforeEach(() => {
    sinon.stub(NodeProjectBuilder.prototype, 'build');
  });
  afterEach(() => {
    NodeProjectBuilder.prototype.build.restore();
  });

  it('should be a fixed environment', () => {
    expect(init.fixedEnv).to.be.true;
  });

  it('should have a summary', () => {
    expect(init.summary).to.be.a('string');
  });

  it('should export a function', () => {
    expect(init).to.be.a('function');
  });

  describe('when directory is not empty', () => {
    beforeEach(() => {
      sinon.stub(fs, 'readdir').yields(null, ['files']);
      sinon.stub(process, 'exit');
      sinon.stub(prompt, 'get').yields();
    });
    afterEach(() => {
      fs.readdir.restore();
      process.exit.restore();
      prompt.get.restore();
    });

    it('should be checking current dir', () => (
      expect(init())
        .to.eventually.be.fulfilled
        .then(() => {
          expect(fs.readdir).to.have.been.calledOnce;
          expect(fs.readdir).to.have.been.calledWith(process.cwd());
        })
    ));

    it('should exit with one', () => (
      expect(init())
        .to.eventually.be.fulfilled
        .then(() => {
          expect(process.exit).to.have.been.calledOnce;
          expect(process.exit).to.have.been.calledWith(1);
        })
    ));
  });

  describe('when directory is empty', () => {
    beforeEach(() => {
      sinon.stub(fs, 'readdir').yields(null, []);
      sinon.stub(process, 'exit');
      sinon.stub(prompt, 'get').yields(null, { language: 'node' });
    });
    afterEach(() => {
      fs.readdir.restore();
      process.exit.restore();
      prompt.get.restore();
    });

    it('should be checking current dir', () => (
      expect(init())
        .to.eventually.be.fulfilled
        .then(() => {
          expect(fs.readdir).to.have.been.calledOnce;
          expect(fs.readdir).to.have.been.calledWith(process.cwd());
        })
    ));

    it('should exit with zero', () => (
      expect(init())
        .to.eventually.be.fulfilled
        .then(() => {
          expect(process.exit).to.have.been.calledOnce;
          expect(process.exit).to.have.been.calledWith(0);
        })
    ));
  });

  describe('User Input', () => {
    beforeEach(() => {
      sinon.stub(fs, 'readdir').yields(null, []);
      sinon.stub(process, 'exit');
    });
    afterEach(() => {
      fs.readdir.restore();
      process.exit.restore();
    });

    describe('when user picks something other then Nodejs', () => {
      beforeEach(() => {
        sinon.stub(prompt, 'get').yields(null, { language: 'ruby' });
      });
      afterEach(() => prompt.get.restore());

      it('should exit with one, current only supports Node projects', () => (
        expect(init())
          .to.eventually.be.fulfilled
          .then(() => {
            expect(process.exit).to.have.been.calledOnce;
            expect(process.exit).to.have.been.calledWith(1);
          })
      ));
    });

    describe('when user picks to build a Nodejs project', () => {
      beforeEach(() => {
        sinon.stub(prompt, 'get').yields(null, { language: 'Nodejs' });
      });
      afterEach(() => prompt.get.restore());

      it('should exit with 0', () => (
        expect(init())
          .to.eventually.be.fulfilled
          .then(() => {
            expect(process.exit).to.have.been.calledOnce;
            expect(process.exit).to.have.been.calledWith(0);
          })
      ));

      it('should call builder\'s build method', () => (
        expect(init())
          .to.eventually.be.fulfilled
          .then(() => expect(NodeProjectBuilder.prototype.build).to.have.been.calledOnce)
      ));
    });
  });
});
