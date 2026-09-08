export const firstManualResponseEventType = '首次人工承接' as const
export const ownershipHandoffEventType = '已交接承接' as const

export const customerStageEventTypes = [firstManualResponseEventType, ownershipHandoffEventType, '预约已确认', '完成关键沟通', '已给方案', '已报价', '已成交', '暂不推进'] as const

export type CustomerStageEventType = typeof customerStageEventTypes[number]

export type CustomerStageEvent = {
  id: string
  recordId: string
  type: CustomerStageEventType
  occurredAt: string
  note: string
  createdAt: string
}

type CustomerStageEventDefinition = {
  type: CustomerStageEventType
  description: string
  nextStage?: 'intent' | 'customer' | 'lost'
  nextStatus?: string
  nextAction?: string
}

export const customerStageEventDefinitions: CustomerStageEventDefinition[] = [
  { type: firstManualResponseEventType, description: '已按客户进入时的内容承诺完成首次人工回应，并记录已确认信息、待补资料与下一步。' },
  { type: ownershipHandoffEventType, description: '原承接人已将后续人工承接交给新的负责人，并记录交接范围、原因和下一步。' },
  { type: '预约已确认', description: '已和客户确认到店、上门、线上或其他约见安排。', nextStage: 'intent', nextStatus: '已预约', nextAction: '预约前确认时间、资料和沟通安排' },
  { type: '完成关键沟通', description: '已完成到店、上门、线上或其他影响决策的关键沟通。' },
  { type: '已给方案', description: '已向客户给出可供确认的方案、配置或服务建议。', nextStage: 'intent', nextStatus: '方案中', nextAction: '确认方案反馈与需要调整的内容' },
  { type: '已报价', description: '已向客户给出价格、报价单或可确认的费用范围。', nextStage: 'intent', nextStatus: '报价中', nextAction: '确认报价反馈与下一步决定' },
  { type: '已成交', description: '客户已确认成交，进入交付、服务或回访。', nextStage: 'customer', nextStatus: '服务中', nextAction: '安排服务与回访' },
  { type: '暂不推进', description: '当前不再继续投入跟进，需要保留原因供后续复盘。', nextStage: 'lost', nextStatus: '已放弃', nextAction: '' },
]

export function customerStageEventByType(value: unknown) {
  return typeof value === 'string' ? customerStageEventDefinitions.find((event) => event.type === value) : undefined
}

export function normalizeCustomerStageEvents(value: unknown): CustomerStageEvent[] {
  if (!Array.isArray(value)) return []
  return value.reduce<CustomerStageEvent[]>((events, item) => {
    if (!item || typeof item !== 'object') return events
    const event = item as Partial<CustomerStageEvent>
    const definition = customerStageEventByType(event.type)
    const id = typeof event.id === 'string' ? event.id.slice(0, 200) : ''
    const recordId = typeof event.recordId === 'string' ? event.recordId.slice(0, 200) : ''
    if (!id || !recordId || !definition) return events
    events.push({
      id,
      recordId,
      type: definition.type,
      occurredAt: typeof event.occurredAt === 'string' ? event.occurredAt.slice(0, 20) : '',
      note: typeof event.note === 'string' ? event.note.slice(0, 3000) : '',
      createdAt: typeof event.createdAt === 'string' ? event.createdAt.slice(0, 20) : '',
    })
    return events
  }, [])
}
