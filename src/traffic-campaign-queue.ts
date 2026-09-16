import type { GeneratedTopicCandidate, OpportunityChannelPerformance } from './topic-research'
import { campaignLifecycle, campaignTimingLabel, diagnoseCampaignPerformance, type CampaignLifecycle } from './traffic-campaign'

export type TrafficCampaignQueueItem = {
  opportunity: GeneratedTopicCandidate
  lifecycle: CampaignLifecycle
  action: string
  timing: string
  total: {
    reach: number
    interactions: number
    inquiries: number
    leads: number
    qualifiedLeads: number
    customers: number
  }
  priority: number
}

export type TrafficCampaignQueue = {
  items: TrafficCampaignQueueItem[]
  pendingStart: number
  preparing: number
  validating: number
  waitingReview: number
}

function dateValue(value: string) {
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function daysUntil(value: string, now: string) {
  const end = dateValue(value)
  const current = dateValue(now)
  if (!end || !current) return null
  return Math.ceil((end.getTime() - current.getTime()) / 86_400_000)
}

export function trafficCampaignQueue(topics: GeneratedTopicCandidate[], performanceByOpportunity: Record<string, OpportunityChannelPerformance[]>, now: string): TrafficCampaignQueue {
  const items = topics.flatMap((opportunity): TrafficCampaignQueueItem[] => {
    const lifecycle = campaignLifecycle(opportunity, now)
    if (lifecycle.status === '已复盘' || opportunity.status === '暂不采用') return []
    const results = performanceByOpportunity[opportunity.id] || []
    const total = results.reduce((summary, item) => ({
      reach: summary.reach + item.reach,
      interactions: summary.interactions + item.interactions,
      inquiries: summary.inquiries + item.platformInquiries,
      leads: summary.leads + item.registeredLeads,
      qualifiedLeads: summary.qualifiedLeads + item.qualifiedLeads,
      customers: summary.customers + item.customers,
    }), { reach: 0, interactions: 0, inquiries: 0, leads: 0, qualifiedLeads: 0, customers: 0 })
    const diagnosis = diagnoseCampaignPerformance({
      executed: results.some((item) => item.executed),
      reach: total.reach,
      interactions: total.interactions,
      platformInquiries: total.inquiries,
      registeredLeads: total.leads,
      qualifiedLeads: total.qualifiedLeads,
      customers: total.customers,
    })
    const days = daysUntil(opportunity.campaignEndsAt, now)
    if (lifecycle.status === '等待复盘') return [{ opportunity, lifecycle, action: '复盘本轮结果', timing: campaignTimingLabel(lifecycle.status, opportunity.campaignEndsAt), total, priority: 0 }]
    if (lifecycle.status === '执行准备中') return [{ opportunity, lifecycle, action: '确认是否已开始执行', timing: campaignTimingLabel(lifecycle.status, opportunity.campaignEndsAt), total, priority: 1 }]
    if (lifecycle.status === '待启动') return [{ opportunity, lifecycle, action: '建立渠道执行准备', timing: campaignTimingLabel(lifecycle.status, opportunity.campaignEndsAt), total, priority: 2 }]
    const timing = days === 0 ? '今天到验证截止，回收渠道结果。' : days === 1 ? '明天到验证截止，先补齐渠道结果。' : days !== null && days < 0 ? '验证期已到，请人工结束并复盘。' : campaignTimingLabel(lifecycle.status, opportunity.campaignEndsAt)
    return [{ opportunity, lifecycle, action: days !== null && days <= 1 ? '回收渠道结果' : diagnosis.nextAction, timing, total, priority: days !== null && days <= 1 ? 0 : 3 }]
  }).sort((left, right) => left.priority - right.priority || left.opportunity.campaignEndsAt.localeCompare(right.opportunity.campaignEndsAt) || right.opportunity.createdAt.localeCompare(left.opportunity.createdAt))

  return {
    items,
    pendingStart: items.filter((item) => item.lifecycle.status === '待启动').length,
    preparing: items.filter((item) => item.lifecycle.status === '执行准备中').length,
    validating: items.filter((item) => item.lifecycle.status === '验证中').length,
    waitingReview: items.filter((item) => item.lifecycle.status === '等待复盘').length,
  }
}
