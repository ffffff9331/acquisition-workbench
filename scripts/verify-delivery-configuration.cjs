const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { buildSync } = require('esbuild')

const projectRoot = path.resolve(__dirname, '..')
const outputFile = path.join(os.tmpdir(), `acquisition-delivery-configuration-${process.pid}.cjs`)

try {
  buildSync({
    entryPoints: [path.join(projectRoot, 'src/delivery-configuration.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: outputFile,
    logLevel: 'silent',
  })

  const configuration = require(outputFile)
  const registry = requireFromTypeScript(path.join(projectRoot, 'src/industry-pack-registry.ts'))
  const tactics = requireFromTypeScript(path.join(projectRoot, 'src/tactic-packs.ts'))
  const bathroom = registry.industryRulePacks.find((pack) => pack.id === 'bathroom-industry-rules-v2')
  const bathroomTactics = tactics.growthTacticPacks.filter((pack) => pack.industryPackId === bathroom.id)
  const first = bathroomTactics.find((pack) => pack.channelId === 'douyin')
  const second = bathroomTactics.find((pack) => pack.channelId === 'offline')
  assert.ok(bathroom && first && second, '测试需要卫浴行业、抖音与线下活动打法包')

  const empty = { enabledChannels: [], installedIndustryPacks: [], activeIndustryPackId: '', installedTacticPacks: [], activeTacticPackId: '' }
  const missingIndustry = configuration.createDeliveryConfigurationPlan(empty, { industryPackId: '', tacticPackIds: [first.id], defaultTacticPackId: first.id }, registry.industryRulePacks, tactics.growthTacticPacks)
  assert.equal(missingIndustry.ok, false, '无行业时不能应用配置')
  const missingTactic = configuration.createDeliveryConfigurationPlan(empty, { industryPackId: bathroom.id, tacticPackIds: [], defaultTacticPackId: '' }, registry.industryRulePacks, tactics.growthTacticPacks)
  assert.equal(missingTactic.ok, false, '无获客方式时不能应用配置')
  const invalidDefault = configuration.createDeliveryConfigurationPlan(empty, { industryPackId: bathroom.id, tacticPackIds: [first.id], defaultTacticPackId: second.id }, registry.industryRulePacks, tactics.growthTacticPacks)
  assert.equal(invalidDefault.ok, false, '默认方式必须属于已选获客方式')
  const foreignTactic = { ...first, id: 'test-foreign-tactic', industryPackId: 'windows-industry-rules-v2' }
  const crossIndustry = configuration.createDeliveryConfigurationPlan(empty, { industryPackId: bathroom.id, tacticPackIds: [first.id, foreignTactic.id], defaultTacticPackId: first.id }, registry.industryRulePacks, [...tactics.growthTacticPacks, foreignTactic])
  assert.equal(crossIndustry.ok, false, '获客方式不能跨行业混用')

  const existing = { enabledChannels: ['wechat'], installedIndustryPacks: ['windows-industry-rules-v2'], activeIndustryPackId: 'windows-industry-rules-v2', installedTacticPacks: [], activeTacticPackId: '' }
  const valid = configuration.createDeliveryConfigurationPlan(existing, { industryPackId: bathroom.id, tacticPackIds: [first.id, second.id, first.id], defaultTacticPackId: second.id }, registry.industryRulePacks, tactics.growthTacticPacks)
  assert.equal(valid.ok, true, '同一行业的已选获客方式应可应用')
  assert.deepEqual(valid.requiredChannels.sort(), ['douyin', 'offline'], '需要自动去重并汇总渠道')
  assert.deepEqual(valid.next.enabledChannels.sort(), ['douyin', 'offline', 'wechat'], '已有渠道不能被覆盖或删除')
  assert.deepEqual(valid.next.installedIndustryPacks.sort(), [bathroom.id, 'windows-industry-rules-v2'].sort(), '已有行业规则不能被覆盖或删除')
  assert.equal(valid.next.activeIndustryPackId, bathroom.id, '应用后应切换当前行业')
  assert.equal(valid.next.activeTacticPackId, second.id, '应用后应使用指定默认方式')
  assert.deepEqual(valid.next.installedTacticPacks.sort(), [first.id, second.id].sort(), '已选获客方式应去重安装')
  assert.deepEqual(Object.keys(valid.next).sort(), ['activeIndustryPackId', 'activeTacticPackId', 'enabledChannels', 'installedIndustryPacks', 'installedTacticPacks'], '配置逻辑不得创建线索、客户、任务或事件')

  console.log('获客配置测试通过：行业、打法、默认方式、渠道汇总与历史数据保留均符合预期')
} finally {
  fs.rmSync(outputFile, { force: true })
}

function requireFromTypeScript(entryPoint) {
  const bundled = path.join(os.tmpdir(), `acquisition-delivery-dependency-${path.basename(entryPoint)}-${process.pid}.cjs`)
  try {
    buildSync({ entryPoints: [entryPoint], bundle: true, platform: 'node', format: 'cjs', outfile: bundled, logLevel: 'silent' })
    return require(bundled)
  } finally {
    fs.rmSync(bundled, { force: true })
  }
}
