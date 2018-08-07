'use strict';

const { expect } = require('chai');

const composeService = require('../../lib/projectBuilders/composeService');

describe('Project builders', () => {
  describe('composeService', () => {
    describe('toCompose', () => {
      it('should not wrap image names in quotes', () => {
        const json = {
          version: '2.2',
          services: {
            'my-service': {
              image: 'my/image:1.2.3',
            },
          },
        };

        const actual = composeService.toCompose(json);
        expect(actual).to.equal('version: \'2.2\'\nservices:\n  my-service:\n    image: my/image:1.2.3\n');
      });

      it('should not end user defined volume in null', () => {
        const json = {
          version: '2.2',
          volumes: {
            node_modules: undefined,
          },
        };

        const actual = composeService.toCompose(json);
        expect(actual).to.equal('version: \'2.2\'\nvolumes:\n  node_modules:\n');
      });

      it('should not end user defined network in null', () => {
        const json = {
          version: '2.2',
          networks: {
            test_net: undefined,
          },
        };

        const actual = composeService.toCompose(json);
        expect(actual).to.equal('version: \'2.2\'\nnetworks:\n  test_net:\n');
      });

      it('should not wrap volume list entries in quotes', () => {
        const json = {
          version: '2.2',
          services: {
            'my-service': {
              volumes: [
                '.:/usr/src/app',
                'node_modules:/usr/src/app/node_modules',
                './reports:/usr/src/app/reports',
              ],
            },
          },
        };

        const actual = composeService.toCompose(json);
        expect(actual).to.equal('version: \'2.2\'\nservices:\n  my-service:\n    volumes:\n      - .:/usr/src/app\n      - node_modules:/usr/src/app/node_modules\n      - ./reports:/usr/src/app/reports\n');
      });

      it('should not wrap volume list entries in quotes for any service', () => {
        const json = {
          version: '2.2',
          services: {
            'my-service': {
              volumes: [
                '.:/usr/src/app',
                'node_modules:/usr/src/app/node_modules',
                './reports:/usr/src/app/reports',
              ],
            },
            'my-other-service': {
              volumes: [
                '.:/usr/src/app',
                'node_modules:/usr/src/app/node_modules',
                './reports:/usr/src/app/reports',
              ],
            },
          },
        };

        const actual = composeService.toCompose(json);
        expect(actual).to.equal('version: \'2.2\'\nservices:\n  my-service:\n    volumes:\n      - .:/usr/src/app\n      - node_modules:/usr/src/app/node_modules\n      - ./reports:/usr/src/app/reports\n  my-other-service:\n    volumes:\n      - .:/usr/src/app\n      - node_modules:/usr/src/app/node_modules\n      - ./reports:/usr/src/app/reports\n');
      });
    });
  });
});
