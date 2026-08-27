export type OrganicExperimentPlan = {
  naturalOnlyConfirmed: boolean
  testQuestion: string
  primaryMetric: '' | '真实咨询' | '有效线索' | '预约或到店'
  observationUntil: string
  changedVariable: '' | '标题' | '封面' | '开头' | '案例与证明' | '行动引导'
  guardrail: string
}

export const emptyOrganicExperimentPlan: OrganicExperimentPlan = {
  naturalOnlyConfirmed: false,
  testQuestion: '',
  primaryMetric: '',
  observationUntil: '',
  changedVariable: '',
  guardrail: '',
}

function clean(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

export function normalizeOrganicExperimentPlan(value: unknown): OrganicExperimentPlan {
  const item = value && typeof value === 'object' ? value as Partial<OrganicExperimentPlan> : {}
  const primaryMetric = item.primaryMetric === '真实咨询' || item.primaryMetric === '有效线索' || item.primaryMetric === '预约或到店' ? item.primaryMetric : ''
  const changedVariable = item.changedVariable === '标题' || item.changedVariable === '封面' || item.changedVariable === '开头' || item.changedVariable === '案例与证明' || item.changedVariable === '行动引导' ? item.changedVariable : ''
  return {
    naturalOnlyConfirmed: item.naturalOnlyConfirmed === true,
    testQuestion: clean(item.testQuestion, 600),
    primaryMetric,
    observationUntil: /^\d{4}-\d{2}-\d{2}$/.test(clean(item.observationUntil, 20)) ? clean(item.observationUntil, 20) : '',
    changedVariable,
    guardrail: clean(item.guardrail, 600),
  }
}

export function organicExperimentReady(plan: OrganicExperimentPlan) {
  return Boolean(plan.naturalOnlyConfirmed && plan.testQuestion && plan.primaryMetric && plan.observationUntil && plan.changedVariable && plan.guardrail)
}
