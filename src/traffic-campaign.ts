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

export type CampaignPerformanceSummary = {
  executed: boolean
  reach: number
  interactions: number
  platformInquiries: number
  registeredLeads: number
  qualifiedLeads: number
  customers: number
}

export type CampaignPerformanceDiagnosis = {
  label: string
  tone: 'pending' | 'attention' | 'progress' | 'positive'
  nextAction: string
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

export function canStartCampaign(owner: string, startedAt: string, note: string) {
  return Boolean(owner.trim() && startedAt && note.trim())
}

export function diagnoseCampaignPerformance(summary: CampaignPerformanceSummary): CampaignPerformanceDiagnosis {
  if (!summary.executed) return { label: '尚未实际执行', tone: 'pending', nextAction: '先完成人工发布、触达、活动或合作动作，再开始判断这条路径是否有效。' }
  if (summary.customers > 0) return { label: '已带来客户', tone: 'positive', nextAction: '回看带来客户的具体来源、客户问题和承接动作，保留可复用的真实做法。' }
  if (summary.qualifiedLeads > 0) return { label: '有效线索待推进', tone: 'progress', nextAction: '为每位有效线索安排下一次人工跟进，优先推进预约、方案或报价。' }
  if (summary.registeredLeads > 0) return { label: '线索待筛选', tone: 'progress', nextAction: '补齐客户的需求与关键条件，完成一次人工判断后再决定是否推进。' }
  if (summary.platformInquiries > 0) return { label: '咨询未登记', tone: 'attention', nextAction: '把每次实际咨询登记为线索，才能判断内容问题还是后续承接问题。' }
  if (summary.reach > 0 || summary.interactions > 0) return { label: '流量未转咨询', tone: 'attention', nextAction: '回看客户问题、真实证明和行动引导是否足够具体，再调整下一次人工执行。' }
  return { label: '结果待回填', tone: 'pending', nextAction: '已确认执行，但尚无可观察结果；先按平台或现场实际情况回填，不把空数据当成零效果。' }
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
