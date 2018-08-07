'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const fs = require('fs');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const fileWriter = require('../../lib/projectBuilders/fileWriter');


const { expect } = chai;
chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('Project builders', () => {
  describe('fileWriter', () => {
    describe('write', () => {
      describe('when failed to write file', () => {
        before(() => sinon.stub(fs, 'writeFile').yields(new Error('boom')));
        after(() => fs.writeFile.restore());

        it('should reject', () => (
          expect(fileWriter.write('my-file.js', 'hello world'))
            .to.eventually.be.rejectedWith('FailedToWriteFile: my-file.js: boom')
        ));
      });

      describe('when file written', () => {
        before(() => sinon.stub(fs, 'writeFile').yields());
        after(() => fs.writeFile.restore());

        it('should be fulfilled', () => (
          expect(fileWriter.write('my-file.js', 'hello world'))
            .to.eventually.be.fulfilled
        ));

        it('should have appended a new line at end of file', () => {
          expect(fs.writeFile).to.have.been.calledWith('my-file.js', 'hello world\n');
        });
      });
    });

    describe('writeExecutable', () => {
      describe('when failed to write file', () => {
        before(() => {
          sinon.stub(fs, 'writeFile').yields(new Error('boom'));
          sinon.stub(fs, 'chmod').yields();
        });
        after(() => {
          fs.writeFile.restore();
          fs.chmod.restore();
        });

        it('should reject', () => (
          expect(fileWriter.writeExecutable('my-file.js', 'hello world'))
            .to.eventually.be.rejectedWith('FailedToWriteFile: my-file.js: boom')
        ));
      });

      describe('when failed to mark file as executable', () => {
        before(() => {
          sinon.stub(fs, 'writeFile').yields();
          sinon.stub(fs, 'chmod').yields(new Error('boom'));
        });
        after(() => {
          fs.writeFile.restore();
          fs.chmod.restore();
        });

        it('should reject', () => (
          expect(fileWriter.writeExecutable('my-file.js', 'hello world'))
            .to.eventually.be.rejectedWith('FailedToSetExecutableBit: my-file.js: boom')
        ));
      });

      describe('when executable written', () => {
        before(() => {
          sinon.stub(fs, 'writeFile').yields();
          sinon.stub(fs, 'chmod').yields();
        });
        after(() => {
          fs.writeFile.restore();
          fs.chmod.restore();
        });

        it('should be fulfilled', () => (
          expect(fileWriter.writeExecutable('my-file.js', 'hello world'))
            .to.eventually.be.fulfilled
        ));

        it('should have appended a new line at end of file', () => {
          expect(fs.writeFile).to.have.been.calledWith('my-file.js', 'hello world\n');
        });

        it('should have set the executable bit', () => {
          expect(fs.chmod).to.have.been.calledWith('my-file.js', '755');
        });
      });
    });
  });
});
