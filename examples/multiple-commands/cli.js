#!/usr/bin/env node

const createCli = require('../../src/index')

createCli({
  description: 'My cli',
  environmentPrefix: 'MY_CLI',
  commands: [
    {
      name: 'show',
      description: 'Show thing',
      options: [
        {
          name: 'name',
          description: 'Name of thing',
          required: true,
          environmentName: 'EXPLICIT_NAME'
        }
      ]
    },
    {
      name: 'list',
      description: 'List things'
    }
  ],
  handlersRoot: __dirname
})
