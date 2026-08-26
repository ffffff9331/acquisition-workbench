const http = require('node:http')
const assert = require('node:assert/strict')
const { createOfficialServiceClient, normalizeBaseUrl } = require('../electron/official-service.cjs')

async function readJson(request) {
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}
}

async function main() {
  assert.equal(normalizeBaseUrl('http://api.example.com'), '')
  assert.equal(normalizeBaseUrl('https://api.example.com/'), 'https://api.example.com')
  assert.equal(normalizeBaseUrl('http://127.0.0.1:4180/'), 'http://127.0.0.1:4180')

  const observed = []
  const server = http.createServer(async (request, response) => {
    observed.push({ method: request.method, url: request.url, authorization: request.headers.authorization, body: await readJson(request) })
    response.setHeader('Content-Type', 'application/json')
    if (request.method === 'GET' && request.url === '/v1/workspaces/demo-workspace/credit-account') {
      response.end(JSON.stringify({
        account: { workspaceId: 'demo-workspace', balance: 1280, frozen: 20, lowBalanceThreshold: 200, status: 'active', updatedAt: '2026-08-26T10:00:00+08:00' },
        packages: [{ id: 'points-1000', title: '标准充值', points: 1000, bonusPoints: 100, priceFen: 9900, description: '到账 1100 积分', recommended: true }],
        transactions: [{ id: 'tx-1', type: 'recharge', points: 1100, balanceAfter: 1280, description: '标准充值到账', status: 'completed', createdAt: '2026-08-26T10:00:00+08:00' }],
      }))
      return
    }
    if (request.method === 'GET' && request.url === '/v1/workspaces/invalid-workspace/credit-account') {
      response.end(JSON.stringify({
        account: { workspaceId: 'invalid-workspace', balance: '1280', frozen: 0, lowBalanceThreshold: 200, status: 'unknown', updatedAt: '2026-08-26T10:00:00+08:00' },
        packages: [],
        transactions: [],
      }))
      return
    }
    if (request.method === 'POST' && request.url === '/v1/workspaces/demo-workspace/recharge-orders') {
      response.end(JSON.stringify({ orderId: 'order-1', checkoutUrl: `http://127.0.0.1:${server.address().port}/checkout/order-1`, expiresAt: '2026-08-26T10:30:00+08:00' }))
      return
    }
    if (request.method === 'POST' && request.url === '/v1/generations') {
      response.end(JSON.stringify({ requestId: 'generation-1', output: { topics: [{ title: '已形成获客机会', customerQuestion: '怎么买', targetCustomer: '准备购买的人', buyerStage: '方案比较', demandSignal: '来源支持', contentAngle: '避坑', keyPromise: '帮助判断', proofNeeded: '真实案例', callToAction: '私信咨询', leadMagnet: '清单', recommendedChannels: ['douyin'], riskNote: '', fitReason: '接近购买决策', evidenceIds: ['source-1'] }] }, usage: { pointsCharged: 12, balanceAfter: 1268 } }))
      return
    }
    response.statusCode = 404
    response.end(JSON.stringify({ message: 'Not found' }))
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const client = createOfficialServiceClient({ baseUrl: `http://127.0.0.1:${server.address().port}`, getToken: () => 'local-test-token' })
  try {
    const account = await client.getCreditAccount('demo-workspace')
    assert.equal(account.ok, true)
    assert.equal(account.data.account.balance, 1280)
    assert.equal(account.data.packages[0].bonusPoints, 100)

    const invalidAccount = await client.getCreditAccount('invalid-workspace')
    assert.equal(invalidAccount.ok, false)
    assert.match(invalidAccount.message, /无效/)

    const order = await client.createRechargeOrder('demo-workspace', 'points-1000')
    assert.equal(order.ok, true)
    assert.equal(order.order.orderId, 'order-1')

    const generation = await client.generate({ workspaceId: 'demo-workspace', task: 'acquisition_opportunities', payload: { query: '小户型卫生间' } })
    assert.equal(generation.ok, true)
    assert.equal(generation.data.usage.pointsCharged, 12)
    assert.equal(generation.data.usage.balanceAfter, 1268)

    assert.equal(observed.length, 4)
    observed.forEach((request) => assert.equal(request.authorization, 'Bearer local-test-token'))
    assert.equal(observed[2].body.packageId, 'points-1000')
    assert.ok(observed[2].body.clientRequestId)
    assert.equal(observed[3].body.workspaceId, 'demo-workspace')
    assert.equal(observed[3].body.task, 'acquisition_opportunities')
    assert.ok(observed[3].body.requestId)
    process.stdout.write('Official service contract verified.\n')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`)
  process.exitCode = 1
})
