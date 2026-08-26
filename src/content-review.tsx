import { useMemo, useState } from 'react'
import { AlertTriangle, Check, CircleAlert, CircleCheckBig, FileCheck2, Gauge, LoaderCircle, ShieldCheck, Sparkles, Trash2 } from 'lucide-react'
import { generateWithConfiguredService } from './ai-generation'
import type { AISecretStatus, AIServiceSettings } from './ai-service'
import { channelById } from './channels'
import type { ContentTask, ContentVariant } from './content-production'
import type { ResearchEvidence } from './topic-research'
import { evaluateIndustryContentRules, industryRulePayload, type IndustryRulePack } from './industry-rules'

export type ContentReviewSeverity = '阻断' | '重要' | '建议'
export type ContentReviewVerdict = '可以进入人工确认' | '修改后再确认' | '不建议发布'
export type ContentReviewDimensionId = 'customerRelevance' | 'contentValue' | 'evidenceSupport' | 'specificity' | 'channelFit' | 'conversionClarity' | 'executionReadiness'

export type ContentRuleCheck = {
  id: string
  label: string
  status: '通过' | '提醒' | '阻断'
  message: string
  suggestion: string
}

export type ContentReviewDimension = {
  id: ContentReviewDimensionId
  score: number
  reason: string
}

export type AIContentReviewIssue = {
  severity: ContentReviewSeverity
  location: string
  problem: string
  suggestion: string
  evidenceIds: string[]
}

export type AIContentReview = {
  score: number
  verdict: ContentReviewVerdict
  summary: string
  dimensions: ContentReviewDimension[]
  strengths: string[]
  issues: AIContentReviewIssue[]
  service: 'official' | 'custom'
  reviewedAt: string
  draftFingerprint: string
}

export type ContentRevisionProposal = {
  summary: string
  changes: string[]
  unresolved: string[]
  draft: {
    title: string
    hook: string
    outline: string
    body: string
    callToAction: string
    coverCopy: string
    visualPlan: string
    claimChecks: Array<{ statement: string; evidenceId: string; risk: string }>
  }
  service: 'official' | 'custom'
  generatedAt: string
  sourceFingerprint: string
}

export type ContentQualityReview = {
  aiReview: AIContentReview | null
  revision: ContentRevisionProposal | null
}

export const emptyContentQualityReview: ContentQualityReview = { aiReview: null, revision: null }

const dimensionDefinitions: Array<{ id: ContentReviewDimensionId; label: string }> = [
  { id: 'customerRelevance', label: '客户相关性' },
  { id: 'contentValue', label: '内容价值' },
  { id: 'evidenceSupport', label: '证据支撑' },
  { id: 'specificity', label: '具体程度' },
  { id: 'channelFit', label: '渠道适配' },
  { id: 'conversionClarity', label: '转化清晰度' },
  { id: 'executionReadiness', label: '执行可行性' },
]

const dimensionIds = dimensionDefinitions.map((item) => item.id)
const placeholderPatterns = [/待补充/i, /待确认/i, /待完善/i, /xxx/i, /示例内容/i, /这里填写/i, /请输入/i]
const absolutePromisePatterns = [/百分百/i, /100%/i, /绝对不会/i, /保证有效/i, /保证成交/i, /保证安装/i, /零风险/i, /永久有效/i, /全网最低/i, /行业第一/i]
const vagueMarketingTerms = ['品质保障', '值得信赖', '一站式服务', '专业团队', '行业领先', '高端品质', '极致体验', '超高性价比']
const actionTerms = ['私信', '评论', '加微信', '添加微信', '电话', '预约', '到店', '扫码', '填写', '领取', '报名', '咨询']

