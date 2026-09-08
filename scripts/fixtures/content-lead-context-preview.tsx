import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../../src/styles.css'
import { CustomerStageEventDialog, OwnershipHandoffDialog, RecordDialog } from '../../src/App'
import { firstManualResponseEventType, ownershipHandoffEventType, type CustomerStageEvent } from '../../src/customer-events'
import type { ContentLeadContext } from '../../src/content-production'

const source = '抖音 · 旧卫生间换智能马桶，先判断四个尺寸 · DY-QA-001'

const context: ContentLeadContext = {
  contentTaskId: 'qa-content-task',
  variantId: 'qa-content-variant',
  channelId: 'douyin',
  title: '旧卫生间换智能马桶，先判断四个尺寸',
  customerPromise: '帮助客户先完成基础自查，减少买后返工。',
  customerNextAction: '私信发送户型图和四个尺寸，安排初步判断。',
  inquiryOwner: '店长',
  firstResponseTarget: '2小时内',
  inquiryEntry: '抖音私信发送户型图和四个尺寸。',
  firstResponsePlan: '当天人工确认地区、现场情况和关键尺寸。',
  customerPreparation: '准备户型图、坑距和电源位置照片。',
  serviceBoundary: '仅服务本地城区，最终方案和报价以现场确认后为准。',
  lockedAt: '2026-09-08T09:00:00.000Z',
}

const record = {
  id: 'qa-record',
  name: '王女士',
  contact: 'QA 微信备注',
  source,
  need: '旧卫生间更换智能马桶，想先确认是否需要改电。',
  stage: 'lead' as const,
  status: '待联系' as const,
  owner: '店长',
  nextAction: '',
  nextDate: '',
  note: '这是隔离预览数据。',
  tacticPackId: '',
  tacticLeadValues: {},
  tacticQualificationStatus: '' as const,
  tacticQualificationNote: '',
  tacticQualifiedAt: '',
  contentLeadContext: context,
  intakeAt: '2026-09-08T09:30',
  firstResponseDueAt: '2026-09-08T11:30',
  createdAt: '2026-09-08',
}

function Preview() {
  const [open, setOpen] = useState(true)
  const [eventOpen, setEventOpen] = useState(false)
  const [handoffOpen, setHandoffOpen] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(record)
  const [events, setEvents] = useState<CustomerStageEvent[]>([])
  const [message, setMessage] = useState('隔离预览：来源不变时，保存后仍会保留原始承接快照。')
  return <main style={{ maxWidth: 960, margin: '0 auto', padding: 32 }}>
    <p style={{ color: '#52675e', fontSize: 12 }}>{message}</p>
    <button className="button button-primary" type="button" onClick={() => setOpen(true)}>打开线索档案</button>
    {open && <RecordDialog
      record={currentRecord}
      stage="lead"
      sourceOptions={[{ id: 'qa-source', label: source }, { id: 'qa-manual', label: '手动到店' }]}
      contentLeadSourceOptions={[{ source, sourceCode: 'DY-QA-001', context }]}
      stageEvents={events}
      onClose={() => setOpen(false)}
      onSubmit={() => setMessage('隔离预览已保存：来源不变时保留原始快照；换为手动到店则不带旧内容。')}
      onRecordFirstResponse={() => { setOpen(false); setEventOpen(true) }}
      onRequestHandoff={() => { setOpen(false); setHandoffOpen(true) }}
    />}
    {eventOpen && <CustomerStageEventDialog
      record={currentRecord}
      initialType={firstManualResponseEventType}
      onClose={() => { setEventOpen(false); setOpen(true) }}
      onSubmit={(formData) => {
        const note = String(formData.get('note') || '').trim()
        if (!note) return
        setEvents([{ id: 'qa-first-response', recordId: currentRecord.id, type: firstManualResponseEventType, occurredAt: String(formData.get('occurredAt') || '2026-09-08'), note, createdAt: '2026-09-08' }])
        setEventOpen(false)
        setOpen(true)
        setMessage('隔离预览：首次人工承接已记录，线索仍保持在线索阶段。')
      }}
    />}
    {handoffOpen && <OwnershipHandoffDialog
      record={currentRecord}
      onClose={() => { setHandoffOpen(false); setOpen(true) }}
      onSubmit={(formData) => {
        const nextOwner = String(formData.get('nextOwner') || '').trim()
        const note = String(formData.get('note') || '').trim()
        if (!nextOwner || !note) return
        const occurredAt = String(formData.get('occurredAt') || '2026-09-08T10:00')
        setCurrentRecord((item) => ({ ...item, owner: nextOwner }))
        setEvents((items) => [{ id: 'qa-handoff', recordId: currentRecord.id, type: ownershipHandoffEventType, occurredAt, note: `由店长交接给${nextOwner}。${note}`, createdAt: occurredAt }, ...items])
        setHandoffOpen(false)
        setOpen(true)
        setMessage(`隔离预览：承接责任已转交给${nextOwner}，并保留交接说明。`)
      }}
    />}
  </main>
}

createRoot(document.getElementById('root')!).render(<Preview />)
