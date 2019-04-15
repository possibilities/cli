import test from 'ava'
import dedent from 'dedent'
const { testCli } = require('./_helpers.js')

const echoArgsHandler = (args, positional) => ({ args, positional })

test('runs', async t => {
  t.plan(1)
  const { response } =
    await testCli('node example-app', {}, { handlers: echoArgsHandler })
  t.deepEqual(response.args, {})
})

test('runs command', async t => {
  t.plan(4)
  const { response: response1 } = await testCli(
    'node example-app show',
    {
      commands: [
        { name: 'show', description: 'Show things' },
        { name: 'list', description: 'List things' }
      ]
    },
    {
      handlers: {
        show: echoArgsHandler,
        list: echoArgsHandler
      }
    }
  )
  t.deepEqual(response1.args, {})
  t.deepEqual(response1.positional, { commands: ['show'] })
  const { response: response2 } = await testCli(
    'node example-app list',
    {
      commands: [
        { name: 'show', description: 'Show things' },
        { name: 'list', description: 'List things' }
      ]
    },
    {
      handlers: {
        show: echoArgsHandler,
        list: echoArgsHandler
      }
    }
  )
  t.deepEqual(response2.args, {})
  t.deepEqual(response2.positional, { commands: ['list'] })
})

test('runs command in command group', async t => {
  t.plan(4)
  const config = {
    groups: [{
      name: 'users',
      label: 'Users',
      commands: [
        { name: 'show', description: 'Show user' },
        {
          name: 'list',
          description: 'List users',
          options: [{
            name: 'foo',
            type: 'string'
          }]
        }
      ]
    }, {
      name: 'util',
      label: 'Utilities',
      commands: [
        { name: 'fix', description: 'Fix things' },
        { name: 'break', description: 'Break things' }
      ]
    }]
  }
  const handlers = {
    users: {
      show: echoArgsHandler,
      list: echoArgsHandler
    },
    util: {
      fix: echoArgsHandler,
      break: echoArgsHandler
    }
  }
  const { response: response1 } = await testCli(
    'node example-app users show',
    config,
    { handlers }
  )
  t.deepEqual(response1.args, {})
  t.deepEqual(response1.positional.commands, ['users', 'show'])

  const { response: response2 } = await testCli(
    'node example-app util break',
    config,
    { handlers }
  )

  t.deepEqual(response2.args, {})
  t.deepEqual(response2.positional, { commands: ['util', 'break'] })
})

test('runs with option for command', async t => {
  t.plan(2)
  const { response } = await testCli(
    'node example-app show --foo bar1',
    {
      commands: [
        {
          name: 'show',
          description: 'Show things',
          options: [{
            name: 'foo',
            type: 'string'
          }]
        }
      ]
    },
    { handlers: echoArgsHandler }
  )
  t.deepEqual(response.positional.commands, ['show'])
  t.deepEqual(response.args, { foo: 'bar1' })
})

test('runs with option for command in command group', async t => {
  t.plan(2)
  const { response } = await testCli(
    'node example-app users list --foo bar2',
    {
      groups: [{
        name: 'users',
        label: 'Users',
        commands: [
          { name: 'show', description: 'Show user' },
          {
            name: 'list',
            description: 'List users',
            options: [{
              name: 'foo',
              type: 'string'
            }]
          }
        ]
      }, {
        name: 'util',
        label: 'Utilities',
        commands: [
          { name: 'fix', description: 'Fix things' },
          { name: 'break', description: 'Break things' }
        ]
      }]
    },
    {
      handlers: {
        users: {
          show: echoArgsHandler,
          list: echoArgsHandler
        },
        util: {
          fix: echoArgsHandler,
          break: echoArgsHandler
        }
      }
    }
  )
  t.deepEqual(response.positional.commands, ['users', 'list'])
  t.deepEqual(response.args, { foo: 'bar2' })
})

test('runs with string option', async t => {
  t.plan(1)
  const { response } = await testCli(
    'node example-app --foo bar',
    {
      options: [{
        name: 'foo',
        type: 'string'
      }]
    },
    { handlers: echoArgsHandler }
  )
  t.deepEqual(response.args, { foo: 'bar' })
})

