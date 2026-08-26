import { useState } from 'react'
import { AlertTriangle, BarChart3, BookOpenCheck, Check, LoaderCircle, RotateCcw, Sparkles, Trash2 } from 'lucide-react'
import { generateWithConfiguredService } from './ai-generation'
import type { AISecretStatus, AIServiceSettings } from './ai-service'
import { channelById } from './channels'
import { contentDraftFingerprint } from './content-review'
import type { ContentTask, ContentVariant } from './content-production'
import type { GeneratedTopicCandidate, OpportunityChannelPerformance } from './topic-research'

export type ContentLearningStatus = '待确认' | '已采用'

export type ContentLearningRecord = {
  id: string
  taskId: string
  variantId: string
  opportunityId: string
  channelId: ContentVariant['channelId']
  executionItemId: string
  decision: string
  summary: string
  keepRules: string[]
  changeRules: string[]
  avoidRules: string[]
  nextGenerationRules: string[]
  caveats: string[]
  note: string
  status: ContentLearningStatus
  service: 'official' | 'custom'
  draftFingerprint: string
  resultFingerprint: string
  createdAt: string
  adoptedAt: string
}

function clean(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function cleanList(value: unknown, maxItems = 10) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').map((item) => clean(item, 600)).filter(Boolean).slice(0, maxItems) : []
}

