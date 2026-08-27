import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Coins,
  FolderPlus,
  Link2,
  Menu,
  MessageSquareMore,
  Plus,
  Search,
  Send,
  Sparkles,
  Target,
  UsersRound,
  X,
} from 'lucide-react'
import { AIServiceDialog, type AISecretStatus, type AIServiceSettings, loadAIServiceSettings } from './ai-service'
import { CreditAccountDialog, type CreditAccountSnapshot } from './credits'
import { channelById, channelDefinitions, channelStatusOptions, nextChannelStatus, type ChannelDefinition, type ChannelId } from './channels'
import { DouyinWorkspace, douyinSourceOptions, emptyDouyinData, normalizeDouyinData, type DouyinData } from './douyin'
import { XiaohongshuWorkspace, emptyXiaohongshuData, normalizeXiaohongshuData, xiaohongshuSourceOptions, type XiaohongshuData } from './xiaohongshu'
import { WechatWorkspace, emptyWechatData, normalizeWechatData, wechatSourceOptions, type WechatData } from './wechat'
import { OfflineWorkspace, emptyOfflineData, normalizeOfflineData, offlineSourceOptions, type OfflineData } from './offline'
import { ReferralWorkspace, emptyReferralData, normalizeReferralData, referralSourceOptions, type ReferralData } from './referral'
import { BilibiliWorkspace, bilibiliSourceOptions, emptyBilibiliData, normalizeBilibiliData, type BilibiliData } from './bilibili'
import { IndustryRuleCatalog } from './industry-rule-catalog'
import { industryRulePackById, industryRulePacks, normalizeIndustryPackId } from './industry-pack-registry'
import { TacticPackCatalog } from './tactic-pack-catalog'
import { growthTacticPackById, growthTacticPacks, type GrowthTacticPack } from './tactic-packs'
import { emptyTopicResearchData, normalizeTopicResearchData, TopicResearchPanel, type GeneratedTopicCandidate, type OpportunityChannelPerformance, type TopicResearchData } from './topic-research'
import { ContentProductionPanel, emptyContentProductionData, normalizeContentProductionData, type ContentProductionData } from './content-production'
import type { IndustryRulePack } from './industry-rules'

type View = 'workspace' | 'acquisition' | 'leads' | 'intents' | 'customers' | 'review'
type Stage = 'lead' | 'intent' | 'customer' | 'lost'
type RecordStatus = '待判断' | '待联系' | '已预约' | '方案中' | '报价中' | '服务中' | '待回访' | '稳定客户' | '已放弃'

type CustomerRecord = {
  id: string
  name: string
  contact: string
  source: string
  need: string
  stage: Stage
  status: RecordStatus
  owner: string
  nextAction: string
  nextDate: string
  note: string
  createdAt: string
}

type ChannelTaskStatus = '准备中' | '制作中' | '待发布' | '已发布' | '执行中' | '跟进中' | '已完成' | '已暂停'

type ChannelTask = {
  id: string
  channelId: ChannelId
  contentPackageId: string
  title: string
  goal: string
  callToAction: string
  owner: string
  plannedDate: string
  status: ChannelTaskStatus
  sourceCode: string
  linkOrLocation: string
  note: string
  videoFormat: string
  openingHook: string
  scriptOutline: string
  shootingChecklist: string
  viewCount: number
  interactionCount: number
  inquiryCount: number
  createdAt: string
}

type SourceOption = { id: string; label: string }

type WorkspaceData = { records: CustomerRecord[]; enabledChannels: ChannelId[]; installedIndustryPacks: string[]; activeIndustryPackId: string; installedTacticPacks: string[]; activeTacticPackId: string; channelTasks: ChannelTask[]; topicResearch: TopicResearchData; contentProduction: ContentProductionData; douyin: DouyinData; xiaohongshu: XiaohongshuData; wechat: WechatData; offline: OfflineData; referral: ReferralData; bilibili: BilibiliData }

const STORAGE_KEY = 'acquisition-workbench-core-v1'
const emptyData: WorkspaceData = { records: [], enabledChannels: [], installedIndustryPacks: [], activeIndustryPackId: '', installedTacticPacks: [], activeTacticPackId: '', channelTasks: [], topicResearch: emptyTopicResearchData, contentProduction: emptyContentProductionData, douyin: emptyDouyinData, xiaohongshu: emptyXiaohongshuData, wechat: emptyWechatData, offline: emptyOfflineData, referral: emptyReferralData, bilibili: emptyBilibiliData }

const navItems: Array<{ id: View; label: string; icon: ReactNode }> = [
  { id: 'workspace', label: '工作台', icon: <Target size={18} /> },
  { id: 'acquisition', label: '获客', icon: <Send size={18} /> },
  { id: 'leads', label: '线索', icon: <MessageSquareMore size={18} /> },
  { id: 'intents', label: '意向客户', icon: <UsersRound size={18} /> },
  { id: 'customers', label: '客户', icon: <Check size={18} /> },
  { id: 'review', label: '复盘', icon: <BarChart3 size={18} /> },
]

const stageMeta: Record<Exclude<Stage, 'lost'>, { label: string; statuses: RecordStatus[] }> = {
  lead: { label: '线索', statuses: ['待判断', '待联系', '已放弃'] },
  intent: { label: '意向客户', statuses: ['待联系', '已预约', '方案中', '报价中', '已放弃'] },
  customer: { label: '客户', statuses: ['服务中', '待回访', '稳定客户'] },
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function loadData(): WorkspaceData {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return emptyData
    const parsed = JSON.parse(saved) as Partial<WorkspaceData> & { enabledChannels?: unknown; installedContentPackages?: unknown }
    if (!Array.isArray(parsed.records)) return emptyData
    const channelTasks: ChannelTask[] = Array.isArray(parsed.channelTasks) ? parsed.channelTasks.filter((task) => task && typeof task.title === 'string' && channelDefinitions.some((definition) => definition.id === task.channelId)).map((task) => ({
      id: task.id || `task-${Date.now()}`,
      channelId: task.channelId as ChannelId,
      contentPackageId: normalizeIndustryPackId(task.contentPackageId) || task.contentPackageId || '',
      title: task.title,
      goal: task.goal || '',
      callToAction: task.callToAction || '',
      owner: task.owner || '',
      plannedDate: task.plannedDate || '',
      status: task.status || '准备中',
      sourceCode: task.sourceCode || createSourceCode(channelById(task.channelId as ChannelId)),
      linkOrLocation: task.linkOrLocation || '',
      note: task.note || '',
      videoFormat: task.videoFormat || '口播讲解',
      openingHook: task.openingHook || '',
      scriptOutline: task.scriptOutline || '',
      shootingChecklist: task.shootingChecklist || '',
      viewCount: typeof task.viewCount === 'number' ? task.viewCount : 0,
      interactionCount: typeof task.interactionCount === 'number' ? task.interactionCount : 0,
      inquiryCount: typeof task.inquiryCount === 'number' ? task.inquiryCount : 0,
      createdAt: task.createdAt || todayISO(),
    })) : []
    const savedIndustryPacks = Array.isArray(parsed.installedIndustryPacks) ? parsed.installedIndustryPacks : Array.isArray(parsed.installedContentPackages) ? parsed.installedContentPackages : []
    const installedIndustryPacks = [...new Set(savedIndustryPacks.map(normalizeIndustryPackId).filter(Boolean))]
    const requestedActivePackId = normalizeIndustryPackId(parsed.activeIndustryPackId)
    const activeIndustryPackId = requestedActivePackId || installedIndustryPacks[0] || ''
    const installedTacticPacks = [...new Set((Array.isArray(parsed.installedTacticPacks) ? parsed.installedTacticPacks : []).filter((id): id is string => Boolean(growthTacticPackById(id))))]
    const requestedActiveTacticPackId = typeof parsed.activeTacticPackId === 'string' && growthTacticPackById(parsed.activeTacticPackId) ? parsed.activeTacticPackId : ''
    const douyin = normalizeDouyinData(parsed.douyin, channelTasks)
    const xiaohongshu = normalizeXiaohongshuData(parsed.xiaohongshu, channelTasks)
    const wechat = normalizeWechatData(parsed.wechat, channelTasks)
    const offline = normalizeOfflineData(parsed.offline, channelTasks)
    const referral = normalizeReferralData(parsed.referral, channelTasks)
    const bilibili = normalizeBilibiliData(parsed.bilibili, channelTasks)
    const topicResearch = normalizeTopicResearchData(parsed.topicResearch)
    const contentProduction = normalizeContentProductionData(parsed.contentProduction)
    return {
      records: parsed.records.filter((record) => record && typeof record.name === 'string').map((record) => ({
        ...record,
        contact: record.contact || '',
        source: record.source || '未记录来源',
        need: record.need || '',
        owner: record.owner || '',
        nextAction: record.nextAction || '',
        nextDate: record.nextDate || '',
        note: record.note || '',
        createdAt: record.createdAt || todayISO(),
      })),
      enabledChannels: normalizeEnabledChannels(parsed.enabledChannels, channelTasks, douyin, xiaohongshu, wechat, offline, referral, bilibili),
      installedIndustryPacks,
      activeIndustryPackId,
      installedTacticPacks,
      activeTacticPackId: requestedActiveTacticPackId,
      channelTasks,
      topicResearch,
      contentProduction,
      douyin,
      xiaohongshu,
      wechat,
      offline,
      referral,
      bilibili,
    }
  } catch {
    return emptyData
  }
}

