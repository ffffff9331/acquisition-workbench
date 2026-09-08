import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, Check, CircleCheckBig, ExternalLink, Globe2, KeyRound, Lightbulb, Link2, LoaderCircle, Plus, Search, ShieldCheck, Sparkles, Target, Trash2, UsersRound, X } from 'lucide-react'
import { generateWithConfiguredService } from './ai-generation'
import type { AISecretStatus, AIServiceSettings } from './ai-service'
import { channelById, type ChannelId } from './channels'
import { buildIndustrySearchQuery, evaluateOpportunityByIndustryRules, industryRulePayload, type IndustryRulePack } from './industry-rules'
import { growthTacticPackPayload, type GrowthTacticPack } from './tactic-packs'
import { campaignEndAt, campaignLifecycle, campaignTimingLabel, normalizeCampaignStatus, normalizeCampaignTestWindowDays, normalizeTrafficMode, trafficModes, type CampaignStatus, type TrafficMode } from './traffic-campaign'

export type ResearchSource = 'web' | 'douyin' | 'xiaohongshu' | 'wechat' | 'bilibili'
export type ResearchFreshness = 'week' | 'month' | 'year' | 'all'

export type ResearchEvidence = {
  id: string
  query: string
  source: ResearchSource
  title: string
  url: string
  summary: string
  publishedDate: string
  discoveredAt: string
}

export type AcquisitionBrief = {
  offer: string
  targetCustomer: string
  serviceArea: string
  conversionGoal: string
  proofAssets: string
  differentiator: string
  constraints: string
}

export type OpportunityStatus = '待评估' | '已采用' | '暂不采用'
export type OpportunityDecision = '' | '继续投入' | '调整后再试' | '停止投入'
export { trafficModes } from './traffic-campaign'
export type { TrafficMode } from './traffic-campaign'

export type OpportunityAdoption = {
  channelId: ChannelId
  itemId: string
  adoptedAt: string
}

export type OpportunityChannelPerformance = {
  channelId: ChannelId
  itemId: string
  stage: string
  executed: boolean
  reach: number
  interactions: number
  platformInquiries: number
  registeredLeads: number
  qualifiedLeads: number
  customers: number
}

export type TopicResearchData = {
  brief: AcquisitionBrief
  evidence: ResearchEvidence[]
  generatedTopics: GeneratedTopicCandidate[]
}

export type GeneratedTopicCandidate = {
  id: string
  industryPackId: string
  tacticPackId: string
  title: string
  customerQuestion: string
  targetCustomer: string
  buyerStage: string
  demandSignal: string
  contentAngle: string
  keyPromise: string
  proofNeeded: string
  callToAction: string
  leadMagnet: string
  recommendedChannels: ChannelId[]
  trafficMode: TrafficMode
  testWindowDays: 7 | 14
  successSignal: string
  campaignStatus: CampaignStatus
  campaignOwner: string
  campaignStartedAt: string
  campaignEndsAt: string
  campaignNote: string
  campaignReviewedAt: string
  riskNote: string
  fitReason: string
  evidenceIds: string[]
  service: 'official' | 'custom'
  status: OpportunityStatus
  adoptedChannels: ChannelId[]
  adoptions: OpportunityAdoption[]
  reviewDecision: OpportunityDecision
  createdAt: string
}

type SearchResult = Omit<ResearchEvidence, 'id' | 'query' | 'source' | 'discoveredAt'> & { score: number }

export const emptyAcquisitionBrief: AcquisitionBrief = {
  offer: '',
  targetCustomer: '',
  serviceArea: '',
  conversionGoal: '',
  proofAssets: '',
  differentiator: '',
  constraints: '',
}

export const emptyTopicResearchData: TopicResearchData = { brief: emptyAcquisitionBrief, evidence: [], generatedTopics: [] }

const channelIds: ChannelId[] = ['douyin', 'xiaohongshu', 'wechat', 'offline', 'referral', 'bilibili']

const sourceOptions: Array<{ id: ResearchSource; label: string; searchLabel: string }> = [
  { id: 'web', label: '全网', searchLabel: '全网搜索' },
  { id: 'douyin', label: '抖音', searchLabel: '抖音站内搜索' },
  { id: 'xiaohongshu', label: '小红书', searchLabel: '小红书站内搜索' },
  { id: 'wechat', label: '微信内容', searchLabel: '微信内容搜索' },
  { id: 'bilibili', label: 'B站', searchLabel: 'B站站内搜索' },
]

function fallbackTrafficMode(channels: ChannelId[]): TrafficMode {
  if (channels.includes('referral')) return '合作转介绍'
  if (channels.includes('offline')) return '同城线下触达'
  return '平台自然推荐'
}

