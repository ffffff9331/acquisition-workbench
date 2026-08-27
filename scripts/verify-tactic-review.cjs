const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { buildSync } = require('esbuild')

const projectRoot = path.resolve(__dirname, '..')
const outputFile = path.join(os.tmpdir(), `acquisition-tactic-review-${process.pid}.cjs`)

try {
  buildSync({
    entryPoints: [path.join(projectRoot, 'src/tactic-review.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: outputFile,
    logLevel: 'silent',
  })

  const review = require(outputFile)
  const fullValues = {
    'service-area': '杭州临平区',
    'renovation-stage': '旧房翻新',
    'bathroom-condition': '主卫约 2 平方米',
    'target-product': '确认智能马桶安装范围',
  }
  const rows = review.tacticReviewRows([
    { tacticPackId: 'bathroom-douyin-measurement-v1', tacticLeadValues: {}, tacticQualificationStatus: '', stage: 'lead', status: '待判断' },
    { tacticPackId: 'bathroom-douyin-measurement-v1', tacticLeadValues: fullValues, tacticQualificationStatus: '可人工推进', stage: 'intent', status: '已预约' },
    { tacticPackId: 'bathroom-douyin-measurement-v1', tacticLeadValues: fullValues, tacticQualificationStatus: '可人工推进', stage: 'intent', status: '报价中' },
    { tacticPackId: 'bathroom-douyin-measurement-v1', tacticLeadValues: fullValues, tacticQualificationStatus: '可人工推进', stage: 'customer', status: '服务中' },
    { tacticPackId: 'bathroom-douyin-measurement-v1', tacticLeadValues: fullValues, tacticQualificationStatus: '暂不符合', stage: 'lost', status: '已放弃' },
    { tacticPackId: 'unknown-tactic', tacticLeadValues: fullValues, tacticQualificationStatus: '可人工推进', stage: 'customer', status: '服务中' },
  ])

  assert.equal(rows.length, 1, '未知或已移除的打法不能进入复盘统计')
  assert.equal(rows[0].consultations, 5, '所有可识别打法咨询都应进入咨询数')
  assert.equal(rows[0].informationComplete, 4, '只统计完整填写关键字段的咨询')
  assert.equal(rows[0].manuallyReady, 3, '只统计完整信息且人工确认可推进的咨询')
  assert.equal(rows[0].appointments, 1, '预约只统计当前明确标记为已预约的记录')
  assert.equal(rows[0].proposalOrQuote, 1, '方案或报价只统计当前处于对应状态的记录')
  assert.equal(rows[0].customers, 1, '成交只统计已进入客户阶段的记录')
  assert.equal(rows[0].notMoving, 1, '暂不符合或已放弃的记录应进入未推进统计')

  console.log('打法复盘测试通过：咨询、资料补全、人工推进、当前预约/方案与成交均可追溯。')
} finally {
  fs.rmSync(outputFile, { force: true })
}
