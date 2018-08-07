'use strict';

class ProjectDecorator {
  constructor(projectTemplate) {
    Object.defineProperty(this, 'projectTemplate', {
      enumerable: true,
      value: projectTemplate,
    });

    Object.defineProperty(this, 'name', {
      enumerable: true,
      get() {
        return this.projectTemplate.name;
      },
    });

    Object.defineProperty(this, 'safeName', {
      enumerable: true,
      value: this.projectTemplate.safeName,
    });

    Object.defineProperty(this, 'description', {
      enumerable: true,
      get() {
        return this.projectTemplate.description;
      },
    });

    Object.defineProperty(this, 'version', {
      enumerable: true,
      get() {
        return this.projectTemplate.version;
      },
    });

    Object.defineProperty(this, 'keywords', {
      enumerable: true,
      get() {
        return this.projectTemplate.keywords;
      },
    });

    Object.defineProperty(this, 'files', {
      enumerable: true,
      get() {
        return this.projectTemplate.files;
      },
    });

    Object.defineProperty(this, 'executables', {
      enumerable: true,
      get() {
        return this.projectTemplate.executables;
      },
    });
  }

  // eslint-disable-next-line class-methods-use-this
  build() {
    throw new Error('NotImplemented');
  }
}

module.exports = {
  ProjectDecorator,
};
