# Contributing to bam
First Thanks for helping out :+1::tada: we really appreciate it :tada::+1:

The following is a set of guidelines for contributing to the project. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Pull Requests
All Pull Requests are welcome but to ensure they get committed please make sure you include the following in your PR:

* Brief description of the issue
* Results from the automated tests
* Ensure that tests are updated or new tests are added to properly cover the change in question
* Impacted areas of application for test focus
* If dependencies on another PR, include a reference number and describe the dependency
* End all files with a newline!

## Style guides
### Git Commit Messages

* Use the imperative mood ("Add feature" not "Added feature", "Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Limit each line in the body of the commit to 80 characters or less
* Reference issues and pull requests liberally after the first line
* When only changing documentation, include `[ci skip]` in the commit description
* Consider starting the commit message with an applicable emoji:
  * :art: `:art:` when improving the format/structure of the code
  * :racehorse: `:racehorse:` when improving performance
  * :non-potable_water: `:non-potable_water:` when plugging memory leaks
  * :memo: `:memo:` when writing docs
  * :penguin: `:penguin:` when fixing something on Linux
  * :apple: `:apple:` when fixing something on macOS
  * :checkered_flag: `:checkered_flag:` when fixing something on Windows
  * :bug: `:bug:` when fixing a bug
  * :fire: `:fire:` when removing code or files
  * :green_heart: `:green_heart:` when fixing the CI build
  * :white_check_mark: `:white_check_mark:` when adding tests
  * :lock: `:lock:` when dealing with security
  * :arrow_up: `:arrow_up:` when upgrading dependencies
  * :arrow_down: `:arrow_down:` when downgrading dependencies
  * :shirt: `:shirt:` when removing linter warnings

### JavaScript

All JavaScript must adhere to [The JavaScript Style Guide](https://www.npmjs.com/package/@vanderlaan/eslint-config-vanderlaan).

#### Special Considerations

* Prefer the object spread operator (`{...anotherObj}`) to `Object.assign()`
* Prefer the array spread operator (`[...array]`) to `Array.concat()`
* Prefer array destruction in promises (`.then(([a, b, c]) => {..})`) to non-standard `.spread((a, b, c) => {..})`
* Prefer Arrow Functions (`() => console.log('hello')`) to named or anonymous functions (`function() { console.log('world'); }`)
* Prefer Class syntax vs. function constructors/Prototype
* Inline `export`s with expressions whenever possible
  ```js
  // Use this:
  module.exports = {
    property1: 'hello world',
    myFunction() {..}
  };

  // Instead of:
  const Lib = {
    property1: 'hello world',
    myFunction() {..}
  }

  module.exports = Lib
  ```
* Prefer named exports vs. default exports in order to support _tree shaking_ (`const { ClassName } = require('my-module');`)
  ```js
  // Use this:
  class ClassName {
  }

  module.exports = {
    ClassName,
  };

  // Instead of:
  module.exports = class ClassName {
  }
  ```
* Place requires in the following order:
  * Built in Node Modules (such as `path`)
  * NPM Modules (such as `sinon-chai`)
  * Local Modules (using relative paths)
* Sort all requires in alphabetical order. For local modules sort first by path followed by file name.

#### :white_check_mark:Good Example
  ```js
  // good
  const b = require('./b');
  const c = require('./c');
  const a = require('../lib/a');
  ```
#### :x:Bad Example
  ```js
  // bad
  const a = require('../lib/a');
  const c = require('./c');
  const b = require('./b');
  ```

### Tests

* Include thoughtfully-worded, well-structured [Mocha](https://github.com/mochajs/mocha) tests in the `./test` folder.
  * The `./test` folder structure should mimic the production folder (i.e. `./src`)
* Tests should be categorized as Unit, Integration, System, and Benchmark. To allow for easy glob patterns mark unit tests with the `*.unit.js` extension, integration tests with the `*.integration.js` extension, System tests with `*.system.js` extension and Benchmark tests with the `*.bench.js` extension.
* The test file should have the same name as the production file it is testing say for the proper file extension (i.e. `*.unit.js`, `*.system.js`)
* Testing private functions is discouraged. Needing to test a private function is usually an indication that your service has too many responsibilities and should be split up.
* Tests should use arrow functions and should never use `this`
* Tests should be using the `sinon-chai` expectations for consistency paired with `chai-as-promised`
  * Please see the helpful notes here around [testing promises](http://imaginativethinking.ca/heck-test-async-code-mocha/)
* Tests must follow the pattern _setup - run - assert - destroy_, a describe should still work if it is marked as `.only`
* Treat `describe` as a noun or situation.
* Treat `it` as a statement about state or how an operation _should_ change state.

#### :white_check_mark:Good Example
```js
describe('GET User Route', () => {
  describe('when user found', () => {
    it('should return 200', () => {...});
    it('should return the user object', () => {...});
  });
  describe('when user not found', () => {
    it('should return 404', () => {...});
  });
});
```

#### :x:Bad Example
```js
describe('GET User Route', () => {
  it('when user found return 200', () => {...});
  it('when user not found return 404', () => {...});
  it('when user found return the user object', () => {...});
});
```

## Additional Notes

### Git Branches

* Branch names should be all lower case. This avoids communication issues when multiple people need to access the same branch, _Check out proj 1234_ is that `Proj-1234`, `proj-1234` or `PROJ-1234`, and also prevents accidental duplication; branch `proj-1234` is not the same as `Proj-1234` but both can exist. Sticking to lower case saves on confusion.
* Branch names should be under 50 characters. This makes checking them out and using various git commands easier: less typing.
* Branch names should use kebab case (snake case but use dash `-` instead of underscore `_`). A dash stands out more and is not lost by an underline; also to type a dash you only need to push one key.
* Branch names ideally should include a description of the change to make it easier to know what each branch does without having to look up each issue. The description should be as short as possible.
  * :white_check_mark:**Great Example**: `proj-1234-type-error-on-update`
  * :ballot_box_with_check:**Good Example**: `type-error-on-update`
  * :x:**Bad Example**: `this-fixes-a-type-error-on-update`
  * :x:**Horrible Example**: `Fixes_typeError_on-update`
