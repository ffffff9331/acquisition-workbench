const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { buildSync } = require('esbuild')

const projectRoot = path.resolve(__dirname, '..')
const outputFile = path.join(os.tmpdir(), `acquisition-traffic-campaign-queue-${process.pid}.cjs`)

function topic(id, overrides = {}) {
  return {
    id,
    industryPackId: '',
    tacticPackId: '',
    title: `战役 ${id}`,
    customerQuestion: '',
    targetCustomer: '',
    buyerStage: '',
    demandSignal: '',
    contentAngle: '',
    keyPromise: '',
    proofNeeded: '',
    callToAction: '',
    leadMagnet: '',
    recommendedChannels: ['douyin'],
    trafficMode: '平台自然推荐',
    testWindowDays: 7,
    successSignal: '记录有效咨询。',
    campaignStatus: '待启动',
    campaignOwner: '',
    campaignStartedAt: '',
    campaignEndsAt: '',
    campaignNote: '',
    campaignReviewedAt: '',
    riskNote: '',
    fitReason: '',
    evidenceIds: [],
    service: 'official',
    status: '已采用',
    adoptedChannels: [],
    adoptions: [],
    reviewDecision: '',
    createdAt: '2026-09-08T09:00:00',
    ...overrides,
  }
}

try {
  buildSync({
    entryPoints: [path.join(projectRoot, 'src/traffic-campaign-queue.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: outputFile,
    logLevel: 'silent',
  })

  const { trafficCampaignQueue } = require(outputFile)
  const queue = trafficCampaignQueue([
    topic('needs-review', { campaignStatus: '验证中', campaignEndsAt: '2026-09-08T08:00' }),
    topic('traffic-stalled', { campaignStatus: '验证中', campaignEndsAt: '2026-09-15T09:00' }),
    topic('preparing', { campaignStatus: '执行准备中', adoptions: [{ channelId: 'douyin', itemId: 'idea-1', adoptedAt: '2026-09-08T09:00' }] }),
    topic('waiting-start'),
    topic('done', { campaignStatus: '已复盘', reviewDecision: '继续投入' }),
  ], {
    'needs-review': [{ channelId: 'douyin', itemId: 'idea-2', stage: '已发布', executed: true, reach: 1000, interactions: 80, platformInquiries: 5, registeredLeads: 3, qualifiedLeads: 1, customers: 0 }],
    'traffic-stalled': [{ channelId: 'douyin', itemId: 'idea-3', stage: '已发布', executed: true, reach: 1000, interactions: 80, platformInquiries: 0, registeredLeads: 0, qualifiedLeads: 0, customers: 0 }],
  }, '2026-09-08T10:00')

  assert.equal(queue.items.length, 4, '已复盘战役不应继续占用首页待办')
  assert.equal(queue.items[0].opportunity.id, 'needs-review', '到期未复盘的战役应优先处理')
  assert.equal(queue.items[0].action, '复盘本轮结果', '到期战役应要求人工复盘')
  assert.equal(queue.items[0].total.inquiries, 5, '队列应复用渠道回传的咨询结果')
  assert.equal(queue.preparing, 1, '已建立执行准备但未人工开始的战役应单独统计')
  assert.equal(queue.pendingStart, 1, '尚未建立渠道准备的战役应单独统计')
  assert.equal(queue.waitingReview, 1, '到期验证战役应进入等待复盘统计')
  assert.equal(queue.items.find((item) => item.opportunity.id === 'traffic-stalled').action, '回看客户问题、真实证明和行动引导是否足够具体，再调整下一次人工执行。', '验证中的战役应根据真实结果指出当前最需要调整的环节')

  console.log('流量战役队列测试通过：待启动、待人工开始、到期复盘和渠道结果回传均可用。')
} finally {
  fs.rmSync(outputFile, { force: true })
}
