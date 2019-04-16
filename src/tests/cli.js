import test from 'ava'
import dedent from 'dedent'
const { testCli } = require('./_helpers.js')
const { spawn } = require('child-process-promise')

const echoArgsHandler = (args, positional) => ({ args, positional })

const getOutput = stream => new Promise(resolve => {
  const chunks = []
  stream.on('data', chunk => chunks.push(chunk))
  stream.on('end', () => resolve(chunks.join('')))
})

test('runs', async t => {
  t.plan(1)
  const { response } =
    await testCli('node example-app', { handlers: echoArgsHandler })
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
      ],
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
      ],
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
          options: [{ name: 'foo' }]
        }
      ]
    }, {
      name: 'util',
      label: 'Utilities',
      commands: [
        { name: 'fix', description: 'Fix things' },
        { name: 'break', description: 'Break things' }
      ]
    }],
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
  const { response: response1 } = await testCli(
    'node example-app users show',
    config
  )
  t.deepEqual(response1.args, {})
  t.deepEqual(response1.positional.commands, ['users', 'show'])

  const { response: response2 } = await testCli(
    'node example-app util break',
    config
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
          options: [{ name: 'foo' }]
        }
      ],
      handlers: echoArgsHandler
    }
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
            options: [{ name: 'foo' }]
          }
        ]
      }, {
        name: 'util',
        label: 'Utilities',
        commands: [
          { name: 'fix', description: 'Fix things' },
          { name: 'break', description: 'Break things' }
        ]
      }],
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
      options: [{ name: 'foo' }],
      handlers: echoArgsHandler
    }
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
        default: 'buff'
      }],
      handlers: echoArgsHandler
    }
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
      }],
      handlers: echoArgsHandler
    }
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
      }],
      handlers: echoArgsHandler
    }
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
      }],
      handlers: echoArgsHandler
    }
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
      }],
      handlers: echoArgsHandler
    }
  )
  t.deepEqual(response.args, { foo: false })
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
      ],
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
      }],
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
      }],
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
      }],
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

test('shows app version', async t => {
  t.plan(1)
  try {
    const response = spawn(
      './examples/single-command/cli.js',
      ['--version']
    )
    const output = await getOutput(response.childProcess.stdout)
    await response
    t.is(output.trim(), '0.0.0')
  } catch (error) {
    t.fail()
  }
})

test('shows help', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app --help',
    { handlers: echoArgsHandler }
  )
  const expected = dedent`
  Usage: example-app [options]

  Options
    --help     Show usage
    --version  Show version
  `
  t.is(expected, output)
  t.is(exitCode, 1)
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
            options: [{ name: 'foo' }]
          }
        ]
      }, {
        name: 'util',
        label: 'Utilities',
        commands: [
          { name: 'fix', description: 'Fix things' },
          { name: 'break', description: 'Break things' }
        ]
      }],
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

  Options
    --help     Show usage
    --version  Show version

  Errors
    \`group\` argument is required
    \`command\` argument is required
  `
  t.is(output, expected)
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
      ],
      handlers: {
        show: echoArgsHandler,
        list: echoArgsHandler
      }
    }
  )
  const expected = dedent`
  Usage: example-app <command> [options]

  Commands
    example-app show  Show things
    example-app list  List things

  Options
    --help     Show usage
    --version  Show version
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
            options: [{ name: 'foo' }]
          }
        ]
      }, {
        name: 'util',
        label: 'Utilities',
        commands: [
          { name: 'fix', description: 'Fix things' },
          { name: 'break', description: 'Break things' }
        ]
      }],
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

  Options
    --help     Show usage
    --version  Show version
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
            options: [{ name: 'foo' }]
          }
        ]
      }, {
        name: 'util',
        label: 'Utilities',
        commands: [
          { name: 'fix', description: 'Fix things' },
          { name: 'break', description: 'Break things' }
        ]
      }],
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

  Options
    --help     Show usage
    --version  Show version
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
            options: [{ name: 'foo' }]
          }
        ]
      }, {
        name: 'util',
        label: 'Utilities',
        commands: [
          { name: 'fix', description: 'Fix things' },
          { name: 'break', description: 'Break things' }
        ]
      }],
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

  Options
    --help     Show usage
    --version  Show version
  `
  t.is(expected, output)
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
      ],
      handlers: {
        show: echoArgsHandler,
        list: echoArgsHandler
      }
    }
  )

  const expected = dedent`
  Usage: example-app <command> [options]

  Commands
    example-app show  Show things (default)
    example-app list  List things

  Options
    --help     Show usage
    --version  Show version
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
      }],
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

  Options
    --help     Show usage
    --version  Show version
  `
  t.is(output, expected)
  t.is(exitCode, 1)
})

