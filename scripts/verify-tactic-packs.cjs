const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { buildSync } = require('esbuild')

const projectRoot = path.resolve(__dirname, '..')
const outputFile = path.join(os.tmpdir(), `acquisition-tactic-packs-${process.pid}.cjs`)

try {
  buildSync({
    entryPoints: [path.join(projectRoot, 'src/tactic-packs.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: outputFile,
    logLevel: 'silent',
  })

  const tactics = require(outputFile)
  const packs = tactics.growthTacticPacks

  assert.equal(packs.length, 1, '首批必须有一份真实可运行的打法包用于验证框架')
  assert.equal(new Set(packs.map((pack) => pack.id)).size, packs.length, '打法包 ID 必须唯一')

  for (const pack of packs) {
    assert.ok(pack.industryPackId, `${pack.name}必须绑定一个行业规则包`)
    assert.ok(pack.channelId, `${pack.name}必须绑定一个渠道能力`)
    assert.ok(pack.primaryGoal, `${pack.name}必须说明主要目标`)
    assert.ok(pack.callToAction, `${pack.name}必须说明唯一主要承接动作`)
    assert.ok(pack.customerProfile.length >= 2, `${pack.name}必须说明适合的客户`)
    assert.ok(pack.entryScenarios.length >= 2, `${pack.name}必须说明触发场景`)
    assert.ok(pack.leadFields.filter((field) => field.required).length >= 3, `${pack.name}必须定义至少三项必要线索信息`)
    assert.ok(pack.followUpSteps.length >= 3, `${pack.name}必须定义至少三步跟进节奏`)
    assert.ok(pack.reviewMetrics.length >= 4, `${pack.name}必须定义可回收的复盘指标`)
    assert.ok(pack.boundaries.some((item) => item.includes('不自动')), `${pack.name}必须禁止自动私信、预约或群发`)
    assert.deepEqual(tactics.growthTacticPackPayload(pack)?.id, pack.id, `${pack.name}必须可作为 AI 请求中的结构化数据`) 
  }

  console.log(`打法包测试通过：${packs.map((pack) => pack.name).join('、')}`)
} finally {
  fs.rmSync(outputFile, { force: true })
}
