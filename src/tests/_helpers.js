const createCli = require('../index')

const indentBy = (data, depth) => {
  let str = ''
  while (depth) {
    depth = depth - 1
    str = str = '  '
  }
  return str + data
}

module.exports.testCli = async (command, config, handlers) => {
  // Simulate the logger used internally so that we can check out the
  // string value of all outputs
  let depth = 0
  let output = []
  const logger = {
    info: data => {
      output.push(indentBy(data || '', depth))
    },
    group: data => {
      output.push(indentBy(data || '', depth))
      depth = depth + 1
    },
    error: data => output.push(indentBy(data || '', depth)),
    groupEnd: data => {
      depth = depth - 1
    }
  }
  let exitCode
  const response = await createCli(config, {
    handlers,
    appProcess: {
      exit: code => {
        exitCode = code
      },
      argv: command.split(' ')
    },
    appConsole: logger
  })
  return { response, exitCode, output: output.join('\n').trim() }
}
