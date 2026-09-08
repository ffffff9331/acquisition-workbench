import { growthTacticPackById, tacticLeadProgress, type GrowthTacticPack, type TacticLeadValues, type TacticQualificationStatus } from './tactic-packs'
import { firstManualResponseEventType, type CustomerStageEvent } from './customer-events'
import { firstResponseSlaStatus, nowLocalDateTime } from './lead-response-sla'

export type TacticReviewRecord = {
  id: string
  tacticPackId: string
  tacticLeadValues: TacticLeadValues
  tacticQualificationStatus: TacticQualificationStatus
  stage: string
  status: string
  contentLeadContext?: unknown | null
  intakeAt?: string
  firstResponseDueAt?: string
}

export type TacticReviewRow = {
  pack: GrowthTacticPack
  consultations: number
  firstResponses: number
  firstResponsesPending: number
  firstResponsesOnTime: number
  firstResponsesLate: number
  informationComplete: number
  manuallyReady: number
  appointments: number
  proposalOrQuote: number
  customers: number
  notMoving: number
}

export function tacticReviewRows(records: TacticReviewRecord[], events: CustomerStageEvent[] = [], now = nowLocalDateTime()): TacticReviewRow[] {
  const rows = new Map<string, TacticReviewRow>()
  const eventTypesByRecord = new Map<string, Set<CustomerStageEvent['type']>>()
  events.forEach((event) => {
    const types = eventTypesByRecord.get(event.recordId) || new Set<CustomerStageEvent['type']>()
    types.add(event.type)
    eventTypesByRecord.set(event.recordId, types)
  })

  records.forEach((record) => {
    const pack = growthTacticPackById(record.tacticPackId)
    if (!pack) return

    const current = rows.get(pack.id) || {
      pack,
      consultations: 0,
      firstResponses: 0,
      firstResponsesPending: 0,
      firstResponsesOnTime: 0,
      firstResponsesLate: 0,
      informationComplete: 0,
      manuallyReady: 0,
      appointments: 0,
      proposalOrQuote: 0,
      customers: 0,
      notMoving: 0,
    }
    const progress = tacticLeadProgress(pack, record.tacticLeadValues)
    const eventTypes = eventTypesByRecord.get(record.id) || new Set<CustomerStageEvent['type']>()
    current.consultations += 1
    if (eventTypes.has(firstManualResponseEventType)) current.firstResponses += 1
    const firstResponseSla = firstResponseSlaStatus(record, events, now)
    if (firstResponseSla === '按时承接') current.firstResponsesOnTime += 1
    if (firstResponseSla === '超时承接') current.firstResponsesLate += 1
    if (firstResponseSla === '待承接' || firstResponseSla === '即将超时' || firstResponseSla === '已超时') current.firstResponsesPending += 1
    if (progress.complete) current.informationComplete += 1
    if (progress.complete && record.tacticQualificationStatus === '可人工推进') current.manuallyReady += 1
    if (record.status === '已预约' || eventTypes.has('预约已确认')) current.appointments += 1
    if (record.status === '方案中' || record.status === '报价中' || eventTypes.has('已给方案') || eventTypes.has('已报价')) current.proposalOrQuote += 1
    if (record.stage === 'customer' || eventTypes.has('已成交')) current.customers += 1
    if (record.stage === 'lost' || record.tacticQualificationStatus === '暂不符合' || eventTypes.has('暂不推进')) current.notMoving += 1
    rows.set(pack.id, current)
  })

  return [...rows.values()].sort((left, right) => right.customers - left.customers || right.manuallyReady - left.manuallyReady || right.consultations - left.consultations)
}
