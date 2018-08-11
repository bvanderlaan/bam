'use strict';

const { stripIndent } = require('common-tags');

const compose = require('../../composeService');
const npmService = require('../npmService');
const { ProjectDecorator } = require('./ProjectDecorator');


// /////////////////////////////////////////
// Private Methods
// /////////////////////////////////////////
function sortObjectKeys(obj) {
  return Object.keys(obj).sort().reduce((newObj, key) => {
    // eslint-disable-next-line no-param-reassign
    newObj[key] = obj[key];
    return newObj;
  }, {});
}

// PACKAGE.JSON ///////////////////////////
function updatePackageJson() {
  const packageJson = JSON.parse(this.files['package.json']);
  const prodDeps = [
    'bluebird',
    'cassandra-driver',
    'cassie-odm',
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

// DOCKER ////////////////////////////////
function updateDocker() {
  const testCompose = compose.toJson(this.files['docker-compose.test.yml']);
  testCompose.services.cassandra = {
    image: 'cassandra:2.1',
    expose: ['9042'],
    networks: ['test_net'],
  };
  testCompose.services[this.name].depends_on = testCompose.services[this.name].depends_on || [];
  testCompose.services[this.name].depends_on.push('cassandra');

  testCompose.services[this.name].environment = testCompose.services[this.name].environment || [];
  testCompose.services[this.name].environment.push('CASSANDRA_CONTACT_POINTS=cassandra');
  testCompose.services[this.name].environment.sort();

  this.files['docker-compose.test.yml'] = compose.toCompose(testCompose);

  const devCompose = compose.toJson(this.files['docker-compose.development.yml']);
  devCompose.services[this.name].environment = devCompose.services[this.name].environment || [];
  devCompose.services[this.name].environment.push('CASSANDRA_CONTACT_POINTS=cassandra');
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

    rows.push('|CASSANDRA_CONTACT_POINTS      |A CSV list of host names or IP addresses of the Cassandra nodes       |');
    rows.push(`|CASSANDRA_KEYSPACE            |A CSV list of key spaces which will be used. Defaults to \`${this.keyspaces.join(',')}\`|`);
    rows.push('|CASSANDRA_REPLICATION__CLASS  | What strategy to use when replicating data across the cluster. Defaults to `SimpleStrategy`|');
    rows.push('|CASSANDRA_REPLICATION__FACTOR |When using `SimpleStrategy` you can set how many copies of the data will exist in the cluster. Defaults to `1`|');
    rows.push('|CASSANDRA_REPLICATION__XX     |When using `NetworkTopologyStrategy` you can set the name of each DataCenter and the number of copies of the data by setting one or more `CASSANDRA_REPLICATION__XX` environment variables where `XX` is the name of the DC. Example: `CASSANDRA_REPLICATION__AL3=5`|');
    rows.push('|CASSANDRA_CONNECTION_POOL_SIZE|Connection pool size. Defaults to `3`                                 |');
    rows.sort();

    return newTable.concat(rows).join('\n');
  })
    .replace(/> TBD - Please fill in the rest./, line => (stripIndent`
#### Cassandra
${this.name} uses a Cassandra keyspace for storing its data; the keyspace will be created when ${this.name} starts up if not already created.

Use the \`CASSANDRA_KEYSPACE\` environment variable to tell ${this.name} which keyspace to use. If you want ${this.name} to create the keyspace use the \`CASSANDRA_REPLICATION__CLASS\` environment variable to define the replication strategy to create the keyspace with and use the \`CASSANDRA_REPLICATION__FACTOR\`,if using SimpleStrategy, or \`CASSANDRA_REPLICATION__XX\`, if using NetworkTopology where XX is the name of the DC, variables to set the number of copies.

To tell ${this.name} where to find the Cassandra cluster use the \`CASSANDRA_CONTACT_POINTS\` environment variable by setting it to a comma separated value (CSV) list of ip/host names for the nodes in the cluster ${this.name} can use to talk to.

${this.name} will create the required tables within the keyspace and run any migrations to the data schemas when it boots up.

${line}`));

  this.files['Readme.md'] = t;
}

