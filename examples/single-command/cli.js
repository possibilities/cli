#!/usr/bin/env node

const createCli = require('../../src/index')

createCli({
  description: 'My cli',
  environmentPrefix: 'MY_CLI',
  options: [{
    name: 'name',
    description: 'Name of thing',
    required: true,
    environmentName: 'EXPLICIT_NAME'
  }],
  handlersRoot: __dirname
})