test('runs with string option with default', async t => {
  t.plan(1)
  const { response } = await testCli(
    'node example-app',
    {
      options: [{
        name: 'foo',
        type: 'string',
        default: 'buff'
      }]
    },
    { handlers: echoArgsHandler }
  )
  t.deepEqual(response.args, { foo: 'buff' })
})

test('runs with boolean option', async t => {
  t.plan(1)
  const { response } = await testCli(
    'node example-app --foo',
    {
      options: [{
        name: 'foo',
        type: 'boolean'
      }]
    },
    { handlers: echoArgsHandler }
  )
  t.deepEqual(response.args, { foo: true })
})

test('runs with omitted boolean option', async t => {
  t.plan(1)
  const { response } = await testCli(
    'node example-app',
    {
      options: [{
        name: 'foo',
        type: 'boolean'
      }]
    },
    { handlers: echoArgsHandler }
  )
  t.deepEqual(response.args, { foo: false })
})

test('runs with omitted boolean option with default', async t => {
  t.plan(1)
  const { response } = await testCli(
    'node example-app',
    {
      options: [{
        name: 'foo',
        type: 'boolean',
        default: true
      }]
    },
    { handlers: echoArgsHandler }
  )
  t.deepEqual(response.args, { foo: true })
})

test('runs with negative boolean option', async t => {
  t.plan(1)
  const { response } = await testCli(
    'node example-app --no-foo',
    {
      options: [{
        name: 'foo',
        type: 'boolean'
      }]
    },
    { handlers: echoArgsHandler }
  )
  t.deepEqual(response.args, { foo: false })
})

test('shows help on error', async t => {
  t.plan(2)
  const { exitCode, output } = await testCli(
    'node example-app',
    {
      groups: [{
        name: 'users',
        label: 'Users',
        commands: [
          { name: 'show', description: 'Show user' },
          {
            name: 'list',
            description: 'List users',
            options: [{
              name: 'foo',
              type: 'string'
            }]
          }
        ]
      }, {
        name: 'util',
        label: 'Utilities',
        commands: [
          { name: 'fix', description: 'Fix things' },
          { name: 'break', description: 'Break things' }
        ]
      }]
    }, {
      handlers: {
        users: {
          show: echoArgsHandler,
          list: echoArgsHandler
        },
        util: {
          fix: echoArgsHandler,
          break: echoArgsHandler
        }
      }
    }
  )
  const expected = dedent`
  Usage: example-app <group> <command> [options]

  Commands
    Users
      example-app users show  Show user
      example-app users list  List users
    Utilities
      example-app util fix    Fix things
      example-app util break  Break things

  Option
    --help  Show usage

  Errors
    \`group\` argument is required
    \`command\` argument is required
  `
  t.is(output, expected)
  t.is(exitCode, 1)
})

test('shows help', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app --help',
    {},
    { handlers: echoArgsHandler }
  )
  const expected = dedent`
  Usage: example-app [options]

  Option
    --help  Show usage `

  t.is(expected, output)
  t.is(exitCode, 1)
})

test('shows help with commands', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app --help',
    {
      commands: [
        { name: 'show', description: 'Show things' },
        { name: 'list', description: 'List things' }
      ]
    },
    {
      show: echoArgsHandler,
      list: echoArgsHandler
    }
  )
  const expected = dedent`
  Usage: example-app <command> [options]

  Commands
    example-app show  Show things
    example-app list  List things

  Option
    --help  Show usage
  `
  t.is(expected, output)
  t.is(exitCode, 1)
})

test('shows help with command groups', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app --help',
    {
      groups: [{
        name: 'users',
        label: 'Users',
        commands: [
          { name: 'show', description: 'Show user' },
          {
            name: 'list',
            description: 'List users',
            options: [{
              name: 'foo',
              type: 'string'
            }]
          }
        ]
      }, {
        name: 'util',
        label: 'Utilities',
        commands: [
          { name: 'fix', description: 'Fix things' },
          { name: 'break', description: 'Break things' }
        ]
      }]
    }, {
      handlers: {
        users: {
          show: echoArgsHandler,
          list: echoArgsHandler
        },
        util: {
          fix: echoArgsHandler,
          break: echoArgsHandler
        }
      }
    }
  )
  const expected = dedent`
  Usage: example-app <group> <command> [options]

  Commands
    Users
      example-app users show  Show user
      example-app users list  List users
    Utilities
      example-app util fix    Fix things
      example-app util break  Break things

  Option
    --help  Show usage
  `
  t.is(expected, output)
  t.is(exitCode, 1)
})