// CONFIG //////////////////////////////////
function updateConfig() {
  if (this.keyspaces.length === 0) return;

  if (this.files.src && this.files.src.config && this.files.src.config['index.js']) {
    const c = this.files.src.config['index.js'].replace(/.defaults\({((?:.*\s)*)}\);/, (_, config) => {
      const defaults = config.split('\n').filter(k => k.trim().length);

      defaults.push(`    cassandra_keyspace: '${this.keyspaces.join(',')}',`);
      defaults.push('    cassandra_replication__class: \'SimpleStrategy\',');
      defaults.push('    cassandra_replication__factor: 1,');
      defaults.push('    cassandra_connection_pool_size: 3,');

      return `.defaults({\n${defaults.join('\n')}\n  });`;
    });

    this.files.src.config['index.js'] = c;
  }

  this.files.src.config['cassandra.js'] = stripIndent`
  'use strict';

  const BPromise = require('bluebird');
  const nconf = require('nconf');
  const { Client } = require('cassandra-driver');
  const cassie = require('cassie-odm');

  const { log: logger } = require('./logger');

  BPromise.promisifyAll(Client.prototype);

  const log = logger.child({
    component: 'setup/cassandra',
  });

  const contactPoints = nconf.get('cassandra_contact_points').split(',');
  const keyspaces = nconf.get('cassandra_keyspace').split(',');

  function getCassandraConnection() {
    const client = new Client({ contactPoints });

    return client.connectAsync()
      .then(() => {
        log.info('Connected to Cassandra');
        return client;
      })
      .catch((err) => {
        log.fatal({ err }, 'Error connecting to Cassandra');
        throw err;
      })
      .disposer(() => client.shutdownAsync());
  }

  function getReplicationConfig() {
    const replication = nconf.get('cassandra_replication') || { class: 'SimpleStrategy' };

    if (replication.class === 'SimpleStrategy' && !replication.replication_factor) {
      replication.replication_factor = 1;
    }

    // JSON standard uses double quotes but Cassandra needs single quotes.
    return JSON.stringify(replication).replace(/"/g, '\\'');
  }

  function doesKeyspaceExist(client, keyspace) {
    return client.executeAsync(\`SELECT keyspace_name from system.schema_keyspaces where keyspace_name = '\${keyspace}'\`)
      .then(results => (
        results.rows.some(row => row.keyspace_name === keyspace)
      ));
  }

  function createKeyspace(client, keyspace) {
    const replication = getReplicationConfig();
    log.info({ replication }, \`Creating Keyspace \${keyspace}\`);
    return client.executeAsync(\`CREATE KEYSPACE IF NOT EXISTS \${keyspace}
                WITH REPLICATION = \${replication};\`);
  }

  module.exports = {
    setup() {
      return BPromise.using(getCassandraConnection(), client => (
        BPromise.mapSeries(keyspaces, keyspace => (
          doesKeyspaceExist(client, keyspace)
            .then(exists => (exists ? BPromise.resolve() : createKeyspace(client, keyspace)))
        ))
      ))
        .then(() => log.info(\`Keyspace(s) \${keyspaces.join(', ')} are setup\`))
        .catch((err) => {
          log.fatal({ err }, 'Could not complete setup');
          process.exit(1);
        })
        .then(() => {
          const options = {
            logger,
            contactPoints,
            poolSize: nconf.get('cassandra_connection_pool_size'),
            keyspace: nconf.get('cassandra_keyspace'),
          };
          log.info({ options }, 'Connecting to Cassandra Keyspace(s)');
          cassie.connect(options);

          // TODO: Create models

          log.trace('Syncing Tables');
          return cassie.syncTables(options);
        });
    },
  };`;
}