function formatDate(value: string) {
  if (!value) return '未安排'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(date)
}

function stageForView(view: View): Exclude<Stage, 'lost'> | null {
  if (view === 'leads') return 'lead'
  if (view === 'intents') return 'intent'
  if (view === 'customers') return 'customer'
  return null
}

function statusTone(status: RecordStatus) {
  if (status === '已放弃') return 'muted'
  if (status === '已预约' || status === '报价中' || status === '待回访') return 'amber'
  if (status === '方案中' || status === '服务中') return 'blue'
  if (status === '稳定客户') return 'teal'
  return 'neutral'
}

function taskStatusTone(status: ChannelTaskStatus) {
  if (status === '已暂停') return 'muted'
  if (status === '制作中' || status === '待发布') return 'amber'
  if (status === '已发布' || status === '执行中' || status === '跟进中') return 'blue'
  if (status === '已完成') return 'teal'
  return 'neutral'
}

function createSourceCode(channel: ChannelDefinition) {
  const stamp = todayISO().replace(/-/g, '')
  const suffix = Math.floor(Math.random() * 900 + 100)
  return `${channel.sourcePrefix}-${stamp}-${suffix}`
}

function nonNegativeNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function sourceLabel(task: ChannelTask) {
  return `${channelById(task.channelId).shortLabel} · ${task.title} · ${task.sourceCode}`
}

function normalizeEnabledChannels(value: unknown, tasks: ChannelTask[], douyin: DouyinData, xiaohongshu: XiaohongshuData, wechat: WechatData, offline: OfflineData, referral: ReferralData, bilibili: BilibiliData) {
  const valid = (channel: unknown): channel is ChannelId => typeof channel === 'string' && channelDefinitions.some((definition) => definition.id === channel)
  const inferred = new Set<ChannelId>(Array.isArray(value) ? value.filter(valid) : [])
  tasks.forEach((task) => inferred.add(task.channelId))
  if (douyin.ideas.length || douyin.videoTasks.length || douyin.publishRecords.length || douyin.metrics.length || douyin.settings.accountLabel || douyin.settings.city || douyin.settings.defaultOwner || douyin.settings.defaultCallToAction || douyin.settings.defaultLocation || douyin.settings.forbiddenExpressions) inferred.add('douyin')
  if (xiaohongshu.ideas.length || xiaohongshu.noteTasks.length || xiaohongshu.publishRecords.length || xiaohongshu.metrics.length || xiaohongshu.settings.accountLabel || xiaohongshu.settings.city || xiaohongshu.settings.defaultOwner || xiaohongshu.settings.defaultCallToAction || xiaohongshu.settings.forbiddenExpressions) inferred.add('xiaohongshu')
  if (wechat.tasks.length || wechat.executionRecords.length || wechat.metrics.length || wechat.settings.accountLabel || wechat.settings.defaultOwner || wechat.settings.defaultCallToAction || wechat.settings.forbiddenExpressions) inferred.add('wechat')
  if (offline.tasks.length || offline.runRecords.length || offline.metrics.length || offline.settings.businessLabel || offline.settings.defaultOwner || offline.settings.defaultCallToAction || offline.settings.registrationReminder) inferred.add('offline')
  if (referral.relations.length || referral.logs.length || referral.settings.businessLabel || referral.settings.defaultOwner || referral.settings.defaultHandoffMethod || referral.settings.defaultFeedbackPlan || referral.settings.privacyReminder) inferred.add('referral')
  if (bilibili.ideas.length || bilibili.videoTasks.length || bilibili.publishRecords.length || bilibili.metrics.length || bilibili.settings.accountLabel || bilibili.settings.serviceArea || bilibili.settings.defaultOwner || bilibili.settings.defaultCallToAction || bilibili.settings.defaultCategory || bilibili.settings.defaultSeries || bilibili.settings.contentBoundaries) inferred.add('bilibili')
  return [...inferred]
}

