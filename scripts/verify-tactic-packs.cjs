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

  assert.ok(packs.length >= 1, '首批必须有至少一份真实可运行的打法包用于验证框架')
  assert.equal(new Set(packs.map((pack) => pack.id)).size, packs.length, '打法包 ID 必须唯一')
  assert.ok(packs.some((pack) => pack.id === tactics.BATHROOM_DOUYIN_MEASUREMENT_TACTIC_ID), '首份卫浴抖音打法包必须保留')
  assert.ok(packs.some((pack) => pack.id === tactics.BATHROOM_XIAOHONGSHU_CASE_TACTIC_ID), '卫浴小红书案例打法包必须进入目录')
  assert.ok(packs.some((pack) => pack.id === tactics.BATHROOM_REFERRAL_SERVICE_EXPERIENCE_TACTIC_ID), '卫浴老客自愿转介绍打法包必须进入目录')
  assert.ok(packs.some((pack) => pack.id === tactics.BATHROOM_COMMUNITY_RENOVATION_TACTIC_ID), '卫浴老房社区活动打法包必须进入目录')
  assert.ok(packs.some((pack) => pack.id === tactics.BATHROOM_DESIGNER_PARTNERSHIP_TACTIC_ID), '卫浴设计师合作打法包必须进入目录')

  for (const pack of packs) {
    assert.ok(pack.industryPackId, `${pack.name}必须绑定一个行业规则包`)
    assert.ok(pack.channelId, `${pack.name}必须绑定一个渠道能力`)
    assert.ok(pack.primaryGoal, `${pack.name}必须说明主要目标`)
    assert.ok(pack.callToAction, `${pack.name}必须说明唯一主要承接动作`)
    assert.ok(pack.customerProfile.length >= 2, `${pack.name}必须说明适合的客户`)
    assert.ok(pack.entryScenarios.length >= 2, `${pack.name}必须说明触发场景`)
    assert.ok(pack.contentPromise, `${pack.name}必须说明内容要兑现给客户的核心信息`)
    assert.ok(pack.prePublishChecks.length >= 3, `${pack.name}必须定义发布前的内容与承接检查`)
    assert.ok(pack.channelExecutionSteps.length >= 3, `${pack.name}必须定义发布后的人工执行节奏`)
    assert.ok(pack.experimentPlan.focus && pack.experimentPlan.primaryMetric, `${pack.name}必须定义本轮验证目标和主要指标`)
    assert.ok(pack.experimentPlan.guardrailMetrics.length >= 2, `${pack.name}必须定义至少两项护栏指标`)
    assert.ok(pack.experimentPlan.oneVariableRule, `${pack.name}必须约束每轮只调整一个主要变量`)
    assert.ok(pack.trafficPlan, `${pack.name}必须定义从哪里获得流量的规则`)
    assert.ok(pack.trafficPlan.primaryMode, `${pack.name}必须定义主要流量方式`)
    assert.ok([7, 14].includes(pack.trafficPlan.defaultTestWindowDays), `${pack.name}必须定义 7 或 14 天验证周期`)
    assert.ok(pack.trafficPlan.successSignal, `${pack.name}必须定义不承诺流量的成功信号`)
    assert.ok(pack.trafficPlan.evidencePriorities.length >= 2, `${pack.name}必须说明开始前优先核对的证明`)
    assert.ok(pack.trafficPlan.firstExecutionGate, `${pack.name}必须定义实际开始执行前的人工门槛`)
    assert.ok(pack.leadFields.filter((field) => field.required).length >= 3, `${pack.name}必须定义至少三项必要线索信息`)
    assert.ok(pack.followUpSteps.length >= 3, `${pack.name}必须定义至少三步跟进节奏`)
    assert.ok(pack.reviewMetrics.length >= 4, `${pack.name}必须定义可回收的复盘指标`)
    assert.ok(pack.boundaries.some((item) => item.includes('不自动')), `${pack.name}必须禁止自动私信、预约或群发`)
    const payload = tactics.growthTacticPackPayload(pack)
    assert.deepEqual(payload?.id, pack.id, `${pack.name}必须可作为 AI 请求中的结构化数据`)
    assert.deepEqual(payload?.experimentPlan, pack.experimentPlan, `${pack.name}的验证规则必须进入 AI 请求`)
    assert.deepEqual(payload?.trafficPlan, pack.trafficPlan, `${pack.name}的流量规则必须进入 AI 请求`)

    const blankProgress = tactics.tacticLeadProgress(pack, {})
    assert.equal(blankProgress.complete, false, `${pack.name}缺少必填信息时不能判定为信息完整`)
    assert.equal(blankProgress.completedCount, 0, `${pack.name}空线索不能拥有已补全字段`)
    const blankRecommendation = tactics.tacticQualificationRecommendation(pack, {})
    assert.equal(blankRecommendation.status, '待补充信息', `${pack.name}信息缺失时必须提示先补充信息`)
    assert.equal(blankRecommendation.missingFields.length, blankProgress.requiredCount, `${pack.name}缺失字段必须可追溯`)
    const completeValues = Object.fromEntries(pack.leadFields.filter((field) => field.required).map((field) => [field.id, '已提供']))
    const completeProgress = tactics.tacticLeadProgress(pack, completeValues)
    assert.equal(completeProgress.complete, true, `${pack.name}补全必填信息后必须可以进入下一步判断`)
    assert.equal(completeProgress.completedCount, completeProgress.requiredCount, `${pack.name}完整线索的字段计数必须正确`)
    const completeRecommendation = tactics.tacticQualificationRecommendation(pack, completeValues)
    assert.equal(completeRecommendation.status, '可人工推进', `${pack.name}信息完整后必须只给出人工推进建议`)
    assert.equal(completeRecommendation.missingFields.length, 0, `${pack.name}完整线索不应保留缺失字段`)
    assert.equal(tactics.normalizeTacticQualificationStatus('可人工推进'), '可人工推进', `${pack.name}必须保留合法人工判断`)
    assert.equal(tactics.normalizeTacticQualificationStatus('自动成交'), '', `${pack.name}不得接受未定义的自动判断`)
    assert.equal(tactics.tacticLeadInputName(pack.leadFields[0].id), `tactic-lead-${pack.leadFields[0].id}`, `${pack.name}字段必须有稳定的表单名称`)
  }

  console.log(`打法包测试通过：${packs.map((pack) => pack.name).join('、')}`)
} finally {
  fs.rmSync(outputFile, { force: true })
}