test('shows help for specific command group', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app users --help',
    {
      groups: [{
        name: 'users',
        label: 'Users',
        commands: [
          { name: 'show', description: 'Show user' },
          {
            name: 'list',
            description: 'List users',
            options: [{
              name: 'foo',
              type: 'string'
            }]
          }
        ]
      }, {
        name: 'util',
        label: 'Utilities',
        commands: [
          { name: 'fix', description: 'Fix things' },
          { name: 'break', description: 'Break things' }
        ]
      }]
    }, {
      handlers: {
        users: {
          show: echoArgsHandler,
          list: echoArgsHandler
        },
        util: {
          fix: echoArgsHandler,
          break: echoArgsHandler
        }
      }
    }
  )
  const expected = dedent`
  Usage: example-app users <command> [options]

  Commands
    Users
      example-app users show  Show user
      example-app users list  List users

  Option
    --help  Show usage
  `
  t.is(expected, output)
  t.is(exitCode, 1)
})

test('shows help for specific command in command group', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app users show --help',
    {
      groups: [{
        name: 'users',
        label: 'Users',
        commands: [
          { name: 'show', description: 'Show user' },
          {
            name: 'list',
            description: 'List users',
            options: [{
              name: 'foo',
              type: 'string'
            }]
          }
        ]
      }, {
        name: 'util',
        label: 'Utilities',
        commands: [
          { name: 'fix', description: 'Fix things' },
          { name: 'break', description: 'Break things' }
        ]
      }]
    }, {
      handlers: {
        users: {
          show: echoArgsHandler,
          list: echoArgsHandler
        },
        util: {
          fix: echoArgsHandler,
          break: echoArgsHandler
        }
      }
    }
  )
  const expected = dedent`
  Usage: example-app users show [options]

  Commands
    Users
      example-app users show  Show user
      example-app users list  List users

  Option
    --help  Show usage
  `
  t.is(expected, output)
  t.is(exitCode, 1)
})

test('runs default command', async t => {
  t.plan(2)
  const { response } = await testCli(
    'node example-app',
    {
      defaultCommand: 'show',
      commands: [
        { name: 'show', description: 'Show things' },
        { name: 'list', description: 'List things' }
      ]
    },
    {
      handlers: {
        show: echoArgsHandler,
        list: echoArgsHandler
      }
    }
  )
  t.deepEqual(response.args, {})
  t.deepEqual(response.positional, { commands: ['show'] })
})

test('runs default command in group', async t => {
  t.plan(2)
  const { response } = await testCli(
    'node example-app util',
    {
      groups: [{
        name: 'users',
        label: 'Users',
        commands: [
          { name: 'show', description: 'Show user' },
          { name: 'list', description: 'List users' }
        ]
      }, {
        name: 'util',
        label: 'Utilities',
        defaultCommand: 'break',
        commands: [
          { name: 'fix', description: 'Fix things' },
          { name: 'break', description: 'Break things' }
        ]
      }]
    }, {
      handlers: {
        users: {
          show: echoArgsHandler,
          list: echoArgsHandler
        },
        util: {
          fix: echoArgsHandler,
          break: echoArgsHandler
        }
      }
    }
  )
  t.deepEqual(response.args, {})
  t.deepEqual(response.positional, { commands: ['util', 'break'] })
})

test('runs command in default group', async t => {
  t.plan(2)
  const { response } = await testCli(
    'node example-app break',
    {
      defaultGroup: 'util',
      groups: [{
        name: 'users',
        label: 'Users',
        commands: [
          { name: 'show', description: 'Show user' },
          { name: 'list', description: 'List users' }
        ]
      }, {
        name: 'util',
        label: 'Utilities',
        defaultCommand: 'break',
        commands: [
          { name: 'fix', description: 'Fix things' },
          { name: 'break', description: 'Break things' }
        ]
      }]
    }, {
      handlers: {
        users: {
          show: echoArgsHandler,
          list: echoArgsHandler
        },
        util: {
          fix: echoArgsHandler,
          break: echoArgsHandler
        }
      }
    }
  )
  t.deepEqual(response.args, {})
  t.deepEqual(response.positional, { commands: ['util', 'break'] })
})

