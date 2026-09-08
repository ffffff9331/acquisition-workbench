import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../../src/styles.css'
import { WorkspacePage } from '../../src/App'
import { firstManualResponseEventType } from '../../src/customer-events'

const contentContext = {
  contentTaskId: 'qa-content-task',
  variantId: 'qa-content-variant',
  channelId: 'douyin' as const,
  title: '旧卫生间换智能马桶，先判断四个尺寸',
  customerPromise: '帮助客户先完成基础自查，减少买后返工。',
  customerNextAction: '私信发送户型图和四个尺寸。',
  inquiryOwner: '店长',
  firstResponseTarget: '2小时内' as const,
  inquiryEntry: '抖音私信发送户型图和四个尺寸。',
  firstResponsePlan: '当天人工确认地区、现场情况和关键尺寸。',
  customerPreparation: '准备户型图、坑距和电源位置照片。',
  serviceBoundary: '仅服务本地城区，最终方案和报价以现场确认后为准。',
  lockedAt: '2026-09-08T09:00:00.000Z',
}

const records = [
  { id: 'qa-overdue-response', name: '王女士', contact: '微信备注', source: '抖音 · 旧卫生间换智能马桶 · DY-QA-001', need: '旧卫生间改造，担心坑距和电源。', stage: 'lead' as const, status: '待联系' as const, owner: '店长', nextAction: '当天人工确认地区、现场情况和关键尺寸。', nextDate: '2026-09-06', note: '', tacticPackId: '', tacticLeadValues: {}, tacticQualificationStatus: '' as const, tacticQualificationNote: '', tacticQualifiedAt: '', contentLeadContext: contentContext, intakeAt: '2026-09-08T08:30', firstResponseDueAt: '2026-09-08T10:30', createdAt: '2026-09-06' },
  { id: 'qa-today-followup', name: '李先生', contact: '电话备注', source: '社区活动 · 老房改造咨询 · OF-QA-001', need: '预约到店确认改造范围。', stage: 'intent' as const, status: '已预约' as const, owner: '小周', nextAction: '确认今天到店时间和需带资料', nextDate: '2026-09-08', note: '', tacticPackId: '', tacticLeadValues: {}, tacticQualificationStatus: '' as const, tacticQualificationNote: '', tacticQualifiedAt: '', contentLeadContext: null, intakeAt: '', firstResponseDueAt: '', createdAt: '2026-09-08' },
  { id: 'qa-responded-future', name: '陈女士', contact: '小红书私信', source: '小红书 · 小户型卫浴避坑 · XHS-QA-001', need: '已发送户型图，等待现场照片。', stage: 'lead' as const, status: '待联系' as const, owner: '小吴', nextAction: '等待客户补充现场照片', nextDate: '2026-09-10', note: '', tacticPackId: '', tacticLeadValues: {}, tacticQualificationStatus: '' as const, tacticQualificationNote: '', tacticQualifiedAt: '', contentLeadContext: { ...contentContext, channelId: 'xiaohongshu' as const }, intakeAt: '2026-09-08T09:30', firstResponseDueAt: '2026-09-08T11:30', createdAt: '2026-09-08' },
  { id: 'qa-unscheduled-response', name: '赵女士', contact: '', source: '抖音 · 卫生间尺寸自查 · DY-QA-002', need: '想问是否能安装智能马桶。', stage: 'lead' as const, status: '待联系' as const, owner: '', nextAction: '', nextDate: '', note: '', tacticPackId: '', tacticLeadValues: {}, tacticQualificationStatus: '' as const, tacticQualificationNote: '', tacticQualifiedAt: '', contentLeadContext: { ...contentContext, contentTaskId: 'qa-content-task-2' }, intakeAt: '', firstResponseDueAt: '', createdAt: '2026-09-08' },
]

function Preview() {
  const [message, setMessage] = useState('隔离预览：队列按逾期、首次人工承接、当天事项和后续待办排序。')
  return <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
    <p style={{ color: '#52675e', fontSize: 12 }}>{message}</p>
    <WorkspacePage
      records={records}
      events={[{ id: 'qa-response-event', recordId: 'qa-responded-future', type: firstManualResponseEventType, occurredAt: '2026-09-08', note: '已确认本地服务范围，等待照片。', createdAt: '2026-09-08' }]}
      topicResearch={{ brief: { offer: '', targetCustomer: '', serviceArea: '', conversionGoal: '', proofAssets: '', differentiator: '', constraints: '' }, evidence: [], generatedTopics: [{ id: 'qa-campaign-review', industryPackId: '', tacticPackId: '', title: '旧卫生间智能马桶安装条件验证', customerQuestion: '旧卫生间是否能直接换智能马桶？', targetCustomer: '准备翻新老房卫生间的本地业主', buyerStage: '方案比较', demandSignal: '公开页面反复出现坑距和电源问题。', contentAngle: '先用真实量尺解释安装条件。', keyPromise: '帮助客户减少买错和返工。', proofNeeded: '真实量尺画面和尺寸说明。', callToAction: '私信户型和尺寸，由人工判断。', leadMagnet: '安装自查表', recommendedChannels: ['douyin'], trafficMode: '平台自然推荐', testWindowDays: 7, successSignal: '记录有效咨询、资料补全和进入到店或量尺的人数。', campaignStatus: '验证中', campaignOwner: '店长', campaignStartedAt: '2026-09-01T09:00', campaignEndsAt: '2026-09-08T09:00', campaignNote: '已人工发布，店长承接咨询。', campaignReviewedAt: '', riskNote: '', fitReason: '', evidenceIds: [], service: 'official', status: '已采用', adoptedChannels: ['douyin'], adoptions: [{ channelId: 'douyin', itemId: 'qa-douyin-idea', adoptedAt: '2026-09-01T09:00' }], reviewDecision: '', createdAt: '2026-09-01T09:00' }] }}
      performanceByOpportunity={{ 'qa-campaign-review': [{ channelId: 'douyin', itemId: 'qa-douyin-idea', stage: '已发布', executed: true, reach: 1800, interactions: 126, platformInquiries: 9, registeredLeads: 5, qualifiedLeads: 2, customers: 1 }] }}
      leads={3}
      intents={1}
      customers={0}
      channelCount={2}
      onAddLead={() => setMessage('隔离预览：点击新建线索。')}
      onOpenRecord={(record) => setMessage(`隔离预览：打开 ${record.name} 的客户档案。`)}
      onAddEvent={(record) => setMessage(`隔离预览：为 ${record.name} 打开“首次人工承接”记录。`)}
      onNavigate={(view) => setMessage(`隔离预览：跳转到 ${view}。`)}
    />
  </main>
}

createRoot(document.getElementById('root')!).render(<Preview />)
