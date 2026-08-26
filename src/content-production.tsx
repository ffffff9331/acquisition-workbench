import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, Check, CircleCheckBig, Clipboard, FileText, History, Lock, Plus, RotateCcw, ShieldCheck, Sparkles, Trash2, Unlock } from 'lucide-react'
import { generateWithConfiguredService } from './ai-generation'
import type { AISecretStatus, AIServiceSettings } from './ai-service'
import { channelById, type ChannelId } from './channels'
import type { GeneratedTopicCandidate, OpportunityChannelPerformance, ResearchEvidence } from './topic-research'
import { ContentReviewPanel, contentDraftFingerprint, emptyContentQualityReview, evaluateContentRules, normalizeContentQualityReview, type ContentQualityReview, type ContentRevisionProposal } from './content-review'
import { ContentLearningPanel, contentLearningResultFingerprint, normalizeContentLearnings, type ContentLearningRecord } from './content-learning'

export type ContentTaskStatus = '简报中' | '草稿中' | '待检查' | '已锁定'

export type ContentPreflight = {
  factsVerified: boolean
  channelFitVerified: boolean
  assetsReady: boolean
  reviewConfirmed: boolean
  manualReviewed: boolean
}

export type ContentClaimCheck = {
  statement: string
  evidenceId: string
  risk: string
}

export type ContentVersion = {
  id: string
  reason: string
  createdAt: string
  title: string
  hook: string
  outline: string
  body: string
  callToAction: string
  coverCopy: string
  visualPlan: string
}

export type ContentVariant = {
  id: string
  channelId: ChannelId
  executionItemId: string
  title: string
  hook: string
  outline: string
  body: string
  callToAction: string
  coverCopy: string
  visualPlan: string
  claimChecks: ContentClaimCheck[]
  qualityReview: ContentQualityReview
  preflight: ContentPreflight
  versions: ContentVersion[]
  lockedAt: string
  createdAt: string
  updatedAt: string
}

export type ContentTask = {
  id: string
  opportunityId: string
  title: string
  targetCustomer: string
  buyerStage: string
  objective: string
  audienceGain: string
  coreClaim: string
  proofPlan: string
  assetRequirements: string
  evidenceIds: string[]
  variants: ContentVariant[]
  activeVariantId: string
  status: ContentTaskStatus
  createdAt: string
  updatedAt: string
}

export type ContentProductionData = {
  tasks: ContentTask[]
  activeTaskId: string
  learnings: ContentLearningRecord[]
}

export const emptyContentProductionData: ContentProductionData = { tasks: [], activeTaskId: '', learnings: [] }

const channelIds: ChannelId[] = ['douyin', 'xiaohongshu', 'wechat', 'offline', 'referral', 'bilibili']

const emptyPreflight: ContentPreflight = {
  factsVerified: false,
  channelFitVerified: false,
  assetsReady: false,
  reviewConfirmed: false,
  manualReviewed: false,
}