test('runs default command in default group', async t => {
  t.plan(2)
  const { response } = await testCli(
    'node example-app',
    {
      defaultGroup: 'users',
      groups: [{
        name: 'users',
        label: 'Users',
        defaultCommand: 'list',
        commands: [
          { name: 'show', description: 'Show user' },
          { name: 'list', description: 'List users' }
        ]
      }, {
        name: 'util',
        label: 'Utilities',
        commands: [
          { name: 'fix', description: 'Fix things' },
          { name: 'break', description: 'Break things' }
        ]
      }]
    }, {
      handlers: {
        users: {
          show: echoArgsHandler,
          list: echoArgsHandler
        },
        util: {
          fix: echoArgsHandler,
          break: echoArgsHandler
        }
      }
    }
  )
  t.deepEqual(response.args, {})
  t.deepEqual(response.positional, { commands: ['users', 'list'] })
})

test('errors when handler throws error', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app foo',
    {},
    { handlers: () => { throw new Error('Everything is ruined!') } }
  )
  const expected = dedent`
  Usage: example-app [options]

  Option
    --help  Show usage

  Error
    Everything is ruined!
  `
  t.is(expected, output)
  t.is(exitCode, 1)
})

test('errors given non-existent command', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app foo',
    {
      commands: [
        { name: 'show', description: 'Show things' },
        { name: 'list', description: 'List things' }
      ],
    },
    {
      show: echoArgsHandler,
      list: echoArgsHandler
    }
  )

  const expected = dedent`
  Usage: example-app <command> [options]

  Commands
    example-app show  Show things
    example-app list  List things

  Option
    --help  Show usage

  Error
    \`foo\` command does not exist
  `
  t.is(output, expected)
  t.is(exitCode, 1)
})

test('errors given non-existent command in command group', async t => {
  const { output, exitCode } = await testCli(
    'node example-app users foo',
    {
      groups: [{
        name: 'users',
        label: 'Users',
        defaultCommand: 'list',
        commands: [
          { name: 'show', description: 'Show user' },
          { name: 'list', description: 'List users' }
        ]
      }, {
        name: 'util',
        label: 'Utilities',
        commands: [
          { name: 'fix', description: 'Fix things' },
          { name: 'break', description: 'Break things' }
        ]
      }]
    }, {
      handlers: {
        users: {
          show: echoArgsHandler,
          list: echoArgsHandler
        },
        util: {
          fix: echoArgsHandler,
          break: echoArgsHandler
        }
      }
    }
  )

  const expected = dedent`
  Usage: example-app <group> <command> [options]

  Commands
    Users
      example-app users show  Show user
      example-app users list  List users

  Option
    --help  Show usage

  Error
    \`foo\` command does not exist in \`users\` group
  `

  t.is(output, expected)
  t.is(exitCode, 1)
})

test('errors given non-existent group', async t => {
  t.plan(4)
  const config = {
    groups: [{
      name: 'users',
      label: 'Users',
      defaultCommand: 'list',
      commands: [
        { name: 'show', description: 'Show user' },
        { name: 'list', description: 'List users' }
      ]
    }, {
      name: 'util',
      label: 'Utilities',
      commands: [
        { name: 'fix', description: 'Fix things' },
        { name: 'break', description: 'Break things' }
      ]
    }]
  }
  const handlers = {
    users: {
      show: echoArgsHandler,
      list: echoArgsHandler
    },
    util: {
      fix: echoArgsHandler,
      break: echoArgsHandler
    }
  }

  const { output: output1, exitCode: exitCode1 } = await testCli(
    'node example-app fooz',
    config,
    { handlers }
  )

  const expected1 = dedent`
  Usage: example-app <group> <command> [options]

  Commands
    Users
      example-app users show  Show user
      example-app users list  List users
    Utilities
      example-app util fix    Fix things
      example-app util break  Break things

  Option
    --help  Show usage

  Error
    \`fooz\` group does not exist
  `

  t.is(output1, expected1)
  t.is(exitCode1, 1)

  const { output: output2, exitCode: exitCode2 } = await testCli(
    'node example-app fooz barz',
    config,
    { handlers }
  )

  const expected2 = dedent`
  Usage: example-app <group> <command> [options]

  Commands
    Users
      example-app users show  Show user
      example-app users list  List users
    Utilities
      example-app util fix    Fix things
      example-app util break  Break things

  Option
    --help  Show usage

  Error
    \`fooz\` group does not exist
  `

  t.is(output2, expected2)
  t.is(exitCode2, 1)
})

