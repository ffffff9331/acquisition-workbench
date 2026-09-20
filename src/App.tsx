import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ClipboardPlus,
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
import { DeliveryConfigurationPanel } from './delivery-configuration-panel'
import { createDeliveryConfigurationPlan, type DeliveryConfigurationSelection } from './delivery-configuration'
import { verifyDeliveryPackArtifact, type VerifiedDeliveryPack } from './delivery-pack-auth'
import { growthTacticPackById, growthTacticPacks, normalizeTacticLeadValues, normalizeTacticQualificationStatus, tacticLeadInputName, tacticLeadProgress, tacticQualificationRecommendation, type GrowthTacticPack, type TacticLeadValues, type TacticQualificationStatus } from './tactic-packs'
import { customerStageEventByType, customerStageEventDefinitions, firstManualResponseEventType, normalizeCustomerStageEvents, ownershipHandoffEventType, type CustomerStageEvent } from './customer-events'
import { tacticReviewRows } from './tactic-review'
import { emptyTopicResearchData, normalizeTopicResearchData, TopicResearchPanel, type GeneratedTopicCandidate, type OpportunityChannelPerformance, type TopicResearchData } from './topic-research'
import { ContentProductionPanel, contentLeadContextForExecution, emptyContentProductionData, normalizeContentProductionData, type ContentLeadContext, type ContentProductionData } from './content-production'
import { contentLeadContextForUpdatedRecord } from './lead-content-context'
import { leadWorkQueue } from './lead-work-queue'
import { firstResponseDeadline, firstResponseSlaLabel, firstResponseSlaStatus, normalizeFirstResponseTarget, nowLocalDateTime } from './lead-response-sla'
import { trafficCampaignQueue } from './traffic-campaign-queue'
import type { IndustryRulePack } from './industry-rules'
import { OperationsHub } from './operations-hub'
import { emptyOperationsData, normalizeOperationsData, pruneOperationsContentLinks, type OperationsData } from './operations-core'

type View = 'workspace' | 'acquisition' | 'operations' | 'leads' | 'intents' | 'customers' | 'review'
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
  tacticPackId: string
  tacticLeadValues: TacticLeadValues
  tacticQualificationStatus: TacticQualificationStatus
  tacticQualificationNote: string
  tacticQualifiedAt: string
  contentLeadContext: ContentLeadContext | null
  intakeAt: string
  firstResponseDueAt: string
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
type ContentLeadSourceOption = { source: string; sourceCode: string; context: ContentLeadContext }

type WorkspaceData = { records: CustomerRecord[]; events: CustomerStageEvent[]; enabledChannels: ChannelId[]; installedIndustryPacks: string[]; activeIndustryPackId: string; installedTacticPacks: string[]; activeTacticPackId: string; deliveryPackArtifacts: string[]; installationId: string; channelTasks: ChannelTask[]; topicResearch: TopicResearchData; contentProduction: ContentProductionData; operations: OperationsData; douyin: DouyinData; xiaohongshu: XiaohongshuData; wechat: WechatData; offline: OfflineData; referral: ReferralData; bilibili: BilibiliData }

const STORAGE_KEY = 'acquisition-workbench-core-v1'
const emptyData: WorkspaceData = { records: [], events: [], enabledChannels: [], installedIndustryPacks: [], activeIndustryPackId: '', installedTacticPacks: [], activeTacticPackId: '', deliveryPackArtifacts: [], installationId: '', channelTasks: [], topicResearch: emptyTopicResearchData, contentProduction: emptyContentProductionData, operations: emptyOperationsData, douyin: emptyDouyinData, xiaohongshu: emptyXiaohongshuData, wechat: emptyWechatData, offline: emptyOfflineData, referral: emptyReferralData, bilibili: emptyBilibiliData }

const navItems: Array<{ id: View; label: string; icon: ReactNode }> = [
  { id: 'workspace', label: '今日工作', icon: <Target size={18} /> },
  { id: 'acquisition', label: '需求与机会', icon: <Search size={18} /> },
  { id: 'operations', label: '运营', icon: <FolderPlus size={18} /> },
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
  return nowLocalDateTime().slice(0, 10)
}

function createInstallationId() {
  const suffix = globalThis.crypto?.randomUUID?.().replace(/-/g, '') || `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`
  return `workbench-${suffix}`.slice(0, 120)
}

function normalizeInstallationId(value: unknown) {
  const id = typeof value === 'string' ? value.trim().slice(0, 120) : ''
  return /^[a-z0-9-]+$/i.test(id) ? id : ''
}

function formText(formData: FormData, name: string, maxLength = 1000) {
  return String(formData.get(name) || '').trim().slice(0, maxLength)
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function normalizeContentLeadContext(value: unknown): ContentLeadContext | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Partial<ContentLeadContext>
  const channelId = channelDefinitions.some((channel) => channel.id === item.channelId) ? item.channelId as ChannelId : null
  const contentTaskId = cleanText(item.contentTaskId, 120)
  const variantId = cleanText(item.variantId, 120)
  if (!channelId || !contentTaskId || !variantId) return null
  return {
    contentTaskId,
    variantId,
    channelId,
    title: cleanText(item.title, 200),
    customerPromise: cleanText(item.customerPromise, 600),
    customerNextAction: cleanText(item.customerNextAction, 1000),
    inquiryOwner: cleanText(item.inquiryOwner, 120),
    firstResponseTarget: normalizeFirstResponseTarget(item.firstResponseTarget),
    inquiryEntry: cleanText(item.inquiryEntry, 300),
    firstResponsePlan: cleanText(item.firstResponsePlan, 800),
    customerPreparation: cleanText(item.customerPreparation, 800),
    serviceBoundary: cleanText(item.serviceBoundary, 800),
    lockedAt: cleanText(item.lockedAt, 60),
  }
}

function sourceCodeFromLabel(value: string) {
  const parts = value.split(' · ')
  return cleanText(parts[parts.length - 1], 120)
}

function tacticLeadValuesFromForm(formData: FormData, pack?: GrowthTacticPack) {
  if (!pack) return {}
  return pack.leadFields.reduce<TacticLeadValues>((values, field) => {
    const value = formText(formData, tacticLeadInputName(field.id))
    if (value) values[field.id] = value
    return values
  }, {})
}

function tacticNextAction(pack: GrowthTacticPack, values: TacticLeadValues) {
  const progress = tacticLeadProgress(pack, values)
  return pack.followUpSteps[progress.complete ? 1 : 0]?.action || ''
}

function tacticQualificationForRecord(record: CustomerRecord) {
  const pack = growthTacticPackById(record.tacticPackId)
  if (!pack) return null
  const recommendation = tacticQualificationRecommendation(pack, record.tacticLeadValues)
  const status = recommendation.status === '待补充信息'
    ? '待补充信息'
    : record.tacticQualificationStatus || '待人工判断'
  return { pack, recommendation, status }
}

function qualificationTone(status: string) {
  if (status === '可人工推进') return 'teal'
  if (status === '暂不符合') return 'muted'
  return 'amber'
}

