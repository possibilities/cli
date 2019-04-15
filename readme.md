# CLI helpers

A declarative, opinionated approach for creating CLI applications

## Motivation

CLIs are effectively one or more "handler" functions. This library aims to free the developer from the incidental labor of creating a CLI UX so they can concentrate on the business logic of the handler functions. The results are a highly opinionated library that will "scale" up or down for most apps in terms of helping organize a small or large numbers of (possibly grouped/nested) commands and subcommands into CLIs that follow common Unix conventions. Flexibility is a non-goal but the underlying functions used by the library are exposed to enable custom implementations.

## Usage

1. Start by adding the library to your new or existing project.

   ```Shell
   mkdir -p /tmp/my-app
   cd /tmp/my-app
   yarn add @possibilities/cli
   ```

1. Create the entrypoint for your CLI

   File: `./cli.js`

   ```javascript
   #!/usr/bin/env node

   const createCli = require('@possibilities/cli')
   createCli({
     description: 'My cli',
     commands: [
       {
         name: 'show',
         description: 'Show thing',
         options: [
           {
             name: 'name',
             description: 'Name of thing',
             required: true
           }
         ]
       },
       {
         name: 'list',
         description: 'List things'
       }
     ]
   })
   ```

   Note: the first line is important, see [shebang](https://en.wikipedia.org/wiki/Shebang_(Unix))

1. Make the entrypoint file executable

   ```Shell
   chmod +x ./cli.js
   ```

1. Create handlers for handling each configured command

   File: `./commands/show.js`

   ```javascript
   module.exports = ({ name }) => console.info(`showing ${name}!`)
   ```

   File: `./commands/list.js`

   ```javascript
   module.exports = () => console.info('listing things!')
   ```

1. Add a `bin` key to your `./package.json`

   File: `./package.json`

   ```json
   {
     "name": "my-cli",
     "bin": {
        "my-cli": "./cli.js"
      }
   }
   ```

1. Link package for development

   To make your binary available during development it needs to be linked "globally". At the time of this writing `yarn` appears [unable to accomplish this](https://github.com/yarnpkg/yarn/issues/891#issuecomment-285776748)† so we recommend using `npm`'s link command to create the appropriate symbolic link while developing your CLI.

   ```Shell
   npm link . && rm ./package-lock.json
   ```

1. Invoke the CLI

   View help

   ```Shell
   > my-cli --help
   Usage: my-cli <command> [options]

   Commands:
     my-cli show  Show thing
     my-cli list  List things

   Options:
     --help     Show help                                                 [boolean]
     --version  Show version number                                       [boolean]
   ```

   Run a command

   ```Shell
   > my-cli show --name foo
   showing foo!
   ```

## Configuration

A CLI configuration object is passed into the provided `createCli` helper to map CLI commands, sub-commands, positional arguments and named options to handler functions.

TODO

### Resolving handlers

By default the handler functions are read from the filesystem based on naming conventions that map the names of commands and groups to Node.js modules and sub-directories (respectively). Additionally custom resolution can be acheived by providing a function that maps command/group names to handlers in whatever way you choose.

TODO

## Inspiration

This library is heavily inspired by years of using [`yargs`](https://github.com/yargs/yargs/blob/master/docs/api.md). I maintain many CLI applications that previously contained ~100+ lines of boilerplate to achieve the UI/UX provided by this library. There is nothing here that can't be done with `yargs` and for many it is more appropriate as `yargs` can be configured to behave in almost any way you can imagine.

## Footnotes

† If you know a solution to this please [let me know](mailto:mikebannister@gmail.com)
