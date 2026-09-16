const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { buildSync } = require('esbuild')

const projectRoot = path.resolve(__dirname, '..')
const outputFile = path.join(os.tmpdir(), `acquisition-traffic-campaigns-${process.pid}.cjs`)
const trafficOutputFile = path.join(os.tmpdir(), `acquisition-traffic-campaign-rules-${process.pid}.cjs`)

try {
  buildSync({
    entryPoints: [path.join(projectRoot, 'src/topic-research.tsx')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    jsx: 'automatic',
    outfile: outputFile,
    logLevel: 'silent',
  })

  const research = require(outputFile)
  buildSync({
    entryPoints: [path.join(projectRoot, 'src/traffic-campaign.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: trafficOutputFile,
    logLevel: 'silent',
  })
  const traffic = require(trafficOutputFile)
  const migrated = research.normalizeTopicResearchData({
    generatedTopics: [{
      id: 'legacy-offline',
      title: '老房改造社区现场判断',
      recommendedChannels: ['offline'],
    }, {
      id: 'explicit-campaign',
      title: '智能马桶安装条件主动需求截流',
      recommendedChannels: ['douyin', 'xiaohongshu'],
      trafficMode: '主动需求截流',
      testWindowDays: 14,
      successSignal: '14 天内记录有效咨询、量尺预约和到店人数。',
    }],
  })

  assert.equal(migrated.generatedTopics[0].trafficMode, '同城线下触达', '历史线下机会升级后应保留合理的流量方式')
  assert.equal(migrated.generatedTopics[0].testWindowDays, 7, '未记录验证周期的历史机会应安全回退到 7 天')
  assert.equal(migrated.generatedTopics[0].successSignal, '记录有效咨询、进入下一步和实际成交，不只看播放量。', '历史机会缺少成功信号时应补充不承诺流量的默认口径')
  assert.equal(migrated.generatedTopics[1].trafficMode, '主动需求截流', '模型或人工指定的流量方式应被保留')
  assert.equal(migrated.generatedTopics[1].testWindowDays, 14, '14 天验证周期应被保留')
  assert.equal(migrated.generatedTopics[1].successSignal, '14 天内记录有效咨询、量尺预约和到店人数。', '人工指定的成功信号应被保留')
  assert.equal(migrated.generatedTopics[0].campaignStatus, '待启动', '没有渠道准备的历史机会不能被误判为已经开始')

  const running = research.normalizeTopicResearchData({
    generatedTopics: [{
      id: 'running-campaign',
      title: '已人工开始的验证战役',
      recommendedChannels: ['douyin'],
      adoptions: [{ channelId: 'douyin', itemId: 'idea-1', adoptedAt: '2026-09-08T09:00:00' }],
      campaignStatus: '验证中',
      campaignOwner: '店长',
      campaignStartedAt: '2026-09-08T09:30',
      campaignEndsAt: '2026-09-15T09:30',
      campaignNote: '已人工发布。',
    }],
  })
  assert.equal(running.generatedTopics[0].campaignStatus, '验证中', '人工记录的验证状态应被保留')
  assert.equal(running.generatedTopics[0].campaignOwner, '店长', '战役负责人应被保留')
  assert.equal(running.generatedTopics[0].campaignEndsAt, '2026-09-15T09:30', '验证截止时间应被保留')
  assert.equal(traffic.canStartCampaign('店长', '2026-09-08T09:30', '已人工发布第一条内容。'), true, '负责人、实际开始时间和执行说明齐全时才可以开始验证')
  assert.equal(traffic.canStartCampaign('店长', '2026-09-08T09:30', ''), false, '执行说明为空时不得开始验证')
  assert.equal(traffic.canStartCampaign('店长', '2026-09-08T09:30', '   '), false, '仅包含空白字符的执行说明不得开始验证')
  assert.equal(traffic.diagnoseCampaignPerformance({ executed: true, reach: 680, interactions: 42, platformInquiries: 6, registeredLeads: 4, qualifiedLeads: 2, customers: 1 }).label, '已带来客户', '已形成客户时应优先提示回看有效路径')
  assert.equal(traffic.diagnoseCampaignPerformance({ executed: true, reach: 680, interactions: 42, platformInquiries: 0, registeredLeads: 0, qualifiedLeads: 0, customers: 0 }).label, '流量未转咨询', '已有可见流量但没有咨询时不应误判为承接问题')
  assert.equal(traffic.diagnoseCampaignPerformance({ executed: true, reach: 0, interactions: 0, platformInquiries: 0, registeredLeads: 0, qualifiedLeads: 0, customers: 0 }).label, '结果待回填', '已执行但没有任何回传时不能武断判定没有流量')

  console.log('流量战役测试通过：旧机会迁移、流量方式、人工开始、验证周期与成功信号均可用。')
} finally {
  fs.rmSync(outputFile, { force: true })
  fs.rmSync(trafficOutputFile, { force: true })
}