test('shows help with description', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app --help',
    {
      handlers: echoArgsHandler,
      description: 'An example app'
    }
  )
  const expected = dedent`
  Usage: example-app [options]

  An example app

  Options
    --help     Show usage
    --version  Show version
  `
  t.is(expected, output)
  t.is(exitCode, 1)
})

test('errors when handler throws error', async t => {
  t.plan(2)
  const { output, exitCode } = await testCli(
    'node example-app foo',
    { handlers: () => { throw new Error('Everything is ruined!') } }
  )
  const expected = dedent`
  Usage: example-app [options]

  Options
    --help     Show usage
    --version  Show version

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
      handlers: {
        show: echoArgsHandler,
        list: echoArgsHandler
      }
    }
  )

  const expected = dedent`
  Usage: example-app <command> [options]

  Commands
    example-app show  Show things
    example-app list  List things

  Options
    --help     Show usage
    --version  Show version

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
      }],
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

  Options
    --help     Show usage
    --version  Show version

  Error
    \`foo\` command does not exist in \`users\` group
  `

  t.is(output, expected)
  t.is(exitCode, 1)
})

test('errors given non-existent group', async t => {
  t.plan(4)

  const { output: output1, exitCode: exitCode1 } = await testCli(
    'node example-app fooz',
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
      }],
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

  const expected1 = dedent`
  Usage: example-app <group> <command> [options]

  Commands
    Users
      example-app users show  Show user
      example-app users list  List users
    Utilities
      example-app util fix    Fix things
      example-app util break  Break things

  Options
    --help     Show usage
    --version  Show version

  Error
    \`fooz\` group does not exist
  `

  t.is(output1, expected1)
  t.is(exitCode1, 1)

  const { output: output2, exitCode: exitCode2 } = await testCli(
    'node example-app fooz barz',
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
      }],
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

  const expected2 = dedent`
  Usage: example-app <group> <command> [options]

  Commands
    Users
      example-app users show  Show user
      example-app users list  List users
    Utilities
      example-app util fix    Fix things
      example-app util break  Break things

  Options
    --help     Show usage
    --version  Show version

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
      handlers: {
        show: echoArgsHandler,
        list: echoArgsHandler
      }
    }
  )

  const expected = dedent`
  Usage: example-app <command> [options]

  Commands
    example-app show  Show things
    example-app list  List things

  Options
    --help     Show usage
    --version  Show version

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
      }],
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

  Options
    --help     Show usage
    --version  Show version

  Errors
    \`group\` argument is required
    \`command\` argument is required
  `
  t.is(output, expected)
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
        description: 'Name of foo',
        required: true
      }],
      handlers: echoArgsHandler
    }
  )
  const expected = dedent`
  Usage: example-app [options]

  An example app

  Options
    --foo      Name of foo
    --help     Show usage
    --version  Show version

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
        description: 'Name of foo',
        required: true
      }],
      handlers: echoArgsHandler
    }
  )
  const expected = dedent`
  Usage: example-app [options]

  An example app

  Options
    --foo      Name of foo
    --help     Show usage
    --version  Show version

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
          description: 'Name of foo',
          required: true
        },
        {
          name: 'bar',
          description: 'Name of bar',
          required: true
        }
      ],
      handlers: echoArgsHandler
    }
  )
  const expected = dedent`
  Usage: example-app [options]

  An example app

  Options
    --foo      Name of foo
    --bar      Name of bar
    --help     Show usage
    --version  Show version

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
          description: 'Name of foo',
          required: true
        },
        {
          name: 'bar',
          description: 'Name of bar',
          required: true
        }
      ],
      handlers: echoArgsHandler
    }
  )
  const expected = dedent`
  Usage: example-app [options]

  An example app

  Options
    --foo      Name of foo
    --bar      Name of bar
    --help     Show usage
    --version  Show version

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
        description: 'Name of foo',
        required: true
      }],
      handlers: echoArgsHandler
    }
  )
  const expected = dedent`
  Usage: example-app [options]

  An example app

  Options
    --foo      Name of foo
    --help     Show usage
    --version  Show version

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
        description: 'Name of foo',
        required: true
      }],
      handlers: echoArgsHandler
    }
  )
  const expected = dedent`
  Usage: example-app [options]

  An example app

  Options
    --foo      Name of foo
    --help     Show usage
    --version  Show version

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
            description: 'Name of foo',
            required: true
          }]
        }
      ],
      handlers: echoArgsHandler
    }
  )
  const expected = dedent`
  Usage: example-app show [options]

  An example app

  Command
    example-app show  Show things

  Options
    --foo      Name of foo
    --help     Show usage
    --version  Show version

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
            description: 'Name of foo'
          }]
        }
      ],
      handlers: echoArgsHandler
    }
  )
  const expected = dedent`
  Usage: example-app show [options]

  An example app

  Command
    example-app show  Show things

  Options
    --foo      Name of foo
    --help     Show usage
    --version  Show version

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
              description: 'Name of foo'
            },
            {
              name: 'bar',
              description: 'Name of bar'
            }
          ]
        }
      ],
      handlers: echoArgsHandler
    }
  )
  const expected = dedent`
  Usage: example-app show [options]

  An example app

  Command
    example-app show  Show things

  Options
    --foo      Name of foo
    --bar      Name of bar
    --help     Show usage
    --version  Show version

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
            description: 'Name of foo'
          }]
        }
      ],
      handlers: echoArgsHandler
    }
  )
  const expected = dedent`
  Usage: example-app show [options]

  An example app

  Command
    example-app show  Show things

  Options
    --foo      Name of foo
    --help     Show usage
    --version  Show version

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
              description: 'Name of foo',
              required: true
            },
            {
              name: 'bar',
              description: 'Name of bar',
              required: true
            }
          ]
        }
      ],
      handlers: echoArgsHandler
    }
  )
  const expected = dedent`
  Usage: example-app show [options]

  An example app

  Command
    example-app show  Show things

  Options
    --foo      Name of foo
    --bar      Name of bar
    --help     Show usage
    --version  Show version

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
      }],
      handlers: echoArgsHandler
    }
  )
  const expected = dedent`
  Usage: example-app users show [options]

  An example app

  Commands
    Users
      example-app users show  Show user
      example-app users list  List users

  Options
    --foo      Name of foo
    --help     Show usage
    --version  Show version

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
      }],
      handlers: echoArgsHandler
    }
  )
  const expected = dedent`
  Usage: example-app users show [options]

  An example app

  Commands
    Users
      example-app users show  Show user
      example-app users list  List users

  Options
    --foo      Name of foo
    --help     Show usage
    --version  Show version

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
                description: 'Name of foo',
                required: true
              },
              {
                name: 'bar',
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
      }],
      handlers: echoArgsHandler
    }
  )
  const expected = dedent`
  Usage: example-app users show [options]

  An example app

  Commands
    Users
      example-app users show  Show user
      example-app users list  List users

  Options
    --foo      Name of foo
    --bar      Name of bar
    --help     Show usage
    --version  Show version

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
      }],
      handlers: echoArgsHandler
    }
  )
  const expected = dedent`
  Usage: example-app users show [options]

  An example app

  Commands
    Users
      example-app users show  Show user
      example-app users list  List users

  Options
    --foo      Name of foo
    --help     Show usage
    --version  Show version

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
                description: 'Name of foo',
                required: true
              },
              {
                name: 'bar',
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
      }],
      handlers: echoArgsHandler
    }
  )

  const expected = dedent`
  Usage: example-app users show [options]

  An example app

  Commands
    Users
      example-app users show  Show user
      example-app users list  List users

  Options
    --foo      Name of foo
    --bar      Name of bar
    --help     Show usage
    --version  Show version

  Errors
    \`foo\` option is required
    \`bar\` option is required
  `
  t.is(exitCode, 1)
  t.is(expected, output)
})

