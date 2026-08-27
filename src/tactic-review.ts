import { growthTacticPackById, tacticLeadProgress, type GrowthTacticPack, type TacticLeadValues, type TacticQualificationStatus } from './tactic-packs'

export type TacticReviewRecord = {
  tacticPackId: string
  tacticLeadValues: TacticLeadValues
  tacticQualificationStatus: TacticQualificationStatus
  stage: string
  status: string
}

export type TacticReviewRow = {
  pack: GrowthTacticPack
  consultations: number
  informationComplete: number
  manuallyReady: number
  appointments: number
  proposalOrQuote: number
  customers: number
  notMoving: number
}

export function tacticReviewRows(records: TacticReviewRecord[]): TacticReviewRow[] {
  const rows = new Map<string, TacticReviewRow>()

  records.forEach((record) => {
    const pack = growthTacticPackById(record.tacticPackId)
    if (!pack) return

    const current = rows.get(pack.id) || {
      pack,
      consultations: 0,
      informationComplete: 0,
      manuallyReady: 0,
      appointments: 0,
      proposalOrQuote: 0,
      customers: 0,
      notMoving: 0,
    }
    const progress = tacticLeadProgress(pack, record.tacticLeadValues)
    current.consultations += 1
    if (progress.complete) current.informationComplete += 1
    if (progress.complete && record.tacticQualificationStatus === '可人工推进') current.manuallyReady += 1
    if (record.status === '已预约') current.appointments += 1
    if (record.status === '方案中' || record.status === '报价中') current.proposalOrQuote += 1
    if (record.stage === 'customer') current.customers += 1
    if (record.stage === 'lost' || record.tacticQualificationStatus === '暂不符合') current.notMoving += 1
    rows.set(pack.id, current)
  })

  return [...rows.values()].sort((left, right) => right.customers - left.customers || right.manuallyReady - left.manuallyReady || right.consultations - left.consultations)
}