function nowISO() {
  return new Date().toISOString()
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function clean(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function normalizePreflight(value: unknown): ContentPreflight {
  const item = value && typeof value === 'object' ? value as Partial<ContentPreflight> : {}
  return {
    factsVerified: item.factsVerified === true,
    channelFitVerified: item.channelFitVerified === true,
    assetsReady: item.assetsReady === true,
    reviewConfirmed: item.reviewConfirmed === true || item.manualReviewed === true,
    manualReviewed: item.manualReviewed === true,
  }
}

function normalizeVersions(value: unknown): ContentVersion[] {
  if (!Array.isArray(value)) return []
  return value.filter((item) => item && typeof item === 'object').map((item) => {
    const version = item as Partial<ContentVersion>
    return {
      id: clean(version.id, 120) || createId('content-version'),
      reason: clean(version.reason, 100) || '历史版本',
      createdAt: clean(version.createdAt, 60) || nowISO(),
      title: clean(version.title, 200),
      hook: clean(version.hook, 800),
      outline: clean(version.outline, 5000),
      body: clean(version.body, 30000),
      callToAction: clean(version.callToAction, 1000),
      coverCopy: clean(version.coverCopy, 500),
      visualPlan: clean(version.visualPlan, 8000),
    }
  }).slice(0, 20)
}

function normalizeVariant(value: unknown): ContentVariant | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Partial<ContentVariant>
  if (!channelIds.includes(item.channelId as ChannelId)) return null
  return {
    id: clean(item.id, 120) || createId('content-variant'),
    channelId: item.channelId as ChannelId,
    executionItemId: clean(item.executionItemId, 120),
    title: clean(item.title, 200),
    hook: clean(item.hook, 800),
    outline: clean(item.outline, 5000),
    body: clean(item.body, 30000),
    callToAction: clean(item.callToAction, 1000),
    coverCopy: clean(item.coverCopy, 500),
    visualPlan: clean(item.visualPlan, 8000),
    claimChecks: Array.isArray(item.claimChecks) ? item.claimChecks.filter((claim) => claim && typeof claim === 'object').map((claim) => ({
      statement: clean(claim.statement, 500),
      evidenceId: clean(claim.evidenceId, 120),
      risk: clean(claim.risk, 500),
    })).filter((claim) => claim.statement).slice(0, 12) : [],
    qualityReview: normalizeContentQualityReview(item.qualityReview),
    preflight: normalizePreflight(item.preflight),
    versions: normalizeVersions(item.versions),
    lockedAt: clean(item.lockedAt, 60),
    createdAt: clean(item.createdAt, 60) || nowISO(),
    updatedAt: clean(item.updatedAt, 60) || nowISO(),
  }
}

export function normalizeContentProductionData(value: unknown): ContentProductionData {
  if (!value || typeof value !== 'object') return emptyContentProductionData
  const raw = value as Partial<ContentProductionData>
  const tasks = Array.isArray(raw.tasks) ? raw.tasks.filter((item) => item && typeof item === 'object').map((item) => {
    const task = item as Partial<ContentTask>
    const variants = Array.isArray(task.variants) ? task.variants.map(normalizeVariant).filter((variant): variant is ContentVariant => Boolean(variant)) : []
    const activeVariantId = variants.some((variant) => variant.id === task.activeVariantId) ? clean(task.activeVariantId, 120) : variants[0]?.id || ''
    const status: ContentTaskStatus = task.status === '草稿中' || task.status === '待检查' || task.status === '已锁定' ? task.status : '简报中'
    return {
      id: clean(task.id, 120) || createId('content-task'),
      opportunityId: clean(task.opportunityId, 120),
      title: clean(task.title, 200),
      targetCustomer: clean(task.targetCustomer, 600),
      buyerStage: clean(task.buyerStage, 120),
      objective: clean(task.objective, 600),
      audienceGain: clean(task.audienceGain, 600),
      coreClaim: clean(task.coreClaim, 1000),
      proofPlan: clean(task.proofPlan, 3000),
      assetRequirements: clean(task.assetRequirements, 5000),
      evidenceIds: Array.isArray(task.evidenceIds) ? task.evidenceIds.filter((id): id is string => typeof id === 'string').slice(0, 20) : [],
      variants,
      activeVariantId,
      status,
      createdAt: clean(task.createdAt, 60) || nowISO(),
      updatedAt: clean(task.updatedAt, 60) || nowISO(),
    }
  }).filter((task) => task.title) : []
  const activeTaskId = tasks.some((task) => task.id === raw.activeTaskId) ? clean(raw.activeTaskId, 120) : tasks[0]?.id || ''
  return { tasks, activeTaskId, learnings: normalizeContentLearnings(raw.learnings) }
}

function createVariant(channelId: ChannelId, title: string, callToAction: string, executionItemId = ''): ContentVariant {
  const createdAt = nowISO()
  return {
    id: createId('content-variant'),
    channelId,
    executionItemId,
    title,
    hook: '',
    outline: '',
    body: '',
    callToAction,
    coverCopy: '',
    visualPlan: '',
    claimChecks: [],
    qualityReview: emptyContentQualityReview,
    preflight: { ...emptyPreflight },
    versions: [],
    lockedAt: '',
    createdAt,
    updatedAt: createdAt,
  }
}

export function createContentTaskFromOpportunity(opportunity: GeneratedTopicCandidate, defaultChannel?: ChannelId): ContentTask {
  const createdAt = nowISO()
  const channelId = defaultChannel || opportunity.recommendedChannels[0]
  const variants = channelId ? [createVariant(channelId, opportunity.title, opportunity.callToAction, opportunity.adoptions.find((item) => item.channelId === channelId)?.itemId || '')] : []
  return {
    id: createId('content-task'),
    opportunityId: opportunity.id,
    title: opportunity.title,
    targetCustomer: opportunity.targetCustomer,
    buyerStage: opportunity.buyerStage,
    objective: opportunity.callToAction,
    audienceGain: opportunity.keyPromise,
    coreClaim: opportunity.contentAngle,
    proofPlan: opportunity.proofNeeded,
    assetRequirements: opportunity.proofNeeded,
    evidenceIds: [...opportunity.evidenceIds],
    variants,
    activeVariantId: variants[0]?.id || '',
    status: variants.length ? '草稿中' : '简报中',
    createdAt,
    updatedAt: createdAt,
  }
}

function variantSnapshot(variant: ContentVariant, reason: string): ContentVersion {
  return {
    id: createId('content-version'),
    reason,
    createdAt: nowISO(),
    title: variant.title,
    hook: variant.hook,
    outline: variant.outline,
    body: variant.body,
    callToAction: variant.callToAction,
    coverCopy: variant.coverCopy,
    visualPlan: variant.visualPlan,
  }
}

function channelGuidance(channelId: ChannelId) {
  if (channelId === 'douyin') return '前 3 秒明确客户问题；正文适合真人口播或现场演示；visualPlan 按镜头逐行列出；coverCopy 不超过两行。'
  if (channelId === 'xiaohongshu') return '标题符合真实搜索意图；正文便于分段阅读；visualPlan 按首图、过程图、证明图、收尾图排序；封面只建议产品实拍加短文案，或直接使用标题。'
  if (channelId === 'wechat') return '先明确触达人群和关系语境；语气像真实经营者；避免硬广堆砌；给出一个清楚且不过度打扰的联系动作。'
  if (channelId === 'bilibili') return '开头说明观众看完能解决什么；outline 使用章节结构；正文允许更完整的解释和案例；visualPlan 标记讲解、演示和证明素材。'
  if (channelId === 'offline') return '内容用于活动招募或现场物料；正文讲清适合谁、时间地点、参与价值和登记方式；visualPlan 列出海报、现场展示和登记物料。'
  return '先讲清合作对象为什么愿意推荐；正文包含适合推荐的人、证明材料、推荐动作和合作边界；避免承诺无法兑现的权益。'
}

function draftFromOutput(output: unknown) {
  const raw = output && typeof output === 'object' && 'draft' in output && (output as { draft?: unknown }).draft && typeof (output as { draft: unknown }).draft === 'object'
    ? (output as { draft: Record<string, unknown> }).draft
    : output && typeof output === 'object' ? output as Record<string, unknown> : {}
  const listText = (value: unknown, maxLength: number) => Array.isArray(value) ? value.filter((item) => typeof item === 'string').join('\n').slice(0, maxLength) : clean(value, maxLength)
  const claimChecks = Array.isArray(raw.claimChecks) ? raw.claimChecks.filter((item) => item && typeof item === 'object').map((item) => {
    const claim = item as Record<string, unknown>
    return { statement: clean(claim.statement, 500), evidenceId: clean(claim.evidenceId, 120), risk: clean(claim.risk, 500) }
  }).filter((item) => item.statement).slice(0, 12) : []
  return {
    title: clean(raw.title, 200),
    hook: clean(raw.hook, 800),
    outline: listText(raw.outline, 5000),
    body: clean(raw.body, 30000),
    callToAction: clean(raw.callToAction, 1000),
    coverCopy: clean(raw.coverCopy, 500),
    visualPlan: listText(raw.visualPlan, 8000),
    claimChecks,
  }
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '刚刚'
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}

export function ContentProductionPanel({ data, opportunities, evidence, enabledChannels, performanceByOpportunity, aiSettings, aiSecrets, onChange, onToast, onOpenAIService, onOfficialUsage, onOpenChannel }: { data: ContentProductionData; opportunities: GeneratedTopicCandidate[]; evidence: ResearchEvidence[]; enabledChannels: ChannelId[]; performanceByOpportunity: Record<string, OpportunityChannelPerformance[]>; aiSettings: AIServiceSettings; aiSecrets: AISecretStatus; onChange: (updater: (current: ContentProductionData) => ContentProductionData) => void; onToast: (message: string) => void; onOpenAIService: () => void; onOfficialUsage: (usage: { pointsCharged: number; balanceAfter: number }) => void; onOpenChannel: (channelId: ChannelId) => void }) {
  const [addingChannel, setAddingChannel] = useState<ChannelId>('douyin')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const activeTask = data.tasks.find((task) => task.id === data.activeTaskId) || data.tasks[0]
  const activeVariant = activeTask?.variants.find((variant) => variant.id === activeTask.activeVariantId) || activeTask?.variants[0]
  const activeOpportunity = activeTask ? opportunities.find((item) => item.id === activeTask.opportunityId) : undefined
  const activeLearning = activeVariant ? data.learnings.find((item) => item.taskId === activeTask?.id && item.variantId === activeVariant.id) : undefined
  const validatedLearnings = data.learnings.filter((item) => {
    if (item.status !== '已采用' || activeVariant && item.channelId !== activeVariant.channelId) return false
    const opportunity = opportunities.find((candidate) => candidate.id === item.opportunityId)
    const matchingPerformance = (performanceByOpportunity[item.opportunityId] || []).filter((result) => result.channelId === item.channelId && result.itemId === item.executionItemId)
    return item.resultFingerprint === contentLearningResultFingerprint(opportunity?.reviewDecision || '', matchingPerformance)
  })
  const taskHasLockedVariant = Boolean(activeTask?.variants.some((variant) => variant.lockedAt))
  const usedOpportunityIds = useMemo(() => new Set(data.tasks.map((task) => task.opportunityId)), [data.tasks])
  const availableOpportunities = opportunities.filter((item) => item.status !== '暂不采用' && !usedOpportunityIds.has(item.id))

  const updateTask = (updater: (task: ContentTask) => ContentTask) => {
    if (!activeTask) return
    onChange((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === activeTask.id ? { ...updater(task), updatedAt: nowISO() } : task) }))
  }

  const updateVariant = (updater: (variant: ContentVariant) => ContentVariant) => {
    if (!activeTask || !activeVariant) return
    updateTask((task) => {
      const variants = task.variants.map((variant) => {
        if (variant.id !== activeVariant.id) return variant
        const next = updater(variant)
        const draftChanged = contentDraftFingerprint(next) !== contentDraftFingerprint(variant)
        return {
          ...next,
          preflight: draftChanged ? { ...next.preflight, reviewConfirmed: false, manualReviewed: false } : next.preflight,
          updatedAt: nowISO(),
        }
      })
      const nextVariant = variants.find((variant) => variant.id === activeVariant.id)!
      return { ...task, variants, status: nextVariant.lockedAt ? '已锁定' : nextVariant.body ? '待检查' : '草稿中' }
    })
  }

  const addTask = (opportunity: GeneratedTopicCandidate) => {
    const preferred = opportunity.recommendedChannels.find((channelId) => enabledChannels.includes(channelId)) || opportunity.recommendedChannels[0] || enabledChannels[0] || 'douyin'
    const task = createContentTaskFromOpportunity(opportunity, preferred)
    onChange((current) => ({ ...current, tasks: [task, ...current.tasks], activeTaskId: task.id }))
    onToast('已建立内容任务，可以先核对简报再生成渠道草稿')
    window.setTimeout(() => document.getElementById('content-production')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const addVariant = () => {
    if (!activeTask) return
    const existing = activeTask.variants.find((variant) => variant.channelId === addingChannel)
    if (existing) {
      onChange((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === activeTask.id ? { ...task, activeVariantId: existing.id } : task) }))
      onToast(`已切换到${channelById(addingChannel).shortLabel}版本`)
      return
    }
    const variant = createVariant(addingChannel, activeTask.title, activeTask.objective, activeOpportunity?.adoptions.find((item) => item.channelId === addingChannel)?.itemId || '')
    updateTask((task) => ({ ...task, variants: [...task.variants, variant], activeVariantId: variant.id, status: '草稿中' }))
    onToast(`已新增${channelById(addingChannel).shortLabel}版本`)
  }

  const removeTask = () => {
    if (!activeTask) return
    onChange((current) => {
      const tasks = current.tasks.filter((task) => task.id !== activeTask.id)
      return { ...current, tasks, activeTaskId: tasks[0]?.id || '', learnings: current.learnings.filter((item) => item.taskId !== activeTask.id) }
    })
    onToast('已移除内容任务')
  }

  const removeVariant = () => {
    if (!activeTask || !activeVariant) return
    updateTask((task) => {
      const variants = task.variants.filter((variant) => variant.id !== activeVariant.id)
      return { ...task, variants, activeVariantId: variants[0]?.id || '', status: variants.length ? '草稿中' : '简报中' }
    })
    onChange((current) => ({ ...current, learnings: current.learnings.filter((item) => item.variantId !== activeVariant.id) }))
    onToast('已移除渠道版本')
  }

  const createManualSnapshot = () => {
    if (!activeVariant) return
    updateVariant((variant) => ({ ...variant, versions: [variantSnapshot(variant, '手工保存'), ...variant.versions].slice(0, 20) }))
    onToast('已保存当前版本')
  }

  const restoreVersion = (version: ContentVersion) => {
    updateVariant((variant) => ({
      ...variant,
      versions: [variantSnapshot(variant, '恢复前自动保存'), ...variant.versions].slice(0, 20),
      title: version.title,
      hook: version.hook,
      outline: version.outline,
      body: version.body,
      callToAction: version.callToAction,
      coverCopy: version.coverCopy,
      visualPlan: version.visualPlan,
      lockedAt: '',
      preflight: { ...variant.preflight, manualReviewed: false },
    }))
    onToast('已恢复历史版本，请重新核对')
  }

  const generateDraft = async () => {
    if (!activeTask || !activeVariant) return
    const selectedEvidence = evidence.filter((item) => activeTask.evidenceIds.includes(item.id))
    if (!selectedEvidence.length || !activeTask.targetCustomer.trim() || !activeTask.objective.trim() || !activeTask.proofPlan.trim()) {
      setError('生成前需要明确目标客户、内容目标、证明计划，并保留至少一条真实来源。')
      return
    }
    const configured = aiSettings.mode === 'official' ? Boolean(aiSettings.officialWorkspaceId && aiSecrets.officialTokenSaved) : Boolean(aiSettings.customBaseUrl && aiSettings.customModel && aiSecrets.customApiKeySaved)
    if (!configured) {
      setError('请先配置 AI 服务。')
      onOpenAIService()
      return
    }
    setGenerating(true)
    setError('')
    try {
      const response = await generateWithConfiguredService(aiSettings, aiSecrets, {
        task: 'content_draft',
        payload: {
          brief: {
            title: activeTask.title,
            targetCustomer: activeTask.targetCustomer,
            buyerStage: activeTask.buyerStage,
            objective: activeTask.objective,
            audienceGain: activeTask.audienceGain,
            coreClaim: activeTask.coreClaim,
            proofPlan: activeTask.proofPlan,
            assetRequirements: activeTask.assetRequirements,
          },
          evidence: selectedEvidence.map((item) => ({ id: item.id, title: item.title, url: item.url, summary: item.summary, publishedDate: item.publishedDate })),
          channel: { id: activeVariant.channelId, name: channelById(activeVariant.channelId).shortLabel, guidance: channelGuidance(activeVariant.channelId) },
          currentDraft: {
            title: activeVariant.title,
            hook: activeVariant.hook,
            outline: activeVariant.outline,
            body: activeVariant.body,
            callToAction: activeVariant.callToAction,
            coverCopy: activeVariant.coverCopy,
            visualPlan: activeVariant.visualPlan,
          },
          validatedLearnings: validatedLearnings.slice(0, 8).map((item) => ({ decision: item.decision, summary: item.summary, keepRules: item.keepRules, changeRules: item.changeRules, avoidRules: item.avoidRules, nextGenerationRules: item.nextGenerationRules, note: item.note })),
        },
      })
      if (!response.ok) {
        setError(response.message || '本次生成失败。')
        return
      }
      const draft = draftFromOutput(response.output)
      if (!draft.title || !draft.body) {
        setError('模型没有返回可用的标题和正文，请重试或更换模型。')
        return
      }
      updateVariant((variant) => ({
        ...variant,
        versions: variant.body || variant.hook || variant.outline ? [variantSnapshot(variant, 'AI 生成前自动保存'), ...variant.versions].slice(0, 20) : variant.versions,
        ...draft,
        qualityReview: { ...variant.qualityReview, revision: null },
        lockedAt: '',
        preflight: { ...emptyPreflight },
      }))
      if (response.usage) {
        onOfficialUsage(response.usage)
        onToast(`已生成${channelById(activeVariant.channelId).shortLabel}草稿，消耗 ${response.usage.pointsCharged} 积分`)
      } else {
        onToast(`已用自有 AI 服务生成${channelById(activeVariant.channelId).shortLabel}草稿`)
      }
    } catch {
      setError('生成失败，请检查网络或 AI 服务配置。')
    } finally {
      setGenerating(false)
    }
  }

  const applyRevision = (proposal: ContentRevisionProposal) => {
    updateVariant((variant) => ({
      ...variant,
      versions: [variantSnapshot(variant, '应用候选优化稿前'), ...variant.versions].slice(0, 20),
      ...proposal.draft,
      qualityReview: { ...variant.qualityReview, revision: proposal },
      lockedAt: '',
      preflight: { ...emptyPreflight },
    }))
    onToast('已应用候选优化稿，请重新评审并完成人工确认')
  }

  const saveLearning = (learning: ContentLearningRecord) => {
    onChange((current) => ({ ...current, learnings: current.learnings.some((item) => item.id === learning.id) ? current.learnings.map((item) => item.id === learning.id ? learning : item) : [learning, ...current.learnings].slice(0, 200) }))
  }

  const removeLearning = () => {
    if (!activeLearning) return
    onChange((current) => ({ ...current, learnings: current.learnings.filter((item) => item.id !== activeLearning.id) }))
    onToast('已移除这条学习记录')
  }

  const readiness = activeTask && activeVariant ? {
    evidenceReady: activeTask.evidenceIds.some((id) => evidence.some((item) => item.id === id)),
    proofReady: Boolean(activeTask.proofPlan.trim() && activeTask.assetRequirements.trim()),
    ctaReady: Boolean(activeVariant.callToAction.trim()),
    humanReady: Object.values(activeVariant.preflight).every(Boolean),
  } : null
  const localReviewChecks = activeTask && activeVariant ? evaluateContentRules(activeTask, activeVariant, evidence) : []
  const localReviewBlockers = localReviewChecks.filter((item) => item.status === '阻断')
  const aiReviewIsStale = Boolean(activeVariant?.qualityReview.aiReview && activeVariant.qualityReview.aiReview.draftFingerprint !== (activeVariant ? contentDraftFingerprint(activeVariant) : ''))
  const reviewReady = localReviewBlockers.length === 0 && !aiReviewIsStale
  const canLock = Boolean(readiness?.evidenceReady && readiness.proofReady && readiness.ctaReady && readiness.humanReady && activeVariant?.body.trim() && localReviewBlockers.length === 0)

  const toggleLock = () => {
    if (!activeVariant) return
    if (activeVariant.lockedAt) {
      updateVariant((variant) => ({ ...variant, lockedAt: '', preflight: { ...variant.preflight, manualReviewed: false } }))
      onToast('已解除锁定，可以继续修改')
      return
    }
    if (!canLock) {
      setError('完成全部发布前检查后才能锁定最终版本。')
      return
    }
    updateVariant((variant) => ({ ...variant, executionItemId: variant.executionItemId || activeOpportunity?.adoptions.find((item) => item.channelId === variant.channelId)?.itemId || '', versions: [variantSnapshot(variant, '锁定最终版本'), ...variant.versions].slice(0, 20), lockedAt: nowISO() }))
    onToast('最终版本已锁定，发布时请使用这一版')
  }

  const copyFinal = async () => {
    if (!activeVariant) return
    const text = [activeVariant.title, activeVariant.hook, activeVariant.body, activeVariant.callToAction].filter(Boolean).join('\n\n')
    try {
      await navigator.clipboard.writeText(text)
      onToast('已复制当前内容')
    } catch {
      onToast('复制失败，请在正文中手工选择内容')
    }
  }

  return <section className="content-production" id="content-production">
    <div className="content-production-heading">
      <div><span><FileText size={16} /></span><div><h2>内容生产台</h2><p>把获客机会加工成有证据、有素材、有渠道版本的可发布内容。</p></div></div>
      <div className="content-production-summary"><span><b>{data.tasks.length}</b>内容任务</span><span><b>{data.tasks.reduce((sum, task) => sum + task.variants.length, 0)}</b>渠道版本</span><span><b>{data.tasks.filter((task) => task.variants.some((variant) => variant.lockedAt)).length}</b>已锁定</span><span><b>{data.learnings.filter((item) => item.status === '已采用').length}</b>已沉淀规则</span></div>
    </div>

    {!data.tasks.length ? <div className="content-production-empty"><FileText size={25} /><div><strong>先从一个获客机会开始</strong><p>内容生产台不会凭空编选题。选择已经有真实来源支撑的机会，再建立内容简报。</p></div>{availableOpportunities.slice(0, 3).map((opportunity) => <button key={opportunity.id} className="button button-secondary" type="button" onClick={() => addTask(opportunity)}>{opportunity.title}<ArrowRight size={14} /></button>)}</div> : <div className="content-production-layout">
      <aside className="content-task-sidebar">
        <div className="content-task-sidebar-head"><strong>内容任务</strong><span>{data.tasks.length}</span></div>
        <div className="content-task-list">{data.tasks.map((task) => <button key={task.id} className={activeTask?.id === task.id ? 'active' : ''} type="button" onClick={() => onChange((current) => ({ ...current, activeTaskId: task.id }))}><span className={`content-status-dot ${task.status}`}></span><div><strong>{task.title}</strong><small>{task.variants.length ? `${task.variants.length} 个渠道版本` : '待选择渠道'} · {task.status}</small></div></button>)}</div>
        {availableOpportunities.length > 0 && <div className="content-add-menu"><span>新增内容任务</span>{availableOpportunities.slice(0, 4).map((opportunity) => <button key={opportunity.id} type="button" onClick={() => addTask(opportunity)}><Plus size={13} />{opportunity.title}</button>)}</div>}
      </aside>

      {activeTask && <div className="content-task-editor">
        <div className="content-task-toolbar"><div><span className={`status-pill ${activeTask.status === '已锁定' ? 'teal' : activeTask.status === '待检查' ? 'amber' : 'neutral'}`}>{activeTask.status}</span><small>建立于 {formatTime(activeTask.createdAt)}</small></div><button className="icon-button small" type="button" title="移除内容任务" aria-label="移除内容任务" onClick={removeTask}><Trash2 size={14} /></button></div>
        <div className="content-brief-panel">
          <div className="content-section-title"><div><FileText size={15} /><strong>内容简报</strong></div><small>所有渠道共用，行业插件可补充规则，但不改变这套结构。</small></div>
          <div className="content-brief-grid">
            <label className="field field-wide"><span>内容主题</span><input disabled={taskHasLockedVariant} value={activeTask.title} onChange={(event) => updateTask((task) => ({ ...task, title: event.target.value }))} /></label>
            <label className="field"><span>目标客户</span><textarea disabled={taskHasLockedVariant} rows={3} value={activeTask.targetCustomer} onChange={(event) => updateTask((task) => ({ ...task, targetCustomer: event.target.value }))} /></label>
            <label className="field"><span>客户所处阶段</span><input disabled={taskHasLockedVariant} value={activeTask.buyerStage} onChange={(event) => updateTask((task) => ({ ...task, buyerStage: event.target.value }))} placeholder="例如：方案比较 / 准备购买" /></label>
            <label className="field"><span>本条内容唯一目标</span><textarea disabled={taskHasLockedVariant} rows={3} value={activeTask.objective} onChange={(event) => updateTask((task) => ({ ...task, objective: event.target.value }))} /></label>
            <label className="field"><span>客户看完能得到什么</span><textarea disabled={taskHasLockedVariant} rows={3} value={activeTask.audienceGain} onChange={(event) => updateTask((task) => ({ ...task, audienceGain: event.target.value }))} /></label>
            <label className="field field-wide"><span>核心观点</span><textarea disabled={taskHasLockedVariant} rows={3} value={activeTask.coreClaim} onChange={(event) => updateTask((task) => ({ ...task, coreClaim: event.target.value }))} /></label>
            <label className="field"><span>怎么证明</span><textarea disabled={taskHasLockedVariant} rows={4} value={activeTask.proofPlan} onChange={(event) => updateTask((task) => ({ ...task, proofPlan: event.target.value }))} placeholder="说明哪些观点需要案例、数据、实拍或专业依据" /></label>
            <label className="field"><span>必须准备的真实素材</span><textarea disabled={taskHasLockedVariant} rows={4} value={activeTask.assetRequirements} onChange={(event) => updateTask((task) => ({ ...task, assetRequirements: event.target.value }))} placeholder="每行一种：产品实拍、前后对比、报价单局部、现场演示……" /></label>
          </div>
          <div className="content-evidence-strip"><div><ShieldCheck size={14} /><strong>引用来源</strong><span>{activeTask.evidenceIds.filter((id) => evidence.some((item) => item.id === id)).length}</span></div><div>{evidence.slice(0, 12).map((source) => { const selected = activeTask.evidenceIds.includes(source.id); return <label key={source.id} className={selected ? 'selected' : ''} title={taskHasLockedVariant ? '存在已锁定版本，请先解除锁定' : selected ? '取消引用' : '加入引用'}><input type="checkbox" disabled={taskHasLockedVariant} checked={selected} onChange={(event) => updateTask((task) => ({ ...task, evidenceIds: event.target.checked ? [...new Set([...task.evidenceIds, source.id])] : task.evidenceIds.filter((id) => id !== source.id) }))} /><span><Check size={11} /></span><b>{source.title}</b></label> })}</div>{taskHasLockedVariant && <small>共用简报与引用来源已随最终版本冻结。解除全部锁定后可继续调整。</small>}</div>
        </div>

        <div className="content-variant-panel">
          <div className="content-section-title"><div><Sparkles size={15} /><strong>渠道版本</strong></div><div className="content-add-variant"><select value={addingChannel} onChange={(event) => setAddingChannel(event.target.value as ChannelId)}>{channelIds.map((channelId) => <option key={channelId} value={channelId}>{channelById(channelId).shortLabel}</option>)}</select><button className="button button-secondary small" type="button" onClick={addVariant}><Plus size={13} />新增 / 切换</button></div></div>
          {activeTask.variants.length > 0 && <div className="content-variant-tabs">{activeTask.variants.map((variant) => <button key={variant.id} className={activeVariant?.id === variant.id ? 'active' : ''} type="button" onClick={() => updateTask((task) => ({ ...task, activeVariantId: variant.id }))}><span className={`mini-channel-icon ${variant.channelId}`}>{channelById(variant.channelId).icon}</span>{channelById(variant.channelId).shortLabel}{variant.lockedAt && <Lock size={11} />}</button>)}</div>}

          {!activeVariant ? <div className="content-variant-empty">选择一个渠道，建立第一份渠道版本。</div> : <>
            <div className="content-variant-toolbar"><div><strong>{channelById(activeVariant.channelId).shortLabel}表达规则</strong><p>{channelGuidance(activeVariant.channelId)}</p></div><div><button className="button button-secondary small" type="button" onClick={createManualSnapshot} disabled={Boolean(activeVariant.lockedAt)}><History size={13} />保存版本</button><button className="button button-primary small" type="button" onClick={() => void generateDraft()} disabled={generating || Boolean(activeVariant.lockedAt)}>{generating ? <RotateCcw className="spin" size={13} /> : <Sparkles size={13} />}{generating ? '正在生成' : activeVariant.body ? '重新生成草稿' : '生成渠道草稿'}</button><button className="icon-button small" type="button" title="移除渠道版本" aria-label="移除渠道版本" onClick={removeVariant}><Trash2 size={14} /></button></div></div>
            {error && <div className="service-error content-error"><AlertTriangle size={14} />{error}</div>}
            <div className="content-draft-grid">
              <label className="field field-wide"><span>渠道标题</span><input disabled={Boolean(activeVariant.lockedAt)} value={activeVariant.title} onChange={(event) => updateVariant((variant) => ({ ...variant, title: event.target.value }))} /></label>
              <label className="field"><span>开头</span><textarea disabled={Boolean(activeVariant.lockedAt)} rows={5} value={activeVariant.hook} onChange={(event) => updateVariant((variant) => ({ ...variant, hook: event.target.value }))} placeholder="第一句话为什么值得客户继续看" /></label>
              <label className="field"><span>结构 / 大纲</span><textarea disabled={Boolean(activeVariant.lockedAt)} rows={5} value={activeVariant.outline} onChange={(event) => updateVariant((variant) => ({ ...variant, outline: event.target.value }))} placeholder="每行一个部分" /></label>
              <label className="field field-wide"><span>正文 / 脚本</span><textarea disabled={Boolean(activeVariant.lockedAt)} rows={12} value={activeVariant.body} onChange={(event) => updateVariant((variant) => ({ ...variant, body: event.target.value }))} placeholder="AI 生成后仍需结合真实产品、案例和经营者表达进行修改" /></label>
              <label className="field"><span>客户下一步</span><textarea disabled={Boolean(activeVariant.lockedAt)} rows={3} value={activeVariant.callToAction} onChange={(event) => updateVariant((variant) => ({ ...variant, callToAction: event.target.value }))} /></label>
              <label className="field"><span>封面文案</span><textarea disabled={Boolean(activeVariant.lockedAt)} rows={3} value={activeVariant.coverCopy} onChange={(event) => updateVariant((variant) => ({ ...variant, coverCopy: event.target.value }))} placeholder="小红书只建议产品实拍加短文案，或直接使用标题" /></label>
              <label className="field field-wide"><span>画面 / 素材安排</span><textarea disabled={Boolean(activeVariant.lockedAt)} rows={6} value={activeVariant.visualPlan} onChange={(event) => updateVariant((variant) => ({ ...variant, visualPlan: event.target.value }))} placeholder="逐行写清使用什么真实画面，以及它要证明什么" /></label>
            </div>

            {activeVariant.claimChecks.length > 0 && <div className="claim-checks"><div><ShieldCheck size={15} /><strong>AI 提出的事实核对项</strong><small>这些提示不能替代人工核实。</small></div>{activeVariant.claimChecks.map((claim, index) => { const source = evidence.find((item) => item.id === claim.evidenceId); return <article key={`${claim.statement}-${index}`}><span>{index + 1}</span><div><strong>{claim.statement}</strong><p>{claim.risk || '发布前确认这句话有真实依据。'}</p>{source && <button type="button" onClick={() => window.open(source.url, '_blank', 'noopener,noreferrer')}>{source.title}</button>}</div></article> })}</div>}

            <ContentReviewPanel task={activeTask} variant={activeVariant} evidence={evidence} aiSettings={aiSettings} aiSecrets={aiSecrets} channelGuidance={channelGuidance(activeVariant.channelId)} validatedLearnings={validatedLearnings} onUpdateVariant={updateVariant} onApplyRevision={applyRevision} onToast={onToast} onOpenAIService={onOpenAIService} onOfficialUsage={onOfficialUsage} />

            <div className="content-preflight"><div className="content-preflight-head"><div><CircleCheckBig size={16} /><strong>发布前检查</strong></div><small>全部通过后，锁定本次最终版本。</small></div><div className="content-preflight-list">
              <span className={readiness?.evidenceReady ? 'done' : ''}><Check size={13} /><b>来源证据</b><small>{readiness?.evidenceReady ? '已保留真实来源' : '缺少可追溯来源'}</small></span>
              <span className={readiness?.proofReady ? 'done' : ''}><Check size={13} /><b>证明素材</b><small>{readiness?.proofReady ? '已写明证明与素材' : '补充证明计划和真实素材'}</small></span>
              {([['factsVerified', '事实已核对', '数字、价格、案例和效果承诺'], ['channelFitVerified', '渠道表达已核对', `适合${channelById(activeVariant.channelId).shortLabel}用户阅读或观看`], ['assetsReady', '素材已准备', '需要的实拍、截图或现场材料已齐'], ['reviewConfirmed', '体检问题已处理', reviewReady ? '本地阻断已清除，AI 评审结果仍由你判断' : aiReviewIsStale ? '草稿变化后需要重新评审' : `还有 ${localReviewBlockers.length} 个本地阻断问题`], ['manualReviewed', '人工已通读', '内容自然、下一步清楚、可以发布']] as Array<[keyof ContentPreflight, string, string]>).map(([key, label, note]) => { const disabled = Boolean(activeVariant.lockedAt) || key === 'reviewConfirmed' && !reviewReady; return <label key={key} className={`${activeVariant.preflight[key] ? 'done' : ''} ${disabled ? 'disabled' : ''}`}><input type="checkbox" disabled={disabled} checked={activeVariant.preflight[key]} onChange={(event) => updateVariant((variant) => ({ ...variant, preflight: { ...variant.preflight, [key]: event.target.checked } }))} /><span><Check size={13} /></span><b>{label}</b><small>{note}</small></label> })}
            </div><div className="content-final-actions"><button className="button button-secondary" type="button" onClick={() => void copyFinal()} disabled={!activeVariant.body}><Clipboard size={15} />复制当前内容</button><button className={`button ${activeVariant.lockedAt ? 'button-secondary' : 'button-primary'}`} type="button" onClick={toggleLock} disabled={!activeVariant.lockedAt && !canLock}>{activeVariant.lockedAt ? <Unlock size={15} /> : <Lock size={15} />}{activeVariant.lockedAt ? '解除锁定' : '锁定最终版本'}</button>{activeVariant.lockedAt && <button className="button button-primary" type="button" onClick={() => onOpenChannel(activeVariant.channelId)}>进入{channelById(activeVariant.channelId).shortLabel}手工发布<ArrowRight size={15} /></button>}</div></div>

            <ContentLearningPanel task={activeTask} variant={activeVariant} opportunity={activeOpportunity} performance={performanceByOpportunity[activeTask.opportunityId] || []} learning={activeLearning} aiSettings={aiSettings} aiSecrets={aiSecrets} onChange={saveLearning} onRemove={removeLearning} onToast={onToast} onOpenAIService={onOpenAIService} onOfficialUsage={onOfficialUsage} />

            {activeVariant.versions.length > 0 && <details className="content-version-history"><summary><History size={14} />历史版本 <span>{activeVariant.versions.length}</span></summary><div>{activeVariant.versions.map((version) => <article key={version.id}><div><strong>{version.reason}</strong><small>{formatTime(version.createdAt)} · {version.body.length} 字</small></div><button className="text-button" type="button" onClick={() => restoreVersion(version)}>恢复此版</button></article>)}</div></details>}
          </>}
        </div>
      </div>}
    </div>}
  </section>
}