test('accepts option from environment based on prefix', async t => {
  t.plan(1)
  try {
    const response = spawn(
      './examples/single-command/cli.js',
      [],
      { env: { ...process.env, MY_CLI_NAME: 'foo from env' } }
    )
    const output = await getOutput(response.childProcess.stdout)
    await response
    t.is(output.trim(), 'single command: showing foo from env!')
  } catch (error) {
    t.fail()
  }
})

test('accepts command option from environment based on prefix', async t => {
  t.plan(2)
  try {
    const response1 = spawn(
      './examples/multiple-commands/cli.js',
      ['show'],
      { env: { ...process.env, MY_CLI_NAME: 'bar from env' } }
    )
    const output1 = await getOutput(response1.childProcess.stdout)
    await response1
    t.is(output1.trim(), 'multiple commands: showing bar from env!')

    const response2 = spawn(
      './examples/multiple-commands/cli.js',
      ['list']
    )
    const output2 = await getOutput(response2.childProcess.stdout)
    await response2
    t.is(output2.trim(), 'multiple commands: listing things!')
  } catch (error) {
    t.fail()
  }
})

test('accepts command option in command group from environment based on prefix', async t => {
  t.plan(1)
  try {
    const response1 = spawn(
      './examples/command-groups/cli.js',
      ['users', 'show'],
      { env: { ...process.env, MY_CLI_NAME: 'fuff from env' } }
    )
    const output1 = await getOutput(response1.childProcess.stdout)
    await response1
    t.is(output1.trim(), 'command groups: showing fuff from env user!')
  } catch (error) {
    t.fail()
  }
})