export function normalizeTopicResearchData(value: unknown): TopicResearchData {
  if (!value || typeof value !== 'object') return emptyTopicResearchData
  const rawBrief = (value as Partial<TopicResearchData>).brief
  const brief: AcquisitionBrief = rawBrief && typeof rawBrief === 'object' ? {
    offer: typeof rawBrief.offer === 'string' ? rawBrief.offer.slice(0, 300) : '',
    targetCustomer: typeof rawBrief.targetCustomer === 'string' ? rawBrief.targetCustomer.slice(0, 500) : '',
    serviceArea: typeof rawBrief.serviceArea === 'string' ? rawBrief.serviceArea.slice(0, 200) : '',
    conversionGoal: typeof rawBrief.conversionGoal === 'string' ? rawBrief.conversionGoal.slice(0, 300) : '',
    proofAssets: typeof rawBrief.proofAssets === 'string' ? rawBrief.proofAssets.slice(0, 1000) : '',
    differentiator: typeof rawBrief.differentiator === 'string' ? rawBrief.differentiator.slice(0, 600) : '',
    constraints: typeof rawBrief.constraints === 'string' ? rawBrief.constraints.slice(0, 600) : '',
  } : { ...emptyAcquisitionBrief }
  const evidence = Array.isArray((value as Partial<TopicResearchData>).evidence)
    ? (value as Partial<TopicResearchData>).evidence!.filter((item): item is ResearchEvidence => Boolean(item && typeof item.title === 'string' && typeof item.url === 'string')).map((item) => ({
      id: item.id || `evidence-${Date.now()}`,
      query: item.query || '',
      source: sourceOptions.some((source) => source.id === item.source) ? item.source : 'web',
      title: item.title,
      url: item.url,
      summary: item.summary || '',
      publishedDate: item.publishedDate || '',
      discoveredAt: item.discoveredAt || new Date().toISOString(),
    }))
    : []
  const generatedTopics = Array.isArray((value as Partial<TopicResearchData>).generatedTopics)
    ? (value as Partial<TopicResearchData>).generatedTopics!.filter((item): item is GeneratedTopicCandidate => Boolean(item && typeof item.title === 'string')).map((item) => {
      const recommendedChannels = Array.isArray(item.recommendedChannels) ? item.recommendedChannels.filter((id): id is ChannelId => channelIds.includes(id as ChannelId)).slice(0, 3) : []
      const adoptions = Array.isArray(item.adoptions) ? item.adoptions.filter((adoption): adoption is OpportunityAdoption => Boolean(adoption && channelIds.includes(adoption.channelId as ChannelId) && typeof adoption.itemId === 'string' && adoption.itemId)).map((adoption) => ({ channelId: adoption.channelId, itemId: adoption.itemId.slice(0, 200), adoptedAt: typeof adoption.adoptedAt === 'string' ? adoption.adoptedAt : '' })) : []
      const reviewDecision = (item.reviewDecision === '继续投入' || item.reviewDecision === '调整后再试' || item.reviewDecision === '停止投入' ? item.reviewDecision : '') as OpportunityDecision
      return {
      id: item.id || `generated-topic-${Date.now()}`,
      industryPackId: typeof item.industryPackId === 'string' ? item.industryPackId.slice(0, 200) : '',
      tacticPackId: typeof item.tacticPackId === 'string' ? item.tacticPackId.slice(0, 200) : '',
      title: item.title.trim().slice(0, 160),
      customerQuestion: typeof item.customerQuestion === 'string' ? item.customerQuestion.trim().slice(0, 300) : '',
      targetCustomer: typeof item.targetCustomer === 'string' ? item.targetCustomer.trim().slice(0, 300) : '',
      buyerStage: typeof item.buyerStage === 'string' ? item.buyerStage.trim().slice(0, 100) : '',
      demandSignal: typeof item.demandSignal === 'string' ? item.demandSignal.trim().slice(0, 500) : '',
      contentAngle: typeof item.contentAngle === 'string' ? item.contentAngle.trim().slice(0, 400) : typeof (item as GeneratedTopicCandidate & { angle?: string }).angle === 'string' ? (item as GeneratedTopicCandidate & { angle?: string }).angle!.trim().slice(0, 400) : '',
      keyPromise: typeof item.keyPromise === 'string' ? item.keyPromise.trim().slice(0, 400) : '',
      proofNeeded: typeof item.proofNeeded === 'string' ? item.proofNeeded.trim().slice(0, 600) : '',
      callToAction: typeof item.callToAction === 'string' ? item.callToAction.trim().slice(0, 300) : '',
      leadMagnet: typeof item.leadMagnet === 'string' ? item.leadMagnet.trim().slice(0, 300) : '',
      recommendedChannels,
      trafficMode: normalizeTrafficMode(item.trafficMode, fallbackTrafficMode(recommendedChannels)),
      testWindowDays: normalizeCampaignTestWindowDays(item.testWindowDays),
      successSignal: typeof item.successSignal === 'string' ? item.successSignal.trim().slice(0, 400) : '记录有效咨询、进入下一步和实际成交，不只看播放量。',
      campaignStatus: normalizeCampaignStatus(item.campaignStatus, adoptions.length > 0, Boolean(reviewDecision)),
      campaignOwner: typeof item.campaignOwner === 'string' ? item.campaignOwner.trim().slice(0, 120) : '',
      campaignStartedAt: typeof item.campaignStartedAt === 'string' ? item.campaignStartedAt.slice(0, 40) : '',
      campaignEndsAt: typeof item.campaignEndsAt === 'string' ? item.campaignEndsAt.slice(0, 40) : '',
      campaignNote: typeof item.campaignNote === 'string' ? item.campaignNote.trim().slice(0, 1000) : '',
      campaignReviewedAt: typeof item.campaignReviewedAt === 'string' ? item.campaignReviewedAt.slice(0, 40) : '',
      riskNote: typeof item.riskNote === 'string' ? item.riskNote.trim().slice(0, 500) : '',
      fitReason: typeof item.fitReason === 'string' ? item.fitReason.trim().slice(0, 500) : typeof (item as GeneratedTopicCandidate & { reason?: string }).reason === 'string' ? (item as GeneratedTopicCandidate & { reason?: string }).reason!.trim().slice(0, 500) : '',
      evidenceIds: Array.isArray(item.evidenceIds) ? item.evidenceIds.filter((id): id is string => typeof id === 'string').slice(0, 8) : [],
      service: item.service === 'custom' ? 'custom' as const : 'official' as const,
      status: (item.status === '已采用' || item.status === '暂不采用' ? item.status : '待评估') as OpportunityStatus,
      adoptedChannels: Array.isArray(item.adoptedChannels) ? item.adoptedChannels.filter((id): id is ChannelId => channelIds.includes(id as ChannelId)) : [],
      adoptions,
      reviewDecision,
      createdAt: item.createdAt || new Date().toISOString(),
    }}).filter((item) => item.title)
    : []
  return { brief, evidence, generatedTopics }
}

function generatedTopicsFromOutput(output: unknown, tacticPack?: GrowthTacticPack) {
  const candidates = Array.isArray(output) ? output : output && typeof output === 'object' && Array.isArray((output as { topics?: unknown }).topics) ? (output as { topics: unknown[] }).topics : []
  return candidates.map((item) => {
    if (!item || typeof item !== 'object') return null
    const candidate = item as Record<string, unknown>
    const title = typeof candidate.title === 'string' ? candidate.title.trim().slice(0, 160) : ''
    if (!title) return null
    const recommendedChannels = Array.isArray(candidate.recommendedChannels) ? candidate.recommendedChannels.filter((id): id is ChannelId => channelIds.includes(id as ChannelId)).slice(0, 3) : []
    return {
      title,
      customerQuestion: typeof candidate.customerQuestion === 'string' ? candidate.customerQuestion.trim().slice(0, 300) : '',
      targetCustomer: typeof candidate.targetCustomer === 'string' ? candidate.targetCustomer.trim().slice(0, 300) : '',
      buyerStage: typeof candidate.buyerStage === 'string' ? candidate.buyerStage.trim().slice(0, 100) : '',
      demandSignal: typeof candidate.demandSignal === 'string' ? candidate.demandSignal.trim().slice(0, 500) : '',
      contentAngle: typeof candidate.contentAngle === 'string' ? candidate.contentAngle.trim().slice(0, 400) : '',
      keyPromise: typeof candidate.keyPromise === 'string' ? candidate.keyPromise.trim().slice(0, 400) : '',
      proofNeeded: typeof candidate.proofNeeded === 'string' ? candidate.proofNeeded.trim().slice(0, 600) : '',
      callToAction: typeof candidate.callToAction === 'string' ? candidate.callToAction.trim().slice(0, 300) : '',
      leadMagnet: typeof candidate.leadMagnet === 'string' ? candidate.leadMagnet.trim().slice(0, 300) : '',
      recommendedChannels,
      trafficMode: normalizeTrafficMode(candidate.trafficMode, tacticPack?.trafficPlan.primaryMode || fallbackTrafficMode(recommendedChannels)),
      testWindowDays: normalizeCampaignTestWindowDays(candidate.testWindowDays, tacticPack?.trafficPlan.defaultTestWindowDays),
      successSignal: typeof candidate.successSignal === 'string' && candidate.successSignal.trim() ? candidate.successSignal.trim().slice(0, 400) : tacticPack?.trafficPlan.successSignal || '记录有效咨询、进入下一步和实际成交，不只看播放量。',
      riskNote: typeof candidate.riskNote === 'string' ? candidate.riskNote.trim().slice(0, 500) : '',
      fitReason: typeof candidate.fitReason === 'string' ? candidate.fitReason.trim().slice(0, 500) : '',
      evidenceIds: Array.isArray(candidate.evidenceIds) ? candidate.evidenceIds.filter((id): id is string => typeof id === 'string').slice(0, 8) : [],
    }
  }).filter((item): item is NonNullable<typeof item> => Boolean(item)).slice(0, 6)
}

