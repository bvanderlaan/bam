# BAM
A CLI for initializing projects and running Docker commands

## Developing Bam

You are welcome to submit PRs to fix issues, add new features, or just make Bam better.
Bam has a serries of automated tests and strives for a decent amount of code coverage to ensure that no changes will introduce regression issues. If you are submitting a PR make sure that the existing tests all pass and any new behaviours your PR is adding is covered by their own set of tests. To run the tests use the `npm run lint` and `npm test` commands.

### Adding a new Command

Bam is built with a plugin command architecture. To add a new command to Bam you simply need to add a new module to the `cmds` folder. Bam will automatically pick it up and add it to its repertoire.

A command module exposes a single function at its root level which satisfies the following interface:

```
module.exports = (composeFile, arguments, commandName) => {}
```

When Bam executes your command it will pass it in:
* The name of the docker-compose file to use (i.e. `docker-compose.development.yml`). This will simply be the compose file name and not path. It's expected to be in the root of the application/service you are executing against.
* An array of arguments that your command can use. Some commands expect the first argument to be the name of the application/service to execute against (e.g. `my-service`).
* The name of the command. This your command probably already knows and will likely not use but is useful for proxy commands such as the `dockerCompose` command, which needs to know which docker-compose command you want it to run.

Lastly if your command does *not* require to know what environment the user wants the command to run against, because the command only runs in one environment, think `test` command which always runs in the `test` environment, then you can mark your command as being a *fixed environment* command by attaching the `fixEnv` property to it.

```
module.exports = (_, args) => {...};
module.exports.fixEnv = true;
```

This way Bam will not attempt to validate that an environment flag was set preventing it from failing early and allowing your command to be executed.

#### Defining Help for your new command

Your command if it will support the `--help` flag should check the arguments list to see if the `--help` flag is present and if so display help text about your command while bypassing the execution of your command.

To have your command insert into the root `--help` feature which prints out all the commands bam supports, define the `summary` property on the root of your command.

```
module.exports.summary = 'List the services defined in the compose file.';
```

When the user types `bam --help`, bam will look up all its commands, and if the command has a `summary` property the command's name and summary text will be presented to the user.
