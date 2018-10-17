'use strict';

const { stripIndent } = require('common-tags');

const compose = require('../../composeService');
const npmService = require('../npmService');
const { ProjectDecorator } = require('./ProjectDecorator');

// /////////////////////////////////////////
// Private Methods
// /////////////////////////////////////////
const sortObjectKeys = obj => (
  Object.keys(obj).sort().reduce((newObj, key) => {
    // eslint-disable-next-line no-param-reassign
    newObj[key] = obj[key];
    return newObj;
  }, {})
);

// PACKAGE.JSON ///////////////////////////
function updatePackageJson() {
  const packageJson = JSON.parse(this.files['package.json']);
  const prodDeps = [
    'passport',
    'passport-local',
    'passport-jwt',
    'jsonwebtoken',
  ];

  return npmService.addDependencies(prodDeps, this.latestVersion)
    .then((deps) => {
      Object.assign(packageJson.dependencies, deps);
      packageJson.dependencies = sortObjectKeys(packageJson.dependencies);
    })
    .then(() => {
      this.files['package.json'] = JSON.stringify(packageJson, null, 2);
    });
}

// CONFIG //////////////////////////////////
function updateConfig() {
  this.files.src.config['passport.js'] = stripIndent`
  'use strict';

  const passport = require('passport');
  const { Strategy: LocalStrategy } = require('passport-local');
  const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
  const jwt = require('jsonwebtoken');

  const nconf = require('../config');
  const { User } = require('../users')();

  function generateJwt() {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    return jwt.sign({
      id: this.id,
      displayName: this.displayName,
      exp: parseInt(expiry.getTime() / 1000, 10),
    }, nconf.get('jwt_secret'));
  }

  module.exports = () => {
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) => (
      User.findById(id)
        .then(user => done(null, user))
        .catch(done)
      ));

    const signupOptions = {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    };
    passport.use('local-signup', new LocalStrategy(signupOptions, (req, email, password, done) => {
      if (!req.body.displayName) {
        return done(new Error('Missing Parameter: displayName'));
      }

      User.findOne({ 'local.email': email })
        .then((user) => {
          if (user) {
            return done(null, false);
          } else {
            const newUser = new User();
            newUser.local.email = email;
            newUser.local.password = password;
            newUser.displayName = req.body.displayName;
            newUser.generateJwt = generateJwt.bind(newUser);

            return newUser.save();
          }
        })
        .then(user => done(null, user))
        .catch(done);
      }));

    const loginOptions = {
      usernameField: 'email',
      passwordField: 'password',
    };
    passport.use('local-login', new LocalStrategy(loginOptions, (email, password, done) => (
      User.findOne({ 'local.email': email })
        .then((user) => {
          if (!user || user.state === User.States().PENDING || !user.validatePassword(password)) {
            return done(null, false);
          }

          Object.assign(user, {
            generateJwt: generateJwt.bind(user),
          });

          return done(null, user);
        })
        .catch(done)
    )));

    const jwtOptions = {
      secretOrKey: nconf.get('jwt_secret'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
    };
    passport.use('jwt', new JwtStrategy(jwtOptions, (payload, done) => {
      User.findOne({ _id: payload.id })
        .then((user) => {
          if (user) {
            return done(null, user);
          }

          return done(null, false);
        })
        .catch(done);
    }));

    return passport;
  };`;
}

// DOCKER ////////////////////////////////
function updateDocker() {
  const testCompose = compose.toJson(this.files['docker-compose.test.yml']);
  testCompose.services[this.name].environment = testCompose.services[this.name].environment || [];
  testCompose.services[this.name].environment.push('JWT_SECRET=my-secret-shhhhh');
  testCompose.services[this.name].environment.sort();

  this.files['docker-compose.test.yml'] = compose.toCompose(testCompose);

  const devCompose = compose.toJson(this.files['docker-compose.development.yml']);
  devCompose.services[this.name].environment = devCompose.services[this.name].environment || [];
  devCompose.services[this.name].environment.push('JWT_SECRET=my-secret-shhhhh');
  devCompose.services[this.name].environment.sort();
  this.files['docker-compose.development.yml'] = compose.toCompose(devCompose);
}

// README ////////////////////////////////
function updateReadme() {
  const t = this.files['Readme.md'].replace(/\|Environment Variable\|Description +\|\s\|:-+\|:-+\|\s((?:\|.*\|\s)*)/gm, (table) => {
    const rows = table.split('\n').filter(r => r.length);

    const newTable = [];
    // header
    newTable.push(rows.shift());
    // |:---|:---|
    newTable.push(rows.shift());

    rows.push('|JWT_SECRET          |The secret to use when verifying a JWT                                     |');
    rows.sort();

    return newTable.concat(rows).join('\n');
  });

  this.files['Readme.md'] = t;
}

// SOURCE /////////////////////////////////

function updateSource() {
  const c = this.files.src['server.js'].replace(/const \{ options: swaggerOptions, spec \} = require\('\.\/config\/swagger'\);/, match => (
      `${match}\nconst passport = require('./config/passport')();\n`
    ))
    .replace(/app.use\(addRequestId\(\{ attributeName: 'requestId' \}\)\);/, match => (
      `${match}\napp.use(passport.initialize());\n`
    ));

  this.files.src['server.js'] = c;
}

function addAuthRoutes() {
  this.files.src.authenticate = {
    'index.js': stripIndent`
    'use strict';

    const controller = require('./authenticate.controller');
    const route = require('./authenticate.route');

    module.exports = passport => (
      {
        controller,
        route: passport ? route(passport) : undefined,
      }
    );`,
    'authenticate.route.js': stripIndent`
    'use strict';

    const express = require('express');

    const { login } = require('./authenticate.controller');

    const router = express.Router();

    module.exports = (passport) => {
      router.post('/authenticate', passport.authenticate('local-login'), login);

      return router;
    };`,
    'authenticate.controller.js': stripIndent`
    'use strict';

    module.exports = {
      login(req, res) {
        const token = req.user.generateJwt();
        const displayName = req.user.displayName;
        res.status(200)
          .json({ displayName, token });
      },
    };`,
  };
}

function addSignupRoutes() {
  this.files.src.signup = {
    'index.js': stripIndent`
    'use strict';

    const controller = require('./signup.controller');
    const route = require('./signup.route');

    module.exports = passport => (
      {
        controller,
        route: passport ? route(passport) : undefined,
      }
    );`,
    'signup.route.js': stripIndent`
    'use strict';

    const express = require('express');

    const { signup } = require('./signup.controller');

    const router = express.Router();

    module.exports = (passport) => {
      router.post('/signup', passport.authenticate('local-signup'), signup);

      return router;
    };`,
    'signup.controller.js': stripIndent`
    'use strict';

    module.exports = {
      signup(req, res) {
        const token = req.user.generateJwt();
        res.status(201)
          .json({ token });
      },
    };`,
  };
}


// /////////////////////////////////////////
// Public Methods
// /////////////////////////////////////////

class PassportProjectDecorator extends ProjectDecorator {
  constructor(projectTemplate, latestVersion) {
    super(projectTemplate);

    Object.defineProperty(this, 'latestVersion', {
      value: latestVersion,
    });
  }
  build() {
    return this.projectTemplate.build()
      .then(() => updatePackageJson.call(this))
      .then(() => {
        updateDocker.call(this);
        updateReadme.call(this);
        updateConfig.call(this);
        updateSource.call(this);
        addAuthRoutes.call(this);
        addSignupRoutes.call(this);
      })
      .then(() => ({ files: this.files, executables: this.executables }));
  }
}

module.exports = {
  PassportProjectDecorator,
};

