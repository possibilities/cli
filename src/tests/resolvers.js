const test = require('ava')
const dedent = require('dedent')
const { spawn } = require('child-process-promise')

const getOutput = stream => new Promise(resolve => {
  const chunks = []
  stream.on('data', chunk => chunks.push(chunk))
  stream.on('end', () => resolve(chunks.join('')))
})

test('loads handlers from filesystem', async t => {
  t.plan(1)
  try {
    const response = spawn(
      './examples/single-command/cli.js',
      ['show', '--name', 'foo']
    )
    const output = await getOutput(response.childProcess.stdout)
    await response
    t.is(output.trim(), 'showing foo!')
  } catch (error) {
    t.fail()
  }
})

test.todo('loads command handlers with from filesystem')

test.todo('loads command group handlers with from filesystem')

test.todo('loads handlers with custom loader')
