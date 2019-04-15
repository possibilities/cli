const test = require('ava')
const dedent = require('dedent')
const { spawn } = require('child-process-promise')

const getOutput = stream => new Promise(resolve => {
  const chunks = []
  stream.on('data', chunk => chunks.push(chunk))
  stream.on('end', () => resolve(chunks.join('')))
})

test('loads single command from filesystem', async t => {
  t.plan(1)
  try {
    const response = spawn(
      './examples/single-command/cli.js',
      ['--name', 'foo']
    )
    const output = await getOutput(response.childProcess.stdout)
    await response
    t.is(output.trim(), 'single command: showing foo!')
  } catch (error) {
    t.fail()
  }
})

test('loads multiple commands from filesystem', async t => {
  t.plan(2)
  try {
    const response1 = spawn(
      './examples/multiple-commands/cli.js',
      ['show', '--name', 'foo']
    )
    const output1 = await getOutput(response1.childProcess.stdout)
    await response1
    t.is(output1.trim(), 'multiple commands: showing foo!')

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

test.todo('loads command group from filesystem')

test.todo('loads commands with custom loader')
