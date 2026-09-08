export const trafficModes = ['主动需求截流', '平台自然推荐', '同城线下触达', '合作转介绍', '付费投放规划'] as const

export type TrafficMode = typeof trafficModes[number]
export type CampaignTestWindowDays = 7 | 14
export type CampaignStatus = '待启动' | '执行准备中' | '验证中' | '等待复盘' | '已复盘'

export type TrafficPlan = {
  primaryMode: TrafficMode
  backupModes: TrafficMode[]
  defaultTestWindowDays: CampaignTestWindowDays
  successSignal: string
  evidencePriorities: string[]
  firstExecutionGate: string
}

export type CampaignLifecycleInput = {
  campaignStatus: CampaignStatus
  campaignEndsAt: string
  reviewDecision: string
}

export type CampaignLifecycle = {
  status: CampaignStatus
  label: string
  tone: 'pending' | 'ready' | 'active' | 'review' | 'done'
}

export function normalizeTrafficMode(value: unknown, fallback: TrafficMode): TrafficMode {
  return trafficModes.includes(value as TrafficMode) ? value as TrafficMode : fallback
}

export function normalizeCampaignTestWindowDays(value: unknown, fallback: CampaignTestWindowDays = 7): CampaignTestWindowDays {
  if (value === 14 || value === '14') return 14
  if (value === 7 || value === '7') return 7
  return fallback
}

export function normalizeCampaignStatus(value: unknown, hasAdoptions: boolean, hasReviewDecision: boolean): CampaignStatus {
  if (value === '待启动' || value === '执行准备中' || value === '验证中' || value === '等待复盘' || value === '已复盘') return value
  if (hasReviewDecision) return '已复盘'
  return hasAdoptions ? '执行准备中' : '待启动'
}

function localDate(value: string) {
  if (!value) return null
  const parsed = new Date(value.includes('T') ? value : `${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function localDateTime(value: Date) {
  const parts = [value.getFullYear(), String(value.getMonth() + 1).padStart(2, '0'), String(value.getDate()).padStart(2, '0')]
  const time = [String(value.getHours()).padStart(2, '0'), String(value.getMinutes()).padStart(2, '0')]
  return `${parts.join('-')}T${time.join(':')}`
}

export function campaignEndAt(startedAt: string, days: CampaignTestWindowDays) {
  const start = localDate(startedAt)
  if (!start) return ''
  const end = new Date(start)
  end.setDate(end.getDate() + days)
  return localDateTime(end)
}

export function campaignLifecycle(input: CampaignLifecycleInput, now: string): CampaignLifecycle {
  if (input.reviewDecision || input.campaignStatus === '已复盘') return { status: '已复盘', label: '已复盘', tone: 'done' }
  if (input.campaignStatus === '待启动') return { status: '待启动', label: '待启动', tone: 'pending' }
  if (input.campaignStatus === '执行准备中') return { status: '执行准备中', label: '待人工开始', tone: 'ready' }
  if (input.campaignStatus === '等待复盘') return { status: '等待复盘', label: '等待复盘', tone: 'review' }
  const end = localDate(input.campaignEndsAt)
  const current = localDate(now)
  if (end && current && current.getTime() >= end.getTime()) return { status: '等待复盘', label: '验证期已到', tone: 'review' }
  return { status: '验证中', label: '验证中', tone: 'active' }
}

export function campaignTimingLabel(status: CampaignStatus, endsAt: string) {
  if (status === '待启动') return '先建立至少一项渠道执行准备。'
  if (status === '执行准备中') return '渠道准备已建立，等待人工确认实际开始。'
  if (status === '验证中') return endsAt ? `验证截止：${endsAt.replace('T', ' ')}` : '等待补充验证截止时间。'
  if (status === '等待复盘') return '验证已结束，记录本轮结论后再调整下一轮。'
  return '本轮结论已记录，可带入下一次机会判断。'
}
