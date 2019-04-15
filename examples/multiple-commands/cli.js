#!/usr/bin/env node

const createCli = require('../../src/index')

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
  ],
  handlersRoot: __dirname
})
