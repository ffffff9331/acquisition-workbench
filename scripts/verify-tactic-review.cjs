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
    { id: 'record-1', tacticPackId: 'bathroom-douyin-measurement-v1', tacticLeadValues: {}, tacticQualificationStatus: '', stage: 'lead', status: '待判断', contentLeadContext: { title: '内容 A' }, intakeAt: '2026-09-08T09:00', firstResponseDueAt: '2026-09-08T10:00' },
    { id: 'record-2', tacticPackId: 'bathroom-douyin-measurement-v1', tacticLeadValues: fullValues, tacticQualificationStatus: '可人工推进', stage: 'intent', status: '待联系', contentLeadContext: { title: '内容 B' }, intakeAt: '2026-09-08T09:00', firstResponseDueAt: '2026-09-08T11:00' },
    { id: 'record-3', tacticPackId: 'bathroom-douyin-measurement-v1', tacticLeadValues: fullValues, tacticQualificationStatus: '可人工推进', stage: 'intent', status: '待联系', contentLeadContext: { title: '内容 C' }, intakeAt: '2026-09-08T09:00', firstResponseDueAt: '2026-09-08T10:00' },
    { id: 'record-4', tacticPackId: 'bathroom-douyin-measurement-v1', tacticLeadValues: fullValues, tacticQualificationStatus: '可人工推进', stage: 'lead', status: '待联系' },
    { id: 'record-5', tacticPackId: 'bathroom-douyin-measurement-v1', tacticLeadValues: fullValues, tacticQualificationStatus: '暂不符合', stage: 'lost', status: '已放弃' },
    { id: 'record-6', tacticPackId: 'bathroom-douyin-measurement-v1', tacticLeadValues: fullValues, tacticQualificationStatus: '可人工推进', stage: 'intent', status: '已预约' },
    { id: 'record-7', tacticPackId: 'unknown-tactic', tacticLeadValues: fullValues, tacticQualificationStatus: '可人工推进', stage: 'customer', status: '服务中' },
  ], [
    { id: 'event-0', recordId: 'record-1', type: '首次人工承接', occurredAt: '2026-09-08T09:30', note: '已确认需求，待补照片。', createdAt: '2026-09-08T09:30' },
    { id: 'event-1', recordId: 'record-2', type: '预约已确认', occurredAt: '2026-08-27', note: '', createdAt: '2026-08-27' },
    { id: 'event-2', recordId: 'record-3', type: '已给方案', occurredAt: '2026-08-27', note: '', createdAt: '2026-08-27' },
    { id: 'event-3', recordId: 'record-3', type: '已报价', occurredAt: '2026-08-27', note: '', createdAt: '2026-08-27' },
    { id: 'event-4', recordId: 'record-4', type: '已成交', occurredAt: '2026-08-27', note: '', createdAt: '2026-08-27' },
    { id: 'event-5', recordId: 'record-5', type: '暂不推进', occurredAt: '2026-08-27', note: '', createdAt: '2026-08-27' },
    { id: 'event-6', recordId: 'record-6', type: '预约已确认', occurredAt: '2026-08-27', note: '', createdAt: '2026-08-27' },
    { id: 'event-7', recordId: 'record-3', type: '首次人工承接', occurredAt: '2026-09-08T10:15', note: '已确认需求。', createdAt: '2026-09-08T10:15' },
  ], '2026-09-08T10:30')

  assert.equal(rows.length, 1, '未知或已移除的打法不能进入复盘统计')
  assert.equal(rows[0].consultations, 6, '所有可识别打法咨询都应进入咨询数')
  assert.equal(rows[0].firstResponses, 2, '仅已记录首次人工承接的咨询应计入承接数')
  assert.equal(rows[0].firstResponsesPending, 1, '有时效但尚未回应的内容咨询应进入待承接')
  assert.equal(rows[0].firstResponsesOnTime, 1, '截止时间内记录的首次承接应计为按时')
  assert.equal(rows[0].firstResponsesLate, 1, '截止时间后记录的首次承接应计为超时')
  assert.equal(rows[0].informationComplete, 5, '只统计完整填写关键字段的咨询')
  assert.equal(rows[0].manuallyReady, 4, '只统计完整信息且人工确认可推进的咨询')
  assert.equal(rows[0].appointments, 2, '当前状态或已记录预约均应计入，且同一客户不重复计算')
  assert.equal(rows[0].proposalOrQuote, 1, '已记录方案或报价应计入，即使客户当前状态已变化')
  assert.equal(rows[0].customers, 1, '已记录成交应计入，即使客户当前阶段尚未同步')
  assert.equal(rows[0].notMoving, 1, '暂不符合或已放弃的记录应进入未推进统计')

  console.log('打法复盘测试通过：咨询、首次人工承接、资料补全、人工推进和已记录的预约、方案、成交均可追溯。')
} finally {
  fs.rmSync(outputFile, { force: true })
}
