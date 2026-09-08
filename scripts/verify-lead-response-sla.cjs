const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { buildSync } = require('esbuild')

const projectRoot = path.resolve(__dirname, '..')
const outputFile = path.join(os.tmpdir(), `acquisition-lead-response-sla-${process.pid}.cjs`)
const contentContext = { title: '已锁定内容' }

try {
  buildSync({
    entryPoints: [path.join(projectRoot, 'src/lead-response-sla.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: outputFile,
    logLevel: 'silent',
  })

  const sla = require(outputFile)
  assert.equal(sla.firstResponseDeadline('2026-09-08T10:00', '30分钟内'), '2026-09-08T10:30', '30 分钟时效应从实际进入时间计算')
  assert.equal(sla.firstResponseDeadline('2026-09-08T22:30', '2小时内'), '2026-09-09T00:30', '2 小时时效应支持跨天')
  assert.equal(sla.firstResponseDeadline('2026-09-08T10:00', '当天完成'), '2026-09-08T23:59', '当天完成应截止到当天 23:59')

  const base = { id: 'lead-1', stage: 'lead', contentLeadContext: contentContext, intakeAt: '2026-09-08T10:00', firstResponseDueAt: '2026-09-08T10:30' }
  assert.equal(sla.firstResponseSlaStatus(base, [], '2026-09-08T10:05'), '即将超时', '距截止不足 30 分钟且未回应应提示即将超时')
  assert.equal(sla.firstResponseSlaStatus(base, [], '2026-09-08T10:31'), '已超时', '超过截止仍未回应应标记已超时')
  assert.equal(sla.firstResponseSlaStatus(base, [{ id: 'on-time', recordId: 'lead-1', type: '首次人工承接', occurredAt: '2026-09-08T10:30', note: '', createdAt: '2026-09-08T10:30' }], '2026-09-08T11:00'), '按时承接', '截止时间内的实际首次回应应标记按时承接')
  assert.equal(sla.firstResponseSlaStatus(base, [{ id: 'late', recordId: 'lead-1', type: '首次人工承接', occurredAt: '2026-09-08T10:31', note: '', createdAt: '2026-09-08T10:31' }], '2026-09-08T11:00'), '超时承接', '截止时间后的实际首次回应应标记超时承接')
  assert.equal(sla.firstResponseSlaStatus({ ...base, firstResponseDueAt: '' }, [], '2026-09-08T11:00'), '未设时效', '历史记录没有时效时不能虚构超时结论')
  assert.equal(sla.firstResponseSlaStatus({ ...base, contentLeadContext: null }, [], '2026-09-08T11:00'), '不适用', '非内容来源记录不应进入首次承接 SLA')

  console.log('首次人工承接 SLA 测试通过：截止计算、待承接、超时、按时和历史数据边界均已覆盖。')
} finally {
  fs.rmSync(outputFile, { force: true })
}