test('errors when command is missing', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app',
    {
      commands: [
        { name: 'show', description: 'Show things' },
        { name: 'list', description: 'List things' }
      ],
    },
    {
      show: echoArgsHandler,
      list: echoArgsHandler
    }
  )

  const expected = dedent`
  Usage: example-app <command> [options]

  Commands
    example-app show  Show things
    example-app list  List things

  Option
    --help  Show usage

  Error
    \`command\` argument is required
  `
  t.is(output, expected)
  t.is(exitCode, 1)
})

test('errors when command group is missing', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app',
    {
      groups: [{
        name: 'users',
        label: 'Users',
        defaultCommand: 'list',
        commands: [
          { name: 'show', description: 'Show user' },
          { name: 'list', description: 'List users' }
        ]
      }, {
        name: 'util',
        label: 'Utilities',
        commands: [
          { name: 'fix', description: 'Fix things' },
          { name: 'break', description: 'Break things' }
        ]
      }]
    }, {
      handlers: {
        users: {
          show: echoArgsHandler,
          list: echoArgsHandler
        },
        util: {
          fix: echoArgsHandler,
          break: echoArgsHandler
        }
      }
    }
  )

  const expected = dedent`
  Usage: example-app <group> <command> [options]

  Commands
    Users
      example-app users show  Show user
      example-app users list  List users
    Utilities
      example-app util fix    Fix things
      example-app util break  Break things

  Option
    --help  Show usage

  Errors
    \`group\` argument is required
    \`command\` argument is required
  `
  t.is(output, expected)
  t.is(exitCode, 1)
})

test('shows help with default command', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app --help',
    {
      defaultCommand: 'show',
      commands: [
        { name: 'show', description: 'Show things' },
        { name: 'list', description: 'List things' }
      ]
    },
    {
      show: echoArgsHandler,
      list: echoArgsHandler
    }
  )

  const expected = dedent`
  Usage: example-app <command> [options]

  Commands
    example-app show  Show things (default)
    example-app list  List things

  Option
    --help  Show usage
  `
  t.is(output, expected)
  t.is(exitCode, 1)
})

test('shows help with default command group', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app --help',
    {
      defaultGroup: 'util',
      groups: [{
        name: 'users',
        label: 'Users',
        commands: [
          { name: 'show', description: 'Show user' },
          { name: 'list', description: 'List users' }
        ]
      }, {
        name: 'util',
        label: 'Utilities',
        commands: [
          { name: 'fix', description: 'Fix things' },
          { name: 'break', description: 'Break things' }
        ]
      }]
    }, {
      handlers: {
        users: {
          show: echoArgsHandler,
          list: echoArgsHandler
        },
        util: {
          fix: echoArgsHandler,
          break: echoArgsHandler
        }
      }
    }
  )

  const expected = dedent`
  Usage: example-app <group> <command> [options]

  Commands
    Base
      example-app fix    Fix things
      example-app break  Break things
    Users
      example-app users show  Show user
      example-app users list  List users

  Option
    --help  Show usage
  `
  t.is(output, expected)
  t.is(exitCode, 1)
})

test('shows help with description', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app --help',
    { description: 'An example app' },
    { handlers: echoArgsHandler }
  )
  const expected = dedent`
  Usage: example-app [options]

  An example app

  Option
    --help  Show usage `

  t.is(expected, output)
  t.is(exitCode, 1)
})

test('errors when required option is missing', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app',
    {
      description: 'An example app',
      options: [{
        name: 'foo',
        type: 'string',
        description: 'Name of foo',
        required: true
      }]
    },
    { handlers: echoArgsHandler }
  )
  const expected = dedent`
  Usage: example-app [options]

  An example app

  Options
    --foo   Name of foo
    --help  Show usage

  Error
    \`foo\` option is required
  `
  t.is(exitCode, 1)
  t.is(expected, output)
})

