import type { ChannelId } from './channels'

export type IndustrySearchDirection = {
  id: string
  label: string
  hint: string
  intent: string
  terms: string[]
}

export type IndustryDemandSignal = {
  id: string
  label: string
  buyerStage: string
  priority: '高' | '中' | '低'
  keywords: string[]
  meaning: string
}

export type IndustryOpportunityRuleId = 'industryFit' | 'decisionIntent' | 'evidence' | 'proof' | 'conversion' | 'risk'

export type IndustryOpportunityRule = {
  id: IndustryOpportunityRuleId
  label: string
  weight: number
  description: string
}

export type IndustryEvidenceRule = {
  id: string
  claimType: string
  triggerTerms: string[]
  requiredEvidence: string[]
  missingAction: string
}

export type IndustryChannelRule = {
  channelId: ChannelId
  focus: string
  required: string[]
  avoid: string[]
}

export type IndustryRulePack = {
  id: string
  legacyIds?: string[]
  name: string
  industry: string
  version: string
  description: string
  taxonomy: {
    products: string[]
    services: string[]
    scenarios: string[]
  }
  searchDirections: IndustrySearchDirection[]
  demandSignals: IndustryDemandSignal[]
  sourceRules: {
    prioritize: string[]
    downgrade: string[]
    reject: string[]
  }
  opportunityRules: IndustryOpportunityRule[]
  evidenceRules: IndustryEvidenceRule[]
  productionRules: string[]
  boundaries: string[]
  prohibitedPhrases: string[]
  channelRules: IndustryChannelRule[]
}

export type IndustryOpportunityInput = {
  title: string
  customerQuestion: string
  targetCustomer: string
  buyerStage: string
  demandSignal: string
  contentAngle: string
  keyPromise: string
  proofNeeded: string
  callToAction: string
  riskNote: string
  evidenceIds: string[]
}

export type IndustryBriefInput = {
  offer: string
  targetCustomer: string
  serviceArea: string
  conversionGoal: string
  proofAssets: string
}

export type IndustryEvidenceInput = {
  id: string
  title: string
  summary: string
}

export type IndustryOpportunityEvaluation = {
  score: number
  label: '优先评估' | '需要补充' | '不建议直接制作'
  tone: 'ready' | 'review' | 'blocked'
  matchedSignals: string[]
  checks: Array<{ id: IndustryOpportunityRuleId; label: string; score: number; weight: number; reason: string }>
}

export type IndustryContentCheck = {
  id: string
  label: string
  status: '通过' | '提醒' | '阻断'
  message: string
  suggestion: string
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, '')
}

function containsAny(text: string, terms: string[]) {
  const normalized = normalizeText(text)
  return terms.some((term) => term && normalized.includes(normalizeText(term)))
}

function unique(items: string[]) {
  return [...new Set(items.filter(Boolean))]
}

export function industryRulePayload(pack?: IndustryRulePack) {
  if (!pack) return null
  return {
    id: pack.id,
    name: pack.name,
    industry: pack.industry,
    version: pack.version,
    taxonomy: pack.taxonomy,
    searchDirections: pack.searchDirections.map((item) => ({ label: item.label, intent: item.intent, terms: item.terms })),
    demandSignals: pack.demandSignals,
    sourceRules: pack.sourceRules,
    opportunityRules: pack.opportunityRules,
    evidenceRules: pack.evidenceRules,
    productionRules: pack.productionRules,
    boundaries: pack.boundaries,
    prohibitedPhrases: pack.prohibitedPhrases,
    channelRules: pack.channelRules,
  }
}

export function buildIndustrySearchQuery(pack: IndustryRulePack, directionId: string, brief: IndustryBriefInput) {
  const direction = pack.searchDirections.find((item) => item.id === directionId)
  if (!direction) return ''
  return unique([brief.serviceArea, brief.offer, brief.targetCustomer, ...direction.terms]).join(' ').replace(/\s+/g, ' ').trim()
}