function createId() {
  return `content-learning-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function contentLearningResultFingerprint(decision: string, performance: OpportunityChannelPerformance[]) {
  const text = JSON.stringify({ decision, performance: performance.map((item) => ({ channelId: item.channelId, itemId: item.itemId, stage: item.stage, executed: item.executed, reach: item.reach, interactions: item.interactions, platformInquiries: item.platformInquiries, registeredLeads: item.registeredLeads, qualifiedLeads: item.qualifiedLeads, customers: item.customers })) })
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

export function normalizeContentLearnings(value: unknown): ContentLearningRecord[] {
  if (!Array.isArray(value)) return []
  return value.filter((item) => item && typeof item === 'object').map((item) => {
    const raw = item as Partial<ContentLearningRecord>
    return {
      id: clean(raw.id, 120) || createId(),
      taskId: clean(raw.taskId, 120),
      variantId: clean(raw.variantId, 120),
      opportunityId: clean(raw.opportunityId, 120),
      channelId: raw.channelId || 'douyin',
      executionItemId: clean(raw.executionItemId, 120),
      decision: clean(raw.decision, 60),
      summary: clean(raw.summary, 1200),
      keepRules: cleanList(raw.keepRules),
      changeRules: cleanList(raw.changeRules),
      avoidRules: cleanList(raw.avoidRules),
      nextGenerationRules: cleanList(raw.nextGenerationRules, 12),
      caveats: cleanList(raw.caveats),
      note: clean(raw.note, 2000),
      status: raw.status === '已采用' ? '已采用' as const : '待确认' as const,
      service: raw.service === 'custom' ? 'custom' as const : 'official' as const,
      draftFingerprint: clean(raw.draftFingerprint, 120),
      resultFingerprint: clean(raw.resultFingerprint, 120),
      createdAt: clean(raw.createdAt, 60) || new Date().toISOString(),
      adoptedAt: clean(raw.adoptedAt, 60),
    }
  }).filter((item) => item.taskId && item.variantId && item.summary).slice(0, 200)
}

function learningFromOutput(output: unknown, context: { task: ContentTask; variant: ContentVariant; decision: string; service: 'official' | 'custom'; resultFingerprint: string }): ContentLearningRecord | null {
  const raw = output && typeof output === 'object' && 'learning' in output && (output as { learning?: unknown }).learning && typeof (output as { learning: unknown }).learning === 'object'
    ? (output as { learning: Record<string, unknown> }).learning
    : output && typeof output === 'object' ? output as Record<string, unknown> : {}
  const record: ContentLearningRecord = {
    id: createId(),
    taskId: context.task.id,
    variantId: context.variant.id,
    opportunityId: context.task.opportunityId,
    channelId: context.variant.channelId,
    executionItemId: context.variant.executionItemId,
    decision: context.decision,
    summary: clean(raw.summary, 1200),
    keepRules: cleanList(raw.keepRules),
    changeRules: cleanList(raw.changeRules),
    avoidRules: cleanList(raw.avoidRules),
    nextGenerationRules: cleanList(raw.nextGenerationRules, 12),
    caveats: cleanList(raw.caveats),
    note: '',
    status: '待确认',
    service: context.service,
    draftFingerprint: contentDraftFingerprint(context.variant),
    resultFingerprint: context.resultFingerprint,
    createdAt: new Date().toISOString(),
    adoptedAt: '',
  }
  return record.summary && record.nextGenerationRules.length ? record : null
}

function LearningList({ title, items }: { title: string; items: string[] }) {
  return <div><strong>{title}</strong>{items.length ? items.map((item, index) => <p key={`${item}-${index}`}>{item}</p>) : <p>本轮没有形成这一类规则。</p>}</div>
}

export function ContentLearningPanel({ task, variant, opportunity, performance, learning, aiSettings, aiSecrets, onChange, onRemove, onToast, onOpenAIService, onOfficialUsage }: { task: ContentTask; variant: ContentVariant; opportunity?: GeneratedTopicCandidate; performance: OpportunityChannelPerformance[]; learning?: ContentLearningRecord; aiSettings: AIServiceSettings; aiSecrets: AISecretStatus; onChange: (learning: ContentLearningRecord) => void; onRemove: () => void; onToast: (message: string) => void; onOpenAIService: () => void; onOfficialUsage: (usage: { pointsCharged: number; balanceAfter: number }) => void }) {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const channelPerformance = performance.filter((item) => item.channelId === variant.channelId && item.itemId === variant.executionItemId)
  const totals = channelPerformance.reduce((summary, item) => ({ reach: summary.reach + item.reach, interactions: summary.interactions + item.interactions, inquiries: summary.inquiries + item.platformInquiries, leads: summary.leads + item.registeredLeads, qualified: summary.qualified + item.qualifiedLeads, customers: summary.customers + item.customers }), { reach: 0, interactions: 0, inquiries: 0, leads: 0, qualified: 0, customers: 0 })
  const hasObservedResult = channelPerformance.some((item) => item.executed || item.reach || item.interactions || item.platformInquiries || item.registeredLeads || item.qualifiedLeads || item.customers)
  const decision = opportunity?.reviewDecision || ''
  const currentResultFingerprint = contentLearningResultFingerprint(decision, channelPerformance)
  const stale = Boolean(learning && (learning.executionItemId !== variant.executionItemId || learning.resultFingerprint !== currentResultFingerprint))
  const configured = aiSettings.mode === 'official' ? Boolean(aiSettings.officialWorkspaceId && aiSecrets.officialTokenSaved) : Boolean(aiSettings.customBaseUrl && aiSettings.customModel && aiSecrets.customApiKeySaved)
  const readyReason = !variant.lockedAt ? '锁定最终版本后，才能判断实际发布的是哪一版。' : !variant.executionItemId ? `先把这份内容关联到一个${channelById(variant.channelId).shortLabel}渠道任务。` : !hasObservedResult ? `等待关联的${channelById(variant.channelId).shortLabel}任务记录发布或执行结果。` : !decision ? '结果已经回流，请先在获客机会中选择“继续投入、调整后再试或停止投入”。' : ''

  const generateLearning = async () => {
    if (readyReason) {
      setError(readyReason)
      return
    }
    if (!configured) {
      setError('请先配置 AI 服务。')
      onOpenAIService()
      return
    }
    setGenerating(true)
    setError('')
    try {
      const response = await generateWithConfiguredService(aiSettings, aiSecrets, {
        task: 'content_learning',
        payload: {
          brief: { title: task.title, targetCustomer: task.targetCustomer, buyerStage: task.buyerStage, objective: task.objective, audienceGain: task.audienceGain, coreClaim: task.coreClaim, proofPlan: task.proofPlan },
          channel: { id: variant.channelId, name: channelById(variant.channelId).shortLabel },
          finalDraft: { title: variant.title, hook: variant.hook, outline: variant.outline, body: variant.body, callToAction: variant.callToAction, coverCopy: variant.coverCopy, visualPlan: variant.visualPlan },
          finalReview: variant.qualityReview.aiReview,
          humanDecision: decision,
          observedResults: channelPerformance,
        },
      })
      if (!response.ok || !response.service) {
        setError(response.message || '本次学习分析失败。')
        return
      }
      const record = learningFromOutput(response.output, { task, variant, decision, service: response.service, resultFingerprint: currentResultFingerprint })
      if (!record) {
        setError('模型没有返回可采用的学习规则，请重试或更换模型。')
        return
      }
      onChange({ ...record, id: learning?.id || record.id, note: learning?.note || '' })
      if (response.usage) {
        onOfficialUsage(response.usage)
        onToast(`学习建议已生成，消耗 ${response.usage.pointsCharged} 积分`)
      } else {
        onToast('已用自有 AI 服务生成学习建议')
      }
    } catch {
      setError('学习分析失败，请检查网络或 AI 服务配置。')
    } finally {
      setGenerating(false)
    }
  }

  const adoptLearning = () => {
    if (!learning || stale) return
    onChange({ ...learning, status: '已采用', adoptedAt: new Date().toISOString() })
    onToast('这组规则会用于后续同渠道内容生成')
  }

  const suspendLearning = () => {
    if (!learning) return
    onChange({ ...learning, status: '待确认', adoptedAt: '' })
    onToast('已停止在后续生成中使用这组规则')
  }

  return <div className="content-learning-panel">
    <div className="content-learning-head"><div><BookOpenCheck size={16} /><div><strong>持续学习</strong><small>只从与这份最终稿关联的渠道任务结果中提炼下次规则，不把单次结果当成行业规律。</small></div></div><span className={learning?.status === '已采用' && !stale ? 'active' : ''}>{learning?.status === '已采用' && !stale ? '已用于后续生成' : '等待人工采用'}</span></div>
    <div className="content-learning-metrics"><span><b>{totals.reach}</b>曝光 / 到场</span><span><b>{totals.inquiries}</b>咨询</span><span><b>{totals.qualified}</b>有效线索</span><span><b>{totals.customers}</b>成交</span><span><b>{decision || '未复盘'}</b>本轮结论</span></div>
    <div className="content-learning-action"><div><BarChart3 size={15} /><div><strong>{readyReason ? '还不能形成学习规则' : '可以分析本轮真实结果'}</strong><p>{readyReason || 'AI 只负责整理假设，最终是否用于下一次生成由你确认。'}</p></div></div><button className="button button-secondary small" type="button" disabled={Boolean(readyReason) || generating} onClick={() => void generateLearning()}>{generating ? <LoaderCircle className="spin" size={13} /> : learning ? <RotateCcw size={13} /> : <Sparkles size={13} />}{generating ? '正在分析' : learning ? '重新分析' : '生成学习建议'}</button></div>
    {error && <div className="service-error content-error"><AlertTriangle size={14} />{error}</div>}
    {learning && <div className={`content-learning-result ${stale ? 'stale' : ''}`}>
      <div className="content-learning-summary"><div><span>{stale ? '内容或结果已变化' : learning.status}</span><strong>{learning.summary}</strong><small>{learning.service === 'official' ? '官方积分分析' : '自有 API 分析'} · 基于当前渠道结果</small></div><button className="icon-button small" type="button" title="移除学习记录" aria-label="移除学习记录" onClick={onRemove}><Trash2 size={13} /></button></div>
      {stale && <div className="content-learning-warning"><AlertTriangle size={14} />最终稿、复盘结论或渠道结果已经变化，请重新分析后再采用。</div>}
      <div className="content-learning-rules"><LearningList title="继续保留" items={learning.keepRules} /><LearningList title="下次调整" items={learning.changeRules} /><LearningList title="明确避免" items={learning.avoidRules} /><LearningList title="下次生成规则" items={learning.nextGenerationRules} /></div>
      {learning.caveats.length > 0 && <div className="content-learning-caveats"><AlertTriangle size={14} /><div><strong>解释边界</strong>{learning.caveats.map((item, index) => <p key={`${item}-${index}`}>{item}</p>)}</div></div>}
      <label className="field content-learning-note"><span>人工补充</span><textarea rows={3} value={learning.note} onChange={(event) => onChange({ ...learning, note: event.target.value.slice(0, 2000) })} placeholder="记录本地情况、客户反馈或本轮不能由数据解释的原因" /></label>
      <div className="content-learning-footer"><small>采用后，仅向同渠道的后续草稿和候选优化稿提供这些本地规则。</small>{learning.status === '已采用' && !stale ? <button className="button button-secondary small" type="button" onClick={suspendLearning}>停止使用</button> : <button className="button button-primary small" type="button" disabled={stale} onClick={adoptLearning}><Check size={13} />采用到后续生成</button>}</div>
    </div>}
  </div>
}