function App() {
  const [data, setData] = useState<WorkspaceData>(loadData)
  const [aiSettings, setAISettings] = useState<AIServiceSettings>(loadAIServiceSettings)
  const [aiSecrets, setAISecrets] = useState<AISecretStatus>({ officialTokenSaved: false, customApiKeySaved: false, secureStorageAvailable: false })
  const [view, setView] = useState<View>('workspace')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dialogStage, setDialogStage] = useState<Exclude<Stage, 'lost'> | null>(null)
  const [recordSourcePreset, setRecordSourcePreset] = useState('')
  const [editingRecord, setEditingRecord] = useState<CustomerRecord | null>(null)
  const [aiServiceOpen, setAIServiceOpen] = useState(false)
  const [creditAccountOpen, setCreditAccountOpen] = useState(false)
  const [creditAccount, setCreditAccount] = useState<CreditAccountSnapshot | null>(null)
  const [activeChannelId, setActiveChannelId] = useState<ChannelId | null>(null)
  const [taskChannelId, setTaskChannelId] = useState<ChannelId | null>(null)
  const [editingTask, setEditingTask] = useState<ChannelTask | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    window.localStorage.setItem('acquisition-workbench-ai-settings-v1', JSON.stringify(aiSettings))
  }, [aiSettings])

  useEffect(() => {
    const getSecretStatus = window.workbenchDesktop?.ai?.getSecretStatus
    if (!getSecretStatus) return
    void getSecretStatus().then(setAISecrets).catch(() => {
      setAISecrets((current) => ({ ...current, secureStorageAvailable: false }))
    })
  }, [])

  useEffect(() => {
    setCreditAccount(null)
    if (aiSettings.mode !== 'official' || !aiSettings.officialWorkspaceId || !aiSecrets.officialTokenSaved) {
      return
    }
    const desktopAI = window.workbenchDesktop?.ai
    if (!desktopAI) return
    let cancelled = false
    void desktopAI.getOfficialServiceStatus().then((service) => {
      if (!service.configured || cancelled) return
      return desktopAI.getCreditAccount({ workspaceId: aiSettings.officialWorkspaceId })
    }).then((response) => {
      if (cancelled) return
      setCreditAccount(response?.ok && response.data ? response.data.account : null)
    }).catch(() => {
      if (!cancelled) setCreditAccount(null)
    })
    return () => { cancelled = true }
  }, [aiSettings.mode, aiSettings.officialWorkspaceId, aiSecrets.officialTokenSaved])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const visibleRecords = useMemo(() => {
    const stage = stageForView(view)
    const normalized = search.trim().toLowerCase()
    return data.records
      .filter((record) => stage ? record.stage === stage : true)
      .filter((record) => !normalized || [record.name, record.contact, record.source, record.need, record.owner, record.nextAction].join(' ').toLowerCase().includes(normalized))
      .sort((left, right) => (left.nextDate || '9999-12-31').localeCompare(right.nextDate || '9999-12-31'))
  }, [data.records, search, view])

  const activeRecords = data.records.filter((record) => record.stage !== 'lost')
  const leadCount = data.records.filter((record) => record.stage === 'lead').length
  const intentCount = data.records.filter((record) => record.stage === 'intent').length
  const customerCount = data.records.filter((record) => record.stage === 'customer').length
  const enabledChannels = channelDefinitions.filter((channel) => data.enabledChannels.includes(channel.id))
  const activeIndustryPack = industryRulePackById(data.activeIndustryPackId)
  const activeTacticCandidate = growthTacticPackById(data.activeTacticPackId)
  const activeTacticPack = activeTacticCandidate && activeTacticCandidate.industryPackId === activeIndustryPack?.id && data.enabledChannels.includes(activeTacticCandidate.channelId) ? activeTacticCandidate : undefined
  const opportunityPerformance = useMemo<Record<string, OpportunityChannelPerformance[]>>(() => {
    const result: Record<string, OpportunityChannelPerformance[]> = {}
    const linkedRecords = (sourceCodes: string[]) => {
      const codes = sourceCodes.filter(Boolean)
      if (!codes.length) return []
      const seen = new Set<string>()
      return data.records.filter((record) => {
        if (!codes.some((code) => record.source.includes(code)) || seen.has(record.id)) return false
        seen.add(record.id)
        return true
      })
    }
    const recordSummary = (sourceCodes: string[]) => {
      const records = linkedRecords(sourceCodes)
      return {
        registeredLeads: records.length,
        qualifiedLeads: records.filter((record) => record.stage === 'intent' || record.stage === 'customer').length,
        customers: records.filter((record) => record.stage === 'customer').length,
      }
    }
    data.topicResearch.generatedTopics.forEach((opportunity) => {
      result[opportunity.id] = opportunity.adoptions.map((adoption) => {
        if (adoption.channelId === 'douyin') {
          const tasks = data.douyin.videoTasks.filter((task) => task.ideaId === adoption.itemId)
          const taskIds = new Set(tasks.map((task) => task.id))
          const records = data.douyin.publishRecords.filter((record) => taskIds.has(record.videoTaskId))
          const metrics = records.map((record) => data.douyin.metrics.find((metric) => metric.publishRecordId === record.id)).filter((metric): metric is NonNullable<typeof metric> => Boolean(metric))
          const sources = records.filter((record) => record.status === '已发布').map((record) => record.sourceCode)
          return { channelId: adoption.channelId, itemId: adoption.itemId, stage: records.some((record) => record.status === '已发布') ? '已发布' : tasks[0]?.status || '选题待判断', executed: records.some((record) => record.status === '已发布'), reach: metrics.reduce((sum, metric) => sum + metric.views, 0), interactions: metrics.reduce((sum, metric) => sum + metric.likes + metric.comments + metric.favorites + metric.shares + metric.otherInteractions, 0), platformInquiries: metrics.reduce((sum, metric) => sum + metric.inquiries, 0), ...recordSummary(sources) }
        }
        if (adoption.channelId === 'xiaohongshu') {
          const tasks = data.xiaohongshu.noteTasks.filter((task) => task.ideaId === adoption.itemId)
          const taskIds = new Set(tasks.map((task) => task.id))
          const records = data.xiaohongshu.publishRecords.filter((record) => taskIds.has(record.noteTaskId))
          const metrics = records.map((record) => data.xiaohongshu.metrics.find((metric) => metric.publishRecordId === record.id)).filter((metric): metric is NonNullable<typeof metric> => Boolean(metric))
          const sources = records.filter((record) => record.status === '已发布').map((record) => record.sourceCode)
          return { channelId: adoption.channelId, itemId: adoption.itemId, stage: records.some((record) => record.status === '已发布') ? '已发布' : tasks[0]?.status || '选题待判断', executed: records.some((record) => record.status === '已发布'), reach: metrics.reduce((sum, metric) => sum + metric.views, 0), interactions: metrics.reduce((sum, metric) => sum + metric.likes + metric.comments + metric.favorites + metric.shares, 0), platformInquiries: metrics.reduce((sum, metric) => sum + metric.inquiries, 0), ...recordSummary(sources) }
        }
        if (adoption.channelId === 'bilibili') {
          const tasks = data.bilibili.videoTasks.filter((task) => task.ideaId === adoption.itemId)
          const taskIds = new Set(tasks.map((task) => task.id))
          const records = data.bilibili.publishRecords.filter((record) => taskIds.has(record.videoTaskId))
          const metrics = records.map((record) => data.bilibili.metrics.find((metric) => metric.publishRecordId === record.id)).filter((metric): metric is NonNullable<typeof metric> => Boolean(metric))
          const sources = records.filter((record) => record.status === '已发布').map((record) => record.sourceCode)
          return { channelId: adoption.channelId, itemId: adoption.itemId, stage: records.some((record) => record.status === '已发布') ? '已发布' : tasks[0]?.status || '选题待判断', executed: records.some((record) => record.status === '已发布'), reach: metrics.reduce((sum, metric) => sum + metric.views, 0), interactions: metrics.reduce((sum, metric) => sum + metric.likes + metric.coins + metric.comments + metric.danmaku + metric.favorites + metric.shares, 0), platformInquiries: metrics.reduce((sum, metric) => sum + metric.inquiries, 0), ...recordSummary(sources) }
        }
        if (adoption.channelId === 'wechat') {
          const task = data.wechat.tasks.find((item) => item.id === adoption.itemId)
          const records = data.wechat.executionRecords.filter((record) => record.taskId === adoption.itemId)
          const metrics = records.map((record) => data.wechat.metrics.find((metric) => metric.executionRecordId === record.id)).filter((metric): metric is NonNullable<typeof metric> => Boolean(metric))
          const sources = records.filter((record) => record.status === '已执行').map((record) => record.sourceCode)
          return { channelId: adoption.channelId, itemId: adoption.itemId, stage: records.some((record) => record.status === '已执行') ? '已执行' : task?.status || '任务待确认', executed: records.some((record) => record.status === '已执行'), reach: metrics.reduce((sum, metric) => sum + metric.views, 0), interactions: metrics.reduce((sum, metric) => sum + metric.likes + metric.comments + metric.shares + metric.replies, 0), platformInquiries: metrics.reduce((sum, metric) => sum + metric.inquiries, 0), ...recordSummary(sources) }
        }
        if (adoption.channelId === 'offline') {
          const task = data.offline.tasks.find((item) => item.id === adoption.itemId)
          const records = data.offline.runRecords.filter((record) => record.taskId === adoption.itemId)
          const metrics = records.map((record) => data.offline.metrics.find((metric) => metric.runRecordId === record.id)).filter((metric): metric is NonNullable<typeof metric> => Boolean(metric))
          const sources = records.filter((record) => record.status === '已结束' || record.status === '进行中').map((record) => record.sourceCode)
          return { channelId: adoption.channelId, itemId: adoption.itemId, stage: records[0]?.status || task?.status || '活动待确认', executed: records.some((record) => record.status === '已结束' || record.status === '进行中'), reach: metrics.reduce((sum, metric) => sum + metric.attendees, 0), interactions: metrics.reduce((sum, metric) => sum + metric.registrations + metric.appointments, 0), platformInquiries: metrics.reduce((sum, metric) => sum + metric.inquiries, 0), ...recordSummary(sources) }
        }
        return { channelId: adoption.channelId, itemId: adoption.itemId, stage: '等待建立推荐关系', executed: false, reach: 0, interactions: 0, platformInquiries: 0, registeredLeads: 0, qualifiedLeads: 0, customers: 0 }
      })
    })
    return result
  }, [data.bilibili, data.douyin, data.offline, data.records, data.topicResearch.generatedTopics, data.wechat, data.xiaohongshu])
  const activeSources: SourceOption[] = [
    ...data.channelTasks.filter((task) => task.channelId !== 'douyin' && task.channelId !== 'xiaohongshu' && task.channelId !== 'wechat' && task.channelId !== 'offline' && task.channelId !== 'referral' && task.channelId !== 'bilibili' && ['已发布', '执行中', '跟进中', '已完成'].includes(task.status)).map((task) => ({ id: task.id, label: sourceLabel(task) })),
    ...douyinSourceOptions(data.douyin),
    ...xiaohongshuSourceOptions(data.xiaohongshu),
    ...wechatSourceOptions(data.wechat),
    ...offlineSourceOptions(data.offline),
    ...referralSourceOptions(data.referral),
    ...bilibiliSourceOptions(data.bilibili),
  ]

  const showToast = (message: string) => setToast(message)

  const openRecordDialog = (stage: Exclude<Stage, 'lost'>, source = '') => {
    setRecordSourcePreset(source)
    setDialogStage(stage)
  }

  const addRecord = (formData: FormData, initialStage: Exclude<Stage, 'lost'>) => {
    const stage = (formData.get('stage') as Exclude<Stage, 'lost'>) || initialStage
    const record: CustomerRecord = {
      id: `record-${Date.now()}`,
      name: String(formData.get('name') || '').trim(),
      contact: String(formData.get('contact') || '').trim(),
      source: String(formData.get('source') || '').trim() || '未记录来源',
      need: String(formData.get('need') || '').trim(),
      stage,
      status: String(formData.get('status') || stageMeta[stage].statuses[0]) as RecordStatus,
      owner: String(formData.get('owner') || '').trim(),
      nextAction: String(formData.get('nextAction') || '').trim(),
      nextDate: String(formData.get('nextDate') || ''),
      note: String(formData.get('note') || '').trim(),
      createdAt: todayISO(),
    }
    if (!record.name) return
    setData((current) => ({ ...current, records: [record, ...current.records] }))
    setDialogStage(null)
    setRecordSourcePreset('')
    showToast(`已加入${stageMeta[stage].label}`)
  }

  const updateRecord = (formData: FormData) => {
    if (!editingRecord) return
    const stage = String(formData.get('stage')) as Exclude<Stage, 'lost'>
    setData((current) => ({
      ...current,
      records: current.records.map((record) => record.id === editingRecord.id ? {
        ...record,
        name: String(formData.get('name') || '').trim(),
        contact: String(formData.get('contact') || '').trim(),
        source: String(formData.get('source') || '').trim() || '未记录来源',
        need: String(formData.get('need') || '').trim(),
        stage,
        status: String(formData.get('status') || stageMeta[stage].statuses[0]) as RecordStatus,
        owner: String(formData.get('owner') || '').trim(),
        nextAction: String(formData.get('nextAction') || '').trim(),
        nextDate: String(formData.get('nextDate') || ''),
        note: String(formData.get('note') || '').trim(),
      } : record),
    }))
    setEditingRecord(null)
    showToast('客户信息已更新')
  }

  const moveRecord = (id: string, nextStage: Exclude<Stage, 'lost'>) => {
    setData((current) => ({
      ...current,
      records: current.records.map((record) => record.id === id ? {
        ...record,
        stage: nextStage,
        status: stageMeta[nextStage].statuses[0],
        nextAction: nextStage === 'intent' ? record.nextAction || '联系并确认需求' : record.nextAction || '安排服务与回访',
      } : record),
    }))
    showToast(nextStage === 'intent' ? '已转入意向客户' : '已转入客户')
  }

  const markLost = (id: string) => {
    setData((current) => ({
      ...current,
      records: current.records.map((record) => record.id === id ? { ...record, stage: 'lost', status: '已放弃', nextAction: '' } : record),
    }))
    showToast('已标记为暂不跟进')
  }

  const setNextActionDone = (record: CustomerRecord) => {
    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + 14)
    setData((current) => ({
      ...current,
      records: current.records.map((item) => item.id === record.id ? {
        ...item,
        status: item.stage === 'customer' ? '待回访' : item.status,
        nextAction: item.stage === 'customer' ? '进行下一次回访' : item.nextAction,
        nextDate: nextDate.toISOString().slice(0, 10),
      } : item),
    }))
    showToast('已记录，已安排下一次回访')
  }

  const enableChannel = (channelId: ChannelId) => {
    const channel = channelById(channelId)
    setData((current) => current.enabledChannels.includes(channelId) ? current : { ...current, enabledChannels: [...current.enabledChannels, channelId] })
    setActiveChannelId(channelId)
    showToast(`${channel.shortLabel}已启用`)
  }

  const activateIndustryRules = (packId: string) => {
    const pack = industryRulePackById(packId)
    if (!pack) return
    setData((current) => ({
      ...current,
      activeIndustryPackId: pack.id,
      activeTacticPackId: growthTacticPackById(current.activeTacticPackId)?.industryPackId === pack.id ? current.activeTacticPackId : '',
      installedIndustryPacks: current.installedIndustryPacks.includes(pack.id) ? current.installedIndustryPacks : [...current.installedIndustryPacks, pack.id],
    }))
    showToast(`${pack.name}已设为当前规则`)
  }

  const activateTacticPack = (packId: string) => {
    const pack = growthTacticPackById(packId)
    if (!pack) return
    if (data.activeIndustryPackId !== pack.industryPackId || !data.enabledChannels.includes(pack.channelId)) {
      showToast('请先选择匹配的行业规则并启用对应渠道')
      return
    }
    setData((current) => ({
      ...current,
      activeTacticPackId: pack.id,
      installedTacticPacks: current.installedTacticPacks.includes(pack.id) ? current.installedTacticPacks : [...current.installedTacticPacks, pack.id],
    }))
    showToast(`${pack.name}已设为当前打法`)
  }

  const adoptResearchOpportunity = (opportunity: GeneratedTopicCandidate, channelId: ChannelId) => {
    const createdAt = todayISO()
    const id = `research-${channelId}-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`
    setData((current) => {
      const enabledChannels = current.enabledChannels.includes(channelId) ? current.enabledChannels : [...current.enabledChannels, channelId]
      if (channelId === 'douyin') {
        return { ...current, enabledChannels, douyin: { ...current.douyin, ideas: [{ id, contentPackageId: opportunity.industryPackId, title: opportunity.title, customerProblem: opportunity.customerQuestion || opportunity.demandSignal, contentDirection: opportunity.contentAngle, targetAction: opportunity.callToAction, sourceType: 'AI', tags: [opportunity.buyerStage, '联网研究'].filter(Boolean).join('，'), status: '待判断', createdAt }, ...current.douyin.ideas] } }
      }
      if (channelId === 'xiaohongshu') {
        return { ...current, enabledChannels, xiaohongshu: { ...current.xiaohongshu, ideas: [{ id, contentPackageId: opportunity.industryPackId, title: opportunity.title, customerProblem: opportunity.customerQuestion || opportunity.demandSignal, contentDirection: opportunity.contentAngle, targetAction: opportunity.callToAction, sourceType: 'AI', tags: [opportunity.buyerStage, '联网研究'].filter(Boolean).join('，'), status: '待判断', createdAt }, ...current.xiaohongshu.ideas] } }
      }
      if (channelId === 'bilibili') {
        return { ...current, enabledChannels, bilibili: { ...current.bilibili, ideas: [{ id, contentPackageId: opportunity.industryPackId, title: opportunity.title, audienceQuestion: opportunity.customerQuestion || opportunity.demandSignal, viewerGain: opportunity.keyPromise, proofMaterial: opportunity.proofNeeded, seriesName: '', targetAction: opportunity.callToAction, sourceType: 'AI', tags: [opportunity.buyerStage, '联网研究'].filter(Boolean).join('，'), status: '待判断', createdAt }, ...current.bilibili.ideas] } }
      }
      if (channelId === 'wechat') {
        return { ...current, enabledChannels, wechat: { ...current.wechat, tasks: [{ id, contentPackageId: opportunity.industryPackId, actionType: '朋友圈触达', title: opportunity.title, goal: opportunity.keyPromise, audience: opportunity.targetCustomer, opening: opportunity.title, contentBody: opportunity.contentAngle, callToAction: opportunity.callToAction, assetChecklist: opportunity.proofNeeded, owner: current.wechat.settings.defaultOwner, plannedAt: '', status: '准备中', checklist: { audienceReady: Boolean(opportunity.targetCustomer), contentReady: false, materialsReady: false, ctaReady: Boolean(opportunity.callToAction), scopeChecked: false, executionChecked: false }, createdAt }, ...current.wechat.tasks] } }
      }
      if (channelId === 'offline') {
        return { ...current, enabledChannels, offline: { ...current.offline, tasks: [{ id, contentPackageId: opportunity.industryPackId, activityType: '到店活动', title: opportunity.title, goal: opportunity.callToAction, audience: opportunity.targetCustomer, location: current.topicResearch.brief.serviceArea, startAt: '', endAt: '', owner: current.offline.settings.defaultOwner, staffPlan: '', materialChecklist: opportunity.proofNeeded, onSiteProcess: opportunity.contentAngle, registrationMethod: opportunity.leadMagnet, callToAction: opportunity.callToAction, followUpPlan: '活动结束后 24 小时内联系已登记客户', status: '策划中', checklist: { scheduleReady: false, staffReady: false, materialsReady: false, processReady: false, registrationReady: false, followUpReady: false }, createdAt }, ...current.offline.tasks] } }
      }
      return { ...current, enabledChannels }
    })
    showToast(channelId === 'referral' ? '已启用转介绍合作，请先建立具体推荐关系' : `已加入${channelById(channelId).shortLabel}，等待人工确认`)
    return id
  }

  const addChannelTask = (formData: FormData, channelId: ChannelId) => {
    const channel = channelById(channelId)
    const task: ChannelTask = {
      id: `task-${Date.now()}`,
      channelId,
      contentPackageId: '',
      title: String(formData.get('title') || '').trim(),
      goal: String(formData.get('goal') || '').trim(),
      callToAction: String(formData.get('callToAction') || '').trim(),
      owner: String(formData.get('owner') || '').trim(),
      plannedDate: String(formData.get('plannedDate') || ''),
      status: String(formData.get('status') || '准备中') as ChannelTaskStatus,
      sourceCode: createSourceCode(channel),
      linkOrLocation: String(formData.get('linkOrLocation') || '').trim(),
      note: String(formData.get('note') || '').trim(),
      videoFormat: String(formData.get('videoFormat') || '口播讲解'),
      openingHook: String(formData.get('openingHook') || '').trim(),
      scriptOutline: String(formData.get('scriptOutline') || '').trim(),
      shootingChecklist: String(formData.get('shootingChecklist') || '').trim(),
      viewCount: nonNegativeNumber(formData.get('viewCount')),
      interactionCount: nonNegativeNumber(formData.get('interactionCount')),
      inquiryCount: nonNegativeNumber(formData.get('inquiryCount')),
      createdAt: todayISO(),
    }
    if (!task.title) return
    setData((current) => ({ ...current, channelTasks: [task, ...current.channelTasks] }))
    setTaskChannelId(null)
    showToast(`已建立${channel.taskLabel}`)
  }

  const updateChannelTask = (formData: FormData) => {
    if (!editingTask) return
    const channel = channelById(editingTask.channelId)
    setData((current) => ({
      ...current,
      channelTasks: current.channelTasks.map((task) => task.id === editingTask.id ? {
        ...task,
        contentPackageId: task.contentPackageId || '',
        title: String(formData.get('title') || '').trim(),
        goal: String(formData.get('goal') || '').trim(),
        callToAction: String(formData.get('callToAction') || '').trim(),
        owner: String(formData.get('owner') || '').trim(),
        plannedDate: String(formData.get('plannedDate') || ''),
        status: String(formData.get('status') || task.status) as ChannelTaskStatus,
        linkOrLocation: String(formData.get('linkOrLocation') || '').trim(),
        note: String(formData.get('note') || '').trim(),
        videoFormat: String(formData.get('videoFormat') || task.videoFormat),
        openingHook: String(formData.get('openingHook') || '').trim(),
        scriptOutline: String(formData.get('scriptOutline') || '').trim(),
        shootingChecklist: String(formData.get('shootingChecklist') || '').trim(),
        viewCount: nonNegativeNumber(formData.get('viewCount')),
        interactionCount: nonNegativeNumber(formData.get('interactionCount')),
        inquiryCount: nonNegativeNumber(formData.get('inquiryCount')),
      } : task),
    }))
    setEditingTask(null)
    showToast(`${channel.taskLabel}已更新`)
  }

  const advanceChannelTask = (task: ChannelTask) => {
    const channel = channelById(task.channelId)
    const nextStatus = task.status === '准备中' ? nextChannelStatus(channel) : task.status === '制作中' ? '待发布' : task.status === '待发布' ? '已发布' : task.status === '已发布' || task.status === '执行中' || task.status === '跟进中' ? '已完成' : task.status
    setData((current) => ({ ...current, channelTasks: current.channelTasks.map((item) => item.id === task.id ? { ...item, status: nextStatus } : item) }))
    const copy = nextStatus === '制作中' ? '已进入制作环节' : nextStatus === '待发布' ? '已完成制作，等待你手工发布' : nextStatus === '已发布' ? '已记录发布，可开始承接咨询' : nextStatus === '已完成' ? '已完成，可在复盘查看结果' : '任务状态已更新'
    showToast(copy)
  }

  const switchView = (nextView: View) => {
    setView(nextView)
    if (nextView !== 'acquisition') setActiveChannelId(null)
    setSearch('')
    setSidebarOpen(false)
  }

  const page = (() => {
    if (view === 'workspace') {
      return <WorkspacePage records={activeRecords} leads={leadCount} intents={intentCount} customers={customerCount} channelCount={enabledChannels.length} onAddLead={() => openRecordDialog('lead')} onOpenRecord={setEditingRecord} onNavigate={switchView} />
    }
    if (view === 'acquisition' && activeChannelId) {
      const channel = channelById(activeChannelId)
      if (channel.id === 'douyin') return <DouyinWorkspace data={data.douyin} records={data.records} onChange={(updater) => setData((current) => ({ ...current, douyin: updater(current.douyin) }))} onBack={() => setActiveChannelId(null)} onAddLead={(source) => openRecordDialog('lead', source)} onToast={showToast} />
      if (channel.id === 'xiaohongshu') return <XiaohongshuWorkspace data={data.xiaohongshu} records={data.records} onChange={(updater) => setData((current) => ({ ...current, xiaohongshu: updater(current.xiaohongshu) }))} onBack={() => setActiveChannelId(null)} onAddLead={(source) => openRecordDialog('lead', source)} onToast={showToast} />
      if (channel.id === 'wechat') return <WechatWorkspace data={data.wechat} records={data.records} onChange={(updater) => setData((current) => ({ ...current, wechat: updater(current.wechat) }))} onBack={() => setActiveChannelId(null)} onAddLead={(source) => openRecordDialog('lead', source)} onToast={showToast} />
      if (channel.id === 'offline') return <OfflineWorkspace data={data.offline} records={data.records} onChange={(updater) => setData((current) => ({ ...current, offline: updater(current.offline) }))} onBack={() => setActiveChannelId(null)} onAddLead={(source) => openRecordDialog('lead', source)} onOpenRecord={(record) => setEditingRecord(data.records.find((item) => item.id === record.id) || null)} onToast={showToast} />
      if (channel.id === 'referral') return <ReferralWorkspace data={data.referral} records={data.records} onChange={(updater) => setData((current) => ({ ...current, referral: updater(current.referral) }))} onBack={() => setActiveChannelId(null)} onAddLead={(source) => openRecordDialog('lead', source)} onOpenRecord={(record) => setEditingRecord(data.records.find((item) => item.id === record.id) || null)} onToast={showToast} />
      if (channel.id === 'bilibili') return <BilibiliWorkspace data={data.bilibili} records={data.records} onChange={(updater) => setData((current) => ({ ...current, bilibili: updater(current.bilibili) }))} onBack={() => setActiveChannelId(null)} onAddLead={(source) => openRecordDialog('lead', source)} onToast={showToast} />
      return <ChannelWorkspacePage channel={channel} tasks={data.channelTasks.filter((task) => task.channelId === channel.id)} records={data.records} onBack={() => setActiveChannelId(null)} onAddTask={() => setTaskChannelId(channel.id)} onEditTask={setEditingTask} onAdvanceTask={advanceChannelTask} onAddLead={() => openRecordDialog('lead')} />
    }
    if (view === 'acquisition') return <AcquisitionPage topicResearch={data.topicResearch} contentProduction={data.contentProduction} industryPack={activeIndustryPack} activeIndustryPackId={data.activeIndustryPackId} tacticPack={activeTacticPack} activeTacticPackId={data.activeTacticPackId} aiSettings={aiSettings} aiSecrets={aiSecrets} enabledChannels={data.enabledChannels} performanceByOpportunity={opportunityPerformance} onTopicResearchChange={(updater) => setData((current) => ({ ...current, topicResearch: updater(current.topicResearch) }))} onContentProductionChange={(updater) => setData((current) => ({ ...current, contentProduction: updater(current.contentProduction) }))} onToast={showToast} onOpenAIService={() => setAIServiceOpen(true)} onOfficialUsage={(usage) => setCreditAccount((current) => current ? { ...current, balance: usage.balanceAfter, updatedAt: '' } : current)} onAdoptOpportunity={adoptResearchOpportunity} onActivateIndustryRules={activateIndustryRules} onActivateTacticPack={activateTacticPack} onEnableChannel={enableChannel} onOpenChannel={setActiveChannelId} />
    if (view === 'review') return <ReviewPage records={data.records} onNavigate={switchView} />
    const stage = stageForView(view)
    if (!stage) return null
    return <LifecyclePage stage={stage} records={visibleRecords} sourceOptions={activeSources} search={search} onSearch={setSearch} onAdd={() => openRecordDialog(stage)} onEdit={setEditingRecord} onMove={moveRecord} onMarkLost={markLost} onCompleteAction={setNextActionDone} />
  })()

  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand"><span className="brand-mark"><Target size={20} /></span><div><strong>获客工作台</strong><span>客户增长管理</span></div><button className="mobile-close icon-button" type="button" onClick={() => setSidebarOpen(false)} aria-label="关闭菜单"><X size={18} /></button></div>
      <nav className="sidebar-nav" aria-label="主导航">{navItems.map((item) => <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => switchView(item.id)}>{item.icon}<span>{item.label}</span>{item.id === 'leads' && leadCount > 0 && <b>{leadCount}</b>}{item.id === 'intents' && intentCount > 0 && <b>{intentCount}</b>}</button>)}</nav>
      <div className="sidebar-note"><span>本地保存</span><p>数据保存在这台电脑中。</p></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu icon-button" type="button" onClick={() => setSidebarOpen(true)} aria-label="打开菜单"><Menu size={19} /></button><div className="breadcrumbs"><span>客户增长</span><ChevronRight size={14} /><strong>{activeChannelId ? channelById(activeChannelId).shortLabel : navItems.find((item) => item.id === view)?.label}</strong></div><div className="topbar-right">{aiSettings.mode === 'official' && <button className={`credit-account-button ${creditAccount ? 'loaded' : ''}`} type="button" onClick={() => setCreditAccountOpen(true)}><Coins size={15} /><span>{creditAccount ? `${new Intl.NumberFormat('zh-CN').format(creditAccount.balance)} 积分` : '积分账户'}</span></button>}<button className={`ai-service-button ${aiSettings.mode === 'official' && aiSecrets.officialTokenSaved || aiSettings.mode === 'custom' && aiSecrets.customApiKeySaved ? 'configured' : ''}`} type="button" onClick={() => setAIServiceOpen(true)}><Sparkles size={15} /><span>AI 服务</span></button><span className="save-state"><span></span>已自动保存</span></div></header>
      <div className="page-wrap" key={view}>{page}</div>
    </main>
    {dialogStage && <RecordDialog stage={dialogStage} sourceOptions={activeSources} defaultSource={recordSourcePreset} onClose={() => { setDialogStage(null); setRecordSourcePreset('') }} onSubmit={(formData) => addRecord(formData, dialogStage)} />}
    {editingRecord && <RecordDialog record={editingRecord} sourceOptions={activeSources} stage={editingRecord.stage === 'lost' ? 'lead' : editingRecord.stage} onClose={() => setEditingRecord(null)} onSubmit={updateRecord} />}
    {taskChannelId && <ChannelTaskDialog channel={channelById(taskChannelId)} onClose={() => setTaskChannelId(null)} onSubmit={(formData) => addChannelTask(formData, taskChannelId)} />}
    {editingTask && <ChannelTaskDialog channel={channelById(editingTask.channelId)} task={editingTask} onClose={() => setEditingTask(null)} onSubmit={updateChannelTask} />}
    {aiServiceOpen && <AIServiceDialog settings={aiSettings} secretStatus={aiSecrets} onClose={() => setAIServiceOpen(false)} onSave={(nextSettings, nextSecrets) => { setAISettings(nextSettings); setAISecrets(nextSecrets); setAIServiceOpen(false); showToast(nextSettings.mode === 'official' ? '官方 AI 服务已保存' : '自有 AI 服务已保存') }} onToast={showToast} />}
    {creditAccountOpen && <CreditAccountDialog settings={aiSettings} secretStatus={aiSecrets} onClose={() => setCreditAccountOpen(false)} onOpenAIService={() => { setCreditAccountOpen(false); setAIServiceOpen(true) }} onAccountChange={setCreditAccount} onToast={showToast} />}
    {toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}
  </div>
}

