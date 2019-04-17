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
          description: 'Show user',
          options: [
            {
              name: 'first-name',
              description: 'First name of user',
              required: true,
              environmentName: 'EXPLICIT_FIRST_NAME'
            }
          ]
        },
        {
          name: 'list',
          description: 'List users'
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
