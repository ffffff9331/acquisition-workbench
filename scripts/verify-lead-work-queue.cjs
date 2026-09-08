const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { buildSync } = require('esbuild')

const projectRoot = path.resolve(__dirname, '..')
const outputFile = path.join(os.tmpdir(), `acquisition-lead-work-queue-${process.pid}.cjs`)

try {
  buildSync({
    entryPoints: [path.join(projectRoot, 'src/lead-work-queue.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: outputFile,
    logLevel: 'silent',
  })

  const queue = require(outputFile)
  const records = [
    { id: 'overdue-response', stage: 'lead', name: '王女士', source: '抖音', owner: '店长', nextAction: '当天人工确认地区和尺寸', nextDate: '2026-09-06', contentLeadContext: { title: '内容 A' }, intakeAt: '2026-09-08T09:30', firstResponseDueAt: '2026-09-08T10:00' },
    { id: 'due-soon-response', stage: 'lead', name: '孙女士', source: '小红书', owner: '小林', nextAction: '人工确认户型照片', nextDate: '2026-09-08', contentLeadContext: { title: '内容 B' }, intakeAt: '2026-09-08T09:40', firstResponseDueAt: '2026-09-08T10:30' },
    { id: 'today-followup', stage: 'intent', name: '李先生', source: '线下活动', owner: '小周', nextAction: '确认到店时间', nextDate: '2026-09-08', contentLeadContext: null },
    { id: 'responded-future', stage: 'lead', name: '陈女士', source: '小红书', owner: '', nextAction: '等待户型图', nextDate: '2026-09-10', contentLeadContext: { title: '内容 C', inquiryOwner: '小吴' }, intakeAt: '2026-09-08T09:00', firstResponseDueAt: '2026-09-08T11:00' },
    { id: 'unscheduled-response', stage: 'lead', name: '赵女士', source: '抖音', owner: '', nextAction: '', nextDate: '', contentLeadContext: { title: '内容 D' } },
    { id: 'lost', stage: 'lost', name: '不应出现', source: '', owner: '', nextAction: '忽略', nextDate: '2026-09-01', contentLeadContext: { title: '内容 D' } },
  ]
  const result = queue.leadWorkQueue(records, [
    { id: 'response-1', recordId: 'responded-future', type: '首次人工承接', occurredAt: '2026-09-08T09:20', note: '已确认需求。', createdAt: '2026-09-08T09:20' },
  ], '2026-09-08T10:10')

  assert.equal(result.firstResponsePending, 3, '内容来源且尚未记录首次人工承接的线索应进入承接待办')
  assert.equal(result.unassignedFirstResponses, 1, '未指定负责人的首次承接应作为责任风险单独统计')
  assert.equal(result.firstResponseOverdue, 1, '超过首次承接截止仍未回应的内容咨询应单独统计')
  assert.equal(result.firstResponseDueSoon, 1, '距首次承接截止不足 30 分钟的内容咨询应单独统计')
  assert.equal(result.overdue, 1, '逾期事项只统计仍在推进的客户记录')
  assert.equal(result.dueToday, 2, '今天到期的事项应单独统计，即将超时承接也可同时拥有今天的下一步')
  assert.deepEqual(result.items.map((item) => item.record.id), ['overdue-response', 'due-soon-response', 'unscheduled-response', 'today-followup', 'responded-future'], '队列应优先已超时承接、即将超时承接、其他首次承接、当天事项和未来待办')
  assert.equal(result.items[0].kind, '首次人工承接', '内容线索在首次回应前应保留承接语义')
  assert.equal(result.items[0].timing, '已超时 · 10:00 截止', '首次承接超时应优先显示真实截止时间')
  assert.equal(result.items[1].timing, '即将超时 · 10:30 截止', '即将超时应显示真实截止时间')
  assert.equal(result.items[2].timing, '未设时效', '没有时效依据的历史首次承接不能伪装成今天事项')
  assert.equal(result.items.find((item) => item.record.id === 'responded-future')?.owner, '小吴', '队列应回退到已锁定内容中指定的咨询承接人')
  assert.equal(queue.workQueueTiming('2026-09-10', '2026-09-08'), '2 天后', '未来安排应提供可读的相对日期')

  console.log('线索工作队列测试通过：首次承接、逾期、当天和待安排事项均可按真实状态排序。')
} finally {
  fs.rmSync(outputFile, { force: true })
}