function createCustomerStageEvent(recordId: string, type: CustomerStageEvent['type'], occurredAt = todayISO(), note = ''): CustomerStageEvent {
  return {
    id: `event-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
    recordId,
    type,
    occurredAt,
    note,
    createdAt: new Date().toISOString().slice(0, 19),
  }
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
    const deliveryPackArtifacts = [...new Set((Array.isArray(parsed.deliveryPackArtifacts) ? parsed.deliveryPackArtifacts : []).filter((value): value is string => typeof value === 'string' && value.length > 0 && value.length <= 100_000))].slice(0, 80)
    const douyin = normalizeDouyinData(parsed.douyin, channelTasks)
    const xiaohongshu = normalizeXiaohongshuData(parsed.xiaohongshu, channelTasks)
    const wechat = normalizeWechatData(parsed.wechat, channelTasks)
    const offline = normalizeOfflineData(parsed.offline, channelTasks)
    const referral = normalizeReferralData(parsed.referral, channelTasks)
    const bilibili = normalizeBilibiliData(parsed.bilibili, channelTasks)
    const topicResearch = normalizeTopicResearchData(parsed.topicResearch)
    const contentProduction = normalizeContentProductionData(parsed.contentProduction)
    const operations = normalizeOperationsData(parsed.operations)
    const events = normalizeCustomerStageEvents(parsed.events)
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
        tacticPackId: typeof record.tacticPackId === 'string' ? record.tacticPackId.slice(0, 200) : '',
        tacticLeadValues: normalizeTacticLeadValues(record.tacticLeadValues),
        tacticQualificationStatus: normalizeTacticQualificationStatus(record.tacticQualificationStatus),
        tacticQualificationNote: typeof record.tacticQualificationNote === 'string' ? record.tacticQualificationNote.slice(0, 3000) : '',
        tacticQualifiedAt: typeof record.tacticQualifiedAt === 'string' ? record.tacticQualifiedAt.slice(0, 20) : '',
        contentLeadContext: normalizeContentLeadContext(record.contentLeadContext),
        intakeAt: typeof record.intakeAt === 'string' ? record.intakeAt.slice(0, 20) : '',
        firstResponseDueAt: typeof record.firstResponseDueAt === 'string' ? record.firstResponseDueAt.slice(0, 20) : '',
        createdAt: record.createdAt || todayISO(),
      })),
      events,
      enabledChannels: normalizeEnabledChannels(parsed.enabledChannels, channelTasks, douyin, xiaohongshu, wechat, offline, referral, bilibili),
      installedIndustryPacks,
      activeIndustryPackId,
      installedTacticPacks,
      activeTacticPackId: requestedActiveTacticPackId,
      deliveryPackArtifacts,
      installationId: normalizeInstallationId(parsed.installationId),
      channelTasks,
      topicResearch,
      contentProduction,
      operations,
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
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', value.includes('T') ? { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } : { month: 'numeric', day: 'numeric' }).format(date)
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
  const [data, setData] = useState<WorkspaceData>(() => {
    const loaded = loadData()
    return loaded.installationId ? loaded : { ...loaded, installationId: createInstallationId() }
  })
  const [verifiedDeliveryPacks, setVerifiedDeliveryPacks] = useState<VerifiedDeliveryPack[]>([])
  const [aiSettings, setAISettings] = useState<AIServiceSettings>(loadAIServiceSettings)
  const [aiSecrets, setAISecrets] = useState<AISecretStatus>({ officialTokenSaved: false, customApiKeySaved: false, secureStorageAvailable: false })
  const [view, setView] = useState<View>('workspace')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dialogStage, setDialogStage] = useState<Exclude<Stage, 'lost'> | null>(null)
  const [recordSourcePreset, setRecordSourcePreset] = useState('')
  const [recordTacticPackId, setRecordTacticPackId] = useState('')
  const [editingRecord, setEditingRecord] = useState<CustomerRecord | null>(null)
  const [intentConfirmationRecord, setIntentConfirmationRecord] = useState<CustomerRecord | null>(null)
  const [eventRecord, setEventRecord] = useState<CustomerRecord | null>(null)
  const [eventTypePreset, setEventTypePreset] = useState<CustomerStageEvent['type'] | undefined>(undefined)
  const [handoffRecord, setHandoffRecord] = useState<CustomerRecord | null>(null)
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
    let cancelled = false
    void Promise.all(data.deliveryPackArtifacts.map((raw) => verifyDeliveryPackArtifact(raw, undefined, data.installationId))).then((results) => {
      if (cancelled) return
      const seenLicenses = new Set<string>()
      setVerifiedDeliveryPacks(results.flatMap((result) => {
        if (!result.ok || seenLicenses.has(result.value.artifact.manifest.licenseId)) return []
        seenLicenses.add(result.value.artifact.manifest.licenseId)
        return [result.value]
      }))
    }).catch(() => {
      if (!cancelled) setVerifiedDeliveryPacks([])
    })
    return () => { cancelled = true }
  }, [data.deliveryPackArtifacts, data.installationId])

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
  const authorizedIndustryPackIds = useMemo(() => new Set([...data.installedIndustryPacks, ...verifiedDeliveryPacks.flatMap((pack) => pack.solutionPack.industryPackIds)]), [data.installedIndustryPacks, verifiedDeliveryPacks])
  const authorizedTacticPackIds = useMemo(() => new Set([...data.installedTacticPacks, ...verifiedDeliveryPacks.flatMap((pack) => pack.solutionPack.tacticPackIds)]), [data.installedTacticPacks, verifiedDeliveryPacks])
  const availableIndustryPacks = industryRulePacks.filter((pack) => authorizedIndustryPackIds.has(pack.id))
  const availableTacticPacks = growthTacticPacks.filter((pack) => authorizedTacticPackIds.has(pack.id))
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
        if (adoption.channelId === 'referral') {
          const relation = data.referral.relations.find((item) => item.id === adoption.itemId)
          const sources = relation?.sourceCode ? [relation.sourceCode] : []
          const received = relation ? data.referral.logs.some((log) => log.relationId === relation.id && log.type === '收到推荐') : false
          return { channelId: adoption.channelId, itemId: adoption.itemId, stage: relation?.status || '推荐关系待确认', executed: received, reach: 0, interactions: 0, platformInquiries: 0, ...recordSummary(sources) }
        }
        return { channelId: adoption.channelId, itemId: adoption.itemId, stage: '等待建立推荐关系', executed: false, reach: 0, interactions: 0, platformInquiries: 0, registeredLeads: 0, qualifiedLeads: 0, customers: 0 }
      })
    })
    return result
  }, [data.bilibili, data.douyin, data.offline, data.records, data.referral, data.topicResearch.generatedTopics, data.wechat, data.xiaohongshu])
  const activeSources: SourceOption[] = [
    ...data.channelTasks.filter((task) => task.channelId !== 'douyin' && task.channelId !== 'xiaohongshu' && task.channelId !== 'wechat' && task.channelId !== 'offline' && task.channelId !== 'referral' && task.channelId !== 'bilibili' && ['已发布', '执行中', '跟进中', '已完成'].includes(task.status)).map((task) => ({ id: task.id, label: sourceLabel(task) })),
    ...douyinSourceOptions(data.douyin),
    ...xiaohongshuSourceOptions(data.xiaohongshu),
    ...wechatSourceOptions(data.wechat),
    ...offlineSourceOptions(data.offline),
    ...referralSourceOptions(data.referral),
    ...bilibiliSourceOptions(data.bilibili),
  ]

  const contentExecutionForSourceCode = (sourceCode: string): { channelId: ChannelId; executionItemId: string } | null => {
    const douyinRecord = data.douyin.publishRecords.find((record) => record.sourceCode === sourceCode)
    if (douyinRecord) {
      const task = data.douyin.videoTasks.find((item) => item.id === douyinRecord.videoTaskId)
      if (task?.ideaId) return { channelId: 'douyin', executionItemId: task.ideaId }
    }
    const xiaohongshuRecord = data.xiaohongshu.publishRecords.find((record) => record.sourceCode === sourceCode)
    if (xiaohongshuRecord) {
      const task = data.xiaohongshu.noteTasks.find((item) => item.id === xiaohongshuRecord.noteTaskId)
      if (task?.ideaId) return { channelId: 'xiaohongshu', executionItemId: task.ideaId }
    }
    const wechatRecord = data.wechat.executionRecords.find((record) => record.sourceCode === sourceCode)
    if (wechatRecord?.taskId) return { channelId: 'wechat', executionItemId: wechatRecord.taskId }
    const offlineRecord = data.offline.runRecords.find((record) => record.sourceCode === sourceCode)
    if (offlineRecord?.taskId) return { channelId: 'offline', executionItemId: offlineRecord.taskId }
    const bilibiliRecord = data.bilibili.publishRecords.find((record) => record.sourceCode === sourceCode)
    if (bilibiliRecord) {
      const task = data.bilibili.videoTasks.find((item) => item.id === bilibiliRecord.videoTaskId)
      if (task?.ideaId) return { channelId: 'bilibili', executionItemId: task.ideaId }
    }
    return null
  }

  const contentLeadSourceOptions: ContentLeadSourceOption[] = activeSources.flatMap((source) => {
    const sourceCode = sourceCodeFromLabel(source.label)
    const execution = contentExecutionForSourceCode(sourceCode)
    const context = execution ? contentLeadContextForExecution(data.contentProduction, execution.channelId, execution.executionItemId) : null
    return context ? [{ source: source.label, sourceCode, context }] : []
  })

  const contentLeadContextForSource = (source: string) => {
    const matched = contentLeadSourceOptions.find((option) => option.source === source || option.sourceCode === source)
    return matched?.context || null
  }

  const showToast = (message: string) => setToast(message)

  const openRecordDialog = (stage: Exclude<Stage, 'lost'>, source = '', channelId?: ChannelId) => {
    setRecordSourcePreset(source)
    const tacticPack = activeTacticPack && activeTacticPack.channelId === channelId ? activeTacticPack : undefined
    setRecordTacticPackId(tacticPack?.id || '')
    setDialogStage(stage)
  }

  const addRecord = (formData: FormData, initialStage: Exclude<Stage, 'lost'>) => {
    const stage = (formData.get('stage') as Exclude<Stage, 'lost'>) || initialStage
    const tacticPack = growthTacticPackById(formData.get('tacticPackId'))
    const tacticLeadValues = tacticLeadValuesFromForm(formData, tacticPack)
    const tacticQualificationStatus = normalizeTacticQualificationStatus(formData.get('tacticQualificationStatus'))
    const tacticQualificationNote = formText(formData, 'tacticQualificationNote', 3000)
    const qualificationRecommendation = tacticPack ? tacticQualificationRecommendation(tacticPack, tacticLeadValues) : null
    if (tacticPack && stage === 'intent' && (qualificationRecommendation?.status !== '可人工推进' || tacticQualificationStatus !== '可人工推进')) {
      showToast('请先补全关键信息，并由人工确认可以推进后再转入意向客户')
      return
    }
    const source = formText(formData, 'source', 500) || '未记录来源'
    const contentLeadContext = contentLeadContextForSource(source)
    const nextAction = formText(formData, 'nextAction') || (stage === 'lead' ? contentLeadContext?.firstResponsePlan || (tacticPack ? tacticNextAction(tacticPack, tacticLeadValues) : '') : '')
    const nextDate = formText(formData, 'nextDate', 20) || (stage === 'lead' && nextAction ? todayISO() : '')
    const owner = formText(formData, 'owner', 200) || contentLeadContext?.inquiryOwner || ''
    const intakeAt = nowLocalDateTime()
    const record: CustomerRecord = {
      id: `record-${Date.now()}`,
      name: formText(formData, 'name', 200),
      contact: formText(formData, 'contact', 300),
      source,
      need: formText(formData, 'need', 3000),
      stage,
      status: String(formData.get('status') || (stage === 'lead' && contentLeadContext ? '待联系' : stageMeta[stage].statuses[0])) as RecordStatus,
      owner,
      nextAction,
      nextDate,
      note: formText(formData, 'note', 3000),
      tacticPackId: tacticPack?.id || '',
      tacticLeadValues,
      tacticQualificationStatus,
      tacticQualificationNote,
      tacticQualifiedAt: tacticQualificationStatus ? todayISO() : '',
      contentLeadContext,
      intakeAt,
      firstResponseDueAt: contentLeadContext ? firstResponseDeadline(intakeAt, contentLeadContext.firstResponseTarget) : '',
      createdAt: todayISO(),
    }
    if (!record.name) return
    setData((current) => ({ ...current, records: [record, ...current.records] }))
    setDialogStage(null)
    setRecordSourcePreset('')
    setRecordTacticPackId('')
    showToast(`已加入${stageMeta[stage].label}`)
  }

  const updateRecord = (formData: FormData) => {
    if (!editingRecord) return
    const stage = String(formData.get('stage')) as Exclude<Stage, 'lost'>
    const tacticPack = growthTacticPackById(formData.get('tacticPackId')) || growthTacticPackById(editingRecord.tacticPackId)
    const tacticLeadValues = tacticPack ? tacticLeadValuesFromForm(formData, tacticPack) : editingRecord.tacticLeadValues
    const tacticQualificationStatus = tacticPack ? normalizeTacticQualificationStatus(formData.get('tacticQualificationStatus')) : editingRecord.tacticQualificationStatus
    const tacticQualificationNote = tacticPack ? formText(formData, 'tacticQualificationNote', 3000) : editingRecord.tacticQualificationNote
    const qualificationRecommendation = tacticPack ? tacticQualificationRecommendation(tacticPack, tacticLeadValues) : null
    const source = formText(formData, 'source', 500) || '未记录来源'
    if (tacticPack && editingRecord.stage === 'lead' && stage === 'intent' && (qualificationRecommendation?.status !== '可人工推进' || tacticQualificationStatus !== '可人工推进')) {
      showToast('请先补全关键信息，并由人工确认可以推进后再转入意向客户')
      return
    }
    const nextContentLeadContext = contentLeadContextForUpdatedRecord(editingRecord.source, source, editingRecord.contentLeadContext, contentLeadContextForSource(source))
    const owner = formText(formData, 'owner', 200) || editingRecord.owner || nextContentLeadContext?.inquiryOwner || ''
    const intakeAt = editingRecord.intakeAt || nowLocalDateTime()
    const firstResponseDueAt = editingRecord.firstResponseDueAt || (nextContentLeadContext ? firstResponseDeadline(intakeAt, nextContentLeadContext.firstResponseTarget) : '')
    setData((current) => ({
      ...current,
      records: current.records.map((record) => record.id === editingRecord.id ? {
        ...record,
        name: formText(formData, 'name', 200),
        contact: formText(formData, 'contact', 300),
        source,
        need: formText(formData, 'need', 3000),
        stage,
        status: String(formData.get('status') || stageMeta[stage].statuses[0]) as RecordStatus,
        owner,
        nextAction: formText(formData, 'nextAction'),
        nextDate: formText(formData, 'nextDate', 20),
        note: formText(formData, 'note', 3000),
        tacticPackId: tacticPack?.id || editingRecord.tacticPackId,
        tacticLeadValues,
        tacticQualificationStatus,
        tacticQualificationNote,
        tacticQualifiedAt: tacticQualificationStatus ? record.tacticQualifiedAt || todayISO() : '',
        contentLeadContext: nextContentLeadContext,
        intakeAt,
        firstResponseDueAt,
      } : record),
    }))
    setEditingRecord(null)
    showToast('客户信息已更新')
  }

  const moveRecord = (id: string, nextStage: Exclude<Stage, 'lost'>) => {
    setData((current) => ({
      ...current,
      events: nextStage === 'customer' ? [...current.events, createCustomerStageEvent(id, '已成交')] : current.events,
      records: current.records.map((record) => record.id === id ? {
        ...record,
        stage: nextStage,
        status: stageMeta[nextStage].statuses[0],
        nextAction: nextStage === 'intent' ? record.nextAction || '联系并确认需求' : record.nextAction || '安排服务与回访',
      } : record),
    }))
    showToast(nextStage === 'intent' ? '已转入意向客户' : '已转入客户')
  }

  const confirmTacticIntent = (record: CustomerRecord) => {
    const qualification = tacticQualificationForRecord(record)
    if (!qualification || qualification.recommendation.status !== '可人工推进' || record.tacticQualificationStatus !== '可人工推进') {
      showToast('请先补全信息并完成人工判断')
      return
    }
    setData((current) => ({
      ...current,
      records: current.records.map((item) => item.id === record.id ? {
        ...item,
        stage: 'intent',
        status: '待联系',
        tacticQualifiedAt: item.tacticQualifiedAt || todayISO(),
        nextAction: item.nextAction || '联系并确认需求',
      } : item),
    }))
    setIntentConfirmationRecord(null)
    showToast('已确认并转入意向客户')
  }

  const markLost = (id: string) => {
    setData((current) => ({
      ...current,
      events: [...current.events, createCustomerStageEvent(id, '暂不推进')],
      records: current.records.map((record) => record.id === id ? { ...record, stage: 'lost', status: '已放弃', nextAction: '' } : record),
    }))
    showToast('已标记为暂不跟进')
  }

  const openCustomerStageEvent = (record: CustomerRecord, type?: CustomerStageEvent['type']) => {
    setEventTypePreset(type)
    setEventRecord(record)
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

  const addCustomerStageEvent = (formData: FormData) => {
    if (!eventRecord) return
    const definition = customerStageEventByType(formData.get('type'))
    if (!definition) return
    const qualification = tacticQualificationForRecord(eventRecord)
    if (eventRecord.stage === 'lead' && definition.nextStage && definition.nextStage !== 'lost' && qualification && (qualification.recommendation.status !== '可人工推进' || eventRecord.tacticQualificationStatus !== '可人工推进')) {
      showToast('请先补全信息并完成人工判断，再记录会推进客户阶段的事项')
      return
    }
    const note = formText(formData, 'note', 3000)
    if (definition.type === firstManualResponseEventType && !note) {
      showToast('请记录已确认的信息、待补资料或明确的下一步')
      return
    }
    const event = createCustomerStageEvent(eventRecord.id, definition.type, formText(formData, 'occurredAt', 20) || (definition.type === firstManualResponseEventType ? nowLocalDateTime() : todayISO()), note)
    setData((current) => ({
      ...current,
      events: [event, ...current.events],
      records: current.records.map((record) => record.id === eventRecord.id ? {
        ...record,
        stage: definition.nextStage ? definition.nextStage as Stage : record.stage,
        status: definition.nextStatus ? definition.nextStatus as RecordStatus : record.status,
        nextAction: definition.nextAction === undefined ? record.nextAction : definition.nextAction,
      } : record),
    }))
    setEventRecord(null)
    setEventTypePreset(undefined)
    showToast(`${definition.type}已记录`)
  }

  const handoffLead = (formData: FormData) => {
    if (!handoffRecord) return
    const nextOwner = formText(formData, 'nextOwner', 200)
    const note = formText(formData, 'note', 3000)
    if (!nextOwner) {
      showToast('请填写新的承接负责人')
      return
    }
    if (!note) {
      showToast('请说明交接原因、已完成内容或下一步')
      return
    }
    const occurredAt = formText(formData, 'occurredAt', 20) || nowLocalDateTime()
    const previousOwner = handoffRecord.owner || handoffRecord.contentLeadContext?.inquiryOwner || '未分配负责人'
    const event = createCustomerStageEvent(
      handoffRecord.id,
      ownershipHandoffEventType,
      occurredAt,
      `由 ${previousOwner} 交接给 ${nextOwner}。${note}`,
    )
    setData((current) => ({
      ...current,
      events: [event, ...current.events],
      records: current.records.map((record) => record.id === handoffRecord.id ? { ...record, owner: nextOwner } : record),
    }))
    setHandoffRecord(null)
    showToast(`已交接给${nextOwner}`)
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

  const applyDeliveryConfiguration = (selection: DeliveryConfigurationSelection) => {
    const plan = createDeliveryConfigurationPlan(data, selection, availableIndustryPacks, availableTacticPacks)
    if (!plan.ok || !plan.next) {
      showToast(plan.errors[0] || '请检查获客配置')
      return
    }
    setData((current) => {
      const nextPlan = createDeliveryConfigurationPlan(current, selection, availableIndustryPacks, availableTacticPacks)
      return nextPlan.next ? { ...current, ...nextPlan.next } : current
    })
    setActiveChannelId(null)
    const added = [
      plan.addsIndustryPack ? '行业规则' : '',
      plan.addedChannels.length ? `${plan.addedChannels.length} 个渠道` : '',
      plan.addedTacticPackIds.length ? `${plan.addedTacticPackIds.length} 种获客方式` : '',
    ].filter(Boolean)
    showToast(added.length ? `已应用配置：新增${added.join('、')}` : '当前获客配置已更新')
  }

  const importDeliveryPack = async (raw: string) => {
    const result = await verifyDeliveryPackArtifact(raw, undefined, data.installationId)
    if (!result.ok) return result
    const licenseId = result.value.artifact.manifest.licenseId
    if (data.deliveryPackArtifacts.includes(raw) || verifiedDeliveryPacks.some((pack) => pack.artifact.manifest.licenseId === licenseId)) {
      return { ok: true, message: `“${result.value.solutionPack.title}”已经导入。` }
    }
    setData((current) => current.deliveryPackArtifacts.includes(raw) ? current : { ...current, deliveryPackArtifacts: [...current.deliveryPackArtifacts, raw] })
    setVerifiedDeliveryPacks((current) => current.some((pack) => pack.artifact.manifest.licenseId === licenseId) ? current : [...current, result.value])
    return { ok: true, message: `已导入“${result.value.solutionPack.title}”，现在可以继续配置。` }
  }

  const adoptResearchOpportunity = (opportunity: GeneratedTopicCandidate, channelId: ChannelId) => {
    const createdAt = todayISO()
    const id = `research-${channelId}-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`
    const tactic = growthTacticPackById(opportunity.tacticPackId)
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
      if (channelId === 'referral') {
        const relationType = tactic?.recommendedRelationType || '合作伙伴推荐'
        return { ...current, enabledChannels, referral: { ...current.referral, relations: [{ id, contentPackageId: opportunity.industryPackId, relationType, name: opportunity.title, organization: '', contact: '', relationshipBasis: '来自需求雷达的战役准备，需由人工确认真实关系与介绍意愿。', referralScenario: opportunity.customerQuestion || opportunity.demandSignal, idealCustomer: opportunity.targetCustomer, cooperationValue: opportunity.keyPromise, introductionMessage: '', handoffMethod: opportunity.callToAction, feedbackPlan: '在客户本人同意的范围内人工反馈承接进展。', owner: current.referral.settings.defaultOwner, nextAction: '确认关系基础、介绍场景、客户同意与资料交接边界', nextDate: '', status: '待联系', checklist: { relationshipConfirmed: false, referralScenarioReady: false, idealCustomerReady: false, introductionReady: false, handoffReady: false, feedbackReady: false }, sourceCode: '', createdAt }, ...current.referral.relations] } }
      }
      return { ...current, enabledChannels }
    })
    showToast(channelId === 'referral' ? '已建立推荐关系准备，请先完成人工关系确认' : `已加入${channelById(channelId).shortLabel}，等待人工确认`)
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

  const openContentProduction = () => {
    switchView('acquisition')
    window.setTimeout(() => document.getElementById('content-production')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const page = (() => {
    if (view === 'workspace') {
      return <WorkspacePage records={activeRecords} events={data.events} topicResearch={data.topicResearch} performanceByOpportunity={opportunityPerformance} leads={leadCount} intents={intentCount} customers={customerCount} channelCount={enabledChannels.length} onAddLead={() => openRecordDialog('lead')} onOpenRecord={setEditingRecord} onAddEvent={openCustomerStageEvent} onNavigate={switchView} />
    }
    if (view === 'acquisition' && activeChannelId) {
      const channel = channelById(activeChannelId)
      if (channel.id === 'douyin') return <DouyinWorkspace data={data.douyin} records={data.records} onChange={(updater) => setData((current) => ({ ...current, douyin: updater(current.douyin) }))} onBack={() => setActiveChannelId(null)} onAddLead={(source) => openRecordDialog('lead', source, channel.id)} onToast={showToast} />
      if (channel.id === 'xiaohongshu') return <XiaohongshuWorkspace data={data.xiaohongshu} records={data.records} onChange={(updater) => setData((current) => ({ ...current, xiaohongshu: updater(current.xiaohongshu) }))} onBack={() => setActiveChannelId(null)} onAddLead={(source) => openRecordDialog('lead', source, channel.id)} onToast={showToast} />
      if (channel.id === 'wechat') return <WechatWorkspace data={data.wechat} records={data.records} onChange={(updater) => setData((current) => ({ ...current, wechat: updater(current.wechat) }))} onBack={() => setActiveChannelId(null)} onAddLead={(source) => openRecordDialog('lead', source, channel.id)} onToast={showToast} />
      if (channel.id === 'offline') return <OfflineWorkspace data={data.offline} records={data.records} tacticPack={activeTacticPack?.channelId === 'offline' ? activeTacticPack : undefined} onChange={(updater) => setData((current) => ({ ...current, offline: updater(current.offline) }))} onBack={() => setActiveChannelId(null)} onAddLead={(source) => openRecordDialog('lead', source, channel.id)} onOpenRecord={(record) => setEditingRecord(data.records.find((item) => item.id === record.id) || null)} onToast={showToast} />
      if (channel.id === 'referral') return <ReferralWorkspace data={data.referral} records={data.records} tacticPack={activeTacticPack?.channelId === 'referral' ? activeTacticPack : undefined} onChange={(updater) => setData((current) => ({ ...current, referral: updater(current.referral) }))} onBack={() => setActiveChannelId(null)} onAddLead={(source) => openRecordDialog('lead', source, channel.id)} onOpenRecord={(record) => setEditingRecord(data.records.find((item) => item.id === record.id) || null)} onToast={showToast} />
      if (channel.id === 'bilibili') return <BilibiliWorkspace data={data.bilibili} records={data.records} onChange={(updater) => setData((current) => ({ ...current, bilibili: updater(current.bilibili) }))} onBack={() => setActiveChannelId(null)} onAddLead={(source) => openRecordDialog('lead', source, channel.id)} onToast={showToast} />
      return <ChannelWorkspacePage channel={channel} tasks={data.channelTasks.filter((task) => task.channelId === channel.id)} records={data.records} onBack={() => setActiveChannelId(null)} onAddTask={() => setTaskChannelId(channel.id)} onEditTask={setEditingTask} onAdvanceTask={advanceChannelTask} onAddLead={() => openRecordDialog('lead', '', channel.id)} />
    }
    if (view === 'acquisition') return <AcquisitionPage topicResearch={data.topicResearch} contentProduction={data.contentProduction} industryPack={activeIndustryPack} activeIndustryPackId={data.activeIndustryPackId} tacticPack={activeTacticPack} activeTacticPackId={data.activeTacticPackId} aiSettings={aiSettings} aiSecrets={aiSecrets} enabledChannels={data.enabledChannels} installedIndustryPacks={data.installedIndustryPacks} installedTacticPacks={data.installedTacticPacks} installationId={data.installationId} importedSolutionPackIds={verifiedDeliveryPacks.map((pack) => pack.solutionPack.id)} availableIndustryPacks={availableIndustryPacks} availableTacticPacks={availableTacticPacks} performanceByOpportunity={opportunityPerformance} onTopicResearchChange={(updater) => setData((current) => ({ ...current, topicResearch: updater(current.topicResearch) }))} onContentProductionChange={(updater) => setData((current) => { const contentProduction = updater(current.contentProduction); return { ...current, contentProduction, operations: pruneOperationsContentLinks(current.operations, contentProduction.tasks.map((task) => task.id)) } })} onToast={showToast} onOpenAIService={() => setAIServiceOpen(true)} onOfficialUsage={(usage) => setCreditAccount((current) => current ? { ...current, balance: usage.balanceAfter, updatedAt: '' } : current)} onAdoptOpportunity={adoptResearchOpportunity} onImportDeliveryPack={importDeliveryPack} onApplyDeliveryConfiguration={applyDeliveryConfiguration} onActivateIndustryRules={activateIndustryRules} onActivateTacticPack={activateTacticPack} onOpenChannel={setActiveChannelId} />
    if (view === 'operations') return <OperationsHub data={data.operations} contentProduction={data.contentProduction} opportunityCount={data.topicResearch.generatedTopics.length} leadCount={leadCount} intentCount={intentCount} customerCount={customerCount} onChange={(updater) => setData((current) => ({ ...current, operations: updater(current.operations) }))} onOpenAcquisition={() => switchView('acquisition')} onOpenLeads={() => switchView('leads')} onOpenContent={openContentProduction} onToast={showToast} />
    if (view === 'review') return <ReviewPage records={data.records} events={data.events} onNavigate={switchView} />
    const stage = stageForView(view)
    if (!stage) return null
    return <LifecyclePage stage={stage} records={visibleRecords} events={data.events} sourceOptions={activeSources} search={search} onSearch={setSearch} onAdd={() => openRecordDialog(stage)} onEdit={setEditingRecord} onMove={moveRecord} onRequestTacticIntent={setIntentConfirmationRecord} onAddEvent={openCustomerStageEvent} onMarkLost={markLost} onCompleteAction={setNextActionDone} />
  })()

  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand"><span className="brand-mark"><Target size={20} /></span><div><strong>获客运营工作台</strong><span>内容、客户与增长复盘</span></div><button className="mobile-close icon-button" type="button" onClick={() => setSidebarOpen(false)} aria-label="关闭菜单"><X size={18} /></button></div>
      <nav className="sidebar-nav" aria-label="主导航">{navItems.map((item) => <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => switchView(item.id)}>{item.icon}<span>{item.label}</span>{item.id === 'leads' && leadCount > 0 && <b>{leadCount}</b>}{item.id === 'intents' && intentCount > 0 && <b>{intentCount}</b>}</button>)}</nav>
      <div className="sidebar-note"><span>本地保存</span><p>数据保存在这台电脑中。</p></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu icon-button" type="button" onClick={() => setSidebarOpen(true)} aria-label="打开菜单"><Menu size={19} /></button><div className="breadcrumbs"><span>获客运营</span><ChevronRight size={14} /><strong>{activeChannelId ? channelById(activeChannelId).shortLabel : navItems.find((item) => item.id === view)?.label}</strong></div><div className="topbar-right">{aiSettings.mode === 'official' && <button className={`credit-account-button ${creditAccount ? 'loaded' : ''}`} type="button" onClick={() => setCreditAccountOpen(true)}><Coins size={15} /><span>{creditAccount ? `${new Intl.NumberFormat('zh-CN').format(creditAccount.balance)} 积分` : '积分账户'}</span></button>}<button className={`ai-service-button ${aiSettings.mode === 'official' && aiSecrets.officialTokenSaved || aiSettings.mode === 'custom' && aiSecrets.customApiKeySaved ? 'configured' : ''}`} type="button" onClick={() => setAIServiceOpen(true)}><Sparkles size={15} /><span>AI 服务</span></button><span className="save-state"><span></span>已自动保存</span></div></header>
      <div className="page-wrap" key={view}>{page}</div>
    </main>
    {dialogStage && <RecordDialog stage={dialogStage} sourceOptions={activeSources} contentLeadSourceOptions={contentLeadSourceOptions} defaultSource={recordSourcePreset} tacticPack={growthTacticPackById(recordTacticPackId)} onClose={() => { setDialogStage(null); setRecordSourcePreset(''); setRecordTacticPackId('') }} onSubmit={(formData) => addRecord(formData, dialogStage)} />}
    {editingRecord && <RecordDialog record={editingRecord} stageEvents={data.events.filter((event) => event.recordId === editingRecord.id)} sourceOptions={activeSources} contentLeadSourceOptions={contentLeadSourceOptions} stage={editingRecord.stage === 'lost' ? 'lead' : editingRecord.stage} tacticPack={growthTacticPackById(editingRecord.tacticPackId)} onClose={() => setEditingRecord(null)} onSubmit={updateRecord} onRecordFirstResponse={() => { openCustomerStageEvent(editingRecord, firstManualResponseEventType); setEditingRecord(null) }} onRequestHandoff={() => { setHandoffRecord(editingRecord); setEditingRecord(null) }} />}
    {intentConfirmationRecord && <TacticIntentConfirmationDialog record={intentConfirmationRecord} onClose={() => setIntentConfirmationRecord(null)} onEdit={() => { setIntentConfirmationRecord(null); setEditingRecord(intentConfirmationRecord) }} onConfirm={() => confirmTacticIntent(intentConfirmationRecord)} />}
    {eventRecord && <CustomerStageEventDialog record={eventRecord} initialType={eventTypePreset} onClose={() => { setEventRecord(null); setEventTypePreset(undefined) }} onSubmit={addCustomerStageEvent} />}
    {handoffRecord && <OwnershipHandoffDialog record={handoffRecord} onClose={() => setHandoffRecord(null)} onSubmit={handoffLead} />}
    {taskChannelId && <ChannelTaskDialog channel={channelById(taskChannelId)} onClose={() => setTaskChannelId(null)} onSubmit={(formData) => addChannelTask(formData, taskChannelId)} />}
    {editingTask && <ChannelTaskDialog channel={channelById(editingTask.channelId)} task={editingTask} onClose={() => setEditingTask(null)} onSubmit={updateChannelTask} />}
    {aiServiceOpen && <AIServiceDialog settings={aiSettings} secretStatus={aiSecrets} onClose={() => setAIServiceOpen(false)} onSave={(nextSettings, nextSecrets) => { setAISettings(nextSettings); setAISecrets(nextSecrets); setAIServiceOpen(false); showToast(nextSettings.mode === 'official' ? '官方 AI 服务已保存' : '自有 AI 服务已保存') }} onToast={showToast} />}
    {creditAccountOpen && <CreditAccountDialog settings={aiSettings} secretStatus={aiSecrets} onClose={() => setCreditAccountOpen(false)} onOpenAIService={() => { setCreditAccountOpen(false); setAIServiceOpen(true) }} onAccountChange={setCreditAccount} onToast={showToast} />}
    {toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}
  </div>
}

export function WorkspacePage({ records, events, topicResearch, performanceByOpportunity, leads, intents, customers, channelCount, onAddLead, onOpenRecord, onAddEvent, onNavigate }: { records: CustomerRecord[]; events: CustomerStageEvent[]; topicResearch: TopicResearchData; performanceByOpportunity: Record<string, OpportunityChannelPerformance[]>; leads: number; intents: number; customers: number; channelCount: number; onAddLead: () => void; onOpenRecord: (record: CustomerRecord) => void; onAddEvent: (record: CustomerRecord, type?: CustomerStageEvent['type']) => void; onNavigate: (view: View) => void }) {
  const queue = leadWorkQueue(records, events, nowLocalDateTime())
  const queueItems = queue.items.slice(0, 6)
  const campaignQueue = trafficCampaignQueue(topicResearch.generatedTopics, performanceByOpportunity, nowLocalDateTime())
  const campaignItems = campaignQueue.items.slice(0, 5)
  return <>
    <PageHeader title="今天，把咨询先接住" description="先处理内容带来的新咨询和已到期的跟进，再推进意向、成交和老客户经营。" action={<button className="button button-primary" onClick={onAddLead}><Plus size={16} />新建线索</button>} />
    <section className="stage-overview" aria-label="当前客户阶段概览"><button onClick={() => onNavigate('leads')}><span>线索</span><strong>{leads}</strong><small>新进来的咨询</small><ArrowRight size={16} /></button><button onClick={() => onNavigate('intents')}><span>意向客户</span><strong>{intents}</strong><small>正在推进成交</small><ArrowRight size={16} /></button><button onClick={() => onNavigate('customers')}><span>客户</span><strong>{customers}</strong><small>服务与后续经营</small><ArrowRight size={16} /></button></section>
    {campaignItems.length > 0 && <section className="work-panel traffic-campaign-queue-panel"><div className="section-heading-row"><div><h2>今日流量战役</h2><p>先确认哪些战役真的开始执行、哪些该回收结果并作出下一轮判断。</p></div><button className="text-button" onClick={() => onNavigate('acquisition')}>进入需求雷达</button></div><div className="traffic-campaign-queue-stats"><span><b>{campaignQueue.pendingStart}</b>待启动</span><span><b>{campaignQueue.preparing}</b>待人工开始</span><span><b>{campaignQueue.validating}</b>验证中</span><span className={campaignQueue.waitingReview ? 'risk' : ''}><b>{campaignQueue.waitingReview}</b>等待复盘</span></div><div className="traffic-campaign-queue-list">{campaignItems.map((item) => <button key={item.opportunity.id} type="button" onClick={() => onNavigate('acquisition')}><span className={`campaign-queue-state ${item.lifecycle.tone}`}>{item.lifecycle.label}</span><div><strong>{item.action}</strong><p>{item.opportunity.title}</p><small>{item.timing}</small></div><div className="campaign-queue-result"><span>{item.total.inquiries} 咨询</span><span>{item.total.leads} 线索</span><span>{item.total.qualifiedLeads} 有效</span><span>{item.total.customers} 成交</span></div><ChevronRight size={16} /></button>)}</div></section>}
    <section className="workspace-grid"><div className="work-panel"><div className="section-heading-row"><div><h2>今日获客承接</h2><p>先接内容咨询，再处理承接超时、逾期和今天应完成的跟进。</p></div><button className="text-button" onClick={() => onNavigate('leads')}>查看全部线索</button></div><div className="lead-work-stats"><span><b>{queue.firstResponsePending}</b>待首次承接</span><span className={queue.firstResponseOverdue ? 'risk' : ''}><b>{queue.firstResponseOverdue}</b>承接已超时</span><span className={queue.firstResponseDueSoon ? 'risk' : ''}><b>{queue.firstResponseDueSoon}</b>即将超时</span><span className={queue.unassignedFirstResponses ? 'risk' : ''}><b>{queue.unassignedFirstResponses}</b>未分配承接</span><span><b>{queue.overdue}</b>已逾期</span><span><b>{queue.dueToday}</b>今天跟进</span></div>{queueItems.length ? <div className="lead-work-list">{queueItems.map((item) => <article className="lead-work-row" key={item.record.id}><button className="lead-work-main" onClick={() => onOpenRecord(item.record as CustomerRecord)}><span className={`stage-dot ${item.record.stage}`}></span><div><strong>{item.needsFirstResponse ? item.record.nextAction || '完成首次人工回应' : item.record.nextAction || '补充下一步动作'}</strong><span>{item.record.name} · {item.record.source || '未记录来源'} · {item.owner || '未分配承接人'}</span></div><time className={item.slaStatus === '已超时' || item.timing.startsWith('已逾期') ? 'overdue' : ''}>{item.timing}</time><ChevronRight size={16} /></button>{item.needsFirstResponse && <button className="button button-primary small lead-work-action" onClick={() => onAddEvent(item.record as CustomerRecord, firstManualResponseEventType)}>记录首次承接<ClipboardPlus size={14} /></button>}<span className={`lead-work-kind ${item.needsFirstResponse ? 'response' : item.kind === '逾期跟进' ? 'overdue' : ''}`}>{item.kind}</span></article>)}</div> : <EmptyState icon={<ClipboardList size={24} />} title="还没有待处理的承接事项" description="已发布内容带来的线索会在这里优先显示；其他客户的下一步也会按日期排进来。" action={<button className="button button-secondary" onClick={onAddLead}><Plus size={15} />新建线索</button>} />}</div><aside className="work-panel quiet-panel"><div className="section-heading-row"><div><h2>客户进程</h2><p>每个人都只需要推进到下一步。</p></div></div><div className="flow-list"><FlowRow index="1" label="线索" count={leads} note="确认来源和需求" /><FlowRow index="2" label="意向客户" count={intents} note="预约、方案、报价" /><FlowRow index="3" label="客户" count={customers} note="服务、回访、复购" /></div></aside></section>
    <section className="work-panel compact-panel"><div><h2>获客渠道</h2><p>{channelCount ? `当前已配置 ${channelCount} 个获客渠道。内容、活动和转介绍带来的结果会统一回到线索与复盘。` : '选择你准备做的获客渠道后，工作台会只保留对应的日常工作区。'}</p></div><button className="button button-secondary" onClick={() => onNavigate('acquisition')}>{channelCount ? '进入获客' : '选择渠道'}<ArrowRight size={16} /></button></section>
  </>
}

function AcquisitionPage({ topicResearch, contentProduction, industryPack, activeIndustryPackId, tacticPack, activeTacticPackId, aiSettings, aiSecrets, enabledChannels, installedIndustryPacks, installedTacticPacks, installationId, importedSolutionPackIds, availableIndustryPacks, availableTacticPacks, performanceByOpportunity, onTopicResearchChange, onContentProductionChange, onToast, onOpenAIService, onOfficialUsage, onAdoptOpportunity, onImportDeliveryPack, onApplyDeliveryConfiguration, onActivateIndustryRules, onActivateTacticPack, onOpenChannel }: { topicResearch: TopicResearchData; contentProduction: ContentProductionData; industryPack?: IndustryRulePack; activeIndustryPackId: string; tacticPack?: GrowthTacticPack; activeTacticPackId: string; aiSettings: AIServiceSettings; aiSecrets: AISecretStatus; enabledChannels: ChannelId[]; installedIndustryPacks: string[]; installedTacticPacks: string[]; installationId: string; importedSolutionPackIds: string[]; availableIndustryPacks: IndustryRulePack[]; availableTacticPacks: GrowthTacticPack[]; performanceByOpportunity: Record<string, OpportunityChannelPerformance[]>; onTopicResearchChange: (updater: (current: TopicResearchData) => TopicResearchData) => void; onContentProductionChange: (updater: (current: ContentProductionData) => ContentProductionData) => void; onToast: (message: string) => void; onOpenAIService: () => void; onOfficialUsage: (usage: { pointsCharged: number; balanceAfter: number }) => void; onAdoptOpportunity: (opportunity: GeneratedTopicCandidate, channelId: ChannelId) => string; onImportDeliveryPack: (raw: string) => Promise<{ ok: boolean; message: string }>; onApplyDeliveryConfiguration: (selection: DeliveryConfigurationSelection) => void; onActivateIndustryRules: (packId: string) => void; onActivateTacticPack: (packId: string) => void; onOpenChannel: (channelId: ChannelId) => void }) {
  const configuredChannels = channelDefinitions.filter((item) => enabledChannels.includes(item.id))
  const [selectedChannelId, setSelectedChannelId] = useState<ChannelId | null>(() => configuredChannels[0]?.id || null)
  const selectedChannel = selectedChannelId ? channelById(selectedChannelId) : undefined
  const installedRules = industryRulePacks.filter((pack) => installedIndustryPacks.includes(pack.id))
  const installedTactics = growthTacticPacks.filter((pack) => installedTacticPacks.includes(pack.id))

  useEffect(() => {
    if (!selectedChannelId || !enabledChannels.includes(selectedChannelId)) setSelectedChannelId(configuredChannels[0]?.id || null)
  }, [configuredChannels, enabledChannels, selectedChannelId])

  return <>
    <PageHeader title="获客" description="选择准备使用的获客渠道。启用后即可进入对应的基础工作区。" />
    <DeliveryConfigurationPanel current={{ enabledChannels, installedIndustryPacks, activeIndustryPackId, installedTacticPacks, activeTacticPackId }} installationId={installationId} industryPacks={availableIndustryPacks} tacticPacks={availableTacticPacks} importedSolutionPackIds={importedSolutionPackIds} onImportDeliveryPack={onImportDeliveryPack} onApply={onApplyDeliveryConfiguration} />
    <TopicResearchPanel data={topicResearch} industryPack={industryPack} tacticPack={tacticPack} aiSettings={aiSettings} aiSecrets={aiSecrets} enabledChannels={enabledChannels} performanceByOpportunity={performanceByOpportunity} onChange={onTopicResearchChange} onToast={onToast} onOpenAIService={onOpenAIService} onOfficialUsage={onOfficialUsage} onAdoptOpportunity={onAdoptOpportunity} onOpenChannel={onOpenChannel} />
    <ContentProductionPanel data={contentProduction} opportunities={topicResearch.generatedTopics} evidence={topicResearch.evidence} industryPack={industryPack} tacticPack={tacticPack} enabledChannels={enabledChannels} performanceByOpportunity={performanceByOpportunity} aiSettings={aiSettings} aiSecrets={aiSecrets} onChange={onContentProductionChange} onToast={onToast} onOpenAIService={onOpenAIService} onOfficialUsage={onOfficialUsage} onOpenChannel={onOpenChannel} />
    {configuredChannels.length && selectedChannel ? <><section className="channel-tabs" aria-label="获客渠道">{configuredChannels.map((item) => <button key={item.id} data-channel-id={item.id} className={selectedChannelId === item.id ? 'active' : ''} type="button" onClick={() => setSelectedChannelId(item.id)}><span className={`mini-channel-icon ${item.id}`}>{item.icon}</span>{item.shortLabel}<b><Check size={11} /></b></button>)}</section>
      <section className="channel-foundation-band" id="channel-foundation"><div className="channel-foundation-head"><span className={`channel-icon ${selectedChannel.id}`}>{selectedChannel.icon}</span><div><h2>{selectedChannel.label}</h2><p>{selectedChannel.description}</p></div><span className="channel-availability enabled">已启用</span></div><div className="channel-foundation-body"><div><h3>基础工作流程</h3><p>这套流程属于渠道本身，不需要先选择行业或内容方向。</p><div className="workflow-steps light">{selectedChannel.workflow.map((step, index) => <span key={step}><b>{index + 1}</b>{step}</span>)}</div></div><div className="channel-foundation-action"><small>当前工作台已配置这项渠道能力。</small><button className="button button-primary" onClick={() => onOpenChannel(selectedChannel.id)}>进入{selectedChannel.shortLabel}<ArrowRight size={16} /></button></div></div></section></> : <section className="channel-configuration-note"><ClipboardList size={20} /><div><h2>先完成获客配置</h2><p>选择行业和准备执行的获客方式后，这里只会显示客户本次需要使用的渠道工作区。</p></div></section>}
    {installedRules.length > 0 && <IndustryRuleCatalog packs={installedRules} activePackId={activeIndustryPackId} onActivate={onActivateIndustryRules} />}
    {selectedChannelId && installedTactics.length > 0 && <TacticPackCatalog packs={installedTactics} activePackId={activeTacticPackId} activeIndustryPackId={activeIndustryPackId} enabledChannels={enabledChannels} selectedChannelId={selectedChannelId} onActivate={onActivateTacticPack} />}
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

function LifecyclePage({ stage, records, events, sourceOptions, search, onSearch, onAdd, onEdit, onMove, onRequestTacticIntent, onAddEvent, onMarkLost, onCompleteAction }: { stage: Exclude<Stage, 'lost'>; records: CustomerRecord[]; events: CustomerStageEvent[]; sourceOptions: SourceOption[]; search: string; onSearch: (value: string) => void; onAdd: () => void; onEdit: (record: CustomerRecord) => void; onMove: (id: string, stage: Exclude<Stage, 'lost'>) => void; onRequestTacticIntent: (record: CustomerRecord) => void; onAddEvent: (record: CustomerRecord, type?: CustomerStageEvent['type']) => void; onMarkLost: (id: string) => void; onCompleteAction: (record: CustomerRecord) => void }) {
  const copy = { lead: { title: '线索', description: '记录新进来的咨询，先确认来源、需求和是否值得继续投入。', action: '新建线索', empty: '还没有线索', helper: '新的私信、扫码、电话、到店和转介绍都可以从这里开始。' }, intent: { title: '意向客户', description: '把确认值得推进的人放在这里，安排联系、预约、方案和报价。', action: '新建意向客户', empty: '还没有意向客户', helper: '线索确认有明确需求后，可以转入这里持续推进。' }, customer: { title: '客户', description: '成交后继续记录服务、回访和下一次可能的复购或转介绍。', action: '新建客户', empty: '还没有客户', helper: '意向客户成交后，会自动进入这里。' } }[stage]
  const statusCounts = stageMeta[stage].statuses.map((status) => ({ status, count: records.filter((record) => record.status === status).length })).filter((item) => item.count > 0)
  const firstResponseByRecord = new Map(events.filter((event) => event.type === firstManualResponseEventType).map((event) => [event.recordId, event]))
  const lifecycleNow = nowLocalDateTime()
  const contentSourceRecords = records.filter((record) => Boolean(record.contentLeadContext))
  const respondedContentLeadCount = contentSourceRecords.filter((record) => firstResponseByRecord.has(record.id)).length
  return <>
    <PageHeader title={copy.title} description={copy.description} action={<button className="button button-primary" onClick={onAdd}><Plus size={16} />{copy.action}</button>} />
    <section className="list-summary"><div><strong>{records.length}</strong><span>当前{copy.title}</span></div>{stage === 'lead' && contentSourceRecords.length > 0 && <div><strong>{respondedContentLeadCount}/{contentSourceRecords.length}</strong><span>内容线索已承接</span></div>}{statusCounts.map((item) => <div key={item.status}><strong>{item.count}</strong><span>{item.status}</span></div>)}<p>{sourceOptions.length ? `${copy.helper} 已有 ${sourceOptions.length} 条已执行的渠道来源可供关联。` : copy.helper}</p></section>
    <section className="table-panel"><div className="table-toolbar"><div><h2>全部{copy.title}</h2><span>{records.length ? '按下一步日期排序' : '等待第一条记录'}</span></div><label className="search-box"><Search size={16} /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="搜索姓名、联系方式、来源或需求" /></label></div>{records.length ? <div className="table-scroll"><table><thead><tr><th>客户</th><th>来源与需求</th><th>当前状态</th><th>下一步</th><th>负责人</th><th aria-label="操作"></th></tr></thead><tbody>{records.map((record) => {
      const qualification = tacticQualificationForRecord(record)
      const canConfirmIntent = qualification?.recommendation.status === '可人工推进' && record.tacticQualificationStatus === '可人工推进'
      const firstResponse = firstResponseByRecord.get(record.id)
      const firstResponseSla = firstResponseSlaStatus(record, events, lifecycleNow)
      const firstResponseTone = firstResponseSla === '按时承接' ? 'done' : firstResponseSla === '超时承接' || firstResponseSla === '已超时' ? 'overdue' : 'pending'
      const firstResponseLabel = firstResponse ? firstResponseSla === '未设时效' ? `已首次承接 · ${formatDate(firstResponse.occurredAt)}` : firstResponseSla : firstResponseSlaLabel(firstResponseSla, record.firstResponseDueAt)
      return <tr key={record.id}><td><button className="record-name" onClick={() => onEdit(record)}><strong>{record.name}</strong><span>{record.contact || `录入于 ${formatDate(record.createdAt)}`}</span></button></td><td><div className="source-cell"><b>{record.source}</b><span>{record.need || '暂未填写需求'}</span>{record.contentLeadContext && <small className={`lead-response-state ${firstResponseTone}`}>{firstResponseLabel}</small>}</div></td><td><div className="record-status-cell"><span className={`status-pill ${statusTone(record.status)}`}>{record.status}</span>{qualification && <button className={`qualification-pill ${qualificationTone(qualification.status)}`} type="button" onClick={() => onEdit(record)} title={`${qualification.pack.name}：${qualification.status}`}>{qualification.status}</button>}</div></td><td><button className="next-cell" onClick={() => onEdit(record)}><b>{record.nextAction || '待安排'}</b><span>{formatDate(record.nextDate)}</span></button></td><td>{record.owner || '未分配'}</td><td><div className="row-actions">{stage === 'lead' && record.contentLeadContext && !firstResponse && <button className="button button-primary small" onClick={() => onAddEvent(record, firstManualResponseEventType)}>记录首次承接<ClipboardPlus size={14} /></button>}{stage === 'lead' && (qualification ? canConfirmIntent ? <button className="button button-secondary small" onClick={() => onRequestTacticIntent(record)}>确认转为意向<ArrowRight size={14} /></button> : <button className="button button-secondary small" onClick={() => onEdit(record)}>{qualification.status === '待补充信息' ? '补充信息' : '查看判断'}<ChevronRight size={14} /></button> : <button className="button button-secondary small" onClick={() => onMove(record.id, 'intent')}>转为意向<ArrowRight size={14} /></button>)}{stage === 'intent' && <><button className="button button-primary small" onClick={() => onMove(record.id, 'customer')}>标记成交<Check size={14} /></button><button className="icon-button small" title="暂不跟进" aria-label="暂不跟进" onClick={() => onMarkLost(record.id)}><X size={15} /></button></>}{stage === 'customer' && <button className="button button-secondary small" onClick={() => onCompleteAction(record)}>记录回访<Check size={14} /></button>}<button className="icon-button small" title="记录推进事项" aria-label="记录推进事项" onClick={() => onAddEvent(record)}><ClipboardPlus size={15} /></button><button className="icon-button small" title="编辑" aria-label="编辑" onClick={() => onEdit(record)}><ChevronRight size={16} /></button></div></td></tr>
    })}</tbody></table></div> : <EmptyState icon={<FolderPlus size={25} />} title={copy.empty} description={copy.helper} action={<button className="button button-primary" onClick={onAdd}><Plus size={16} />{copy.action}</button>} />}</section>
  </>
}

function ReviewPage({ records, events, onNavigate }: { records: CustomerRecord[]; events: CustomerStageEvent[]; onNavigate: (view: View) => void }) {
  const leads = records.filter((record) => record.stage === 'lead').length
  const intents = records.filter((record) => record.stage === 'intent').length
  const customers = records.filter((record) => record.stage === 'customer').length
  const lost = records.filter((record) => record.stage === 'lost').length
  const reviewNow = nowLocalDateTime()
  const reviewRows = useMemo(() => tacticReviewRows(records, events, reviewNow), [records, events, reviewNow])
  const sourceRows = useMemo(() => {
    const map = new Map<string, { source: string; total: number; firstResponses: number; firstResponsesPending: number; firstResponsesOnTime: number; firstResponsesLate: number; informationComplete: number; manuallyReady: number; customers: number }>()
    const eventTypesByRecord = new Map<string, Set<CustomerStageEvent['type']>>()
    events.forEach((event) => {
      const types = eventTypesByRecord.get(event.recordId) || new Set<CustomerStageEvent['type']>()
      types.add(event.type)
      eventTypesByRecord.set(event.recordId, types)
    })
    records.forEach((record) => {
      const source = record.source || '未记录来源'
      const current = map.get(source) ?? { source, total: 0, firstResponses: 0, firstResponsesPending: 0, firstResponsesOnTime: 0, firstResponsesLate: 0, informationComplete: 0, manuallyReady: 0, customers: 0 }
      current.total += 1
      if (eventTypesByRecord.get(record.id)?.has(firstManualResponseEventType)) current.firstResponses += 1
      const firstResponseSla = firstResponseSlaStatus(record, events, reviewNow)
      if (firstResponseSla === '按时承接') current.firstResponsesOnTime += 1
      if (firstResponseSla === '超时承接') current.firstResponsesLate += 1
      if (firstResponseSla === '待承接' || firstResponseSla === '即将超时' || firstResponseSla === '已超时') current.firstResponsesPending += 1
      const tactic = growthTacticPackById(record.tacticPackId)
      if (tactic && tacticLeadProgress(tactic, record.tacticLeadValues).complete) current.informationComplete += 1
      if (tactic && tacticLeadProgress(tactic, record.tacticLeadValues).complete && record.tacticQualificationStatus === '可人工推进') current.manuallyReady += 1
      if (record.stage === 'customer' || eventTypesByRecord.get(record.id)?.has('已成交')) current.customers += 1
      map.set(source, current)
    })
    return [...map.values()].sort((left, right) => right.customers - left.customers || right.firstResponsesOnTime - left.firstResponsesOnTime || right.manuallyReady - left.manuallyReady || right.total - left.total)
  }, [records, events, reviewNow])
  const conversion = leads + intents + customers ? Math.round((customers / Math.max(leads + intents + customers, 1)) * 100) : 0
  return <>
    <PageHeader title="复盘" description="从获客来源一路看到线索、意向和客户，决定下一步把时间花在哪里。" />
    <section className="funnel-panel"><div className="funnel-heading"><div><h2>客户进程</h2><p>这是一张起点清晰的全链路底图，后续获客能力会自动把数据带进来。</p></div><span>{conversion}% 成交占比</span></div><div className="funnel-flow"><FunnelStep label="线索" value={leads} tone="lead" /><FunnelArrow /><FunnelStep label="意向客户" value={intents} tone="intent" /><FunnelArrow /><FunnelStep label="客户" value={customers} tone="customer" /></div><div className="funnel-foot"><span>{lost} 条暂不跟进</span><button className="text-button" onClick={() => onNavigate('leads')}>查看线索</button></div></section>
    <section className="table-panel tactic-review-panel"><div className="table-toolbar"><div><h2>获客路径结果</h2><span>先看哪种内容或动作不仅带来咨询，也确实被人工接住并继续推进。</span></div></div>{reviewRows.length ? <><div className="review-truth-note">只有同时记录客户进入时间、承接截止和实际首次回应时间的内容线索，才判断按时或超时；历史存量数据不倒推时效结论。</div><div className="table-scroll"><table><thead><tr><th>获客路径</th><th>咨询</th><th>待承接</th><th>按时承接</th><th>超时承接</th><th>资料完整</th><th>人工可推进</th><th>已记录预约</th><th>已记录方案/报价</th><th>已记录成交</th><th>未推进</th></tr></thead><tbody>{reviewRows.map((row) => <tr key={row.pack.id}><td><div className="review-path-name"><strong>{row.pack.name}</strong><span>{channelById(row.pack.channelId).shortLabel} · {row.pack.primaryGoal}</span></div></td><td>{row.consultations}</td><td>{row.firstResponsesPending}</td><td>{row.firstResponsesOnTime}</td><td>{row.firstResponsesLate}</td><td>{row.informationComplete}</td><td>{row.manuallyReady}</td><td>{row.appointments}</td><td>{row.proposalOrQuote}</td><td>{row.customers}</td><td>{row.notMoving}</td></tr>)}</tbody></table></div></> : <EmptyState icon={<ClipboardList size={24} />} title="还没有可复盘的获客路径" description="从已启用打法的匹配渠道登记咨询后，这里才会形成可追溯的路径结果。" action={<button className="button button-secondary" onClick={() => onNavigate('acquisition')}>去配置获客路径<ArrowRight size={15} /></button>} />}</section>
    <section className="review-grid-core"><div className="table-panel"><div className="table-toolbar"><div><h2>来源结果</h2><span>先看哪种动作带来的咨询不仅更多，也确实被人工接住。</span></div></div>{sourceRows.length ? <><div className="review-truth-note">“待承接”包含尚在时效内、即将超时和已超时但未记录首次人工承接的内容咨询。</div><div className="table-scroll"><table><thead><tr><th>来源</th><th>咨询</th><th>待承接</th><th>按时承接</th><th>超时承接</th><th>资料完整</th><th>人工可推进</th><th>已记录成交</th></tr></thead><tbody>{sourceRows.map((row) => <tr key={row.source}><td><strong>{row.source}</strong></td><td>{row.total}</td><td>{row.firstResponsesPending}</td><td>{row.firstResponsesOnTime}</td><td>{row.firstResponsesLate}</td><td>{row.informationComplete}</td><td>{row.manuallyReady}</td><td>{row.customers}</td></tr>)}</tbody></table></div></> : <EmptyState icon={<BarChart3 size={24} />} title="暂时没有可复盘的数据" description="先在线索中记录来源，后续推进到意向客户和客户后，这里会形成完整结果。" action={<button className="button button-secondary" onClick={() => onNavigate('leads')}>去记录线索<ArrowRight size={15} /></button>} />}</div><aside className="review-note"><ClipboardList size={20} /><h2>复盘先看什么</h2><ol><li>哪个来源带来的咨询被及时人工接住？</li><li>人工判断后，哪些路径仍然值得推进？</li><li>预约、方案和成交卡在了哪一步？</li></ol><p>没有真实来源、字段和状态记录时，系统不会给出看似聪明但没有依据的结论。</p></aside></section>
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

export function RecordDialog({ stage, record, stageEvents = [], sourceOptions, contentLeadSourceOptions, defaultSource = '', tacticPack, onClose, onSubmit, onRecordFirstResponse, onRequestHandoff }: { stage: Exclude<Stage, 'lost'>; record?: CustomerRecord; stageEvents?: CustomerStageEvent[]; sourceOptions: SourceOption[]; contentLeadSourceOptions: ContentLeadSourceOption[]; defaultSource?: string; tacticPack?: GrowthTacticPack; onClose: () => void; onSubmit: (formData: FormData) => void; onRecordFirstResponse?: () => void; onRequestHandoff?: () => void }) {
  const [selectedStage, setSelectedStage] = useState<Exclude<Stage, 'lost'>>(record?.stage === 'lost' ? stage : record?.stage ?? stage)
  const [tacticDraftValues, setTacticDraftValues] = useState<TacticLeadValues>(record?.tacticLeadValues || {})
  const [tacticQualificationStatus, setTacticQualificationStatus] = useState<TacticQualificationStatus>(record?.tacticQualificationStatus || '')
  const initialSource = record?.source ?? defaultSource
  const [source, setSource] = useState(initialSource)
  const matchingContentLeadContext = contentLeadSourceOptions.find((option) => option.source === source || option.sourceCode === source)?.context
  const contentLeadContext = record && source === initialSource ? record.contentLeadContext : matchingContentLeadContext || null
  const statuses = stageMeta[selectedStage].statuses
  const defaultStatus = record?.stage === selectedStage && statuses.includes(record.status) ? record.status : !record && selectedStage === 'lead' && contentLeadContext ? '待联系' : statuses[0]
  const title = record ? `编辑${stageMeta[selectedStage].label}` : `新建${stageMeta[stage].label}`
  const tacticProgress = tacticPack ? tacticLeadProgress(tacticPack, tacticDraftValues) : null
  const tacticRecommendation = tacticPack ? tacticQualificationRecommendation(tacticPack, tacticDraftValues) : null
  const firstResponseEvent = [...stageEvents].filter((event) => event.type === firstManualResponseEventType).sort((left, right) => right.occurredAt.localeCompare(left.occurredAt) || right.createdAt.localeCompare(left.createdAt))[0]
  const firstResponseSla = record ? firstResponseSlaStatus(record, stageEvents, nowLocalDateTime()) : '不适用'
  const firstResponseSlaText = record ? firstResponseSlaLabel(firstResponseSla, record.firstResponseDueAt) : ''
  return <div className="dialog-backdrop" role="presentation">
    <form className="dialog" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget)) }}>
      <div className="dialog-head"><div><h2>{title}</h2><p>把来源、联系方式、需求和下一步填写清楚，工作台才能帮你持续推进。</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div>
      <div className="form-grid">
        <label className="field"><span>姓名或称呼</span><input name="name" required autoFocus defaultValue={record?.name ?? ''} placeholder="例如：王女士 / 某公司负责人" /></label>
        <label className="field"><span>联系方式</span><input name="contact" defaultValue={record?.contact ?? ''} placeholder="例如：手机号 / 微信备注名" /></label>
        <label className="field field-wide"><span>来源</span><input name="source" list="channel-source-options" value={source} onChange={(event) => setSource(event.target.value)} placeholder="例如：扫码、电话、朋友介绍" /></label>
        {sourceOptions.length ? <datalist id="channel-source-options">{sourceOptions.map((source) => <option key={source.id} value={source.label} />)}</datalist> : null}
        {contentLeadContext && <section className="content-lead-context field-wide" aria-label="内容承接快照"><div className="content-lead-context-head"><div><Link2 size={16} /><div><strong>内容承接快照</strong><small>这是客户进入时对应的已锁定内容；后续改稿不会改写这条线索的承接依据。</small></div></div><span>{channelById(contentLeadContext.channelId).shortLabel}</span></div><div className="content-lead-context-title"><strong>{contentLeadContext.title || '未命名内容'}</strong></div><dl>{contentLeadContext.customerPromise && <div><dt>内容承诺</dt><dd>{contentLeadContext.customerPromise}</dd></div>}{contentLeadContext.customerNextAction && <div><dt>客户下一步</dt><dd>{contentLeadContext.customerNextAction}</dd></div>}{contentLeadContext.inquiryOwner && <div><dt>咨询承接人</dt><dd>{contentLeadContext.inquiryOwner}</dd></div>}{contentLeadContext.firstResponseTarget && <div><dt>首次承接时效</dt><dd>{contentLeadContext.firstResponseTarget}</dd></div>}{contentLeadContext.inquiryEntry && <div><dt>人工入口</dt><dd>{contentLeadContext.inquiryEntry}</dd></div>}{contentLeadContext.firstResponsePlan && <div><dt>首轮人工回应</dt><dd>{contentLeadContext.firstResponsePlan}</dd></div>}{contentLeadContext.customerPreparation && <div><dt>客户先准备</dt><dd>{contentLeadContext.customerPreparation}</dd></div>}{contentLeadContext.serviceBoundary && <div><dt>服务与报价边界</dt><dd>{contentLeadContext.serviceBoundary}</dd></div>}</dl><p>系统不会自动私信、加好友或预约；店员仍需按客户实际情况完成沟通和判断。</p></section>}
        {record && contentLeadContext && <section className={`first-response-panel field-wide ${firstResponseEvent ? 'done' : ''}`} aria-label="首次人工承接"><div><span>{firstResponseSlaText}</span><h3>首次人工承接</h3><p>{firstResponseEvent ? `${formatDate(firstResponseEvent.occurredAt)} 已记录。${record.firstResponseDueAt ? ` 截止时间为 ${formatDate(record.firstResponseDueAt)}。` : ''}` : `客户已因这条内容进入线索，需由店员按实际情况完成第一次人工回应。${record.firstResponseDueAt ? ` 首次承接截止：${formatDate(record.firstResponseDueAt)}。` : ''}`}</p></div><div className="first-response-actions">{onRecordFirstResponse && !firstResponseEvent && <button className="button button-primary small" type="button" onClick={onRecordFirstResponse}>记录首次承接<ClipboardPlus size={14} /></button>}{onRequestHandoff && <button className="button button-secondary small" type="button" onClick={onRequestHandoff}>转交负责人<ArrowRight size={14} /></button>}</div>{firstResponseEvent?.note && <p className="first-response-note">{firstResponseEvent.note}</p>}{!firstResponseEvent && <small>记录时请写清：已确认什么、客户还需补什么资料，以及双方约定的下一步。不会自动发送任何消息。</small>}</section>}
        <label className="field field-wide"><span>需求</span><textarea name="need" rows={3} defaultValue={record?.need ?? ''} placeholder="他想解决什么问题，是否有明确的购买或服务需求？" /></label>
        {tacticPack ? <fieldset className="tactic-lead-intake">
          <input type="hidden" name="tacticPackId" value={tacticPack.id} />
          <legend>按本次获客方式补充信息</legend>
          <p><strong>{tacticPack.name}</strong>{tacticRecommendation?.status === '可人工推进' ? '：基本信息已齐全，请完成一次人工判断。' : '：先补齐关键现场信息，再判断是否值得继续推进。'}</p>
          <div className="form-grid tactic-lead-grid">{tacticPack.leadFields.map((field) => <label key={field.id} className={`field ${field.inputKind === 'longText' ? 'field-wide' : ''}`}><span>{field.label}{field.required ? <em>需要确认</em> : null}</span><small>{field.purpose}</small>{field.inputKind === 'longText' ? <textarea name={tacticLeadInputName(field.id)} rows={3} value={tacticDraftValues[field.id] || ''} onChange={(event) => setTacticDraftValues((current) => ({ ...current, [field.id]: event.target.value }))} placeholder={field.placeholder || '补充客户提供的实际情况'} /> : <input name={tacticLeadInputName(field.id)} value={tacticDraftValues[field.id] || ''} onChange={(event) => setTacticDraftValues((current) => ({ ...current, [field.id]: event.target.value }))} placeholder={field.placeholder || '补充客户提供的实际情况'} />}</label>)}</div>
          <div className="tactic-qualification"><div><span>当前建议</span><strong className={qualificationTone(tacticRecommendation?.status || '')}>{tacticRecommendation?.status || '待补充信息'}</strong><p>{tacticRecommendation?.reasons.join(' ')}</p></div><label className="field"><span>人工判断</span><select name="tacticQualificationStatus" value={tacticQualificationStatus} onChange={(event) => setTacticQualificationStatus(normalizeTacticQualificationStatus(event.target.value))}><option value="">暂不下结论</option><option value="可人工推进">可人工推进</option><option value="暂不符合">暂不符合</option></select></label><label className="field field-wide"><span>判断备注</span><textarea name="tacticQualificationNote" rows={2} defaultValue={record?.tacticQualificationNote || ''} placeholder="例如：服务范围可覆盖，客户愿意本周到店沟通" /></label></div>
          <small className="tactic-lead-intake-note">{tacticProgress?.complete ? `已补全 ${tacticProgress.completedCount}/${tacticProgress.requiredCount} 项关键信息；选择“可人工推进”后，仍会在转入意向客户前请你确认一次。` : `当前已补全 ${tacticProgress?.completedCount || 0}/${tacticProgress?.requiredCount || 0} 项关键信息；未补全前保留为待判断，不把咨询当成有效预约。`}</small>
        </fieldset> : <input type="hidden" name="tacticPackId" value="" />}
        <label className="field"><span>当前阶段</span><select name="stage" value={selectedStage} onChange={(event) => setSelectedStage(event.target.value as Exclude<Stage, 'lost'>)}>{(Object.keys(stageMeta) as Array<Exclude<Stage, 'lost'>>).map((item) => <option key={item} value={item}>{stageMeta[item].label}</option>)}</select></label>
        <label className="field"><span>当前状态</span><select name="status" key={`${selectedStage}-${defaultStatus}`} defaultValue={defaultStatus}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        <label className="field"><span>负责人</span><input name="owner" defaultValue={record?.owner || contentLeadContext?.inquiryOwner || ''} placeholder="例如：张店长" /></label>
        <label className="field"><span>下一步日期</span><input name="nextDate" type="date" defaultValue={record?.nextDate ?? (!record && selectedStage === 'lead' && contentLeadContext?.firstResponsePlan ? todayISO() : '')} /></label>
        <label className="field field-wide"><span>下一步动作</span><input name="nextAction" defaultValue={record?.nextAction ?? (!record && selectedStage === 'lead' ? contentLeadContext?.firstResponsePlan || tacticPack?.followUpSteps[0]?.action || '' : '')} placeholder={contentLeadContext?.firstResponsePlan || tacticPack?.followUpSteps[0]?.action || '例如：明天电话确认到店时间'} /></label>
        <label className="field field-wide"><span>备注</span><textarea name="note" rows={2} defaultValue={record?.note ?? ''} placeholder="可选，记录需要留意的事情" /></label>
        {record && <section className="customer-event-history field-wide" aria-label="推进记录"><div><h3>推进记录</h3><small>保存客户资料后，可在列表中继续补充每一次预约、方案、报价或成交。</small></div>{stageEvents.length ? <div className="customer-event-list">{[...stageEvents].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt) || right.createdAt.localeCompare(left.createdAt)).slice(0, 5).map((event) => <article className="customer-event-row" key={event.id}><div><strong className="customer-event-type">{event.type}</strong><span>{formatDate(event.occurredAt)}</span></div>{event.note && <p>{event.note}</p>}</article>)}</div> : <p className="customer-event-empty">暂时没有推进记录。</p>}</section>}
      </div>
      <div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onClose}>取消</button><button className="button button-primary" type="submit">保存<Check size={16} /></button></div>
    </form>
  </div>
}

export function CustomerStageEventDialog({ record, initialType, onClose, onSubmit }: { record: CustomerRecord; initialType?: CustomerStageEvent['type']; onClose: () => void; onSubmit: (formData: FormData) => void }) {
  const [selectedType, setSelectedType] = useState<CustomerStageEvent['type']>(initialType || customerStageEventDefinitions[0].type)
  const definition = customerStageEventByType(selectedType) || customerStageEventDefinitions[0]
  const nextStageLabel = definition.nextStage === 'intent' ? '意向客户' : definition.nextStage === 'customer' ? '客户' : definition.nextStage === 'lost' ? '暂不跟进' : ''
  const nextStatusLabel = definition.nextStatus || ''
  return <div className="dialog-backdrop" role="presentation">
    <form className="dialog customer-stage-event-dialog" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget)) }}>
      <div className="dialog-head"><div><h2>记录推进事项</h2><p>只记录已经真实发生的事项。保存后，会在客户档案和复盘中保留依据。</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div>
      <div className="customer-event-summary"><div><span>客户</span><strong>{record.name}</strong></div><div><span>来源</span><strong>{record.source || '未记录来源'}</strong></div><div><span>当前情况</span><strong>{record.stage === 'lost' ? '暂不跟进' : stageMeta[record.stage].label} · {record.status}</strong></div></div>
      <div className="form-grid">
        <label className="field field-wide"><span>本次推进事项</span><select name="type" value={selectedType} onChange={(event) => setSelectedType(event.target.value as CustomerStageEvent['type'])}>{customerStageEventDefinitions.map((item) => <option key={item.type} value={item.type}>{item.type}</option>)}</select></label>
        <section className="customer-event-effect field-wide"><strong>{definition.description}</strong><p>{nextStageLabel && nextStatusLabel ? `保存后会同步为：${nextStageLabel} · ${nextStatusLabel}` : '本次只保留过程记录，不改变当前阶段和状态。'}</p></section>
        {selectedType === firstManualResponseEventType && <section className="first-response-guidance field-wide"><strong>{record.contentLeadContext ? `发布时指定承接人：${record.contentLeadContext.inquiryOwner || record.owner || '未记录'}。客户进入时的承诺：${record.contentLeadContext.customerPromise || record.contentLeadContext.title}` : '首次人工承接只记录实际发生的回应。'}</strong><p>{record.firstResponseDueAt ? `首次承接截止：${formatDate(record.firstResponseDueAt)}。` : '这条历史线索没有设定承接时效，不会倒推按时或超时。'} 备注必须写清已确认的信息、还缺的资料和明确下一步；不把客户未同意提供的信息写成已获得。</p></section>}
        <label className="field"><span>{selectedType === firstManualResponseEventType ? '实际承接时间' : '发生日期'}</span><input name="occurredAt" type={selectedType === firstManualResponseEventType ? 'datetime-local' : 'date'} defaultValue={selectedType === firstManualResponseEventType ? nowLocalDateTime() : todayISO()} /></label>
        <label className="field field-wide"><span>补充说明{selectedType === firstManualResponseEventType ? ' *' : ''}</span><textarea name="note" rows={3} required={selectedType === firstManualResponseEventType} placeholder={selectedType === firstManualResponseEventType ? '例如：已确认在服务范围内，客户本周补充户型图和坑距；明晚 19:30 由店长人工回复。' : '例如：已约好周六下午到店，客户会带现场尺寸和照片'} /></label>
      </div>
      <div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onClose}>取消</button><button className="button button-primary" type="submit">保存记录<Check size={16} /></button></div>
    </form>
  </div>
}

export function OwnershipHandoffDialog({ record, onClose, onSubmit }: { record: CustomerRecord; onClose: () => void; onSubmit: (formData: FormData) => void }) {
  const currentOwner = record.owner || record.contentLeadContext?.inquiryOwner || '未分配负责人'
  return <div className="dialog-backdrop" role="presentation">
    <form className="dialog customer-stage-event-dialog" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget)) }}>
      <div className="dialog-head"><div><h2>转交承接负责人</h2><p>只改变这条客户记录的后续人工责任，不会向客户或第三方自动发送任何通知。</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div>
      <div className="customer-event-summary"><div><span>客户</span><strong>{record.name}</strong></div><div><span>当前负责人</span><strong>{currentOwner}</strong></div><div><span>来源</span><strong>{record.source || '未记录来源'}</strong></div></div>
      <div className="form-grid">
        <section className="first-response-guidance field-wide"><strong>交接后，新负责人会出现在今日承接队列和客户档案中。</strong><p>请写清交接原因、已经完成的沟通内容以及下一步；工作台只保存责任依据，不自动转发消息。</p></section>
        <label className="field"><span>新的承接负责人 *</span><input name="nextOwner" required autoFocus placeholder="例如：销售小李" /></label>
        <label className="field"><span>实际交接时间</span><input name="occurredAt" type="datetime-local" defaultValue={nowLocalDateTime()} /></label>
        <label className="field field-wide"><span>交接说明 *</span><textarea name="note" rows={4} required placeholder="例如：原负责人下班，已确认客户在本地城区；客户今晚补充照片，明早由小李人工继续确认尺寸。" /></label>
      </div>
      <div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onClose}>取消</button><button className="button button-primary" type="submit">确认交接<Check size={16} /></button></div>
    </form>
  </div>
}

function TacticIntentConfirmationDialog({ record, onClose, onEdit, onConfirm }: { record: CustomerRecord; onClose: () => void; onEdit: () => void; onConfirm: () => void }) {
  const qualification = tacticQualificationForRecord(record)
  if (!qualification) return null
  const fieldRows = qualification.pack.leadFields.filter((field) => record.tacticLeadValues[field.id]).map((field) => ({ label: field.label, value: record.tacticLeadValues[field.id] }))
  return <div className="dialog-backdrop" role="presentation">
    <section className="dialog tactic-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="tactic-intent-title">
      <div className="dialog-head"><div><h2 id="tactic-intent-title">确认转为意向客户</h2><p>确认后，这位客户会进入预约、方案和报价的跟进流程。</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div>
      <div className="tactic-confirm-summary"><span className={`qualification-pill ${qualificationTone(qualification.status)}`}>{qualification.status}</span><div><strong>{qualification.pack.name}</strong><p>{qualification.recommendation.reasons.join(' ')}</p></div></div>
      <div className="tactic-confirm-section"><h3>已收集的信息</h3>{fieldRows.length ? <dl>{fieldRows.map((field) => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl> : <p>暂未收集到与这次获客方式相关的信息。</p>}</div>
      <div className="tactic-confirm-section"><h3>转入前请确认</h3><ul>{qualification.pack.qualificationRules.map((rule) => <li key={rule}>{rule}</li>)}</ul>{record.tacticQualificationNote && <p className="tactic-confirm-note"><strong>判断备注：</strong>{record.tacticQualificationNote}</p>}</div>
      <div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onEdit}>返回修改</button><button className="button button-primary" type="button" onClick={onConfirm}>确认转为意向<ArrowRight size={16} /></button></div>
    </section>
  </div>
}

function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) { return <header className="page-header"><div><h1>{title}</h1><p>{description}</p></div>{action && <div className="page-action">{action}</div>}</header> }
function FlowRow({ index, label, count, note }: { index: string; label: string; count: number; note: string }) { return <div className="flow-row"><span>{index}</span><div><b>{label}</b><small>{note}</small></div><strong>{count}</strong></div> }
function FunnelStep({ label, value, tone }: { label: string; value: number; tone: string }) { return <div className={`funnel-step ${tone}`}><span>{label}</span><strong>{value}</strong></div> }
function FunnelArrow() { return <span className="funnel-arrow"><ArrowRight size={18} /></span> }
function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) { return <div className="empty-state"><span>{icon}</span><h2>{title}</h2><p>{description}</p>{action}</div> }

export default App
