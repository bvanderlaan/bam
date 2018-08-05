'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
const sinon = require('sinon');
const fs = require('fs');

const { buildDockerComposeCommand } = require('../lib/dockerComposeBuilder');

const { expect } = chai;
chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('docker-compose command builder', () => {
  before(() => sinon.stub(fs, 'accessSync'));
  after(() => fs.accessSync.restore());

  describe('when docker-compose v1.x', () => {
    before(() => sinon.stub(fs, 'readFileSync').returns('abby:\nports:\n  - "8080:8080"'));
    after(() => fs.readFileSync.restore());

    it('should generate a single file compose command', () => {
      expect(buildDockerComposeCommand('docker-compose.development.yml', ['-d', 'my-service'], 'up'))
        .to.equal('docker-compose -f docker-compose.development.yml up -d my-service');
    });
  });

  describe('when docker-compose v2.x', () => {
    describe('and using double quotes', () => {
      before(() => sinon.stub(fs, 'readFileSync').returns('version: "2"\nservices:\n  abby:\nports:\n    - "8080:8080"'));
      after(() => fs.readFileSync.restore());

      it('should generate a single file compose command', () => {
        expect(buildDockerComposeCommand('docker-compose.development.yml', ['-d', 'my-service'], 'up'))
          .to.equal('docker-compose -f docker-compose.development.yml up -d my-service');
      });
    });

    describe('and using single quotes', () => {
      before(() => sinon.stub(fs, 'readFileSync').returns('version: \'2\'\nservices:\n  abby:\nports:\n    - "8080:8080"'));
      after(() => fs.readFileSync.restore());

      it('should generate a single file compose command', () => {
        expect(buildDockerComposeCommand('docker-compose.development.yml', ['-d', 'my-service'], 'up'))
          .to.equal('docker-compose -f docker-compose.development.yml up -d my-service');
      });
    });

    describe('and has minor version value', () => {
      before(() => sinon.stub(fs, 'readFileSync').returns('version: \'2.2\'\nservices:\n  abby:\nports:\n    - "8080:8080"'));
      after(() => fs.readFileSync.restore());

      it('should generate a single file compose command', () => {
        expect(buildDockerComposeCommand('docker-compose.development.yml', ['-d', 'my-service'], 'up'))
          .to.equal('docker-compose -f docker-compose.development.yml up -d my-service');
      });
    });
  });

  describe('when docker-compose v3.x', () => {
    describe('and using double quotes', () => {
      before(() => sinon.stub(fs, 'readFileSync').returns('version: "3"\nservices:\n  abby:\nports:\n    - "8080:8080"'));
      after(() => fs.readFileSync.restore());

      it('should generate a mulit-file compose command', () => {
        expect(buildDockerComposeCommand('docker-compose.development.yml', ['-d', 'my-service'], 'up'))
          .to.equal('docker-compose -f ./docker-compose.yml -f docker-compose.development.yml up -d my-service');
      });
    });

    describe('and using single quotes', () => {
      before(() => sinon.stub(fs, 'readFileSync').returns('version: \'3\'\nservices:\n  abby:\nports:\n    - "8080:8080"'));
      after(() => fs.readFileSync.restore());

      it('should generate a mulit-file compose command', () => {
        expect(buildDockerComposeCommand('docker-compose.development.yml', ['-d', 'my-service'], 'up'))
          .to.equal('docker-compose -f ./docker-compose.yml -f docker-compose.development.yml up -d my-service');
      });
    });

    describe('and has minor version value', () => {
      before(() => sinon.stub(fs, 'readFileSync').returns('version: \'3.2\'\nservices:\n  abby:\nports:\n    - "8080:8080"'));
      after(() => fs.readFileSync.restore());

      it('should generate a mulit-file compose command', () => {
        expect(buildDockerComposeCommand('docker-compose.development.yml', ['-d', 'my-service'], 'up'))
          .to.equal('docker-compose -f ./docker-compose.yml -f docker-compose.development.yml up -d my-service');
      });
    });

    describe('and has relative path', () => {
      before(() => sinon.stub(fs, 'readFileSync').returns('version: \'3.2\'\nservices:\n  abby:\nports:\n    - "8080:8080"'));
      after(() => fs.readFileSync.restore());

      it('should generate a mulit-file compose command', () => {
        expect(buildDockerComposeCommand('../abby/docker-compose.development.yml', ['-d', 'my-service'], 'up'))
          .to.equal('docker-compose -f ../abby/docker-compose.yml -f ../abby/docker-compose.development.yml up -d my-service');
      });
    });

    describe('and has absolute path', () => {
      before(() => sinon.stub(fs, 'readFileSync').returns('version: \'3.2\'\nservices:\n  abby:\nports:\n    - "8080:8080"'));
      after(() => fs.readFileSync.restore());

      it('should generate a mulit-file compose command', () => {
        expect(buildDockerComposeCommand('/abby/docker-compose.development.yml', ['-d', 'my-service'], 'up'))
          .to.equal('docker-compose -f /abby/docker-compose.yml -f /abby/docker-compose.development.yml up -d my-service');
      });
    });
  });
});