test('errors when option value is missing', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app --foo',
    {
      description: 'An example app',
      options: [{
        name: 'foo',
        type: 'string',
        description: 'Name of foo',
        required: true
      }]
    },
    { handlers: echoArgsHandler }
  )
  const expected = dedent`
  Usage: example-app [options]

  An example app

  Options
    --foo   Name of foo
    --help  Show usage

  Error
    \`foo\` option requires a value
  `
  t.is(exitCode, 1)
  t.is(expected, output)
})

test('errors when multiple option values are missing', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app --foo --bar',
    {
      description: 'An example app',
      options: [
        {
          name: 'foo',
          type: 'string',
          description: 'Name of foo',
          required: true
        },
        {
          name: 'bar',
          type: 'string',
          description: 'Name of bar',
          required: true
        }
      ]
    },
    { handlers: echoArgsHandler }
  )
  const expected = dedent`
  Usage: example-app [options]

  An example app

  Options
    --foo   Name of foo
    --bar   Name of bar
    --help  Show usage

  Errors
    \`foo\` option requires a value
    \`bar\` option requires a value
  `
  t.is(exitCode, 1)
  t.is(expected, output)
})

test('errors when multiple required options are missing', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app',
    {
      description: 'An example app',
      options: [
        {
          name: 'foo',
          type: 'string',
          description: 'Name of foo',
          required: true
        },
        {
          name: 'bar',
          type: 'string',
          description: 'Name of bar',
          required: true
        }
      ]
    },
    { handlers: echoArgsHandler }
  )
  const expected = dedent`
  Usage: example-app [options]

  An example app

  Options
    --foo   Name of foo
    --bar   Name of bar
    --help  Show usage

  Errors
    \`foo\` option is required
    \`bar\` option is required
  `
  t.is(exitCode, 1)
  t.is(expected, output)
})

test('errors given a non-existent option', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app --moof miff',
    {
      description: 'An example app',
      options: [{
        name: 'foo',
        type: 'string',
        description: 'Name of foo',
        required: true
      }]
    },
    { handlers: echoArgsHandler }
  )
  const expected = dedent`
  Usage: example-app [options]

  An example app

  Options
    --foo   Name of foo
    --help  Show usage

  Error
    \`moof\` option does not exist
  `
  t.is(exitCode, 1)
  t.is(expected, output)
})

test('errors given multiple non-existent options', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app --moof miff --doof diff',
    {
      description: 'An example app',
      options: [{
        name: 'foo',
        type: 'string',
        description: 'Name of foo',
        required: true
      }]
    },
    { handlers: echoArgsHandler }
  )
  const expected = dedent`
  Usage: example-app [options]

  An example app

  Options
    --foo   Name of foo
    --help  Show usage

  Errors
    \`doof\` option does not exist
    \`moof\` option does not exist
  `
  t.is(exitCode, 1)
  t.is(expected, output)
})

test('errors when required option is missing for command', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app show',
    {
      description: 'An example app',
      commands: [
        {
          name: 'show',
          description: 'Show things',
          options: [{
            name: 'foo',
            type: 'string',
            description: 'Name of foo',
            required: true
          }]
        }
      ]
    },
    { handlers: echoArgsHandler }
  )
  const expected = dedent`
  Usage: example-app show [options]

  An example app

  Command
    example-app show  Show things

  Options
    --foo   Name of foo
    --help  Show usage

  Error
    \`foo\` option is required
  `
  t.is(exitCode, 1)
  t.is(expected, output)
})

test('errors when option value is missing for command', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app show --foo',
    {
      description: 'An example app',
      commands: [
        {
          name: 'show',
          description: 'Show things',
          options: [{
            name: 'foo',
            type: 'string',
            description: 'Name of foo'
          }]
        }
      ]
    },
    { handlers: echoArgsHandler }
  )
  const expected = dedent`
  Usage: example-app show [options]

  An example app

  Command
    example-app show  Show things

  Options
    --foo   Name of foo
    --help  Show usage

  Error
    \`foo\` option requires a value
  `
  t.is(exitCode, 1)
  t.is(expected, output)
})

