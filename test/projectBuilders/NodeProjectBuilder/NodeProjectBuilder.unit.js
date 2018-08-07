'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const proxyquire = require('proxyquire');

const decorators = require('../../../lib/projectBuilders/NodeProjectBuilder/decorators');

const writerStub = sinon.stub().resolves();
const writeExecutableStub = sinon.stub().resolves();
const repoServicStub = sinon.stub().resolves();

const { NodeProjectBuilder } = proxyquire('../../../lib/projectBuilders/NodeProjectBuilder', {
  '../repoService': {
    createRepo: repoServicStub,
  },
  '../fileWriter': {
    write: writerStub,
    writeExecutable: writeExecutableStub,
  },
  'latest-version': sinon.stub().resolves('1.2.3'),
  mkdirp: sinon.stub().yields(),
});

const { expect } = chai;
chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('Project builders', () => {
  describe('Node', () => {
    it('should use the library decorator', () => {
      const options = {
        name: 'my-cool-name',
        description: 'my project is cool',
        version: '1.2.3',
        isService: 'no',
      };
      const b = new NodeProjectBuilder(options);
      expect(b.template).to.be.an.instanceof(decorators.LibraryProjectDecorator);
    });

    it('should use the Service decorator', () => {
      const options = {
        name: 'my-cool-name',
        description: 'my project is cool',
        version: '1.2.3',
        isService: 'yes',
      };
      const b = new NodeProjectBuilder(options);
      expect(b.template).to.be.an.instanceof(decorators.ServiceProjectDecorator);
    });

    it('should use the Service decorator by default', () => {
      const b = new NodeProjectBuilder({ name: 'my-cool-name', description: 'my project is cool', version: '1.2.3' });
      expect(b.template).to.be.an.instanceof(decorators.ServiceProjectDecorator);
    });

    describe('when failed to write any of the files', () => {
      before(() => {
        writerStub.withArgs('./package.json', sinon.match.string).rejects(new Error('boom'));
      });
      after(() => {
        writerStub.reset();
        writerStub.resolves();
      });

      it('should reject', () => {
        const b = new NodeProjectBuilder({ name: 'my-cool-name', description: 'my project is cool', version: '1.2.3' });
        return expect(b.build()).to.eventually.be.rejectedWith('boom');
      });
    });

    describe('when failed to write any of the executables', () => {
      before(() => {
        writeExecutableStub.withArgs('./script/bootstrap', sinon.match.string).rejects(new Error('boom'));
      });
      after(() => {
        writeExecutableStub.reset();
        writeExecutableStub.resolves();
      });

      it('should reject', () => {
        const b = new NodeProjectBuilder({ name: 'my-cool-name', description: 'my project is cool', version: '1.2.3' });
        return expect(b.build()).to.eventually.be.rejectedWith('boom');
      });
    });

    describe('when successful', () => {
      before(() => repoServicStub.resetHistory());

      it('should create the repo', () => {
        const b = new NodeProjectBuilder({ name: 'my-cool-name', description: 'my project is cool', version: '1.2.3' });
        return expect(b.build()).to.eventually.be.fulfilled
          .then(() => {
            expect(repoServicStub).to.have.been.calledOnce;
          });
      });
    });
  });
});