export function evaluateOpportunityByIndustryRules(opportunity: IndustryOpportunityInput, brief: IndustryBriefInput, evidence: IndustryEvidenceInput[], pack: IndustryRulePack): IndustryOpportunityEvaluation {
  const matchedEvidence = evidence.filter((item) => opportunity.evidenceIds.includes(item.id))
  const fullText = [opportunity.title, opportunity.customerQuestion, opportunity.targetCustomer, opportunity.demandSignal, opportunity.contentAngle, opportunity.keyPromise, ...matchedEvidence.flatMap((item) => [item.title, item.summary])].join('\n')
  const industryTerms = [...pack.taxonomy.products, ...pack.taxonomy.services, ...pack.taxonomy.scenarios]
  const industryMatches = unique(industryTerms.filter((term) => containsAny(fullText, [term])))
  const matchedDemandSignals = pack.demandSignals.filter((signal) => containsAny(fullText, signal.keywords))
  const highIntentStage = ['方案比较', '准备购买'].includes(opportunity.buyerStage) || matchedDemandSignals.some((signal) => signal.priority === '高')
  const proofReady = Boolean(opportunity.proofNeeded.trim()) && Boolean(brief.proofAssets.trim())
  const conversionReady = Boolean(opportunity.callToAction.trim()) && Boolean(brief.conversionGoal.trim())
  const prohibited = pack.prohibitedPhrases.filter((phrase) => containsAny([opportunity.title, opportunity.keyPromise, opportunity.contentAngle].join('\n'), [phrase]))

  const rawScores: Record<IndustryOpportunityRuleId, { score: number; reason: string }> = {
    industryFit: {
      score: industryMatches.length >= 2 ? 100 : industryMatches.length === 1 ? 65 : 20,
      reason: industryMatches.length ? `匹配行业对象：${industryMatches.slice(0, 4).join('、')}` : '没有识别到明确的行业产品、服务或使用场景。',
    },
    decisionIntent: {
      score: highIntentStage ? 100 : matchedDemandSignals.length ? 70 : opportunity.demandSignal.trim() ? 45 : 15,
      reason: matchedDemandSignals.length ? `识别到需求信号：${matchedDemandSignals.map((item) => item.label).slice(0, 3).join('、')}` : '还没有识别到足够具体的购买或决策信号。',
    },
    evidence: {
      score: matchedEvidence.length >= 2 ? 100 : matchedEvidence.length === 1 ? 60 : 0,
      reason: matchedEvidence.length ? `可追溯到 ${matchedEvidence.length} 条当前来源。` : '没有关联当前保存的真实来源。',
    },
    proof: {
      score: proofReady ? 100 : opportunity.proofNeeded.trim() || brief.proofAssets.trim() ? 55 : 0,
      reason: proofReady ? '机会所需证明与商家现有真实素材都已说明。' : '机会所需证明或商家可提供素材仍不完整。',
    },
    conversion: {
      score: conversionReady ? 100 : opportunity.callToAction.trim() || brief.conversionGoal.trim() ? 50 : 0,
      reason: conversionReady ? '机会承接动作与本次获客目标都有明确输入。' : '本次客户下一步动作仍不完整。',
    },
    risk: {
      score: prohibited.length ? 0 : opportunity.riskNote.trim() ? 100 : 70,
      reason: prohibited.length ? `发现高风险表述：${prohibited.join('、')}` : opportunity.riskNote.trim() ? '已给出适用边界或风险提示。' : '未发现禁用表述，但仍需要补充适用边界。',
    },
  }

  const checks = pack.opportunityRules.map((rule) => ({ ...rule, ...rawScores[rule.id] }))
  const totalWeight = checks.reduce((sum, item) => sum + item.weight, 0) || 100
  const score = Math.round(checks.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight)
  const tone = score >= 80 ? 'ready' as const : score >= 60 ? 'review' as const : 'blocked' as const
  return {
    score,
    label: tone === 'ready' ? '优先评估' : tone === 'review' ? '需要补充' : '不建议直接制作',
    tone,
    matchedSignals: matchedDemandSignals.map((item) => item.label),
    checks,
  }
}

export function evaluateIndustryContentRules(pack: IndustryRulePack | undefined, fullDraft: string, proofPlan: string, assetRequirements: string): IndustryContentCheck[] {
  if (!pack) return []
  const prohibited = pack.prohibitedPhrases.filter((phrase) => containsAny(fullDraft, [phrase]))
  const triggeredEvidenceRules = pack.evidenceRules.filter((rule) => containsAny(fullDraft, rule.triggerTerms))
  const proofText = `${proofPlan}\n${assetRequirements}`
  const missingEvidenceRules = triggeredEvidenceRules.filter((rule) => !containsAny(proofText, rule.requiredEvidence))
  return [
    {
      id: 'industry-boundaries',
      label: '行业表达边界',
      status: prohibited.length ? '阻断' : '通过',
      message: prohibited.length ? `发现行业规则禁止的表述：${prohibited.join('、')}。` : `没有发现${pack.industry}规则包列出的禁用表述。`,
      suggestion: '删除无法证明的绝对承诺，改写为适用条件、现场判断或需要人工核实的边界。',
    },
    {
      id: 'industry-evidence',
      label: '行业证据要求',
      status: missingEvidenceRules.length ? '提醒' : '通过',
      message: !triggeredEvidenceRules.length ? '当前草稿没有触发额外的行业事实证明规则。' : missingEvidenceRules.length ? `${missingEvidenceRules.length} 类行业表述还没有在证明计划中找到对应材料。` : `已覆盖 ${triggeredEvidenceRules.length} 类被触发的行业证明要求。`,
      suggestion: missingEvidenceRules.length ? missingEvidenceRules.map((rule) => `${rule.claimType}：${rule.missingAction}`).join('；') : '继续确认素材真实、可使用，并与草稿中的具体说法一一对应。',
    },
  ]
}