test('errors when multiple option values are missing for command', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app show --foo --bar',
    {
      description: 'An example app',
      commands: [
        {
          name: 'show',
          description: 'Show things',
          options: [
            {
              name: 'foo',
              type: 'string',
              description: 'Name of foo'
            },
            {
              name: 'bar',
              type: 'string',
              description: 'Name of bar'
            }
          ]
        }
      ]
    },
    { handlers: echoArgsHandler }
  )
  const expected = dedent`
  Usage: example-app show [options]

  An example app

  Command
    example-app show  Show things

  Options
    --foo   Name of foo
    --bar   Name of bar
    --help  Show usage

  Errors
    \`foo\` option requires a value
    \`bar\` option requires a value
  `
  t.is(exitCode, 1)
  t.is(expected, output)
})

test('errors given a non-existent option for command', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app show --zoo',
    {
      description: 'An example app',
      commands: [
        {
          name: 'show',
          description: 'Show things',
          options: [{
            name: 'foo',
            type: 'string',
            description: 'Name of foo'
          }]
        }
      ]
    },
    { handlers: echoArgsHandler }
  )
  const expected = dedent`
  Usage: example-app show [options]

  An example app

  Command
    example-app show  Show things

  Options
    --foo   Name of foo
    --help  Show usage

  Error
    \`zoo\` option does not exist
  `
  t.is(exitCode, 1)
  t.is(expected, output)
})

test('errors when multiple required options are missing for command', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app show',
    {
      description: 'An example app',
      commands: [
        {
          name: 'show',
          description: 'Show things',
          options: [
            {
              name: 'foo',
              type: 'string',
              description: 'Name of foo',
              required: true
            },
            {
              name: 'bar',
              type: 'string',
              description: 'Name of bar',
              required: true
            }
          ]
        }
      ]
    },
    { handlers: echoArgsHandler }
  )
  const expected = dedent`
  Usage: example-app show [options]

  An example app

  Command
    example-app show  Show things

  Options
    --foo   Name of foo
    --bar   Name of bar
    --help  Show usage

  Errors
    \`foo\` option is required
    \`bar\` option is required
  `
  t.is(exitCode, 1)
  t.is(expected, output)
})

test('errors when required option is missing for command in command group', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app users show',
    {
      description: 'An example app',
      groups: [{
        name: 'users',
        label: 'Users',
        commands: [
          {
            name: 'show',
            description: 'Show user',
            options: [
              {
                name: 'foo',
                type: 'string',
                description: 'Name of foo',
                required: true
              }
            ]
          },
          { name: 'list', description: 'List users' }
        ]
      }, {
        name: 'util',
        label: 'Utilities',
        commands: [
          { name: 'fix', description: 'Fix things' },
          { name: 'break', description: 'Break things' }
        ]
      }]
    },
    { handlers: echoArgsHandler }
  )
  const expected = dedent`
  Usage: example-app users show [options]

  An example app

  Commands
    Users
      example-app users show  Show user
      example-app users list  List users

  Options
    --foo   Name of foo
    --help  Show usage

  Error
    \`foo\` option is required
  `
  t.is(exitCode, 1)
  t.is(expected, output)
})

test('errors when option value is missing for command in command group', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app users show --foo',
    {
      description: 'An example app',
      groups: [{
        name: 'users',
        label: 'Users',
        commands: [
          {
            name: 'show',
            description: 'Show user',
            options: [
              {
                name: 'foo',
                type: 'string',
                description: 'Name of foo',
                required: true
              }
            ]
          },
          { name: 'list', description: 'List users' }
        ]
      }, {
        name: 'util',
        label: 'Utilities',
        commands: [
          { name: 'fix', description: 'Fix things' },
          { name: 'break', description: 'Break things' }
        ]
      }]
    },
    { handlers: echoArgsHandler }
  )
  const expected = dedent`
  Usage: example-app users show [options]

  An example app

  Commands
    Users
      example-app users show  Show user
      example-app users list  List users

  Options
    --foo   Name of foo
    --help  Show usage

  Error
    \`foo\` option requires a value
  `
  t.is(exitCode, 1)
  t.is(expected, output)
})

