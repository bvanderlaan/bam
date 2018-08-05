const { expect } = require('chai');

const { extractEnvironmentFromArguments } = require('../../lib/extractors');

describe('Extractors', () => {
  describe('Extract Environment From Arguments', () => {
    describe('Development selector', () => {
      describe('detect short form selector', () => {
        it('should set the environment to development', () => {
          const args = ['--dev'];
          const { env } = extractEnvironmentFromArguments(args);
          expect(env).to.equal('development');
        });

        it('should remove selector from argument array', () => {
          const args = ['--dev'];
          const { args: justArgs } = extractEnvironmentFromArguments(args);
          expect(justArgs).to.deep.equals([]);
        });
      });

      describe('detect long form selector', () => {
        it('should set the environment to development', () => {
          const args = ['--development'];
          const { env } = extractEnvironmentFromArguments(args);
          expect(env).to.equal('development');
        });

        it('should remove selector from argument array', () => {
          const args = ['--development'];
          const { args: justArgs } = extractEnvironmentFromArguments(args);
          expect(justArgs).to.deep.equals([]);
        });
      });
    });

    describe('Production selector', () => {
      describe('detect short form selector', () => {
        it('should set the environment to production', () => {
          const args = ['--prod'];
          const { env } = extractEnvironmentFromArguments(args);
          expect(env).to.equal('production');
        });

        it('should remove selector from argument array', () => {
          const args = ['--prod'];
          const { args: justArgs } = extractEnvironmentFromArguments(args);
          expect(justArgs).to.deep.equals([]);
        });
      });

      describe('detect long form selector', () => {
        it('should set the environment to production', () => {
          const args = ['--production'];
          const { env } = extractEnvironmentFromArguments(args);
          expect(env).to.equal('production');
        });

        it('should remove selector from argument array', () => {
          const args = ['--production'];
          const { args: justArgs } = extractEnvironmentFromArguments(args);
          expect(justArgs).to.deep.equals([]);
        });
      });
    });

    describe('Test selector', () => {
      describe('detect selector', () => {
        it('should set the environment to test', () => {
          const args = ['--test'];
          const { env } = extractEnvironmentFromArguments(args);
          expect(env).to.equal('test');
        });

        it('should remove selector from argument array', () => {
          const args = ['--test'];
          const { args: justArgs } = extractEnvironmentFromArguments(args);
          expect(justArgs).to.deep.equals([]);
        });
      });
    });

    describe('Environment selector', () => {
      describe('Short form', () => {
        describe('Development flag', () => {
          describe('detect short form flag', () => {
            it('should set the environment to development', () => {
              const args = ['--env=dev'];
              const { env } = extractEnvironmentFromArguments(args);
              expect(env).to.equal('development');
            });
          });

          describe('detect long form flag', () => {
            it('should set the environment to development', () => {
              const args = ['--env=development'];
              const { env } = extractEnvironmentFromArguments(args);
              expect(env).to.equal('development');
            });
          });
        });

        describe('Production flag', () => {
          describe('detect short form flag', () => {
            it('should set the environment to production', () => {
              const args = ['--env=prod'];
              const { env } = extractEnvironmentFromArguments(args);
              expect(env).to.equal('production');
            });
          });

          describe('detect long form flag', () => {
            it('should set the environment to production', () => {
              const args = ['--env=production'];
              const { env } = extractEnvironmentFromArguments(args);
              expect(env).to.equal('production');
            });
          });
        });

        describe('Test flag', () => {
          it('should set the environment to test', () => {
            const args = ['--env=test'];
            const { env } = extractEnvironmentFromArguments(args);
            expect(env).to.equal('test');
          });
        });

        describe('Custom environment flag', () => {
          it('should set the environment to the custom environment', () => {
            const args = ['--env=multi-site'];
            const { env } = extractEnvironmentFromArguments(args);
            expect(env).to.equal('multi-site');
          });

          it('should respect case sensitivity', () => {
            const args = ['--env=Multi-Site'];
            const { env } = extractEnvironmentFromArguments(args);
            expect(env).to.equal('Multi-Site');
          });
        });

        describe('detect no environment flag', () => {
          it('should set environment to empty string (falsey)', () => {
            const args = ['--env'];
            const { env } = extractEnvironmentFromArguments(args);
            expect(env).to.equal('');
          });
        });
      });

      describe('Long form', () => {
        describe('Development flag', () => {
          describe('detect short form flag', () => {
            it('should set the environment to development', () => {
              const args = ['--environment=dev'];
              const { env } = extractEnvironmentFromArguments(args);
              expect(env).to.equal('development');
            });
          });

          describe('detect long form flag', () => {
            it('should set the environment to development', () => {
              const args = ['--environment=development'];
              const { env } = extractEnvironmentFromArguments(args);
              expect(env).to.equal('development');
            });
          });
        });

        describe('Production flag', () => {
          describe('detect short form flag', () => {
            it('should set the environment to production', () => {
              const args = ['--environment=prod'];
              const { env } = extractEnvironmentFromArguments(args);
              expect(env).to.equal('production');
            });
          });

          describe('detect long form flag', () => {
            it('should set the environment to production', () => {
              const args = ['--environment=production'];
              const { env } = extractEnvironmentFromArguments(args);
              expect(env).to.equal('production');
            });
          });
        });

        describe('Test flag', () => {
          it('should set the environment to test', () => {
            const args = ['--environment=test'];
            const { env } = extractEnvironmentFromArguments(args);
            expect(env).to.equal('test');
          });
        });

        describe('Custom environment flag', () => {
          it('should set the environment to the custom environment', () => {
            const args = ['--environment=multi-site'];
            const { env } = extractEnvironmentFromArguments(args);
            expect(env).to.equal('multi-site');
          });

          it('should respect case sensitivity', () => {
            const args = ['--environment=Multi-Site'];
            const { env } = extractEnvironmentFromArguments(args);
            expect(env).to.equal('Multi-Site');
          });
        });

        describe('detect no environment flag', () => {
          it('should set environment to an empty string (falsy)', () => {
            const args = ['--environment'];
            const { env } = extractEnvironmentFromArguments(args);
            expect(env).to.equal('');
          });
        });
      });
    });

    describe('Detect no selector', () => {
      it('should set the environment to empty string (falsy)', () => {
        const args = ['hello'];
        const { env } = extractEnvironmentFromArguments(args);
        expect(env).to.equal('');
      });
    });

    describe('Detect multiple selectors', () => {
      it('should use only the first selector', () => {
        const args = ['--environment=production', '--dev', '--test'];
        const { env } = extractEnvironmentFromArguments(args);
        expect(env).to.equal('production');
      });

      it('should still remove all selectors', () => {
        const args = ['--environment=production', '--dev', '--test'];
        const { args: justArgs } = extractEnvironmentFromArguments(args);
        expect(justArgs).to.deep.equals([]);
      });
    });
  });
});
