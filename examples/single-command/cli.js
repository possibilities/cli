#!/usr/bin/env node

const createCli = require('../../src/index')

createCli({
  description: 'My cli',
  environmentPrefix: 'MY_CLI',
  options: [{
    name: 'first-name',
    description: 'First name of user',
    required: true,
    environmentName: 'EXPLICIT_FIRST_NAME'
  }],
  handlersRoot: __dirname
})
