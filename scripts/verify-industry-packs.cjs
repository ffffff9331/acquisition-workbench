const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { buildSync } = require('esbuild')

const projectRoot = path.resolve(__dirname, '..')
const outputFile = path.join(os.tmpdir(), `acquisition-industry-packs-${process.pid}.cjs`)

try {
  buildSync({
    entryPoints: [path.join(projectRoot, 'src/industry-pack-registry.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: outputFile,
    logLevel: 'silent',
  })

  const registry = require(outputFile)
  const packs = registry.industryRulePacks
  const expectedChannels = ['douyin', 'xiaohongshu', 'wechat', 'offline', 'referral', 'bilibili']

  assert.equal(packs.length, 4, '首批目录必须包含四个可用行业规则包')
  assert.equal(new Set(packs.map((pack) => pack.id)).size, packs.length, '规则包 ID 必须唯一')
  assert.equal(registry.normalizeIndustryPackId('bathroom-industry-content-v1'), 'bathroom-industry-rules-v2', '旧卫浴包 ID 必须迁移')

  for (const pack of packs) {
    assert.equal(pack.opportunityRules.reduce((sum, rule) => sum + rule.weight, 0), 100, `${pack.name}机会评分权重必须等于 100`)
    assert.deepEqual(pack.channelRules.map((rule) => rule.channelId).sort(), [...expectedChannels].sort(), `${pack.name}必须适配六个渠道`)
    assert.ok(pack.searchDirections.length >= 5, `${pack.name}至少需要五个搜索方向`)
    assert.ok(pack.evidenceRules.length >= 5, `${pack.name}至少需要五类证据规则`)
    const first = pack.searchDirections[0]
    const queryA = registry.buildIndustrySearchQuery(pack, first.id, { offer: pack.taxonomy.products[0], targetCustomer: '首次装修家庭', serviceArea: '上海', conversionGoal: '预约咨询', proofAssets: '真实现场资料' })
    const queryB = registry.buildIndustrySearchQuery(pack, first.id, { offer: pack.taxonomy.products[1] || pack.taxonomy.products[0], targetCustomer: '旧房更新家庭', serviceArea: '杭州', conversionGoal: '预约咨询', proofAssets: '真实现场资料' })
    assert.notEqual(queryA, queryB, `${pack.name}搜索上下文必须能随商家输入变化`)
    assert.ok(queryA.includes('上海') && queryB.includes('杭州'), `${pack.name}搜索查询必须携带服务地区`)
  }

  console.log(`行业规则包测试通过：${packs.map((pack) => pack.name).join('、')}`)
} finally {
  fs.rmSync(outputFile, { force: true })
}
