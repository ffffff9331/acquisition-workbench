const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { buildSync } = require('esbuild')

const projectRoot = path.resolve(__dirname, '..')
const outputFile = path.join(os.tmpdir(), `acquisition-customer-events-${process.pid}.cjs`)

try {
  buildSync({
    entryPoints: [path.join(projectRoot, 'src/customer-events.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: outputFile,
    logLevel: 'silent',
  })

  const events = require(outputFile)
  assert.equal(events.customerStageEventByType(events.firstManualResponseEventType).nextStage, undefined, '首次人工承接只记录事实，不应自动改变客户阶段')
  assert.equal(events.customerStageEventByType(events.ownershipHandoffEventType).nextStage, undefined, '负责人交接只记录责任事实，不应自动改变客户阶段')
  assert.equal(events.customerStageEventByType('已报价').nextStatus, '报价中', '已报价应同步到报价中')
  assert.equal(events.customerStageEventByType('完成关键沟通').nextStage, undefined, '关键沟通只记录过程，不改变当前阶段')
  assert.equal(events.customerStageEventByType('不存在的事项'), undefined, '未知事项不能被接受')

  const normalized = events.normalizeCustomerStageEvents([
    { id: 'event-0', recordId: 'record-0', type: events.firstManualResponseEventType, occurredAt: '2026-09-08', note: '已确认区域，待补现场照片。', createdAt: '2026-09-08' },
    { id: 'event-1', recordId: 'record-1', type: '预约已确认', occurredAt: '2026-08-27', note: 'x'.repeat(3200), createdAt: '2026-08-27' },
    { id: 'event-handoff', recordId: 'record-1', type: events.ownershipHandoffEventType, occurredAt: '2026-09-08T10:20', note: '由店长交接给小李。', createdAt: '2026-09-08T10:20' },
    { id: 'event-2', recordId: 'record-2', type: '未知事项', occurredAt: '2026-08-27', note: '', createdAt: '2026-08-27' },
    { id: '', recordId: 'record-3', type: '已成交', occurredAt: '2026-08-27', note: '', createdAt: '2026-08-27' },
    null,
  ])

  assert.equal(normalized.length, 3, '非法事项、缺少关联客户或空项应被过滤')
  assert.equal(normalized[0].type, events.firstManualResponseEventType, '首次人工承接应作为有效过程记录保留')
  assert.equal(normalized[1].type, '预约已确认', '有效事项应被保留')
  assert.equal(normalized[1].note.length, 3000, '备注应受本地存储长度限制')
  assert.equal(normalized[1].occurredAt, '2026-08-27', '发生日期应保留')
  assert.equal(normalized[2].type, events.ownershipHandoffEventType, '人工负责人交接应作为有效过程记录保留')

  console.log('客户推进事项测试通过：首次人工承接、有效类型、同步结果和本地数据清理均已覆盖。')
} finally {
  fs.rmSync(outputFile, { force: true })
}
