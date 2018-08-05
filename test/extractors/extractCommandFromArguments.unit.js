'use strict';

const { expect } = require('chai');

const { extractCommandFromArguments } = require('../../lib/extractors');

describe('Extractors', () => {
  describe('Extract Command From Arguments', () => {
    it('should return the command and collection of arguments minus the command', () => {
      const args = ['log', '--tail=100', '--follow', 'my-service'];
      expect(extractCommandFromArguments(args))
        .to.deep.equals({
          cmd: 'log',
          args: [
            '--tail=100',
            '--follow',
            'my-service',
          ],
        });
    });

    describe('when command is in upper case', () => {
      it('should return the command in lower case', () => {
        const args = ['LOG', '--TAIL=100', '--follow', 'my-service'];
        expect(extractCommandFromArguments(args))
          .to.deep.equals({
            cmd: 'log',
            args: [
              '--TAIL=100',
              '--follow',
              'my-service',
            ],
          });
      });
    });

    describe('when args list is empty', () => {
      it('should return the command as undefined', () => {
        const args = [];
        expect(extractCommandFromArguments(args))
          .to.deep.equals({
            cmd: undefined,
            args: [],
          });
      });
    });

    describe('when args list is only the command', () => {
      it('should return the command with empty args list', () => {
        const args = ['log'];
        expect(extractCommandFromArguments(args))
          .to.deep.equals({
            cmd: 'log',
            args: [],
          });
      });
    });

    describe('Help', () => {
      describe('when args list has the --help flag', () => {
        it('should return the command as help', () => {
          const args = ['--help'];
          expect(extractCommandFromArguments(args))
            .to.deep.equals({
              cmd: 'help',
              args: [],
            });
        });
      });

      describe('when args list has the -h flag', () => {
        it('should return the command as help', () => {
          const args = ['-h'];
          expect(extractCommandFromArguments(args))
            .to.deep.equals({
              cmd: 'help',
              args: [],
            });
        });
      });
    });

    describe('Version', () => {
      describe('when args list has the --version flag', () => {
        it('should return the command as version', () => {
          const args = ['--version'];
          expect(extractCommandFromArguments(args))
            .to.deep.equals({
              cmd: 'version',
              args: [],
            });
        });
      });

      describe('when args list has the -v flag', () => {
        it('should return the command as version', () => {
          const args = ['-v'];
          expect(extractCommandFromArguments(args))
            .to.deep.equals({
              cmd: 'version',
              args: [],
            });
        });
      });
    });
  });
});
