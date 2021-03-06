const { join } = require('path')
const has = require('lodash/has')
const omit = require('lodash/omit')
const difference = require('lodash/difference')
const camelCase = require('lodash/camelCase')
const flatten = require('lodash/flatten')
const partition = require('lodash/partition')
const isFunction = require('lodash/isFunction')
const configureShowUsage = require('./showUsage')

const invokeCommand = async (
  config,
  args,
  handler,
  appProcess,
  appConsole
) => {
  const { options, ...context } = args
  const systemNames = config.options
    .filter(o => o.system)
    .map(o => o.name)
  return handler(omit(options, systemNames), context)
}

// TODO this function has grown into a pile. It would be good to break it up
// into sane "stages". E.g. 1) accumulate full context 2) reduce down to
// smaller, directly useful, context
const parseInput = (config, { env, argv }) => {
  let commands = []
  const inputOptions = {}
  const [negArgs, posArgs] =
    partition(argv.slice(2), a => a.startsWith('--no-'))
  const args = [
    ...posArgs,
    ...flatten(negArgs.map(n => [`--${n.slice(5)}`, false]))
  ]

  while (true) {
    const arg = args.pop()
    if (!arg) break
    if (arg.startsWith('-')) {
      inputOptions[camelCase(arg)] = undefined
    } else {
      const previousArg = args[args.length - 1]
      if (previousArg && previousArg.startsWith('-')) {
        inputOptions[camelCase(previousArg)] = arg
        args.pop()
      } else {
        commands = [arg, ...commands]
      }
    }
  }

  // Build up a list of possible options and include common items such
  // as `--help` and `--version`
  const appOptions = findActiveOptions(
    config,
    { commands, options: inputOptions }
  )

  const envOptions = parseEnvironment(config, appOptions, env)
  const appArgs = {
    commands,
    options: {
      ...envOptions,
      ...inputOptions
    }
  }

  const options = [ ...appOptions, ...systemOptions ]

  // Build a list of expected positional items.
  // TODO support additional positional items after group/command
  const positional = config.groups
    ? [{ name: 'group' }, { name: 'command' }]
    : config.commands ? [{ name: 'command' }] : []

  const appConfig = { ...config, positional, options }

  return { config: appConfig, args: appArgs }
}

const validateInputs = (config, args) => {
  const errors = []
  if (config.groups) {
    const groupName = args.commands[0]
    const commandName = args.commands[1]
    if (!groupName && !commandName) {
      errors.push(new Error(`\`group\` argument is required`))
      errors.push(new Error(`\`command\` argument is required`))
      return errors
    }
    const group = config.groups.find(g => g.name === args.commands[0])
    if (group) {
      const command = group.commands.find(c => c.name === args.commands[1])
      if (!command) {
        errors.push(new Error(
          `\`${args.commands[1]}\` command does not exist in \`${group.name}\` group`
        ))
      }
    } else {
      errors.push(new Error(`\`${args.commands[0]}\` group does not exist`))
    }
    if (errors.length) return errors
  }
  const missingPositionalArgs = config.positional
    ? config.positional.slice(args.commands.length)
    : []
  if (missingPositionalArgs.length) {
    missingPositionalArgs.forEach(missing => {
      errors.push(new Error(`\`${missing.name}\` argument is required`))
    })
    return errors
  }
  if (config.commands) {
    const command = config.commands.find(c => c.name === args.commands[0])
    if (!command) {
      errors.push(new Error(`\`${args.commands[0]}\` command does not exist`))
    }
  }
  if (config.options) {
    for (const option of config.options) {
      if (option.required && !has(args.options, option.name)) {
        errors.push(new Error(`\`${option.name}\` option is required`))
      }
      if (
        option.type === 'string' &&
        has(args.options, option.name) &&
        !args.options[option.name]
      ) {
        errors.push(new Error(`\`${option.name}\` option requires a value`))
      }
    }
  }
  return errors
}

const coerceBooleanValue = (args, option) => {
  return args.options[option.name] === undefined
    ? !!has(args.options, option.name) || !!option.default
    : !!args.options[option.name]
}

const coerceStringValue = (args, option) =>
  args.options[option.name] || option.default

const findActiveOptions = (config, args) => {
  const options = []
  if (config.options) {
    for (const option of config.options) {
      options.push(option)
    }
  }
  if (config.commands) {
    const commandName = args.commands[0]
    for (const command of config.commands) {
      if (!command.options || command.name !== commandName) continue
      for (const option of command.options) {
        options.push(option)
      }
    }
  }
  if (config.groups) {
    const groupName = args.commands[0]
    const commandName = args.commands[1]
    for (const group of config.groups) {
      if (group.name !== groupName) continue
      for (const command of group.commands) {
        if (!command.options || command.name !== commandName) continue
        for (const option of command.options) {
          options.push(option)
        }
      }
    }
  }
  return options.map(option => ({
    ...option,
    type: option.type || 'string'
  }))
}

const resolveHandler = (args, handlers) => {
  if (isFunction(handlers)) return handlers

  let handler = handlers
  for (const command of args.commands) {
    handler = handler[camelCase(command)]
  }

  return handler
}