// SCRIPTS ////////////////////////////////
function updateScripts() {
  const test = this.executables.script.test.replace(/export NODE_ENV="test" # Ensure we are in test environment/g, hook => (
    stripIndent`
    ${hook}

    cassandra=$(echo $CASSANDRA_CONTACT_POINTS | sed 's/\[\"\|\"\]//g')
    echo "===> Waiting on Cassandra"
    while ! nc -z $cassandra 9042;
      do
        echo -n '.';
        sleep 1;
      done;
    echo ""

    `
  ));

  this.executables.script.test = test;

  if (this.executables.script.bench) {
    const bench = this.executables.script.bench.replace(/export NODE_ENV="test" # Ensure we are in test environment/g, hook => (
      stripIndent`
      ${hook}

      cassandra=$(echo $CASSANDRA_CONTACT_POINTS | sed 's/\[\"\|\"\]//g')
      echo "===> Waiting on Cassandra"
      while ! nc -z $cassandra 9042;
        do
          echo -n '.';
          sleep 1;
        done;
      echo ""

      `
    ));

    this.executables.script.bench = bench;
  }

  if (this.executables.script.reset) {
    const reset = this.executables.script.reset.replace(/# TODO: Add additional reset commands here./g, hook => (
      stripIndent`
      cassandra=$(echo $CASSANDRA_CONTACT_POINTS | sed 's/\[\"\|\"\]//g')
      echo "===> Waiting on Cassandra"
      while ! nc -z $cassandra 9042;
        do
          echo -n '.';
          sleep 1;
        done;
      echo ""

      if [ "$1" != "-f" ]; then
        echo "Next the Cassandra keyspaces $CASSANDRA_KEYSPACES will be dropped"
        echo "Do you want to continue (y/n): "
        read yes
      else
        yes="y"
      fi

      if [ "$yes" = "y" ]; then
        echo "==> Dropping Cassandra..."
        node script/drop.cassandra.js
      else
        echo "==> Skip dropping Cassandra keyspaces"
      fi

      ${hook}
      `
    ));

    this.executables.script.reset = reset;
  }

  this.files.script = this.files.script || {};
  this.files.script['drop.cassandra.js'] = stripIndent`
  'use strict';

  const BPromise = require('bluebird');
  const { Client } = require('cassandra-driver');

  const nconf = require('../src/config');
  const logger = require('../src/config/logger')();

  BPromise.promisifyAll(Client.prototype);

  const log = logger.child({
    component: 'setup/cassandra',
  });

  const contactPoints = nconf.get('cassandra_contact_points').split(',');
  const keyspaces = nconf.get('cassandra_keyspace').split(',');

  function getCassandraConnection() {
    const client = new Client({ contactPoints });

    return client.connectAsync()
      .then(() => {
        log.info('Connected to Cassandra');
        return client;
      })
      .catch((err) => {
        log.fatal({ err }, 'Error connecting to Cassandra');
        throw err;
      })
      .disposer(() => client.shutdownAsync());
  }

  function dropKeyspace(client, keyspace) {
    log.info(\`Dropping Keyspace \${keyspace}\`);
    return client.executeAsync(\`DROP KEYSPACE IF EXISTS \${keyspace};\`);
  }

  const env = nconf.get('env');
  BPromise.using(getCassandraConnection(), client => (
    BPromise.mapSeries(keyspaces, keyspace => (
      (env !== 'production') ? dropKeyspace(client, keyspace) : BPromise.resolve()
    ))
  ))
    .then(() => {
      log.info(\`Keyspace(s) \${keyspaces.join(', ')} are setup\`);
      process.exit(0);
    })
    .catch((err) => {
      log.fatal({ err }, 'Could not complete setup');
      process.exit(1);
    });`;
}

// SOURCE /////////////////////////////////

function updateSource() {
  const c = this.files.src['server.js'].replace(/const \{ addStrategies: addPassportStrategies \} = require\('\.\/config\/passport'\);/, match => (
    `${match}\nconst { setup: setupCassie } = require('./config/cassandra');\n`
  ))
    .replace(/Promise.resolve\(\)/, stripIndent`
    Promise.resolve()
      .then(() => setupCassie())`);

  this.files.src['server.js'] = c;
}

// /////////////////////////////////////////
// Public Methods
// /////////////////////////////////////////

class CassandraProjectDecorator extends ProjectDecorator {
  constructor(projectTemplate, latestVersion, options = {}) {
    super(projectTemplate);

    const opt = Object.assign({ keyspaces: '' }, options);

    Object.defineProperty(this, 'latestVersion', {
      value: latestVersion,
    });

    Object.defineProperty(this, 'keyspaces', {
      enumerable: true,
      value: opt.keyspaces.split(',').map(s => s.trim().toLowerCase())
        .filter(k => k.length),
    });
  }
  build() {
    return this.projectTemplate.build()
      .then(() => updatePackageJson.call(this))
      .then(() => {
        updateDocker.call(this);
        updateReadme.call(this);
        updateScripts.call(this);
        updateConfig.call(this);
        updateSource.call(this);
      })
      .then(() => ({ files: this.files, executables: this.executables }));
  }
}

module.exports = {
  CassandraProjectDecorator,
};