function WorkspacePage({ records, leads, intents, customers, channelCount, onAddLead, onOpenRecord, onNavigate }: { records: CustomerRecord[]; leads: number; intents: number; customers: number; channelCount: number; onAddLead: () => void; onOpenRecord: (record: CustomerRecord) => void; onNavigate: (view: View) => void }) {
  const upcoming = [...records].filter((record) => record.nextAction || record.nextDate).sort((left, right) => (left.nextDate || '9999-12-31').localeCompare(right.nextDate || '9999-12-31')).slice(0, 5)
  return <>
    <PageHeader title="今天，把下一步做清楚" description="从一条线索开始，持续推进到意向、成交和老客户经营。" action={<button className="button button-primary" onClick={onAddLead}><Plus size={16} />新建线索</button>} />
    <section className="stage-overview" aria-label="当前客户阶段概览"><button onClick={() => onNavigate('leads')}><span>线索</span><strong>{leads}</strong><small>新进来的咨询</small><ArrowRight size={16} /></button><button onClick={() => onNavigate('intents')}><span>意向客户</span><strong>{intents}</strong><small>正在推进成交</small><ArrowRight size={16} /></button><button onClick={() => onNavigate('customers')}><span>客户</span><strong>{customers}</strong><small>服务与后续经营</small><ArrowRight size={16} /></button></section>
    <section className="workspace-grid"><div className="work-panel"><div className="section-heading-row"><div><h2>下一步</h2><p>优先处理已安排日期的客户事项。</p></div><button className="text-button" onClick={() => onNavigate('intents')}>查看意向客户</button></div>{upcoming.length ? <div className="action-list">{upcoming.map((record) => <button className="action-row" key={record.id} onClick={() => onOpenRecord(record)}><span className={`stage-dot ${record.stage}`}></span><div><strong>{record.nextAction || '补充下一步动作'}</strong><span>{record.name} · {record.source}</span></div><time>{formatDate(record.nextDate)}</time><ChevronRight size={16} /></button>)}</div> : <EmptyState icon={<ClipboardList size={24} />} title="还没有待处理事项" description="新增线索时安排下一步，这里会自动形成今天的工作清单。" action={<button className="button button-secondary" onClick={onAddLead}><Plus size={15} />新建线索</button>} />}</div><aside className="work-panel quiet-panel"><div className="section-heading-row"><div><h2>客户进程</h2><p>每个人都只需要推进到下一步。</p></div></div><div className="flow-list"><FlowRow index="1" label="线索" count={leads} note="确认来源和需求" /><FlowRow index="2" label="意向客户" count={intents} note="预约、方案、报价" /><FlowRow index="3" label="客户" count={customers} note="服务、回访、复购" /></div></aside></section>
    <section className="work-panel compact-panel"><div><h2>获客渠道</h2><p>{channelCount ? `当前已配置 ${channelCount} 个获客渠道。内容、活动和转介绍带来的结果会统一回到线索与复盘。` : '选择你准备做的获客渠道后，工作台会只保留对应的日常工作区。'}</p></div><button className="button button-secondary" onClick={() => onNavigate('acquisition')}>{channelCount ? '进入获客' : '选择渠道'}<ArrowRight size={16} /></button></section>
  </>
}

