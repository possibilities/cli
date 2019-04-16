#!/usr/bin/env node

const createCli = require('../../src/index')

createCli({
  description: 'My cli',
  environmentPrefix: 'MY_CLI',
  groups: [
    {
      name: 'users',
      description: 'Users',
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
      ]
    },
    {
      name: 'util',
      description: 'Utils',
      commands: [
        {
          name: 'fix',
          description: 'Fix things'
        },
        {
          name: 'break',
          description: 'Break things'
        }
      ]
    }
  ],
  handlersRoot: __dirname
})
