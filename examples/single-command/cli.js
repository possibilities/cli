#!/usr/bin/env node

const createCli = require('../../src/index')

createCli({
  description: 'My cli',
  options: [{
    name: 'name',
    description: 'Name of thing',
    required: true
  }],
  handlersRoot: __dirname
})
