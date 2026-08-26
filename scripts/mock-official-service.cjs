const http = require('node:http')

const port = Number(process.env.MOCK_OFFICIAL_SERVICE_PORT || 4180)

async function readJson(request) {
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}
}

const server = http.createServer(async (request, response) => {
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  if (request.headers.authorization !== 'Bearer local-ui-test-token') {
    response.statusCode = 401
    response.end(JSON.stringify({ message: 'Unauthorized' }))
    return
  }
  if (request.method === 'GET' && request.url === '/v1/workspaces/ui-demo/credit-account') {
    response.end(JSON.stringify({
      account: { workspaceId: 'ui-demo', balance: 1280, frozen: 20, lowBalanceThreshold: 200, status: 'active', updatedAt: '2026-08-26T18:30:00+08:00' },
      packages: [
        { id: 'starter', title: '轻量充值', points: 500, bonusPoints: 0, priceFen: 4900, description: '适合偶尔生成内容', recommended: false },
        { id: 'standard', title: '标准充值', points: 1000, bonusPoints: 100, priceFen: 9900, description: '适合持续内容运营', recommended: true },
        { id: 'team', title: '团队充值', points: 3000, bonusPoints: 500, priceFen: 27900, description: '适合多人和多渠道使用', recommended: false },
      ],
      transactions: [
        { id: 'tx-3', type: 'usage', points: -12, balanceAfter: 1280, description: '生成短视频脚本', status: 'completed', createdAt: '2026-08-26T18:26:00+08:00' },
        { id: 'tx-2', type: 'gift', points: 100, balanceAfter: 1292, description: '标准充值赠送', status: 'completed', createdAt: '2026-08-26T16:20:00+08:00' },
        { id: 'tx-1', type: 'recharge', points: 1000, balanceAfter: 1192, description: '标准充值到账', status: 'completed', createdAt: '2026-08-26T16:20:00+08:00' },
      ],
    }))
    return
  }
  if (request.method === 'POST' && request.url === '/v1/workspaces/ui-demo/recharge-orders') {
    const body = await readJson(request)
    response.end(JSON.stringify({ orderId: `mock-${body.packageId}`, checkoutUrl: `http://127.0.0.1:${port}/checkout/${body.packageId}`, expiresAt: '2026-08-26T19:00:00+08:00' }))
    return
  }
  if (request.method === 'POST' && request.url === '/v1/generations') {
    await readJson(request)
    response.end(JSON.stringify({ requestId: 'mock-generation', output: { topics: [{ title: '旧卫生间换智能马桶，先判断这 4 个尺寸', customerQuestion: '旧卫生间能不能直接换智能马桶？', targetCustomer: '准备翻新老房卫生间的本地业主', buyerStage: '方案比较', demandSignal: '多个来源讨论坑距、电源和开门空间冲突。', contentAngle: '展示现场量尺顺序和一组不能直接安装的反例。', keyPromise: '帮助客户在购买前完成一次基础自查。', proofNeeded: '真实量尺画面、尺寸标注和安装案例。', callToAction: '私信户型和尺寸，预约初步判断。', leadMagnet: '智能马桶安装自查表', recommendedChannels: ['douyin', 'xiaohongshu'], riskNote: '不能承诺仅凭线上尺寸一定可以安装。', fitReason: '问题接近购买决策，且商家能提供可核对的真实证明。', evidenceIds: ['source-1', 'source-2'] }] }, usage: { pointsCharged: 12, balanceAfter: 1268 } }))
    return
  }
  if (request.method === 'GET' && request.url.startsWith('/checkout/')) {
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.end('<!doctype html><meta charset="utf-8"><title>本地测试支付页</title><h1>本地测试支付页</h1><p>不会产生真实支付。</p>')
    return
  }
  response.statusCode = 404
  response.end(JSON.stringify({ message: 'Not found' }))
})

server.listen(port, '127.0.0.1', () => process.stdout.write(`Mock official service: http://127.0.0.1:${port}\n`))
