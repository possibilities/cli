const padStart = require('lodash/padStart')
const padEnd = require('lodash/padEnd')
const maxBy = require('lodash/maxBy')
const flatten = require('lodash/flatten')
const partition = require('lodash/partition')

const showCommands = (binName, commands, appConsole) => {
  return generateLeftCommandLabels(binName, commands)
    .forEach((label, index) => {
      const { description, defaultCommand } = commands[index]
      appConsole.info(
        `${label} ${description}${defaultCommand ? ' (default)' : ''}`
      )
    })
}

const padLeftLabels = unpaddedLabels => {
  const minWidth = unpaddedLabels.length
    ? maxBy(unpaddedLabels, l => l.length).length + 1
    : 0
  return unpaddedLabels.map(l => padEnd(l, minWidth))
}

const generateLeftCommandLabels = (binName, commands = []) =>
  padLeftLabels(commands.map(c => `${binName} ${c.name}`))

const generateLeftOptionsLabels = (options = []) => {
  const optionLabels =
    options.map(
      (option, index) => option.alias
        ? `--${option.name}, -${option.alias}`
        : `--${option.name}`
    )
  return padLeftLabels(optionLabels).map(
    (label, index) => `${label} ${options[index].description}`
  )
}

const generateRightOptionsLabels = (options = [], leftLabels) =>
  options.map(
    (o, index) => padStart(
      o.default
        ? `[${o.type}] [default: ${o.default}]`
        : `[${o.type}]`,
      80 - leftLabels[index].length
    )
  )

const showOptions = (options, appConsole) => {
  const leftLabels = generateLeftOptionsLabels(options)
  const rightLabels = generateRightOptionsLabels(options, leftLabels)
  leftLabels.forEach((label, index) => {
    appConsole.info(
      label,
      rightLabels[index]
    )
  })
}

const createShowUsage = (
  args,
  config,
  appProcess,
  appConsole
) => (errors = []) => {
  const binName = appProcess.argv[1].split('/').pop()
  const commands = config.positional.length
    ? ' ' + (
      // TODO haha sorry world. perhaps tag each error with a type?
      config.positional.map((c, i) => (
        !errors.find(e =>
          e.message.includes('command does not exist') ||
          e.message.includes('group does not exist')
        ) && args.commands[i]
      ) ||
      `<${c.name}>`).join(' ')
    )
    : ''
  const options = config.options ? ' [options]' : ''
  appConsole.info(`Usage: ${binName}${commands}${options}`)
  appConsole.info()

  if (config.description) {
    appConsole.info(config.description)
    appConsole.info()
  }

  if (config.groups) {
    const groupName = args.commands[0]
    const groupDoesNotExist = errors
      .some(e => e.message.includes('group does not exist'))
    appConsole.group('Commands')
    const configGroups = config.defaultGroup
      ? flatten(partition(config.groups, g => config.defaultGroup === g.name))
      : config.groups
    configGroups
      .filter(group => (
        groupDoesNotExist ||
        !groupName ||
        group.name === groupName
      ))
      .forEach(({ name, label, commands }) => {
        appConsole.group(`${config.defaultGroup === name ? 'Base' : label}`)
        const commandLabel = config.defaultGroup === name
          ? `  ${binName}`
          : `  ${binName} ${name}`
        showCommands(commandLabel, commands, appConsole)
        appConsole.groupEnd()
      })

    appConsole.groupEnd()
    appConsole.info()
  }

  if (config.commands) {
    appConsole.group(config.commands.length === 1 ? 'Command' : 'Commands')
    showCommands(binName, config.commands, appConsole)
    appConsole.groupEnd()
    appConsole.info()
  }

  if (config.options) {
    appConsole.group(config.options.length === 1 ? 'Option' : 'Options')
    showOptions(config.options, appConsole)
    appConsole.groupEnd()
    appConsole.info()
  }

  if (errors.length) {
    appConsole.group(errors.length === 1 ? 'Error' : 'Errors')
    errors.forEach(error => appConsole.info(error.message))
    appConsole.groupEnd()
  }

  appProcess.exit(1)
}

module.exports = createShowUsage