test('errors when multiple option values are missing for command in command group', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app users show --foo --bar',
    {
      description: 'An example app',
      groups: [{
        name: 'users',
        label: 'Users',
        commands: [
          {
            name: 'show',
            description: 'Show user',
            options: [
              {
                name: 'foo',
                type: 'string',
                description: 'Name of foo',
                required: true
              },
              {
                name: 'bar',
                type: 'string',
                description: 'Name of bar',
                required: true
              }
            ]
          },
          { name: 'list', description: 'List users' }
        ]
      }, {
        name: 'util',
        label: 'Utilities',
        commands: [
          { name: 'fix', description: 'Fix things' },
          { name: 'break', description: 'Break things' }
        ]
      }]
    },
    { handlers: echoArgsHandler }
  )
  const expected = dedent`
  Usage: example-app users show [options]

  An example app

  Commands
    Users
      example-app users show  Show user
      example-app users list  List users

  Options
    --foo   Name of foo
    --bar   Name of bar
    --help  Show usage

  Errors
    \`foo\` option requires a value
    \`bar\` option requires a value
  `
  t.is(exitCode, 1)
  t.is(expected, output)
})

test('errors given a non-existent option for command in command group', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app users show --zoo',
    {
      description: 'An example app',
      groups: [{
        name: 'users',
        label: 'Users',
        commands: [
          {
            name: 'show',
            description: 'Show user',
            options: [
              {
                name: 'foo',
                type: 'string',
                description: 'Name of foo',
                required: true
              }
            ]
          },
          { name: 'list', description: 'List users' }
        ]
      }, {
        name: 'util',
        label: 'Utilities',
        commands: [
          { name: 'fix', description: 'Fix things' },
          { name: 'break', description: 'Break things' }
        ]
      }]
    },
    { handlers: echoArgsHandler }
  )
  const expected = dedent`
  Usage: example-app users show [options]

  An example app

  Commands
    Users
      example-app users show  Show user
      example-app users list  List users

  Options
    --foo   Name of foo
    --help  Show usage

  Error
    \`zoo\` option does not exist
  `
  t.is(exitCode, 1)
  t.is(expected, output)
})

test('errors when multiple required options are missing for command in command group', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app users show',
    {
      description: 'An example app',
      groups: [{
        name: 'users',
        label: 'Users',
        commands: [
          {
            name: 'show',
            description: 'Show user',
            options: [
              {
                name: 'foo',
                type: 'string',
                description: 'Name of foo',
                required: true
              },
              {
                name: 'bar',
                type: 'string',
                description: 'Name of bar',
                required: true
              }
            ]
          },
          { name: 'list', description: 'List users' }
        ]
      }, {
        name: 'util',
        label: 'Utilities',
        commands: [
          { name: 'fix', description: 'Fix things' },
          { name: 'break', description: 'Break things' }
        ]
      }]
    },
    { handlers: echoArgsHandler }
  )

  const expected = dedent`
  Usage: example-app users show [options]

  An example app

  Commands
    Users
      example-app users show  Show user
      example-app users list  List users

  Options
    --foo   Name of foo
    --bar   Name of bar
    --help  Show usage

  Errors
    \`foo\` option is required
    \`bar\` option is required
  `
  t.is(exitCode, 1)
  t.is(expected, output)
})

test.todo('shows help with long descriptions and names')

test.todo('accepts input from config file')

test.todo('configures via object')

test.todo('configures via json file')

test.todo('configures via yaml file')

test.todo('configures via json string')

test.todo('configures via yaml string')

test.todo('shows help with hidden commands')

test.todo('shows help with hidden options')

test.todo('shows help with hidden commands in command group')

test.todo('shows help with hidden options in command group')

test.todo('runs with positional arguments')

test.todo('runs with optional positional arguments')

test.todo('shows help with positional arguments')

test.todo('shows help with optional positional arguments')

test.todo('shows help with epilogue')

test.todo('shows help with examples')

test.todo('shows help with epilogue in command group')

test.todo('shows help with examples in command group')

test.todo('accepts input from environment based on prefix')

test.todo('accepts input from environment based on name')

test.todo('shows app version')

test.todo('shows recommended commands')

test.todo('shows completion script')