function AcquisitionPage({ topicResearch, contentProduction, industryPack, activeIndustryPackId, tacticPack, activeTacticPackId, aiSettings, aiSecrets, enabledChannels, performanceByOpportunity, onTopicResearchChange, onContentProductionChange, onToast, onOpenAIService, onOfficialUsage, onAdoptOpportunity, onActivateIndustryRules, onActivateTacticPack, onEnableChannel, onOpenChannel }: { topicResearch: TopicResearchData; contentProduction: ContentProductionData; industryPack?: IndustryRulePack; activeIndustryPackId: string; tacticPack?: GrowthTacticPack; activeTacticPackId: string; aiSettings: AIServiceSettings; aiSecrets: AISecretStatus; enabledChannels: ChannelId[]; performanceByOpportunity: Record<string, OpportunityChannelPerformance[]>; onTopicResearchChange: (updater: (current: TopicResearchData) => TopicResearchData) => void; onContentProductionChange: (updater: (current: ContentProductionData) => ContentProductionData) => void; onToast: (message: string) => void; onOpenAIService: () => void; onOfficialUsage: (usage: { pointsCharged: number; balanceAfter: number }) => void; onAdoptOpportunity: (opportunity: GeneratedTopicCandidate, channelId: ChannelId) => string; onActivateIndustryRules: (packId: string) => void; onActivateTacticPack: (packId: string) => void; onEnableChannel: (channelId: ChannelId) => void; onOpenChannel: (channelId: ChannelId) => void }) {
  const [selectedChannelId, setSelectedChannelId] = useState<ChannelId>('douyin')
  const channel = channelById(selectedChannelId)
  const isEnabled = enabledChannels.includes(selectedChannelId)
  const isAvailable = selectedChannelId === 'douyin' || selectedChannelId === 'xiaohongshu' || selectedChannelId === 'wechat' || selectedChannelId === 'offline' || selectedChannelId === 'referral' || selectedChannelId === 'bilibili'
  return <>
    <PageHeader title="获客" description="选择准备使用的获客渠道。启用后即可进入对应的基础工作区。" />
    <TopicResearchPanel data={topicResearch} industryPack={industryPack} tacticPack={tacticPack} aiSettings={aiSettings} aiSecrets={aiSecrets} enabledChannels={enabledChannels} performanceByOpportunity={performanceByOpportunity} onChange={onTopicResearchChange} onToast={onToast} onOpenAIService={onOpenAIService} onOfficialUsage={onOfficialUsage} onAdoptOpportunity={onAdoptOpportunity} onOpenChannel={onOpenChannel} />
    <ContentProductionPanel data={contentProduction} opportunities={topicResearch.generatedTopics} evidence={topicResearch.evidence} industryPack={industryPack} tacticPack={tacticPack} enabledChannels={enabledChannels} performanceByOpportunity={performanceByOpportunity} aiSettings={aiSettings} aiSecrets={aiSecrets} onChange={onContentProductionChange} onToast={onToast} onOpenAIService={onOpenAIService} onOfficialUsage={onOfficialUsage} onOpenChannel={onOpenChannel} />
    <section className="channel-tabs" aria-label="获客渠道">{channelDefinitions.map((item) => <button key={item.id} data-channel-id={item.id} className={selectedChannelId === item.id ? 'active' : ''} type="button" onClick={() => setSelectedChannelId(item.id)}><span className={`mini-channel-icon ${item.id}`}>{item.icon}</span>{item.shortLabel}{enabledChannels.includes(item.id) && <b><Check size={11} /></b>}</button>)}</section>
    <section className="channel-foundation-band" id="channel-foundation"><div className="channel-foundation-head"><span className={`channel-icon ${channel.id}`}>{channel.icon}</span><div><h2>{channel.label}</h2><p>{channel.description}</p></div><span className={`channel-availability ${isEnabled ? 'enabled' : isAvailable ? 'available' : 'pending'}`}>{isEnabled ? '已启用' : isAvailable ? '可启用' : '基础框架待完善'}</span></div><div className="channel-foundation-body"><div><h3>基础工作流程</h3><p>这套流程属于渠道本身，不需要先选择行业或内容方向。</p><div className="workflow-steps light">{channel.workflow.map((step, index) => <span key={step}><b>{index + 1}</b>{step}</span>)}</div></div><div className="channel-foundation-action"><small>{isAvailable || isEnabled ? `启用后即可使用${channel.shortLabel}的完整基础工作区。` : '该渠道会在基础能力完成并验证后开放。'}</small>{isEnabled ? <button className="button button-primary" onClick={() => onOpenChannel(channel.id)}>进入{channel.shortLabel}<ArrowRight size={16} /></button> : isAvailable ? <button className="button button-primary" id={`enable-channel-${channel.id}`} onClick={() => onEnableChannel(channel.id)}>启用{channel.shortLabel}<Check size={16} /></button> : <button className="button button-secondary" type="button" disabled>暂未开放</button>}</div></div></section>
    <IndustryRuleCatalog packs={industryRulePacks} activePackId={activeIndustryPackId} onActivate={onActivateIndustryRules} />
    <TacticPackCatalog packs={growthTacticPacks} activePackId={activeTacticPackId} activeIndustryPackId={activeIndustryPackId} enabledChannels={enabledChannels} selectedChannelId={selectedChannelId} onActivate={onActivateTacticPack} />
  </>
}

