const test = require('ava')
const { spawn } = require('child-process-promise')

const getOutput = stream => new Promise(resolve => {
  const chunks = []
  stream.on('data', chunk => chunks.push(chunk))
  stream.on('end', () => resolve(chunks.join('')))
})

test.skip('loads single command from filesystem', async t => {
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

test.skip('loads multiple commands from filesystem', async t => {
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

test.skip('loads command group from filesystem', async t => {
  t.plan(4)
  try {
    const response1 = spawn(
      './examples/command-groups/cli.js',
      ['users', 'show', '--name', 'foo']
    )
    const output1 = await getOutput(response1.childProcess.stdout)
    await response1
    t.is(output1.trim(), 'command groups: showing foo user!')

    const response2 = spawn(
      './examples/command-groups/cli.js',
      ['users', 'list']
    )
    const output2 = await getOutput(response2.childProcess.stdout)
    await response2
    t.is(output2.trim(), 'command groups: listing users!')

    const response3 = spawn(
      './examples/command-groups/cli.js',
      ['util', 'fix']
    )
    const output3 = await getOutput(response3.childProcess.stdout)
    await response3
    t.is(output3.trim(), 'command groups: fixing things util!')

    const response4 = spawn(
      './examples/command-groups/cli.js',
      ['util', 'break']
    )
    const output4 = await getOutput(response4.childProcess.stdout)
    await response4
    t.is(output4.trim(), 'command groups: breaking things util!')
  } catch (error) {
    t.fail()
  }
})
