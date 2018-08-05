'use strict';

const { expect } = require('chai');

const { isAskingForHelp } = require('../lib/isAskingForHelp');

describe('Help', () => {
  describe('when is Asking for Help', () => {
    describe('with short hand', () => {
      it('should return true', () => {
        expect(isAskingForHelp(['-h'])).to.be.true;
        expect(isAskingForHelp(['--h'])).to.be.true;
      });
    });

    describe('with upper case short hand', () => {
      it('should return true', () => {
        expect(isAskingForHelp(['-H'])).to.be.true;
        expect(isAskingForHelp(['--H'])).to.be.true;
      });
    });

    describe('with long form', () => {
      it('should return true', () => {
        expect(isAskingForHelp(['--help'])).to.be.true;
        expect(isAskingForHelp(['-help'])).to.be.true;
      });
    });

    describe('with upper case long form', () => {
      it('should return true', () => {
        expect(isAskingForHelp(['--Help'])).to.be.true;
        expect(isAskingForHelp(['-Help'])).to.be.true;
      });
    });
  });

  describe('when not Asking for Help', () => {
    describe('with no args', () => {
      it('should return false', () => {
        expect(isAskingForHelp()).to.be.false;
      });
    });

    describe('with empty args', () => {
      it('should return false', () => {
        expect(isAskingForHelp([])).to.be.false;
      });
    });

    describe('with non help args', () => {
      it('should return false', () => {
        expect(isAskingForHelp(['fubar', '--notAskingForHelp'])).to.be.false;
      });
    });
  });
});