function ChannelWorkspacePage({ channel, tasks, records, onBack, onAddTask, onEditTask, onAdvanceTask, onAddLead }: { channel: ChannelDefinition; tasks: ChannelTask[]; records: CustomerRecord[]; onBack: () => void; onAddTask: () => void; onEditTask: (task: ChannelTask) => void; onAdvanceTask: (task: ChannelTask) => void; onAddLead: () => void }) {
  const activeTasks = tasks.filter((task) => ['已发布', '执行中', '跟进中', '已完成'].includes(task.status))
  const leads = records.filter((record) => activeTasks.some((task) => record.source.includes(task.sourceCode)))
  const intents = leads.filter((record) => record.stage === 'intent').length
  const customers = leads.filter((record) => record.stage === 'customer').length
  const nextTask = tasks.find((task) => task.status === '准备中' || task.status === '制作中' || task.status === '待发布' || task.status === '执行中' || task.status === '跟进中')
  const stepLabel = nextTask?.status === '准备中' ? '开始制作' : nextTask?.status === '制作中' ? '完成制作' : nextTask?.status === '待发布' ? channel.actionLabel : nextTask?.status === '已发布' ? '完成本次任务' : nextTask?.status === '执行中' || nextTask?.status === '跟进中' ? '完成本次任务' : ''
  return <>
    <PageHeader title={channel.shortLabel} description={channel.description} action={<div className="page-action-group"><button className="button button-secondary" onClick={onBack}><ChevronLeft size={16} />返回获客</button><button className="button button-primary" onClick={onAddTask}><Plus size={16} />新建{channel.taskLabel}</button></div>} />
    <section className="channel-workflow"><div className="channel-workflow-heading"><span className={`channel-icon ${channel.id}`}>{channel.icon}</span><div><h2>{channel.label}</h2><p>从准备一条获客动作开始，到来源、线索和最终结果都在这里留下记录。</p></div></div><div className="workflow-steps">{channel.workflow.map((step, index) => <span key={step}><b>{index + 1}</b>{step}</span>)}</div></section>
    <section className="stage-overview channel-overview"><div><span>全部任务</span><strong>{tasks.length}</strong><small>正在准备或执行</small></div><div><span>已产生来源</span><strong>{activeTasks.length}</strong><small>可关联到新线索</small></div><div><span>关联线索</span><strong>{leads.length}</strong><small>{intents} 个意向客户 · {customers} 个客户</small></div></section>
    <section className="workspace-grid channel-detail-grid"><div className="work-panel"><div className="section-heading-row"><div><h2>{channel.taskLabel}</h2><p>每条已执行任务都会生成来源编号，用来识别它带来的客户。</p></div><button className="text-button" onClick={onAddTask}>新建{channel.taskLabel}</button></div>{tasks.length ? <div className="channel-task-list">{tasks.map((task) => <div className="channel-task-row" key={task.id}><button className="channel-task-main" onClick={() => onEditTask(task)}><span className={`status-pill ${taskStatusTone(task.status)}`}>{task.status}</span><div><strong>{task.title}</strong><span>{task.goal || '暂未填写目标'} · {task.sourceCode}</span></div></button><div className="channel-task-meta"><span>{formatDate(task.plannedDate)}</span><button className="icon-button small" title="编辑任务" aria-label="编辑任务" onClick={() => onEditTask(task)}><ChevronRight size={16} /></button></div></div>)}</div> : <EmptyState icon={<ClipboardList size={24} />} title={`还没有${channel.taskLabel}`} description="先建立一条准备执行的获客动作。发布或执行后，它会自动拥有可追踪的来源编号。" action={<button className="button button-primary" onClick={onAddTask}><Plus size={16} />新建{channel.taskLabel}</button>} />}</div><aside className="work-panel quiet-panel channel-next-panel"><div className="section-heading-row"><div><h2>下一步</h2><p>不追求一次做完，只推进一条任务。</p></div></div>{nextTask ? <div className="channel-next"><span className={`status-pill ${taskStatusTone(nextTask.status)}`}>{nextTask.status}</span><strong>{nextTask.title}</strong><p>{nextTask.goal || '补充这条任务要带来什么结果。'}</p><button className="button button-primary" onClick={() => onAdvanceTask(nextTask)}>{stepLabel}<ArrowRight size={15} /></button></div> : <EmptyState icon={<CalendarDays size={22} />} title="没有待推进任务" description="新建一条任务后，这里会提示最合适的下一步。" />}</aside></section>
    <section className="work-panel compact-panel"><div><h2>线索承接</h2><p>当客户因为这条内容、活动或推荐来咨询时，新建线索并选择对应来源编号，后续的意向、成交和复盘会自动串起来。</p></div><button className="button button-secondary" onClick={onAddLead}><Plus size={15} />新建线索</button></section>
  </>
}