function platformSearchUrl(source: ResearchSource, query: string) {
  const encoded = encodeURIComponent(query.trim())
  if (source === 'douyin') return `https://www.douyin.com/search/${encoded}?type=general`
  if (source === 'xiaohongshu') return `https://www.xiaohongshu.com/search_result?keyword=${encoded}&source=web_search_result_notes`
  if (source === 'wechat') return `https://weixin.sogou.com/weixin?type=2&query=${encoded}`
  if (source === 'bilibili') return `https://search.bilibili.com/all?keyword=${encoded}`
  return `https://www.baidu.com/s?wd=${encoded}`
}

function sourceLabel(source: ResearchSource) {
  return sourceOptions.find((item) => item.id === source)?.label || '全网'
}

function formatDiscoveredAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '刚刚'
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}

const researchDirections: Array<{ label: string; hint: string; build: (brief: AcquisitionBrief) => string }> = [
  { label: '客户原话', hint: '寻找真实问题和描述方式', build: (brief) => `${brief.offer} ${brief.targetCustomer} 常见问题 后悔 怎么办` },
  { label: '比较决策', hint: '寻找价格、方案与选择标准', build: (brief) => `${brief.offer} 怎么选 价格 对比 区别` },
  { label: '避坑投诉', hint: '寻找失败原因和购买阻力', build: (brief) => `${brief.offer} 避坑 投诉 翻车 返工` },
  { label: '案例结果', hint: '寻找可证明的前后变化', build: (brief) => `${brief.offer} 真实案例 前后对比 效果` },
  { label: '本地需求', hint: '寻找可服务范围内的明确需求', build: (brief) => `${brief.serviceArea} ${brief.offer} 咨询 预约 推荐` },
]

function evidenceDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function opportunityReadiness(item: GeneratedTopicCandidate, evidence: ResearchEvidence[]) {
  const matchedEvidence = item.evidenceIds.filter((id) => evidence.some((source) => source.id === id)).length
  const executionFields = [item.targetCustomer, item.contentAngle, item.keyPromise, item.proofNeeded, item.callToAction, item.trafficMode, item.successSignal].filter(Boolean).length
  if (matchedEvidence >= 2 && executionFields >= 7) return { label: '可启动战役', tone: 'ready' }
  if (matchedEvidence >= 1 && executionFields >= 3) return { label: '需要人工补充', tone: 'review' }
  return { label: '证据不足', tone: 'blocked' }
}