function clean(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function clampScore(value: unknown) {
  const score = Number(value)
  return Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0
}

function fingerprintText(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

export function contentDraftFingerprint(variant: Pick<ContentVariant, 'title' | 'hook' | 'outline' | 'body' | 'callToAction' | 'coverCopy' | 'visualPlan'>) {
  return fingerprintText([variant.title, variant.hook, variant.outline, variant.body, variant.callToAction, variant.coverCopy, variant.visualPlan].join('\n---\n'))
}

export function normalizeContentQualityReview(value: unknown): ContentQualityReview {
  if (!value || typeof value !== 'object') return emptyContentQualityReview
  const raw = value as Partial<ContentQualityReview>
  const rawReview = raw.aiReview
  const aiReview = rawReview && typeof rawReview === 'object' ? (() => {
    const service = rawReview.service === 'custom' ? 'custom' as const : 'official' as const
    const verdict: ContentReviewVerdict = rawReview.verdict === '可以进入人工确认' || rawReview.verdict === '不建议发布' ? rawReview.verdict : '修改后再确认'
    const dimensions = Array.isArray(rawReview.dimensions) ? rawReview.dimensions.filter((item) => item && typeof item === 'object' && dimensionIds.includes(item.id as ContentReviewDimensionId)).map((item) => ({
      id: item.id as ContentReviewDimensionId,
      score: clampScore(item.score),
      reason: clean(item.reason, 600),
    })).slice(0, 7) : []
    const issues = Array.isArray(rawReview.issues) ? rawReview.issues.filter((item) => item && typeof item === 'object').map((item) => ({
      severity: (item.severity === '阻断' || item.severity === '建议' ? item.severity : '重要') as ContentReviewSeverity,
      location: clean(item.location, 120),
      problem: clean(item.problem, 800),
      suggestion: clean(item.suggestion, 1000),
      evidenceIds: Array.isArray(item.evidenceIds) ? item.evidenceIds.filter((id): id is string => typeof id === 'string').slice(0, 8) : [],
    })).filter((item) => item.problem).slice(0, 16) : []
    return {
      score: clampScore(rawReview.score),
      verdict,
      summary: clean(rawReview.summary, 1000),
      dimensions,
      strengths: Array.isArray(rawReview.strengths) ? rawReview.strengths.filter((item): item is string => typeof item === 'string').map((item) => item.trim().slice(0, 500)).filter(Boolean).slice(0, 8) : [],
      issues,
      service,
      reviewedAt: clean(rawReview.reviewedAt, 60) || new Date().toISOString(),
      draftFingerprint: clean(rawReview.draftFingerprint, 120),
    }
  })() : null
  const rawRevision = raw.revision
  const revision = rawRevision && typeof rawRevision === 'object' && rawRevision.draft && typeof rawRevision.draft === 'object' ? {
    summary: clean(rawRevision.summary, 1200),
    changes: Array.isArray(rawRevision.changes) ? rawRevision.changes.filter((item): item is string => typeof item === 'string').map((item) => clean(item, 600)).filter(Boolean).slice(0, 12) : [],
    unresolved: Array.isArray(rawRevision.unresolved) ? rawRevision.unresolved.filter((item): item is string => typeof item === 'string').map((item) => clean(item, 600)).filter(Boolean).slice(0, 12) : [],
    draft: {
      title: clean(rawRevision.draft.title, 200),
      hook: clean(rawRevision.draft.hook, 800),
      outline: Array.isArray(rawRevision.draft.outline) ? rawRevision.draft.outline.filter((item): item is string => typeof item === 'string').join('\n').slice(0, 5000) : clean(rawRevision.draft.outline, 5000),
      body: clean(rawRevision.draft.body, 30000),
      callToAction: clean(rawRevision.draft.callToAction, 1000),
      coverCopy: clean(rawRevision.draft.coverCopy, 500),
      visualPlan: Array.isArray(rawRevision.draft.visualPlan) ? rawRevision.draft.visualPlan.filter((item): item is string => typeof item === 'string').join('\n').slice(0, 8000) : clean(rawRevision.draft.visualPlan, 8000),
      claimChecks: Array.isArray(rawRevision.draft.claimChecks) ? rawRevision.draft.claimChecks.filter((item) => item && typeof item === 'object').map((item) => ({ statement: clean(item.statement, 500), evidenceId: clean(item.evidenceId, 120), risk: clean(item.risk, 500) })).filter((item) => item.statement).slice(0, 12) : [],
    },
    service: rawRevision.service === 'custom' ? 'custom' as const : 'official' as const,
    generatedAt: clean(rawRevision.generatedAt, 60) || new Date().toISOString(),
    sourceFingerprint: clean(rawRevision.sourceFingerprint, 120),
  } : null
  return {
    aiReview,
    revision,
  }
}

function lineCount(value: string) {
  return value.split(/\n+/).map((item) => item.trim()).filter(Boolean).length
}

function uniqueActions(value: string) {
  return actionTerms.filter((term) => value.includes(term))
}

export function evaluateContentRules(task: ContentTask, variant: ContentVariant, evidence: ResearchEvidence[], industryPack?: IndustryRulePack): ContentRuleCheck[] {
  const fullDraft = [variant.title, variant.hook, variant.outline, variant.body, variant.callToAction, variant.coverCopy, variant.visualPlan].join('\n')
  const selectedEvidence = evidence.filter((item) => task.evidenceIds.includes(item.id))
  const validClaimLinks = variant.claimChecks.filter((claim) => selectedEvidence.some((item) => item.id === claim.evidenceId)).length
  const placeholders = placeholderPatterns.filter((pattern) => pattern.test(fullDraft))
  const absolutePromises = absolutePromisePatterns.filter((pattern) => pattern.test(fullDraft))
  const vagueTerms = vagueMarketingTerms.filter((term) => fullDraft.includes(term))
  const actions = uniqueActions(variant.callToAction)
  const bodyLength = variant.body.replace(/\s+/g, '').length
  const visualLines = lineCount(variant.visualPlan)

  const baseChecks: ContentRuleCheck[] = [
    { id: 'body', label: '正文完整', status: bodyLength >= 100 ? '通过' : bodyLength ? '提醒' : '阻断', message: bodyLength >= 100 ? `正文已有 ${bodyLength} 字。` : bodyLength ? `正文只有 ${bodyLength} 字，可能无法讲清问题和证明。` : '还没有正文或脚本。', suggestion: '至少讲清客户问题、判断方法、真实证明和下一步。' },
    { id: 'evidence', label: '来源可追溯', status: selectedEvidence.length ? '通过' : '阻断', message: selectedEvidence.length ? `已关联 ${selectedEvidence.length} 条真实来源。` : '没有可追溯的真实来源。', suggestion: '返回获客机会研究，选择与本条内容直接相关的来源。' },
    { id: 'proof', label: '证明方案', status: task.proofPlan.trim() && task.assetRequirements.trim() ? '通过' : '阻断', message: task.proofPlan.trim() && task.assetRequirements.trim() ? '已经写明证明方式和真实素材。' : '证明方式或真实素材要求不完整。', suggestion: '说明每个关键观点由什么实拍、案例、数据或专业依据证明。' },
    { id: 'placeholders', label: '没有占位内容', status: placeholders.length ? '阻断' : '通过', message: placeholders.length ? '草稿仍包含“待补充、XXX、示例内容”等占位文字。' : '没有发现常见占位文字。', suggestion: '发布前替换为真实信息，无法确认的内容应删除。' },
    { id: 'promises', label: '没有绝对承诺', status: absolutePromises.length ? '阻断' : '通过', message: absolutePromises.length ? '发现百分百、保证、零风险或行业第一等高风险承诺。' : '没有发现常见绝对化承诺。', suggestion: '改为适用条件、经验判断或需要现场确认的准确表达。' },
    { id: 'cta', label: '承接动作单一', status: !variant.callToAction.trim() ? '阻断' : actions.length > 2 ? '提醒' : '通过', message: !variant.callToAction.trim() ? '没有告诉客户下一步做什么。' : actions.length > 2 ? `检测到多个动作：${actions.join('、')}。` : '客户下一步清楚且相对集中。', suggestion: '每条内容只保留一个主要动作，其他动作作为补充说明。' },
    { id: 'visuals', label: '素材安排可执行', status: visualLines >= 3 ? '通过' : variant.visualPlan.trim() ? '提醒' : '阻断', message: visualLines >= 3 ? `已安排 ${visualLines} 个画面或素材节点。` : variant.visualPlan.trim() ? '画面或素材安排较少，可能无法支撑正文。' : '没有画面或素材安排。', suggestion: '逐行写清使用什么真实素材，以及它要证明哪句话。' },
    { id: 'claims', label: '事实核对可追踪', status: !variant.claimChecks.length || validClaimLinks === variant.claimChecks.length ? '通过' : '提醒', message: !variant.claimChecks.length ? '没有单独列出的高风险事实项。' : validClaimLinks === variant.claimChecks.length ? `${validClaimLinks} 个事实核对项都关联了来源。` : `${variant.claimChecks.length - validClaimLinks} 个事实核对项没有关联当前来源。`, suggestion: '为事实、数字、案例和效果表述关联来源，或删除无法证明的说法。' },
    { id: 'specificity', label: '避免营销空话', status: vagueTerms.length >= 3 ? '提醒' : '通过', message: vagueTerms.length >= 3 ? `发现较多泛化表达：${vagueTerms.join('、')}。` : '没有发现大量常见营销套话。', suggestion: '用具体场景、步骤、判断标准和真实证明替代抽象形容词。' },
  ]
  return [...baseChecks, ...evaluateIndustryContentRules(industryPack, fullDraft, task.proofPlan, task.assetRequirements)]
}

export function contentRuleScore(checks: ContentRuleCheck[]) {
  const penalty = checks.reduce((sum, check) => sum + (check.status === '阻断' ? 18 : check.status === '提醒' ? 7 : 0), 0)
  return Math.max(0, 100 - penalty)
}

function reviewFromOutput(output: unknown, service: 'official' | 'custom', fingerprint: string): AIContentReview | null {
  const raw = output && typeof output === 'object' && 'review' in output && (output as { review?: unknown }).review && typeof (output as { review: unknown }).review === 'object'
    ? (output as { review: Record<string, unknown> }).review
    : output && typeof output === 'object' ? output as Record<string, unknown> : {}
  const normalized = normalizeContentQualityReview({ aiReview: { ...raw, service, reviewedAt: new Date().toISOString(), draftFingerprint: fingerprint } })
  return normalized.aiReview
}

function revisionFromOutput(output: unknown, service: 'official' | 'custom', fingerprint: string): ContentRevisionProposal | null {
  const raw = output && typeof output === 'object' && 'revision' in output && (output as { revision?: unknown }).revision && typeof (output as { revision: unknown }).revision === 'object'
    ? (output as { revision: Record<string, unknown> }).revision
    : output && typeof output === 'object' ? output as Record<string, unknown> : {}
  const normalized = normalizeContentQualityReview({ revision: { ...raw, service, generatedAt: new Date().toISOString(), sourceFingerprint: fingerprint } })
  return normalized.revision
}

function dimensionLabel(id: ContentReviewDimensionId) {
  return dimensionDefinitions.find((item) => item.id === id)?.label || id
}

function reviewTone(verdict: ContentReviewVerdict) {
  if (verdict === '可以进入人工确认') return 'ready'
  if (verdict === '不建议发布') return 'blocked'
  return 'review'
}

export function ContentReviewPanel({ task, variant, evidence, industryPack, aiSettings, aiSecrets, channelGuidance, validatedLearnings, onUpdateVariant, onApplyRevision, onToast, onOpenAIService, onOfficialUsage }: { task: ContentTask; variant: ContentVariant; evidence: ResearchEvidence[]; industryPack?: IndustryRulePack; aiSettings: AIServiceSettings; aiSecrets: AISecretStatus; channelGuidance: string; validatedLearnings: Array<{ decision: string; summary: string; keepRules: string[]; changeRules: string[]; avoidRules: string[]; nextGenerationRules: string[] }>; onUpdateVariant: (updater: (variant: ContentVariant) => ContentVariant) => void; onApplyRevision: (revision: ContentRevisionProposal) => void; onToast: (message: string) => void; onOpenAIService: () => void; onOfficialUsage: (usage: { pointsCharged: number; balanceAfter: number }) => void }) {
  const [reviewing, setReviewing] = useState(false)
  const [revising, setRevising] = useState(false)
  const [error, setError] = useState('')
  const localChecks = useMemo(() => evaluateContentRules(task, variant, evidence, industryPack), [task, variant, evidence, industryPack])
  const localScore = contentRuleScore(localChecks)
  const blockers = localChecks.filter((item) => item.status === '阻断')
  const warnings = localChecks.filter((item) => item.status === '提醒')
  const fingerprint = contentDraftFingerprint(variant)
  const aiReview = variant.qualityReview.aiReview
  const revision = variant.qualityReview.revision
  const reviewIsStale = Boolean(aiReview && aiReview.draftFingerprint !== fingerprint)
  const revisionIsStale = Boolean(revision && revision.sourceFingerprint !== fingerprint)
  const configured = aiSettings.mode === 'official' ? Boolean(aiSettings.officialWorkspaceId && aiSecrets.officialTokenSaved) : Boolean(aiSettings.customBaseUrl && aiSettings.customModel && aiSecrets.customApiKeySaved)

  const runAIReview = async () => {
    if (!variant.body.trim()) {
      setError('先完成正文或脚本，再进行 AI 深度评审。')
      return
    }
    if (!configured) {
      setError('请先配置 AI 服务。')
      onOpenAIService()
      return
    }
    const selectedEvidence = evidence.filter((item) => task.evidenceIds.includes(item.id))
    setReviewing(true)
    setError('')
    try {
      const response = await generateWithConfiguredService(aiSettings, aiSecrets, {
        task: 'content_review',
        payload: {
          brief: { title: task.title, targetCustomer: task.targetCustomer, buyerStage: task.buyerStage, objective: task.objective, audienceGain: task.audienceGain, coreClaim: task.coreClaim, proofPlan: task.proofPlan, assetRequirements: task.assetRequirements },
          industryRules: industryRulePayload(industryPack),
          channel: { id: variant.channelId, name: channelById(variant.channelId).shortLabel },
          evidence: selectedEvidence.map((item) => ({ id: item.id, title: item.title, summary: item.summary, publishedDate: item.publishedDate })),
          draft: { title: variant.title, hook: variant.hook, outline: variant.outline, body: variant.body, callToAction: variant.callToAction, coverCopy: variant.coverCopy, visualPlan: variant.visualPlan },
          deterministicChecks: localChecks,
        },
      })
      if (!response.ok || !response.service) {
        setError(response.message || '本次评审失败。')
        return
      }
      const review = reviewFromOutput(response.output, response.service, fingerprint)
      if (!review || !review.summary || !review.dimensions.length) {
        setError('模型没有返回完整的评审结果，请重试或更换模型。')
        return
      }
      onUpdateVariant((current) => ({ ...current, qualityReview: { aiReview: review, revision: null }, preflight: { ...current.preflight, reviewConfirmed: false, manualReviewed: false } }))
      if (response.usage) {
        onOfficialUsage(response.usage)
        onToast(`内容深度评审已完成，消耗 ${response.usage.pointsCharged} 积分`)
      } else {
        onToast('已用自有 AI 服务完成内容深度评审')
      }
    } catch {
      setError('评审失败，请检查网络或 AI 服务配置。')
    } finally {
      setReviewing(false)
    }
  }

  const generateRevision = async () => {
    if (!aiReview || reviewIsStale) {
      setError('先对当前草稿完成一次最新的 AI 深度评审。')
      return
    }
    if (!configured) {
      setError('请先配置 AI 服务。')
      onOpenAIService()
      return
    }
    const selectedEvidence = evidence.filter((item) => task.evidenceIds.includes(item.id))
    setRevising(true)
    setError('')
    try {
      const response = await generateWithConfiguredService(aiSettings, aiSecrets, {
        task: 'content_revision',
        payload: {
          brief: { title: task.title, targetCustomer: task.targetCustomer, buyerStage: task.buyerStage, objective: task.objective, audienceGain: task.audienceGain, coreClaim: task.coreClaim, proofPlan: task.proofPlan, assetRequirements: task.assetRequirements },
          industryRules: industryRulePayload(industryPack),
          channel: { id: variant.channelId, name: channelById(variant.channelId).shortLabel, guidance: channelGuidance },
          evidence: selectedEvidence.map((item) => ({ id: item.id, title: item.title, summary: item.summary, publishedDate: item.publishedDate })),
          currentDraft: { title: variant.title, hook: variant.hook, outline: variant.outline, body: variant.body, callToAction: variant.callToAction, coverCopy: variant.coverCopy, visualPlan: variant.visualPlan, claimChecks: variant.claimChecks },
          review: aiReview,
          validatedLearnings: validatedLearnings.slice(0, 8),
        },
      })
      if (!response.ok || !response.service) {
        setError(response.message || '本次优化失败。')
        return
      }
      const proposal = revisionFromOutput(response.output, response.service, fingerprint)
      if (!proposal || !proposal.summary || !proposal.draft.title || !proposal.draft.body || !proposal.changes.length) {
        setError('模型没有返回完整的候选优化稿，请重试或更换模型。')
        return
      }
      onUpdateVariant((current) => ({ ...current, qualityReview: { ...current.qualityReview, revision: proposal } }))
      if (response.usage) {
        onOfficialUsage(response.usage)
        onToast(`候选优化稿已生成，消耗 ${response.usage.pointsCharged} 积分`)
      } else {
        onToast('已用自有 AI 服务生成候选优化稿')
      }
    } catch {
      setError('优化失败，请检查网络或 AI 服务配置。')
    } finally {
      setRevising(false)
    }
  }

  return <div className="content-review-panel">
    <div className="content-review-head"><div><Gauge size={16} /><div><strong>内容体检</strong><small>本地规则负责硬门槛，AI 负责语义评审，结果不预测流量。</small></div></div><div className="content-review-score"><span>结构完整度</span><b>{localScore}</b></div></div>
    <div className="content-review-rule-summary"><span className={blockers.length ? 'blocked' : 'ready'}>{blockers.length ? <CircleAlert size={14} /> : <CircleCheckBig size={14} />}<b>{blockers.length ? `${blockers.length} 个阻断问题` : '本地硬门槛通过'}</b></span><span className={warnings.length ? 'review' : 'ready'}><AlertTriangle size={14} /><b>{warnings.length} 个改进提醒</b></span><small>本地检查不调用模型，也不消耗积分。</small></div>
    {(blockers.length > 0 || warnings.length > 0) && <div className="content-rule-findings">{[...blockers, ...warnings].map((item) => <article key={item.id} className={item.status === '阻断' ? 'blocked' : 'review'}><span>{item.status}</span><div><strong>{item.label}</strong><p>{item.message}</p><small>{item.suggestion}</small></div></article>)}</div>}
    <div className="content-ai-review-action"><div><Sparkles size={15} /><div><strong>AI 深度评审</strong><p>检查客户相关性、内容价值、证据支撑、具体程度、渠道表达、转化动作和执行可行性。</p></div></div><button className="button button-secondary small" type="button" disabled={reviewing || Boolean(variant.lockedAt)} onClick={() => void runAIReview()}>{reviewing ? <LoaderCircle className="spin" size={13} /> : <Sparkles size={13} />}{reviewing ? '正在评审' : aiReview ? '重新评审' : '开始深度评审'}</button></div>
    {error && <div className="service-error content-error"><AlertTriangle size={14} />{error}</div>}
    {aiReview && <div className={`content-ai-review-result ${reviewIsStale ? 'stale' : ''}`}>
      <div className="content-ai-review-summary"><div><span className={reviewTone(aiReview.verdict)}>{reviewIsStale ? '内容已变化' : aiReview.verdict}</span><strong>{aiReview.summary}</strong><small>{aiReview.service === 'official' ? '官方积分评审' : '自有 API 评审'} · {new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(aiReview.reviewedAt))}</small></div><b>{aiReview.score}<small>/100</small></b></div>
      {reviewIsStale && <div className="content-review-stale"><AlertTriangle size={14} />草稿在上次评审后发生了变化，这份结果只能作为历史参考。重新评审后再确认。</div>}
      <div className="content-review-dimensions">{dimensionDefinitions.map((definition) => { const dimension = aiReview.dimensions.find((item) => item.id === definition.id); return <div key={definition.id}><span><b>{definition.label}</b><strong>{dimension?.score ?? 0}</strong></span><p>{dimension?.reason || '模型没有返回这一维度的说明。'}</p></div> })}</div>
      {aiReview.strengths.length > 0 && <div className="content-review-strengths"><div><Check size={14} /><strong>值得保留</strong></div>{aiReview.strengths.map((item, index) => <p key={`${item}-${index}`}>{item}</p>)}</div>}
      {aiReview.issues.length > 0 && <div className="content-review-issues"><div><ShieldCheck size={14} /><strong>需要处理</strong><span>{aiReview.issues.length}</span></div>{aiReview.issues.map((item, index) => <article key={`${item.problem}-${index}`} className={item.severity === '阻断' ? 'blocked' : item.severity === '重要' ? 'important' : 'suggestion'}><span>{item.severity}</span><div><strong>{item.location || '整篇内容'}</strong><p>{item.problem}</p><small>{item.suggestion}</small>{item.evidenceIds.length > 0 && <div>{item.evidenceIds.map((id) => { const source = evidence.find((evidenceItem) => evidenceItem.id === id); return source ? <b key={id}>{source.title}</b> : null })}</div>}</div></article>)}</div>}
      <div className="content-revision-action"><div><FileCheck2 size={15} /><div><strong>候选优化稿</strong><p>只针对本次评审问题改稿，保留有价值的部分；应用前由你检查，不会自动覆盖。</p></div></div><button className="button button-secondary small" type="button" disabled={revising || reviewIsStale || Boolean(variant.lockedAt)} onClick={() => void generateRevision()}>{revising ? <LoaderCircle className="spin" size={13} /> : <FileCheck2 size={13} />}{revising ? '正在优化' : revision && !revisionIsStale ? '重新生成优化稿' : '生成候选优化稿'}</button></div>
      {revision && <div className={`content-revision-result ${revisionIsStale ? 'stale' : ''}`}>
        <div className="content-revision-summary"><div><span>{revisionIsStale ? '原草稿已变化' : '等待人工采用'}</span><strong>{revision.summary}</strong><small>{revision.service === 'official' ? '官方积分优化' : '自有 API 优化'} · {new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(revision.generatedAt))}</small></div><button className="icon-button small" type="button" title="移除候选优化稿" aria-label="移除候选优化稿" disabled={Boolean(variant.lockedAt)} onClick={() => onUpdateVariant((current) => ({ ...current, qualityReview: { ...current.qualityReview, revision: null } }))}><Trash2 size={13} /></button></div>
        {revisionIsStale && <div className="content-review-stale"><AlertTriangle size={14} />当前草稿已不是生成这份优化稿时的版本，请重新评审后再生成。</div>}
        <div className="content-revision-lists"><div><strong>准备修改</strong>{revision.changes.map((item, index) => <p key={`${item}-${index}`}>{item}</p>)}</div><div><strong>仍需人工补充</strong>{revision.unresolved.length ? revision.unresolved.map((item, index) => <p key={`${item}-${index}`}>{item}</p>) : <p>没有新增的人工补充项，仍需按发布前检查核实事实和素材。</p>}</div></div>
        <details className="content-revision-preview"><summary>查看候选成稿</summary><div><strong>{revision.draft.title}</strong>{revision.draft.hook && <p>{revision.draft.hook}</p>}<pre>{revision.draft.body}</pre><small>{revision.draft.callToAction}</small></div></details>
        <div className="content-revision-footer"><small>应用后会先保存当前版本，并要求对新稿重新评审。</small><button className="button button-primary small" type="button" disabled={revisionIsStale || Boolean(variant.lockedAt)} onClick={() => onApplyRevision(revision)}><Check size={13} />应用候选优化稿</button></div>
      </div>}
    </div>}
  </div>
}