function LifecyclePage({ stage, records, sourceOptions, search, onSearch, onAdd, onEdit, onMove, onMarkLost, onCompleteAction }: { stage: Exclude<Stage, 'lost'>; records: CustomerRecord[]; sourceOptions: SourceOption[]; search: string; onSearch: (value: string) => void; onAdd: () => void; onEdit: (record: CustomerRecord) => void; onMove: (id: string, stage: Exclude<Stage, 'lost'>) => void; onMarkLost: (id: string) => void; onCompleteAction: (record: CustomerRecord) => void }) {
  const copy = { lead: { title: '线索', description: '记录新进来的咨询，先确认来源、需求和是否值得继续投入。', action: '新建线索', empty: '还没有线索', helper: '新的私信、扫码、电话、到店和转介绍都可以从这里开始。' }, intent: { title: '意向客户', description: '把确认值得推进的人放在这里，安排联系、预约、方案和报价。', action: '新建意向客户', empty: '还没有意向客户', helper: '线索确认有明确需求后，可以转入这里持续推进。' }, customer: { title: '客户', description: '成交后继续记录服务、回访和下一次可能的复购或转介绍。', action: '新建客户', empty: '还没有客户', helper: '意向客户成交后，会自动进入这里。' } }[stage]
  const statusCounts = stageMeta[stage].statuses.map((status) => ({ status, count: records.filter((record) => record.status === status).length })).filter((item) => item.count > 0)
  return <>
    <PageHeader title={copy.title} description={copy.description} action={<button className="button button-primary" onClick={onAdd}><Plus size={16} />{copy.action}</button>} />
    <section className="list-summary"><div><strong>{records.length}</strong><span>当前{copy.title}</span></div>{statusCounts.map((item) => <div key={item.status}><strong>{item.count}</strong><span>{item.status}</span></div>)}<p>{sourceOptions.length ? `${copy.helper} 已有 ${sourceOptions.length} 条已执行的渠道来源可供关联。` : copy.helper}</p></section>
    <section className="table-panel"><div className="table-toolbar"><div><h2>全部{copy.title}</h2><span>{records.length ? '按下一步日期排序' : '等待第一条记录'}</span></div><label className="search-box"><Search size={16} /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="搜索姓名、联系方式、来源或需求" /></label></div>{records.length ? <div className="table-scroll"><table><thead><tr><th>客户</th><th>来源与需求</th><th>当前状态</th><th>下一步</th><th>负责人</th><th aria-label="操作"></th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td><button className="record-name" onClick={() => onEdit(record)}><strong>{record.name}</strong><span>{record.contact || `录入于 ${formatDate(record.createdAt)}`}</span></button></td><td><div className="source-cell"><b>{record.source}</b><span>{record.need || '暂未填写需求'}</span></div></td><td><span className={`status-pill ${statusTone(record.status)}`}>{record.status}</span></td><td><button className="next-cell" onClick={() => onEdit(record)}><b>{record.nextAction || '待安排'}</b><span>{formatDate(record.nextDate)}</span></button></td><td>{record.owner || '未分配'}</td><td><div className="row-actions">{stage === 'lead' && <button className="button button-secondary small" onClick={() => onMove(record.id, 'intent')}>转为意向<ArrowRight size={14} /></button>}{stage === 'intent' && <><button className="button button-primary small" onClick={() => onMove(record.id, 'customer')}>标记成交<Check size={14} /></button><button className="icon-button small" title="暂不跟进" aria-label="暂不跟进" onClick={() => onMarkLost(record.id)}><X size={15} /></button></>}{stage === 'customer' && <button className="button button-secondary small" onClick={() => onCompleteAction(record)}>记录回访<Check size={14} /></button>}<button className="icon-button small" title="编辑" aria-label="编辑" onClick={() => onEdit(record)}><ChevronRight size={16} /></button></div></td></tr>)}</tbody></table></div> : <EmptyState icon={<FolderPlus size={25} />} title={copy.empty} description={copy.helper} action={<button className="button button-primary" onClick={onAdd}><Plus size={16} />{copy.action}</button>} />}</section>
  </>
}

