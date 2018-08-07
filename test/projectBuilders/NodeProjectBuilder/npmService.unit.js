'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const npmService = require('../../../lib/projectBuilders/NodeProjectBuilder/npmService');

const { expect } = chai;
chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('Project builders', () => {
  describe('Node', () => {
    describe('NPM Service', () => {
      describe('Add Dependencies', () => {
        describe('when failed to get latest version', () => {
          it('should reject', () => {
            const latestVersion = sinon.stub().rejects(new Error('boom'));
            return expect(npmService.addDependencies(['bunyan'], latestVersion))
              .to.eventually.be.rejectedWith('boom');
          });
        });

        describe('when succeeded to get latest version', () => {
          it('should reject', () => {
            const latestVersion = sinon.stub();
            latestVersion.withArgs('bunyan').resolves('1.2.3');
            latestVersion.withArgs('chai').resolves('4.5.6');

            return expect(npmService.addDependencies(['bunyan', 'chai'], latestVersion))
              .to.eventually.be.fulfilled
              .and.deep.equals({
                bunyan: '^1.2.3',
                chai: '^4.5.6',
              });
          });
        });
      });
    });
  });
});
