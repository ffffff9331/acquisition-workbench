import { firstManualResponseEventType, type CustomerStageEvent } from './customer-events'
import { firstResponseSlaLabel, firstResponseSlaStatus, type FirstResponseSlaStatus } from './lead-response-sla'

export type LeadWorkQueueRecord = {
  id: string
  stage: string
  name: string
  source: string
  owner: string
  nextAction: string
  nextDate: string
  contentLeadContext: unknown | null
  intakeAt?: string
  firstResponseDueAt?: string
}

export type LeadWorkQueueKind = '首次人工承接' | '逾期跟进' | '今日跟进' | '待安排'

export type LeadWorkQueueItem = {
  record: LeadWorkQueueRecord
  kind: LeadWorkQueueKind
  priority: number
  timing: string
  needsFirstResponse: boolean
  owner: string
  slaStatus: FirstResponseSlaStatus
}

export type LeadWorkQueue = {
  firstResponsePending: number
  unassignedFirstResponses: number
  firstResponseDueSoon: number
  firstResponseOverdue: number
  overdue: number
  dueToday: number
  items: LeadWorkQueueItem[]
}

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function dayOffset(date: string, today: string) {
  const [year, month, day] = date.split('-').map(Number)
  const [todayYear, todayMonth, todayDay] = today.split('-').map(Number)
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(todayYear, todayMonth - 1, todayDay)) / 86_400_000)
}

export function workQueueTiming(nextDate: string, today: string) {
  if (!validDate(nextDate) || !validDate(today)) return '未安排日期'
  const offset = dayOffset(nextDate, today)
  if (offset === 0) return '今天处理'
  if (offset < 0) return `已逾期 ${Math.abs(offset)} 天`
  return `${offset} 天后`
}

function assignedOwner(record: LeadWorkQueueRecord) {
  if (record.owner.trim()) return record.owner.trim()
  if (!record.contentLeadContext || typeof record.contentLeadContext !== 'object') return ''
  const inquiryOwner = (record.contentLeadContext as { inquiryOwner?: unknown }).inquiryOwner
  return typeof inquiryOwner === 'string' ? inquiryOwner.trim() : ''
}

export function leadWorkQueue(records: LeadWorkQueueRecord[], events: CustomerStageEvent[], now: string): LeadWorkQueue {
  const today = now.slice(0, 10)
  const respondedRecordIds = new Set(events.filter((event) => event.type === firstManualResponseEventType).map((event) => event.recordId))
  const activeRecords = records.filter((record) => record.stage !== 'lost')
  const needsFirstResponse = (record: LeadWorkQueueRecord) => record.stage === 'lead' && Boolean(record.contentLeadContext) && !respondedRecordIds.has(record.id)
  const isOverdue = (record: LeadWorkQueueRecord) => validDate(record.nextDate) && record.nextDate < today
  const isDueToday = (record: LeadWorkQueueRecord) => validDate(record.nextDate) && record.nextDate === today

  const items = activeRecords.flatMap<LeadWorkQueueItem>((record) => {
    const firstResponse = needsFirstResponse(record)
    const slaStatus = firstResponseSlaStatus(record, events, now)
    const overdue = isOverdue(record)
    const dueToday = isDueToday(record)
    if (!firstResponse && !record.nextAction && !record.nextDate) return []

    const kind: LeadWorkQueueKind = firstResponse ? '首次人工承接' : overdue ? '逾期跟进' : dueToday ? '今日跟进' : '待安排'
    const priority = slaStatus === '已超时' ? -1 : overdue ? 0 : slaStatus === '即将超时' ? 1 : firstResponse ? 2 : dueToday ? 3 : record.nextDate ? 4 : 5
    const timing = firstResponse && ['待承接', '即将超时', '已超时', '未设时效'].includes(slaStatus) ? firstResponseSlaLabel(slaStatus, record.firstResponseDueAt || '') : workQueueTiming(record.nextDate, today)
    return [{ record, kind, priority, timing, needsFirstResponse: firstResponse, owner: assignedOwner(record), slaStatus }]
  }).sort((left, right) => left.priority - right.priority || (left.record.nextDate || '9999-12-31').localeCompare(right.record.nextDate || '9999-12-31') || left.record.name.localeCompare(right.record.name, 'zh-CN'))

  return {
    firstResponsePending: activeRecords.filter(needsFirstResponse).length,
    unassignedFirstResponses: activeRecords.filter((record) => needsFirstResponse(record) && !assignedOwner(record)).length,
    firstResponseDueSoon: activeRecords.filter((record) => needsFirstResponse(record) && firstResponseSlaStatus(record, events, now) === '即将超时').length,
    firstResponseOverdue: activeRecords.filter((record) => needsFirstResponse(record) && firstResponseSlaStatus(record, events, now) === '已超时').length,
    overdue: activeRecords.filter(isOverdue).length,
    dueToday: activeRecords.filter(isDueToday).length,
    items,
  }
}