function ReviewPage({ records, onNavigate }: { records: CustomerRecord[]; onNavigate: (view: View) => void }) {
  const leads = records.filter((record) => record.stage === 'lead').length
  const intents = records.filter((record) => record.stage === 'intent').length
  const customers = records.filter((record) => record.stage === 'customer').length
  const lost = records.filter((record) => record.stage === 'lost').length
  const sourceRows = useMemo(() => {
    const map = new Map<string, { source: string; total: number; intents: number; customers: number }>()
    records.forEach((record) => {
      const source = record.source || '未记录来源'
      const current = map.get(source) ?? { source, total: 0, intents: 0, customers: 0 }
      current.total += 1
      if (record.stage === 'intent' || record.stage === 'customer') current.intents += 1
      if (record.stage === 'customer') current.customers += 1
      map.set(source, current)
    })
    return [...map.values()].sort((left, right) => right.customers - left.customers || right.intents - left.intents || right.total - left.total)
  }, [records])
  const conversion = leads + intents + customers ? Math.round((customers / Math.max(leads + intents + customers, 1)) * 100) : 0
  return <>
    <PageHeader title="复盘" description="从获客来源一路看到线索、意向和客户，决定下一步把时间花在哪里。" />
    <section className="funnel-panel"><div className="funnel-heading"><div><h2>客户进程</h2><p>这是一张起点清晰的全链路底图，后续获客能力会自动把数据带进来。</p></div><span>{conversion}% 成交占比</span></div><div className="funnel-flow"><FunnelStep label="线索" value={leads} tone="lead" /><FunnelArrow /><FunnelStep label="意向客户" value={intents} tone="intent" /><FunnelArrow /><FunnelStep label="客户" value={customers} tone="customer" /></div><div className="funnel-foot"><span>{lost} 条暂不跟进</span><button className="text-button" onClick={() => onNavigate('leads')}>查看线索</button></div></section>
    <section className="review-grid-core"><div className="table-panel"><div className="table-toolbar"><div><h2>来源结果</h2><span>先用来源判断哪些动作值得继续记录。</span></div></div>{sourceRows.length ? <div className="table-scroll"><table><thead><tr><th>来源</th><th>进入线索</th><th>进入意向</th><th>成为客户</th></tr></thead><tbody>{sourceRows.map((row) => <tr key={row.source}><td><strong>{row.source}</strong></td><td>{row.total}</td><td>{row.intents}</td><td>{row.customers}</td></tr>)}</tbody></table></div> : <EmptyState icon={<BarChart3 size={24} />} title="暂时没有可复盘的数据" description="先在线索中记录来源，后续推进到意向客户和客户后，这里会形成完整结果。" action={<button className="button button-secondary" onClick={() => onNavigate('leads')}>去记录线索<ArrowRight size={15} /></button>} />}</div><aside className="review-note"><ClipboardList size={20} /><h2>复盘先看什么</h2><ol><li>哪个来源带来了更多值得推进的人？</li><li>意向客户卡在哪个环节？</li><li>成交后的客户，何时适合回访？</li></ol><p>没有真实来源和状态记录时，系统不会给出看似聪明但没有依据的结论。</p></aside></section>
  </>
}

function ChannelTaskDialog({ channel, task, onClose, onSubmit }: { channel: ChannelDefinition; task?: ChannelTask; onClose: () => void; onSubmit: (formData: FormData) => void }) {
  const statuses = channelStatusOptions(channel)
  const defaultStatus = task && statuses.some((status) => status === task.status) ? task.status : statuses[0]
  const isEdit = Boolean(task)
  return <div className="dialog-backdrop" role="presentation">
    <form className="dialog channel-task-dialog" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget)) }}>
      <div className="dialog-head"><div><h2>{isEdit ? `编辑${channel.taskLabel}` : `新建${channel.taskLabel}`}</h2><p>把这次获客动作和行动引导写清楚。任务进入发布、执行或跟进状态后，可作为线索来源使用。</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div>
      <div className="form-grid">
        <label className="field field-wide"><span>{channel.taskLabel}主题</span><input name="title" required autoFocus defaultValue={task?.title ?? ''} placeholder={channel.taskPlaceholder} /></label>
        <label className="field"><span>这次想获得什么结果</span><input name="goal" defaultValue={task?.goal ?? ''} placeholder="例如：获得 10 个有效咨询" /></label>
        <label className="field"><span>客户下一步要做什么</span><input name="callToAction" defaultValue={task?.callToAction ?? ''} placeholder="例如：私信领取清单 / 预约到店" /></label>
        <label className="field"><span>负责人</span><input name="owner" defaultValue={task?.owner ?? ''} placeholder="例如：张店长" /></label>
        <label className="field"><span>计划日期</span><input name="plannedDate" type="date" defaultValue={task?.plannedDate ?? ''} /></label>
        <label className="field"><span>当前状态</span><select name="status" defaultValue={defaultStatus}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        <label className="field"><span>{channel.linkLabel}</span><input name="linkOrLocation" defaultValue={task?.linkOrLocation ?? ''} placeholder={channel.kind === 'offline' ? '例如：XX 小区东门广场' : '发布后可补充链接或记录'} /></label>
        {task ? <div className="field field-wide source-code-field"><span>来源编号</span><div><Link2 size={15} /><strong>{task.sourceCode}</strong><small>线索录入时可选择这一来源。</small></div></div> : null}
        <label className="field field-wide"><span>备注</span><textarea name="note" rows={3} defaultValue={task?.note ?? ''} placeholder="可选，记录素材、活动安排或需要注意的事情" /></label>
      </div>
      <div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onClose}>取消</button><button className="button button-primary" type="submit">保存<Check size={16} /></button></div>
    </form>
  </div>
}

function RecordDialog({ stage, record, sourceOptions, defaultSource = '', onClose, onSubmit }: { stage: Exclude<Stage, 'lost'>; record?: CustomerRecord; sourceOptions: SourceOption[]; defaultSource?: string; onClose: () => void; onSubmit: (formData: FormData) => void }) {
  const [selectedStage, setSelectedStage] = useState<Exclude<Stage, 'lost'>>(record?.stage === 'lost' ? stage : record?.stage ?? stage)
  const statuses = stageMeta[selectedStage].statuses
  const defaultStatus = record?.stage === selectedStage && statuses.includes(record.status) ? record.status : statuses[0]
  const title = record ? `编辑${stageMeta[selectedStage].label}` : `新建${stageMeta[stage].label}`
  return <div className="dialog-backdrop" role="presentation"><form className="dialog" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget)) }}><div className="dialog-head"><div><h2>{title}</h2><p>把来源、联系方式、需求和下一步填写清楚，工作台才能帮你持续推进。</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div><div className="form-grid"><label className="field"><span>姓名或称呼</span><input name="name" required autoFocus defaultValue={record?.name ?? ''} placeholder="例如：王女士 / 某公司负责人" /></label><label className="field"><span>联系方式</span><input name="contact" defaultValue={record?.contact ?? ''} placeholder="例如：手机号 / 微信备注名" /></label><label className="field field-wide"><span>来源</span><input name="source" list="channel-source-options" defaultValue={record?.source ?? defaultSource} placeholder="例如：扫码、电话、朋友介绍" /></label>{sourceOptions.length ? <datalist id="channel-source-options">{sourceOptions.map((source) => <option key={source.id} value={source.label} />)}</datalist> : null}<label className="field field-wide"><span>需求</span><textarea name="need" rows={3} defaultValue={record?.need ?? ''} placeholder="他想解决什么问题，是否有明确的购买或服务需求？" /></label><label className="field"><span>当前阶段</span><select name="stage" value={selectedStage} onChange={(event) => setSelectedStage(event.target.value as Exclude<Stage, 'lost'>)}>{(Object.keys(stageMeta) as Array<Exclude<Stage, 'lost'>>).map((item) => <option key={item} value={item}>{stageMeta[item].label}</option>)}</select></label><label className="field"><span>当前状态</span><select name="status" key={`${selectedStage}-${defaultStatus}`} defaultValue={defaultStatus}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><label className="field"><span>负责人</span><input name="owner" defaultValue={record?.owner ?? ''} placeholder="例如：张店长" /></label><label className="field"><span>下一步日期</span><input name="nextDate" type="date" defaultValue={record?.nextDate ?? ''} /></label><label className="field field-wide"><span>下一步动作</span><input name="nextAction" defaultValue={record?.nextAction ?? ''} placeholder="例如：明天电话确认到店时间" /></label><label className="field field-wide"><span>备注</span><textarea name="note" rows={2} defaultValue={record?.note ?? ''} placeholder="可选，记录需要留意的事情" /></label></div><div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onClose}>取消</button><button className="button button-primary" type="submit">保存<Check size={16} /></button></div></form></div>
}

function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) { return <header className="page-header"><div><h1>{title}</h1><p>{description}</p></div>{action && <div className="page-action">{action}</div>}</header> }
function FlowRow({ index, label, count, note }: { index: string; label: string; count: number; note: string }) { return <div className="flow-row"><span>{index}</span><div><b>{label}</b><small>{note}</small></div><strong>{count}</strong></div> }
function FunnelStep({ label, value, tone }: { label: string; value: number; tone: string }) { return <div className={`funnel-step ${tone}`}><span>{label}</span><strong>{value}</strong></div> }
function FunnelArrow() { return <span className="funnel-arrow"><ArrowRight size={18} /></span> }
function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) { return <div className="empty-state"><span>{icon}</span><h2>{title}</h2><p>{description}</p>{action}</div> }

export default App
