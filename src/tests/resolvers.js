const test = require('ava')
const { testCli } = require('./_helpers')

const echoArgsHandler = (args, positional) => ({ args, positional })

test('loads handlers from filesystem', async t => {
  t.plan(1)
  const { response } =
    await testCli('node example-app', {}, { handlers: echoArgsHandler })
  t.deepEqual(response.args, {})
})

test.todo('loads command handlers with from filesystem')

test.todo('loads command group handlers with from filesystem')

test.todo('loads handlers with custom loader')
