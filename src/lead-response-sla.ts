import { firstManualResponseEventType, type CustomerStageEvent } from './customer-events'

export const firstResponseTargets = ['30分钟内', '2小时内', '当天完成'] as const

export type FirstResponseTarget = typeof firstResponseTargets[number]
export type FirstResponseSlaStatus = '不适用' | '未设时效' | '待承接' | '即将超时' | '已超时' | '按时承接' | '超时承接'

export type FirstResponseSlaRecord = {
  id: string
  stage: string
  contentLeadContext?: unknown | null
  intakeAt?: string
  firstResponseDueAt?: string
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function nowLocalDateTime(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function normalizeFirstResponseTarget(value: unknown): FirstResponseTarget {
  return firstResponseTargets.includes(value as FirstResponseTarget) ? value as FirstResponseTarget : '当天完成'
}

function parseLocalDateTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const [datePart, timePart] = value.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)
  const result = new Date(year, month - 1, day, hours, minutes, 0, 0)
  return Number.isNaN(result.getTime()) ? null : result
}

export function firstResponseDeadline(intakeAt: string, target: FirstResponseTarget) {
  const intake = parseLocalDateTime(intakeAt)
  if (!intake) return ''
  if (target === '当天完成') return `${intake.getFullYear()}-${pad(intake.getMonth() + 1)}-${pad(intake.getDate())}T23:59`
  intake.setMinutes(intake.getMinutes() + (target === '30分钟内' ? 30 : 120))
  return nowLocalDateTime(intake)
}

function firstResponseEvent(events: CustomerStageEvent[], recordId: string) {
  return events.filter((event) => event.recordId === recordId && event.type === firstManualResponseEventType && /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(event.occurredAt)).sort((left, right) => left.occurredAt.localeCompare(right.occurredAt) || left.createdAt.localeCompare(right.createdAt))[0]
}

function hasContentLeadContext(value: unknown) {
  return Boolean(value && typeof value === 'object')
}

export function firstResponseSlaStatus(record: FirstResponseSlaRecord, events: CustomerStageEvent[], now: string): FirstResponseSlaStatus {
  if (!hasContentLeadContext(record.contentLeadContext)) return '不适用'
  const response = firstResponseEvent(events, record.id)
  const dueAt = record.firstResponseDueAt || ''
  if (response) {
    if (!dueAt || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(response.occurredAt)) return '未设时效'
    return response.occurredAt <= dueAt ? '按时承接' : '超时承接'
  }
  if (!dueAt) return '未设时效'
  if (now > dueAt) return '已超时'
  const deadline = parseLocalDateTime(dueAt)
  const current = parseLocalDateTime(now)
  if (deadline && current && deadline.getTime() - current.getTime() <= 30 * 60 * 1000) return '即将超时'
  return '待承接'
}

export function firstResponseSlaLabel(status: FirstResponseSlaStatus, dueAt: string) {
  if (status === '待承接' && dueAt) return `承接截止 ${dueAt.slice(11)}`
  if (status === '即将超时' && dueAt) return `即将超时 · ${dueAt.slice(11)} 截止`
  if (status === '已超时' && dueAt) return `已超时 · ${dueAt.slice(11)} 截止`
  return status
}