export function TopicResearchPanel({ data, industryPack, tacticPack, aiSettings, aiSecrets, enabledChannels, performanceByOpportunity, onChange, onToast, onOpenAIService, onOfficialUsage, onAdoptOpportunity, onOpenChannel }: { data: TopicResearchData; industryPack?: IndustryRulePack; tacticPack?: GrowthTacticPack; aiSettings: AIServiceSettings; aiSecrets: AISecretStatus; enabledChannels: ChannelId[]; performanceByOpportunity: Record<string, OpportunityChannelPerformance[]>; onChange: (updater: (current: TopicResearchData) => TopicResearchData) => void; onToast: (message: string) => void; onOpenAIService: () => void; onOfficialUsage: (usage: { pointsCharged: number; balanceAfter: number }) => void; onAdoptOpportunity: (opportunity: GeneratedTopicCandidate, channelId: ChannelId) => string; onOpenChannel: (channelId: ChannelId) => void }) {
  const [query, setQuery] = useState('')
  const [source, setSource] = useState<ResearchSource>('web')
  const [freshness, setFreshness] = useState<ResearchFreshness>('month')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [searchKeySaved, setSearchKeySaved] = useState(false)
  const [secureStorageAvailable, setSecureStorageAvailable] = useState(false)
  const [lastSearch, setLastSearch] = useState<{ query: string; source: ResearchSource } | null>(null)
  const [generating, setGenerating] = useState(false)
  const [campaignEditor, setCampaignEditor] = useState<GeneratedTopicCandidate | null>(null)
  const [campaignStarter, setCampaignStarter] = useState<GeneratedTopicCandidate | null>(null)

  useEffect(() => {
    const getStatus = window.workbenchDesktop?.research?.getSecretStatus
    if (!getStatus) return
    void getStatus().then((status) => {
      setSearchKeySaved(status.searchApiKeySaved)
      setSecureStorageAvailable(status.secureStorageAvailable)
    }).catch(() => undefined)
  }, [])

  const savedUrls = useMemo(() => new Set(data.evidence.map((item) => item.url)), [data.evidence])
  const distinctQueries = useMemo(() => new Set(data.evidence.map((item) => item.query.trim()).filter(Boolean)).size, [data.evidence])
  const distinctDomains = useMemo(() => new Set(data.evidence.map((item) => evidenceDomain(item.url))).size, [data.evidence])
  const briefReady = Boolean(data.brief.offer.trim() && data.brief.targetCustomer.trim() && data.brief.conversionGoal.trim())
  const canGenerate = briefReady && data.evidence.length >= 2

  const updateBrief = (key: keyof AcquisitionBrief, value: string) => {
    onChange((current) => ({ ...current, brief: { ...current.brief, [key]: value } }))
  }

  const useResearchDirection = (build: (brief: AcquisitionBrief) => string) => {
    const nextQuery = build(data.brief).replace(/\s+/g, ' ').trim()
    if (!data.brief.offer.trim()) {
      setError('先填写主推产品或服务，再选择研究方向。')
      return
    }
    setQuery(nextQuery)
    setError('')
  }

  const useIndustrySearchDirection = (directionId: string) => {
    if (!industryPack || !data.brief.offer.trim()) {
      setError('先填写主推产品或服务，再使用行业搜索方向。')
      return
    }
    setQuery(buildIndustrySearchQuery(industryPack, directionId, data.brief))
    setError('')
  }

  const runSearch = async () => {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) {
      setError('先输入要研究的问题或关键词。')
      return
    }
    const searchApi = window.workbenchDesktop?.research?.search
    if (!searchApi || !searchKeySaved) {
      setError(searchApi ? '请先配置联网搜索服务。' : '浏览器预览不能直接调用搜索服务，请使用平台搜索或在 Windows 桌面版中搜索。')
      return
    }
    setSearching(true)
    setError('')
    try {
      const response = await searchApi({ query: normalizedQuery, source, freshness })
      if (!response.ok) {
        setError(response.message || '本次搜索未返回结果。')
        return
      }
      setResults(response.results)
      setLastSearch({ query: normalizedQuery, source })
      if (!response.results.length) setError('没有找到可用结果，可以换一个更具体的问题。')
    } catch {
      setError('联网搜索失败，请检查网络或搜索服务配置。')
    } finally {
      setSearching(false)
    }
  }

  const openPlatformSearch = () => {
    if (!query.trim()) {
      setError('先输入要研究的问题或关键词。')
      return
    }
    window.open(platformSearchUrl(source, query), '_blank', 'noopener,noreferrer')
  }

  const saveEvidence = (result: SearchResult) => {
    const searchContext = lastSearch || { query: query.trim(), source }
    if (savedUrls.has(result.url)) {
      onToast('这条来源已经保存')
      return
    }
    const item: ResearchEvidence = {
      id: `evidence-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      query: searchContext.query,
      source: searchContext.source,
      title: result.title,
      url: result.url,
      summary: result.summary,
      publishedDate: result.publishedDate,
      discoveredAt: new Date().toISOString(),
    }
    onChange((current) => ({ ...current, evidence: [item, ...current.evidence] }))
    onToast('已保存为需求证据')
  }

  const addManualEvidence = (formData: FormData) => {
    const title = String(formData.get('title') || '').trim()
    const url = String(formData.get('url') || '').trim()
    if (!title || !url) return
    if (savedUrls.has(url)) {
      onToast('这条来源已经保存')
      return
    }
    const item: ResearchEvidence = {
      id: `evidence-${Date.now()}`,
      query: query.trim(),
      source,
      title,
      url,
      summary: String(formData.get('summary') || '').trim(),
      publishedDate: String(formData.get('publishedDate') || ''),
      discoveredAt: new Date().toISOString(),
    }
    onChange((current) => ({ ...current, evidence: [item, ...current.evidence] }))
    setManualOpen(false)
    onToast('搜索发现已保存')
  }

  const removeEvidence = (id: string) => {
    onChange((current) => ({ ...current, evidence: current.evidence.filter((item) => item.id !== id) }))
    onToast('已移除这条来源')
  }

  const generateTopics = async () => {
    if (!briefReady) {
      setError('先补全主推产品、目标客户和客户下一步动作。')
      return
    }
    if (data.evidence.length < 2) {
      setError('至少保存 2 条真实来源再生成，避免模型依据单一页面下结论。')
      return
    }
    const officialReady = aiSettings.mode === 'official' && Boolean(aiSettings.officialWorkspaceId) && aiSecrets.officialTokenSaved
    const customReady = aiSettings.mode === 'custom' && Boolean(aiSettings.customBaseUrl) && Boolean(aiSettings.customModel) && aiSecrets.customApiKeySaved
    if (!officialReady && !customReady) {
      setError('请先配置 AI 服务，再从证据形成流量战役。')
      return
    }
    setGenerating(true)
    setError('')
    try {
      const response = await generateWithConfiguredService(aiSettings, aiSecrets, {
        task: 'acquisition_opportunities',
        payload: {
          brief: data.brief,
          industryRules: industryRulePayload(industryPack),
          tacticPack: growthTacticPackPayload(tacticPack),
          query: query.trim() || data.evidence[0]?.query || '',
          evidence: data.evidence.slice(0, 8).map((item) => ({ id: item.id, source: item.source, title: item.title, summary: item.summary, publishedDate: item.publishedDate })),
          requirements: {
            outputCount: 4,
            allowedChannels: channelIds,
            rules: ['每条机会至少引用一条 evidenceId', '不得虚构销量、效果、客户案例或平台热度', '行动引导必须与 brief.conversionGoal 一致', '所需证明必须是商家可以实际提供的素材', '每条机会必须给出 trafficMode，只能从：主动需求截流、平台自然推荐、同城线下触达、合作转介绍、付费投放规划中选择', '每条机会必须给出 testWindowDays，只能为 7 或 14', '每条机会必须给出 successSignal，优先使用有效咨询、预约、到店、报价或成交等可核对信号，不得只写播放量', ...(tacticPack ? [`优先推荐 ${tacticPack.channelId}，并使行动引导与当前打法包的主要动作一致`] : [])],
          },
          validatedHistory: data.generatedTopics.filter((item) => item.reviewDecision).slice(0, 8).map((item) => ({
            title: item.title,
            buyerStage: item.buyerStage,
            contentAngle: item.contentAngle,
            proofNeeded: item.proofNeeded,
            callToAction: item.callToAction,
            decision: item.reviewDecision,
            results: (performanceByOpportunity[item.id] || []).map((result) => ({ channel: result.channelId, stage: result.stage, reach: result.reach, interactions: result.interactions, inquiries: result.platformInquiries, registeredLeads: result.registeredLeads, qualifiedLeads: result.qualifiedLeads, customers: result.customers })),
          })),
        },
      })
      if (!response.ok) {
        setError(response.message || '本次流量战役生成失败。')
        return
      }
      if (response.usage) onOfficialUsage(response.usage)
      const generated = generatedTopicsFromOutput(response.output, tacticPack)
      if (!generated.length || !response.service) {
        setError(response.usage
          ? `官方网关已记录本次用量并扣除 ${response.usage.pointsCharged} 积分，但没有返回可用流量战役。请保留请求时间并联系服务人员核查。`
          : '模型没有返回可用流量战役，请调整证据后重试。')
        return
      }
      const createdAt = new Date().toISOString()
      onChange((current) => ({
        ...current,
        generatedTopics: generated.map((item, index) => ({ ...item, id: `generated-topic-${Date.now()}-${index}`, industryPackId: industryPack?.id || '', tacticPackId: tacticPack?.id || '', service: response.service!, status: '待评估', adoptedChannels: [], adoptions: [], campaignStatus: '待启动', campaignOwner: '', campaignStartedAt: '', campaignEndsAt: '', campaignNote: '', campaignReviewedAt: '', reviewDecision: '', createdAt })),
      }))
      if (response.usage) {
        onToast(`已形成 ${generated.length} 个获客机会，消耗 ${response.usage.pointsCharged} 积分`)
      } else {
        onToast(`已用自有 AI 服务形成 ${generated.length} 个获客机会`)
      }
    } catch {
      setError('流量战役生成失败，请检查 AI 服务后重试。')
    } finally {
      setGenerating(false)
    }
  }

  const removeGeneratedTopic = (id: string) => {
    onChange((current) => ({ ...current, generatedTopics: current.generatedTopics.filter((item) => item.id !== id) }))
    onToast('已移除这条获客机会')
  }

  const setOpportunityStatus = (id: string, status: OpportunityStatus) => {
    onChange((current) => ({ ...current, generatedTopics: current.generatedTopics.map((item) => item.id === id ? { ...item, status } : item) }))
    onToast(status === '已采用' ? '已保留这条获客机会' : '已标记为暂不采用')
  }

  const adoptToChannel = (item: GeneratedTopicCandidate, channelId: ChannelId) => {
    const readiness = opportunityReadiness(item, data.evidence)
    if (readiness.tone === 'blocked') {
      setError('这条机会还缺少可核对的证据或执行信息，补充后再进入渠道。')
      return
    }
    const itemId = onAdoptOpportunity(item, channelId)
    const adoptedAt = new Date().toISOString()
    onChange((current) => ({
      ...current,
      generatedTopics: current.generatedTopics.map((topic) => topic.id === item.id ? { ...topic, status: '已采用', campaignStatus: topic.campaignStatus === '待启动' ? '执行准备中' : topic.campaignStatus, adoptedChannels: topic.adoptedChannels.includes(channelId) ? topic.adoptedChannels : [...topic.adoptedChannels, channelId], adoptions: topic.adoptions.some((adoption) => adoption.channelId === channelId && adoption.itemId === itemId) ? topic.adoptions : [...topic.adoptions, { channelId, itemId, adoptedAt }] } : topic),
    }))
  }

  const setReviewDecision = (id: string, reviewDecision: OpportunityDecision) => {
    onChange((current) => ({ ...current, generatedTopics: current.generatedTopics.map((item) => item.id === id ? { ...item, reviewDecision, campaignStatus: reviewDecision ? '已复盘' : '等待复盘', campaignReviewedAt: reviewDecision ? new Date().toISOString() : '' } : item) }))
    onToast(reviewDecision ? `已记录复盘结论：${reviewDecision}` : '已清除复盘结论')
  }

  const startTrafficCampaign = (formData: FormData) => {
    if (!campaignStarter) return
    if (!campaignStarter.adoptions.length) {
      setError('先建立至少一项渠道执行准备，再记录本轮人工开始。')
      return
    }
    const campaignOwner = String(formData.get('campaignOwner') || '').trim().slice(0, 120)
    const campaignStartedAt = String(formData.get('campaignStartedAt') || '').slice(0, 40)
    const campaignNote = String(formData.get('campaignNote') || '').trim().slice(0, 1000)
    if (!campaignOwner || !campaignStartedAt) {
      setError('请记录本轮负责人和实际开始时间。')
      return
    }
    const campaignEndsAt = campaignEndAt(campaignStartedAt, campaignStarter.testWindowDays)
    if (!campaignEndsAt) {
      setError('实际开始时间无法识别，请重新填写。')
      return
    }
    onChange((current) => ({ ...current, generatedTopics: current.generatedTopics.map((item) => item.id === campaignStarter.id ? { ...item, campaignStatus: '验证中', campaignOwner, campaignStartedAt, campaignEndsAt, campaignNote, campaignReviewedAt: '', reviewDecision: '' } : item) }))
    setCampaignStarter(null)
    onToast(`已开始 ${campaignStarter.testWindowDays} 天验证，截止到 ${campaignEndsAt.replace('T', ' ')}`)
  }

  const finishTrafficCampaign = (opportunity: GeneratedTopicCandidate) => {
    onChange((current) => ({ ...current, generatedTopics: current.generatedTopics.map((item) => item.id === opportunity.id ? { ...item, campaignStatus: '等待复盘' } : item) }))
    onToast('本轮验证已结束，请根据已有咨询、线索和客户结果记录结论')
  }

  const updateTrafficCampaign = (formData: FormData) => {
    if (!campaignEditor) return
    const trafficMode = normalizeTrafficMode(formData.get('trafficMode'), fallbackTrafficMode(campaignEditor.recommendedChannels))
    const testWindowDays = normalizeCampaignTestWindowDays(formData.get('testWindowDays'))
    const callToAction = String(formData.get('callToAction') || '').trim().slice(0, 300)
    const successSignal = String(formData.get('successSignal') || '').trim().slice(0, 400)
    if (!callToAction || !successSignal) {
      setError('请补齐客户下一步和本轮成功信号，再保存流量战役。')
      return
    }
    onChange((current) => ({
      ...current,
      generatedTopics: current.generatedTopics.map((item) => item.id === campaignEditor.id ? { ...item, trafficMode, testWindowDays, callToAction, successSignal } : item),
    }))
    setCampaignEditor(null)
    onToast('流量战役已更新')
  }

  return <>
    <section className="topic-research-band">
      <div className="topic-research-head">
        <span className="topic-research-icon"><Globe2 size={20} /></span>
        <div><h2>需求雷达</h2><p>先找到真实需求，再把它变成一场可执行、可验证的流量战役。</p></div>
        <button className={`button button-secondary small ${searchKeySaved ? 'configured' : ''}`} type="button" onClick={() => setSettingsOpen(true)}><KeyRound size={14} />{searchKeySaved ? '搜索服务已配置' : '配置搜索服务'}</button>
      </div>
      <div className="acquisition-brief">
        <div className="acquisition-brief-heading"><div><Target size={16} /><strong>本次流量任务</strong></div><span>{briefReady ? <><CircleCheckBig size={13} />目标已明确</> : <><AlertTriangle size={13} />先补全必填项</>}</span></div>
        <div className="acquisition-brief-grid">
          <label><span>主推产品或服务 *</span><input value={data.brief.offer} onChange={(event) => updateBrief('offer', event.target.value)} placeholder="例如：旧卫生间局部改造" /></label>
          <label><span>目标客户 *</span><input value={data.brief.targetCustomer} onChange={(event) => updateBrief('targetCustomer', event.target.value)} placeholder="例如：准备翻新老房卫生间的本地业主" /></label>
          <label><span>服务范围</span><input value={data.brief.serviceArea} onChange={(event) => updateBrief('serviceArea', event.target.value)} placeholder="例如：成都高新区及周边 20 公里" /></label>
          <label><span>希望客户下一步做什么 *</span><input value={data.brief.conversionGoal} onChange={(event) => updateBrief('conversionGoal', event.target.value)} placeholder="例如：私信户型，预约免费初步判断" /></label>
          <label className="wide"><span>可以拿出的真实证明</span><textarea rows={3} value={data.brief.proofAssets} onChange={(event) => updateBrief('proofAssets', event.target.value)} placeholder="案例前后对比、现场视频、尺寸清单、报价结构、客户授权评价等" /></label>
          <label><span>相较替代方案的优势</span><textarea rows={3} value={data.brief.differentiator} onChange={(event) => updateBrief('differentiator', event.target.value)} placeholder="只写真实存在、客户能感知的差异" /></label>
          <label><span>不能承诺或不接的情况</span><textarea rows={3} value={data.brief.constraints} onChange={(event) => updateBrief('constraints', event.target.value)} placeholder="服务边界、价格边界、不能保证的效果" /></label>
        </div>
      </div>
      {industryPack && <div className="active-industry-rules"><ShieldCheck size={16} /><div><strong>{industryPack.name}正在约束本次研究</strong><p>搜索扩词、需求信号、来源筛选、机会评分和证据要求会使用此规则包；具体标题仍由当前商家资料与真实来源生成。</p></div><span>v{industryPack.version}</span></div>}
      {tacticPack && <div className="active-tactic-pack"><Target size={16} /><div><strong>{tacticPack.name}正在组织本次路径</strong><p>研究、人工执行与线索承接会优先围绕这份打法包的目标客户、场景、主要动作和可复盘指标；不会写入固定标题或自动执行沟通。</p></div><span>v{tacticPack.version}</span></div>}
      <div className="research-directions"><div><Search size={15} /><strong>需求搜索方向</strong><span>每次换一个方向搜索，避免只看同行内容或单一平台。</span></div><div>{researchDirections.map((item) => <button key={item.label} type="button" title={item.hint} onClick={() => useResearchDirection(item.build)}>{item.label}</button>)}</div></div>
      {industryPack && <div className="research-directions industry"><div><Target size={15} /><strong>{industryPack.industry}扩词</strong><span>把当前产品、客户和地区带入行业搜索，不使用预制选题。</span></div><div>{industryPack.searchDirections.map((item) => <button key={item.id} type="button" title={`${item.hint} ${item.intent}`} onClick={() => useIndustrySearchDirection(item.id)}>{item.label}</button>)}</div></div>}
      <form className="topic-search-form" onSubmit={(event) => { event.preventDefault(); void runSearch() }}>
        <label className="topic-query-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入客户问题、产品、场景或竞品关键词" /></label>
        <label><span>来源</span><select value={source} onChange={(event) => setSource(event.target.value as ResearchSource)}>{sourceOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label><span>时间</span><select value={freshness} onChange={(event) => setFreshness(event.target.value as ResearchFreshness)}><option value="week">近一周</option><option value="month">近一月</option><option value="year">近一年</option><option value="all">不限</option></select></label>
        <button className="button button-primary" type="submit" disabled={searching}>{searching ? <LoaderCircle className="spin" size={16} /> : <Search size={16} />}{searching ? '正在搜索' : '联网搜索'}</button>
      </form>
      <div className="topic-search-secondary"><button className="text-button" type="button" onClick={openPlatformSearch}><ExternalLink size={14} />打开{sourceOptions.find((item) => item.id === source)?.searchLabel}</button><span>平台页面由本人浏览，不自动抓取账号、评论或私信。</span><button className="text-button" type="button" onClick={() => setManualOpen(true)}><Plus size={14} />保存页面发现</button></div>
      {error && <div className="topic-search-error">{error}</div>}
      {results.length > 0 && <div className="topic-result-list">{results.map((result) => <article key={result.url} className="topic-result-row"><div><span>{sourceLabel(lastSearch?.source || source)}{result.publishedDate ? ` · ${result.publishedDate}` : ''}</span><h3>{result.title}</h3><p>{result.summary || '搜索服务未返回摘要，请打开来源查看。'}</p><button className="topic-source-link" type="button" onClick={() => window.open(result.url, '_blank', 'noopener,noreferrer')}><Link2 size={13} />查看原始来源</button></div><button className="button button-secondary small" type="button" disabled={savedUrls.has(result.url)} onClick={() => saveEvidence(result)}>{savedUrls.has(result.url) ? <Check size={14} /> : <Plus size={14} />}{savedUrls.has(result.url) ? '已保存' : '保存证据'}</button></article>)}</div>}
      <div className="topic-evidence-head"><div><Lightbulb size={16} /><strong>需求证据</strong><span>{data.evidence.length}</span></div><div className="topic-evidence-actions"><small>{data.evidence.length < 2 ? `还需 ${2 - data.evidence.length} 条来源` : `${distinctQueries || 1} 个搜索问题 · ${distinctDomains} 个来源站点`}</small><button className="button button-primary small" type="button" disabled={generating || !canGenerate} onClick={() => void generateTopics()}>{generating ? <LoaderCircle className="spin" size={14} /> : <Sparkles size={14} />}{generating ? '正在分析' : '形成流量战役'}</button></div></div>
      {data.evidence.length ? <div className="topic-evidence-list">{data.evidence.slice(0, 8).map((item) => <article key={item.id}><div><span>{sourceLabel(item.source)} · {formatDiscoveredAt(item.discoveredAt)}</span><button type="button" onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}><strong>{item.title}</strong><ExternalLink size={13} /></button><p>{item.summary || `搜索词：${item.query || '未记录'}`}</p></div><button className="icon-button small" type="button" title="移除来源" aria-label="移除来源" onClick={() => removeEvidence(item.id)}><Trash2 size={14} /></button></article>)}</div> : <div className="topic-evidence-empty">还没有需求证据。搜索并保存真实来源后，再形成流量战役。</div>}
      {!canGenerate && <div className="research-readiness"><strong>生成门槛</strong><span className={briefReady ? 'done' : ''}><Check size={12} />主推产品、目标客户、下一步动作</span><span className={data.evidence.length >= 2 ? 'done' : ''}><Check size={12} />至少 2 条真实来源</span><small>门槛用于减少“标题好看，但没有真实需求、承接和验证方式”的内容。</small></div>}
      {data.generatedTopics.length > 0 && <div className="generated-topic-section"><div className="generated-topic-heading"><div><Sparkles size={16} /><strong>流量战役候选</strong><span>{data.generatedTopics.length}</span></div><small>先人工判断，再启动具体渠道的人工执行。</small></div><div className="generated-topic-list opportunity-list">{data.generatedTopics.map((item) => {
        const readiness = opportunityReadiness(item, data.evidence)
        const appliedIndustryPack = industryPack && item.industryPackId === industryPack.id ? industryPack : undefined
        const industryEvaluation = appliedIndustryPack ? evaluateOpportunityByIndustryRules(item, data.brief, data.evidence, appliedIndustryPack) : null
        const industryFindings = industryEvaluation?.checks.filter((check) => check.score < 70).slice(0, 3) || []
        const matchedEvidence = item.evidenceIds.filter((id) => data.evidence.some((source) => source.id === id)).length
        const recommended = item.recommendedChannels.length ? item.recommendedChannels : enabledChannels.filter((id) => ['douyin', 'xiaohongshu', 'wechat', 'offline', 'referral', 'bilibili'].includes(id)).slice(0, 2)
        const action = (item.callToAction || data.brief.conversionGoal).replace(/[。；;]+$/, '')
        const conversionCopy = [action, item.leadMagnet ? `提供：${item.leadMagnet}` : ''].filter(Boolean).join('；')
        const trafficPlan = `${item.trafficMode} · ${item.testWindowDays} 天验证`
        const performance = performanceByOpportunity[item.id] || []
        const totals = performance.reduce((summary, result) => ({ reach: summary.reach + result.reach, interactions: summary.interactions + result.interactions, platformInquiries: summary.platformInquiries + result.platformInquiries, registeredLeads: summary.registeredLeads + result.registeredLeads, qualifiedLeads: summary.qualifiedLeads + result.qualifiedLeads, customers: summary.customers + result.customers }), { reach: 0, interactions: 0, platformInquiries: 0, registeredLeads: 0, qualifiedLeads: 0, customers: 0 })
        const resultLabel = totals.customers ? '已带来成交' : totals.qualifiedLeads ? '已产生有效线索' : totals.registeredLeads || totals.platformInquiries ? '已产生咨询' : performance.some((result) => result.executed) ? '数据观察中' : performance.length ? '等待执行' : '尚未进入渠道'
        const linkedChannels = new Set(item.adoptions.map((adoption) => adoption.channelId))
        const campaign = campaignLifecycle(item, new Date().toISOString())
        const canReview = campaign.status === '等待复盘' || campaign.status === '已复盘'
        return <article key={item.id} className={`opportunity-card ${item.status === '暂不采用' ? 'rejected' : ''}`}><div className="opportunity-main"><div className="opportunity-meta"><span>{item.service === 'official' ? '官方积分分析' : '自有 API 分析'} · {formatDiscoveredAt(item.createdAt)}</span><b className={industryEvaluation?.tone || readiness.tone}>{industryEvaluation ? `${industryEvaluation.label} ${industryEvaluation.score}` : readiness.label}</b><b className={`campaign-status ${campaign.tone}`}>{campaign.label}</b><b>{matchedEvidence} 条证据</b>{item.buyerStage && <b>{item.buyerStage}</b>}</div><h3>{item.title}</h3><div className="opportunity-summary">{item.targetCustomer && <p><UsersRound size={14} /><span><strong>适合谁</strong>{item.targetCustomer}</span></p>}{item.customerQuestion && <p><Lightbulb size={14} /><span><strong>客户问题</strong>{item.customerQuestion}</span></p>}{item.demandSignal && <p><Search size={14} /><span><strong>需求信号</strong>{item.demandSignal}</span></p>}{item.keyPromise && <p><Target size={14} /><span><strong>这次给客户的价值</strong>{item.keyPromise}</span></p>}</div><div className="opportunity-execution"><div><strong>从哪拿流量</strong><p>{trafficPlan}</p></div><div><strong>怎么讲</strong><p>{item.contentAngle || '需要补充内容角度'}</p></div><div><strong>拿什么证明</strong><p>{item.proofNeeded || '需要补充真实证明素材'}</p></div><div><strong>怎么承接</strong><p>{conversionCopy}</p></div></div><div className="opportunity-success-signal"><Target size={14} /><div><strong>本轮成功信号</strong><p>{item.successSignal}</p></div></div><div className={`campaign-run-status ${campaign.tone}`}><Target size={14} /><div><strong>{campaign.label}</strong><p>{campaignTimingLabel(campaign.status, item.campaignEndsAt)}</p>{item.campaignOwner && <small>负责人：{item.campaignOwner}{item.campaignStartedAt ? ` · 实际开始：${item.campaignStartedAt.replace('T', ' ')}` : ''}</small>}{item.campaignNote && <small>执行说明：{item.campaignNote}</small>}</div></div>{item.fitReason && <p className="opportunity-reason"><CircleCheckBig size={14} />{item.fitReason}</p>}{item.riskNote && <p className="opportunity-risk"><AlertTriangle size={14} />{item.riskNote}</p>}{industryEvaluation && <div className="industry-opportunity-review"><div><ShieldCheck size={14} /><strong>{appliedIndustryPack?.name}本地检查</strong><small>只评估行业匹配、证据与执行准备度，不预测流量、咨询或成交。</small></div>{industryFindings.length ? industryFindings.map((finding) => <p key={finding.id}><b>{finding.label}</b><span>{finding.reason}</span></p>) : <p className="ready"><b>规则检查完整</b><span>当前行业硬条件较完整，仍需人工核对来源和真实素材。</span></p>}</div>}{performance.length > 0 && <div className="opportunity-performance"><div className="opportunity-performance-head"><div><strong>结果回传</strong><span className={totals.customers || totals.qualifiedLeads ? 'positive' : ''}>{resultLabel}</span></div><div><span><b>{totals.reach}</b>曝光 / 到场</span><span><b>{totals.platformInquiries}</b>平台咨询</span><span><b>{totals.registeredLeads}</b>登记线索</span><span><b>{totals.qualifiedLeads}</b>有效线索</span><span><b>{totals.customers}</b>成交</span></div></div><div className="opportunity-performance-list">{performance.map((result) => <button key={`${result.channelId}-${result.itemId}`} type="button" onClick={() => onOpenChannel(result.channelId)}><span className={`mini-channel-icon ${result.channelId}`}>{channelById(result.channelId).icon}</span><strong>{channelById(result.channelId).shortLabel}</strong><span>{result.stage}</span><small>{result.platformInquiries} 咨询 · {result.registeredLeads} 线索 · {result.customers} 成交</small><ArrowRight size={13} /></button>)}</div></div>}{canReview && <div className="opportunity-review"><span>本轮结论</span>{(['继续投入', '调整后再试', '停止投入'] as OpportunityDecision[]).map((decision) => <button key={decision} className={item.reviewDecision === decision ? 'active' : ''} type="button" onClick={() => setReviewDecision(item.id, item.reviewDecision === decision ? '' : decision)}>{item.reviewDecision === decision && <Check size={12} />}{decision}</button>)}<small>结论会连同已有结果进入下一次机会分析。</small></div>}<div className="opportunity-sources"><strong>依据</strong>{item.evidenceIds.map((id) => { const evidence = data.evidence.find((source) => source.id === id); return evidence ? <button key={id} type="button" onClick={() => window.open(evidence.url, '_blank', 'noopener,noreferrer')}>{evidence.title}<ExternalLink size={11} /></button> : null })}</div><div className="opportunity-actions"><span>启动战役</span>{recommended.map((channelId) => <button key={channelId} className="button button-secondary small" type="button" disabled={linkedChannels.has(channelId)} onClick={() => adoptToChannel(item, channelId)}>{linkedChannels.has(channelId) ? <Check size={13} /> : <ArrowRight size={13} />}{linkedChannels.has(channelId) ? `已关联${channelById(channelId).shortLabel}` : `启动${channelById(channelId).shortLabel}`}</button>)}{campaign.status === '执行准备中' && item.adoptions.length > 0 && <button className="button button-primary small" type="button" onClick={() => setCampaignStarter(item)}><Check size={13} />记录本轮已开始</button>}{campaign.status === '验证中' && <button className="button button-secondary small" type="button" onClick={() => finishTrafficCampaign(item)}>结束本轮验证<ArrowRight size={13} /></button>}<button className="text-button" type="button" onClick={() => setCampaignEditor(item)}>编辑战役</button><button className="text-button" type="button" onClick={() => setOpportunityStatus(item.id, item.status === '暂不采用' ? '待评估' : '暂不采用')}>{item.status === '暂不采用' ? '恢复评估' : '暂不采用'}</button></div></div><button className="icon-button small" type="button" title={item.adoptions.length ? '已关联渠道的机会不能删除，可以标记为停止投入' : '移除机会'} aria-label={item.adoptions.length ? '已关联渠道，不能删除' : '移除机会'} disabled={item.adoptions.length > 0} onClick={() => removeGeneratedTopic(item.id)}><Trash2 size={14} /></button></article>
      })}</div></div>}
      {!((aiSettings.mode === 'official' && aiSecrets.officialTokenSaved) || (aiSettings.mode === 'custom' && aiSecrets.customApiKeySaved)) && data.evidence.length > 0 && <div className="topic-ai-setup"><ShieldCheck size={15} /><span>生成前需要选择官方积分服务或接入自己的 API。</span><button className="text-button" type="button" onClick={onOpenAIService}>配置 AI 服务</button></div>}
    </section>
    {campaignEditor && <TrafficCampaignDialog opportunity={campaignEditor} onClose={() => setCampaignEditor(null)} onSubmit={updateTrafficCampaign} />}
    {campaignStarter && <CampaignStartDialog opportunity={campaignStarter} onClose={() => setCampaignStarter(null)} onSubmit={startTrafficCampaign} />}
    {settingsOpen && <ResearchSettingsDialog keySaved={searchKeySaved} secureStorageAvailable={secureStorageAvailable} onClose={() => setSettingsOpen(false)} onSaved={(saved, secure) => { setSearchKeySaved(saved); setSecureStorageAvailable(secure); setSettingsOpen(false); onToast(saved ? '联网搜索服务已保存' : '搜索密钥已移除') }} />}
    {manualOpen && <ManualEvidenceDialog source={source} defaultQuery={query} onClose={() => setManualOpen(false)} onSubmit={addManualEvidence} />}
  </>
}

function currentLocalDateTimeInput() {
  const now = new Date()
  const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
  const time = [String(now.getHours()).padStart(2, '0'), String(now.getMinutes()).padStart(2, '0')].join(':')
  return `${date}T${time}`
}

function CampaignStartDialog({ opportunity, onClose, onSubmit }: { opportunity: GeneratedTopicCandidate; onClose: () => void; onSubmit: (formData: FormData) => void }) {
  return <div className="dialog-backdrop" role="presentation"><form className="dialog traffic-campaign-dialog" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget)) }}><div className="dialog-head"><div><h2>记录本轮已开始</h2><p>只有这里由负责人确认后，战役才开始计入验证期。创建渠道任务、打开平台或准备素材不等于已经执行。</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div><div className="traffic-campaign-summary"><span>流量战役</span><strong>{opportunity.title}</strong><small>已关联：{opportunity.adoptions.map((adoption) => channelById(adoption.channelId).shortLabel).join('、')} · 本轮验证 {opportunity.testWindowDays} 天</small></div><div className="form-grid"><label className="field"><span>本轮负责人 *</span><input name="campaignOwner" required autoFocus defaultValue={opportunity.campaignOwner} placeholder="例如：张店长" /></label><label className="field"><span>实际开始时间 *</span><input name="campaignStartedAt" type="datetime-local" required defaultValue={opportunity.campaignStartedAt || currentLocalDateTimeInput()} /></label><label className="field field-wide"><span>执行说明</span><textarea name="campaignNote" rows={3} defaultValue={opportunity.campaignNote} placeholder="例如：已人工发布第一条内容；评论和私信由店长在营业时间承接" /></label><section className="traffic-campaign-boundary field-wide"><ShieldCheck size={16} /><p><strong>确认后会发生什么</strong>工作台将记录验证开始与截止时间，并汇总已有渠道中的曝光、咨询、线索和成交。它不会替你发布、私信、联系合作方或投放广告。</p></section></div><div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onClose}>取消</button><button className="button button-primary" type="submit">确认开始验证<Check size={16} /></button></div></form></div>
}

function TrafficCampaignDialog({ opportunity, onClose, onSubmit }: { opportunity: GeneratedTopicCandidate; onClose: () => void; onSubmit: (formData: FormData) => void }) {
  return <div className="dialog-backdrop" role="presentation"><form className="dialog traffic-campaign-dialog" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget)) }}><div className="dialog-head"><div><h2>编辑流量战役</h2><p>这里定义的是本轮怎么找人、怎么承接和怎么判断是否值得继续，不会替你自动发布、投放或联系客户。</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div><div className="traffic-campaign-summary"><span>需求机会</span><strong>{opportunity.title}</strong><small>建议渠道：{opportunity.recommendedChannels.length ? opportunity.recommendedChannels.map((id) => channelById(id).shortLabel).join('、') : '请先在获客配置中选择渠道'}</small></div><div className="form-grid"><label className="field"><span>流量方式 *</span><select name="trafficMode" defaultValue={opportunity.trafficMode}>{trafficModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}</select></label><label className="field"><span>验证周期 *</span><select name="testWindowDays" defaultValue={String(opportunity.testWindowDays)}><option value="7">7 天</option><option value="14">14 天</option></select></label><label className="field field-wide"><span>客户进入后的下一步 *</span><input name="callToAction" required defaultValue={opportunity.callToAction} placeholder="例如：私信户型和尺寸，人工判断是否安排到店" /></label><label className="field field-wide"><span>本轮成功信号 *</span><textarea name="successSignal" rows={3} required defaultValue={opportunity.successSignal} placeholder="例如：7 天内记录有效咨询、预约到店和完成首次人工承接的人数" /></label><section className="traffic-campaign-boundary field-wide"><ShieldCheck size={16} /><p><strong>人工执行边界</strong>平台发布、付费投放、私信、预约和客户判断都由门店人工完成；“付费投放规划”只记录素材、目标和结果，不连接广告账户或自动扣费。</p></section></div><div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onClose}>取消</button><button className="button button-primary" type="submit">保存战役<Check size={16} /></button></div></form></div>
}

function ResearchSettingsDialog({ keySaved, secureStorageAvailable, onClose, onSaved }: { keySaved: boolean; secureStorageAvailable: boolean; onClose: () => void; onSaved: (saved: boolean, secure: boolean) => void }) {
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const desktopResearch = window.workbenchDesktop?.research

  const save = async () => {
    if (!desktopResearch) {
      setError('请在 Windows 桌面版中配置联网搜索服务。')
      return
    }
    if (!apiKey.trim() && !keySaved) {
      setError('请输入搜索服务 API Key。')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (apiKey.trim()) await desktopResearch.saveSearchApiKey(apiKey.trim())
      const status = await desktopResearch.getSecretStatus()
      onSaved(status.searchApiKeySaved, status.secureStorageAvailable)
    } catch {
      setError('保存失败，请确认当前 Windows 账户可以使用系统安全存储。')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!desktopResearch) return
    await desktopResearch.clearSearchApiKey()
    const status = await desktopResearch.getSecretStatus()
    onSaved(status.searchApiKeySaved, status.secureStorageAvailable)
  }

  return <div className="dialog-backdrop" role="presentation"><section className="dialog research-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="research-settings-title"><div className="dialog-head"><div><span className="eyebrow"><Globe2 size={14} />联网搜索</span><h2 id="research-settings-title">配置搜索服务</h2><p>当前支持 Tavily Search API。它只用于检索公开网页，不读取平台账号、私信或通讯录。</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div><div className="ai-form"><label className="field field-wide"><span>Search API Key</span><input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} autoFocus placeholder={keySaved ? '已安全保存，输入新 Key 可替换' : '粘贴 Tavily API Key'} autoComplete="off" /></label><div className="service-detail custom-detail"><ShieldCheck size={18} /><div><strong>密钥只保存在当前 Windows 账户</strong><p>联网搜索与 AI 生成是两项独立服务。没有搜索证据时，工作台不应把模型生成内容标记为热点。</p></div></div></div>{!secureStorageAvailable && <div className="service-error">当前环境未检测到系统安全存储，浏览器预览不会保存 API Key。</div>}{error && <div className="service-error">{error}</div>}<div className="dialog-foot">{keySaved && <button className="text-button danger-text" type="button" onClick={() => void remove()}>移除密钥</button>}<button className="button button-secondary" type="button" onClick={onClose}>取消</button><button className="button button-primary" type="button" onClick={() => void save()} disabled={saving}>{saving ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}{saving ? '正在保存' : '保存'}</button></div></section></div>
}

function ManualEvidenceDialog({ source, defaultQuery, onClose, onSubmit }: { source: ResearchSource; defaultQuery: string; onClose: () => void; onSubmit: (formData: FormData) => void }) {
  return <div className="dialog-backdrop" role="presentation"><form className="dialog" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget)) }}><div className="dialog-head"><div><h2>保存页面发现</h2><p>{sourceLabel(source)} · {defaultQuery || '未填写搜索词'}</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div><div className="form-grid"><label className="field field-wide"><span>页面标题</span><input name="title" required autoFocus placeholder="这条内容讨论了什么" /></label><label className="field field-wide"><span>来源链接</span><input name="url" type="url" required placeholder="https://" /></label><label className="field field-wide"><span>关键发现</span><textarea name="summary" rows={4} placeholder="记录客户问题、常见说法、数据或值得验证的观点" /></label><label className="field"><span>发布日期</span><input name="publishedDate" type="date" /></label></div><div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onClose}>取消</button><button className="button button-primary" type="submit">保存<Check size={15} /></button></div></form></div>
}