const resolveInputs = (config, args) => {
  const coercedOptions = {}
  for (const option of config.options) {
    if (option.type === 'boolean') {
      coercedOptions[option.name] = coerceBooleanValue(args, option)
    } else if (option.type === 'string') {
      if (!has(args.options, option.name) && !option.default) continue
      coercedOptions[option.name] = coerceStringValue(args, option)
    }
  }

  if (config.defaultCommand) {
    config.commands = config.commands
      .map(command => ({
        ...command,
        defaultCommand: command.name === config.defaultCommand
      }))
  }

  if (args.commands.length !== config.positional.length) {
    const commands = []
    config.positional.forEach((p, i) => {
      if (args.commands[i]) {
        commands.push(args.commands[i])
      } else {
        if (config.defaultCommand && p.name === 'command') {
          commands.push(config.defaultCommand)
        } else {
          const group = config.groups &&
            config.groups.find(g => g.name === args.commands[0])
          if (group) {
            commands.push(group.defaultCommand)
          }
        }
      }
    })
    // If still not resolved we push in the default group here
    if (commands.length !== config.positional.length && config.defaultGroup) {
      commands.unshift(config.defaultGroup)
      if (commands.length === 1) {
        const group = config.groups.find(g => g.name === config.defaultGroup)
        commands.push(group.defaultCommand)
      }
    }
    return {
      config,
      args: { ...args, commands, options: coercedOptions }
    }
  }

  return {
    config,
    args: { ...args, options: coercedOptions }
  }
}

const preValidationValidation = (config, args) => {
  const inputOptionNames = Object.keys(args.options)
  const optionNames = config.options.map(o => o.name)
  const extraOptions = difference(inputOptionNames, optionNames)
  return extraOptions
    .map(option => new Error(`\`${option}\` option does not exist`))
}

const systemOptions = [
  {
    name: 'help',
    type: 'boolean',
    description: 'Show usage',
    default: false,
    system: true
  },
  {
    name: 'version',
    type: 'boolean',
    description: 'Show version',
    default: false,
    system: true
  }
]

const loadHandlers = config => {
  const handlers = {}
  if (!config.commands && !config.groups) {
    return require(config.handlersRoot)
  }
  if (config.commands) {
    config.commands.forEach(command => {
      handlers[command.name] = require(join(config.handlersRoot, command.name))
    })
  }
  if (config.groups) {
    config.groups.forEach(group => {
      handlers[group.name] = {}
      group.commands.forEach(command => {
        handlers[group.name][command.name] =
          require(join(config.handlersRoot, group.name, command.name) + '.js')
      })
    })
  }
  return handlers
}

const showVersion = appRoot => {
  const { version } = require(join(appRoot, 'package.json'))
  console.info(version)
}

const parseEnvironment = (config, options, env) => {
  if (!config.environmentPrefix) return {}
  const fullPrefix = config.environmentPrefix + '_'
  const args = {}
  Object.keys(env)
    .filter(key => key.startsWith(fullPrefix))
    .forEach(key => {
      args[camelCase(key.slice(fullPrefix.length))] = env[key]
    })
  options
    .filter(option => !!option.environmentName)
    .filter(option => !!env[option.environmentName])
    .forEach(option => {
      args[option.name] = env[option.environmentName]
    })
  return args
}

module.exports = async (config) => {
  const {
    appProcess = process,
    appConsole = console
  } = config

  const { args, config: appConfig } = parseInput(config, appProcess)

  // The "show usage" function returns different output at differnet
  // stages. This initial helper displays data from the raw args and config.
  const showPreResolveUsage = configureShowUsage(
    args,
    appConfig,
    appProcess,
    appConsole
  )

  // Make an inital pass at validation
  const preValidationErrors = preValidationValidation(appConfig, args)
  if (preValidationErrors.length) {
    return showPreResolveUsage(preValidationErrors)
  }

  // Make changes to args and config prior to invoking command
  const {
    args: resolvedArgs,
    config: resolvedConfig
  } = await resolveInputs(appConfig, args)

  // Show help and exit upon request
  if (resolvedArgs.options.help) {
    return showPreResolveUsage()
  }

  if (resolvedArgs.options.version) {
    // TODO makes `handlersRoot` seem mis-named
    return showVersion(appConfig.handlersRoot)
  }

  // Create an update helper for showing usuage with resolved args/config
  const showUsage = configureShowUsage(
    resolvedArgs,
    resolvedConfig,
    appProcess,
    appConsole
  )

  // Final validion on coerced inputs
  const postValidationErrors = validateInputs(resolvedConfig, resolvedArgs)
  if (postValidationErrors.length) {
    return showUsage(postValidationErrors)
  }

  const resolvedHandlers = config.handlers || loadHandlers(config)

  // Find the handler and invoke it
  const handler = resolveHandler(resolvedArgs, resolvedHandlers)
  try {
    const response = await invokeCommand(
      resolvedConfig,
      resolvedArgs,
      handler,
      appProcess,
      appConsole
    )
    appProcess.exit(0)
    // Return is for testing only
    // TODO console JSON and parse in tests
    return response
  } catch (error) {
    if (args.verbose) appConsole.error(error)
    return showUsage([error])
  }
}