test('accepts option from environment based on name', async t => {
  t.plan(1)
  try {
    const response = spawn(
      './examples/single-command/cli.js',
      [],
      { env: { ...process.env, EXPLICIT_NAME: 'foo from env' } }
    )
    const output = await getOutput(response.childProcess.stdout)
    await response
    t.is(output.trim(), 'single command: showing foo from env!')
  } catch (error) {
    t.fail()
  }
})

test('accepts command option from environment based on name', async t => {
  t.plan(2)
  try {
    const response1 = spawn(
      './examples/multiple-commands/cli.js',
      ['show'],
      { env: { ...process.env, EXPLICIT_NAME: 'bar from env' } }
    )
    const output1 = await getOutput(response1.childProcess.stdout)
    await response1
    t.is(output1.trim(), 'multiple commands: showing bar from env!')

    const response2 = spawn(
      './examples/multiple-commands/cli.js',
      ['list']
    )
    const output2 = await getOutput(response2.childProcess.stdout)
    await response2
    t.is(output2.trim(), 'multiple commands: listing things!')
  } catch (error) {
    t.fail()
  }
})

test('accepts command option in command group from environment based on name', async t => {
  t.plan(1)
  try {
    const response1 = spawn(
      './examples/command-groups/cli.js',
      ['users', 'show'],
      { env: { ...process.env, EXPLICIT_NAME: 'fuff from env' } }
    )
    const output1 = await getOutput(response1.childProcess.stdout)
    await response1
    t.is(output1.trim(), 'command groups: showing fuff from env user!')
  } catch (error) {
    t.fail()
  }
})

test.todo('shows help with hidden commands')

test.todo('shows help with hidden command groups')

test.todo('shows help with hidden commands in command group')

test.todo('shows help with hidden option')

test.todo('shows help with hidden command option')

test.todo('shows help with hidden command option in command group')

test.todo('runs with positional arguments')

test.todo('runs with optional positional arguments')

test.todo('shows help with positional arguments')

test.todo('shows help with optional positional arguments')

test.todo('shows help with epilogue')

test.todo('shows help with examples')

test.todo('shows help with epilogue in command group')

test.todo('shows help with examples in command group')

test.todo('accepts input from config file')

test.todo('shows recommended commands')

test.todo('shows completion script')

test.todo('shows help with long descriptions and names')
