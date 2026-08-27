import { useMemo, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ContactRound,
  Handshake,
  HeartHandshake,
  Link2,
  MessageSquareText,
  Pencil,
  Plus,
  Settings2,
  UserPlus,
  UsersRound,
  X,
} from 'lucide-react'
import type { GrowthTacticPack } from './tactic-packs'

export type ReferralRelationType = '老客户转介绍' | '合作伙伴推荐'
export type ReferralRelationStatus = '待联系' | '沟通中' | '可接收推荐' | '暂停'
export type ReferralLogType = '联系记录' | '收到推荐' | '结果反馈' | '感谢维护'

export type ReferralChecklist = {
  relationshipConfirmed: boolean
  referralScenarioReady: boolean
  idealCustomerReady: boolean
  introductionReady: boolean
  handoffReady: boolean
  feedbackReady: boolean
}

export type ReferralRelation = {
  id: string
  contentPackageId: string
  relationType: ReferralRelationType
  name: string
  organization: string
  contact: string
  relationshipBasis: string
  referralScenario: string
  idealCustomer: string
  cooperationValue: string
  introductionMessage: string
  handoffMethod: string
  feedbackPlan: string
  owner: string
  nextAction: string
  nextDate: string
  status: ReferralRelationStatus
  checklist: ReferralChecklist
  sourceCode: string
  createdAt: string
}

export type ReferralLog = {
  id: string
  relationId: string
  type: ReferralLogType
  date: string
  content: string
  nextAction: string
  nextDate: string
  createdAt: string
}

export type ReferralSettings = {
  businessLabel: string
  defaultOwner: string
  monthlyMaintenanceTarget: number
  defaultHandoffMethod: string
  defaultFeedbackPlan: string
  privacyReminder: string
}

export type ReferralData = {
  version: 1
  relations: ReferralRelation[]
  logs: ReferralLog[]
  settings: ReferralSettings
}

export type ReferralLegacyTask = {
  id?: string
  channelId?: string
  contentPackageId?: string
  title?: string
  goal?: string
  callToAction?: string
  owner?: string
  plannedDate?: string
  status?: string
  sourceCode?: string
  linkOrLocation?: string
  note?: string
  createdAt?: string
}

export type ReferralCustomerRecord = {
  id: string
  name: string
  contact?: string
  source: string
  need: string
  stage: 'lead' | 'intent' | 'customer' | 'lost'
  status: string
  owner: string
  nextAction: string
  nextDate: string
}

type ReferralSection = 'overview' | 'relations' | 'referrals' | 'maintenance' | 'review' | 'settings'

const relationTypes: ReferralRelationType[] = ['老客户转介绍', '合作伙伴推荐']

const emptyChecklist: ReferralChecklist = {
  relationshipConfirmed: false,
  referralScenarioReady: false,
  idealCustomerReady: false,
  introductionReady: false,
  handoffReady: false,
  feedbackReady: false,
}

const checklistItems: Array<{ key: keyof ReferralChecklist; label: string }> = [
  { key: 'relationshipConfirmed', label: '关系与意愿已确认' },
  { key: 'referralScenarioReady', label: '适合推荐的场景已明确' },
  { key: 'idealCustomerReady', label: '理想客户已明确' },
  { key: 'introductionReady', label: '介绍说明已准备' },
  { key: 'handoffReady', label: '客户交接方式已确认' },
  { key: 'feedbackReady', label: '结果反馈与感谢已安排' },
]

const relationMeta: Record<ReferralRelationType, { shortLabel: string; prefix: string; icon: ReactNode; organizationLabel: string; basisLabel: string }> = {
  老客户转介绍: { shortLabel: '老客户', prefix: 'RFC', icon: <HeartHandshake size={17} />, organizationLabel: '客户备注', basisLabel: '既有关系与服务经历' },
  合作伙伴推荐: { shortLabel: '合作伙伴', prefix: 'RFP', icon: <Handshake size={17} />, organizationLabel: '公司 / 团队', basisLabel: '合作基础' },
}

const sectionItems: Array<{ id: ReferralSection; label: string; icon: ReactNode }> = [
  { id: 'overview', label: '总览', icon: <Handshake size={15} /> },
  { id: 'relations', label: '推荐关系', icon: <ContactRound size={15} /> },
  { id: 'referrals', label: '登记客户', icon: <UserPlus size={15} /> },
  { id: 'maintenance', label: '维护', icon: <MessageSquareText size={15} /> },
  { id: 'review', label: '复盘', icon: <BarChart3 size={15} /> },
  { id: 'settings', label: '设置', icon: <Settings2 size={15} /> },
]

export const emptyReferralData: ReferralData = {
  version: 1,
  relations: [],
  logs: [],
  settings: {
    businessLabel: '',
    defaultOwner: '',
    monthlyMaintenanceTarget: 4,
    defaultHandoffMethod: '',
    defaultFeedbackPlan: '',
    privacyReminder: '',
  },
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`
}

function createSourceCode(type: ReferralRelationType) {
  return `${relationMeta[type].prefix}-${todayISO().replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0
}

function formNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function normalizeRelationType(value: unknown): ReferralRelationType {
  return relationTypes.includes(value as ReferralRelationType) ? value as ReferralRelationType : '老客户转介绍'
}

function normalizeChecklist(value: unknown): ReferralChecklist {
  const checklist = value && typeof value === 'object' ? value as Partial<ReferralChecklist> : {}
  return {
    relationshipConfirmed: Boolean(checklist.relationshipConfirmed),
    referralScenarioReady: Boolean(checklist.referralScenarioReady),
    idealCustomerReady: Boolean(checklist.idealCustomerReady),
    introductionReady: Boolean(checklist.introductionReady),
    handoffReady: Boolean(checklist.handoffReady),
    feedbackReady: Boolean(checklist.feedbackReady),
  }
}

function inferLegacyType(task: ReferralLegacyTask): ReferralRelationType {
  const value = `${stringValue(task.title)} ${stringValue(task.note)} ${stringValue(task.linkOrLocation)}`
  return value.includes('老客') || value.includes('客户') || value.includes('朋友') ? '老客户转介绍' : '合作伙伴推荐'
}

function migrateLegacyStatus(status: string): ReferralRelationStatus {
  if (status === '跟进中') return '沟通中'
  if (status === '已完成') return '可接收推荐'
  if (status === '已暂停') return '暂停'
  return '待联系'
}

function completedChecklist(status: string): ReferralChecklist {
  const completed = status === '已完成'
  return checklistItems.reduce((current, item) => ({ ...current, [item.key]: completed }), { ...emptyChecklist })
}

function migrateLegacyTasks(legacyTasks: ReferralLegacyTask[]): ReferralData {
  const legacy = legacyTasks.filter((task) => task.channelId === 'referral' && task.title)
  if (!legacy.length) return emptyReferralData
  const relations: ReferralRelation[] = legacy.map((task, index) => {
    const relationType = inferLegacyType(task)
    const status = migrateLegacyStatus(stringValue(task.status))
    return {
      id: `referral-relation-legacy-${task.id || index}`,
      contentPackageId: stringValue(task.contentPackageId),
      relationType,
      name: stringValue(task.linkOrLocation, stringValue(task.title)),
      organization: '',
      contact: '',
      relationshipBasis: stringValue(task.note),
      referralScenario: stringValue(task.goal),
      idealCustomer: '',
      cooperationValue: '',
      introductionMessage: '',
      handoffMethod: stringValue(task.callToAction),
      feedbackPlan: '',
      owner: stringValue(task.owner),
      nextAction: status === '可接收推荐' ? '保持联系并及时反馈推荐结果' : '联系并确认是否愿意推荐',
      nextDate: stringValue(task.plannedDate),
      status,
      checklist: completedChecklist(stringValue(task.status)),
      sourceCode: status === '可接收推荐' ? stringValue(task.sourceCode, createSourceCode(relationType)) : '',
      createdAt: stringValue(task.createdAt, todayISO()),
    }
  })
  return { ...emptyReferralData, relations }
}

export function normalizeReferralData(value: unknown, legacyTasks: ReferralLegacyTask[] = []): ReferralData {
  if (!value || typeof value !== 'object') return migrateLegacyTasks(legacyTasks)
  const raw = value as Partial<ReferralData>
  const relations = Array.isArray(raw.relations) ? raw.relations.filter((relation) => relation && typeof relation.name === 'string').map((relation) => ({
    id: stringValue(relation.id, createId('referral-relation')),
    contentPackageId: stringValue(relation.contentPackageId),
    relationType: normalizeRelationType(relation.relationType),
    name: stringValue(relation.name),
    organization: stringValue(relation.organization),
    contact: stringValue(relation.contact),
    relationshipBasis: stringValue(relation.relationshipBasis),
    referralScenario: stringValue(relation.referralScenario),
    idealCustomer: stringValue(relation.idealCustomer),
    cooperationValue: stringValue(relation.cooperationValue),
    introductionMessage: stringValue(relation.introductionMessage),
    handoffMethod: stringValue(relation.handoffMethod),
    feedbackPlan: stringValue(relation.feedbackPlan),
    owner: stringValue(relation.owner),
    nextAction: stringValue(relation.nextAction),
    nextDate: stringValue(relation.nextDate),
    status: ['沟通中', '可接收推荐', '暂停'].includes(stringValue(relation.status)) ? relation.status as ReferralRelationStatus : '待联系',
    checklist: normalizeChecklist(relation.checklist),
    sourceCode: stringValue(relation.sourceCode),
    createdAt: stringValue(relation.createdAt, todayISO()),
  })) : []
  const logs = Array.isArray(raw.logs) ? raw.logs.filter((log) => log && typeof log.relationId === 'string').map((log) => ({
    id: stringValue(log.id, createId('referral-log')),
    relationId: stringValue(log.relationId),
    type: ['收到推荐', '结果反馈', '感谢维护'].includes(stringValue(log.type)) ? log.type as ReferralLogType : '联系记录',
    date: stringValue(log.date, todayISO()),
    content: stringValue(log.content),
    nextAction: stringValue(log.nextAction),
    nextDate: stringValue(log.nextDate),
    createdAt: stringValue(log.createdAt, todayISO()),
  })) : []
  const settings = raw.settings && typeof raw.settings === 'object' ? raw.settings : emptyReferralData.settings
  return {
    version: 1,
    relations,
    logs,
    settings: {
      businessLabel: stringValue(settings.businessLabel),
      defaultOwner: stringValue(settings.defaultOwner),
      monthlyMaintenanceTarget: numberValue(settings.monthlyMaintenanceTarget) || 4,
      defaultHandoffMethod: stringValue(settings.defaultHandoffMethod),
      defaultFeedbackPlan: stringValue(settings.defaultFeedbackPlan),
      privacyReminder: stringValue(settings.privacyReminder),
    },
  }
}

export function referralSourceOptions(data: ReferralData) {
  return data.relations.filter((relation) => relation.status === '可接收推荐' && relation.sourceCode).map((relation) => ({
    id: relation.id,
    label: `转介绍合作 · ${relationMeta[relation.relationType].shortLabel} · ${relation.name} · ${relation.sourceCode}`,
  }))
}

function formatDate(value: string) {
  if (!value) return '未安排'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(date)
}

function relationStatusTone(status: ReferralRelationStatus) {
  if (status === '暂停') return 'muted'
  if (status === '沟通中') return 'amber'
  if (status === '可接收推荐') return 'teal'
  return 'neutral'
}

function checklistProgress(checklist: ReferralChecklist) {
  const completed = checklistItems.filter((item) => checklist[item.key]).length
  return { completed, total: checklistItems.length, done: completed === checklistItems.length }
}

function sourceLabel(data: ReferralData, relation: ReferralRelation) {
  return referralSourceOptions(data).find((option) => option.id === relation.id)?.label || `转介绍合作 · ${relation.name}`
}

export function ReferralWorkspace({ data, records, tacticPack, onChange, onBack, onAddLead, onOpenRecord, onToast }: { data: ReferralData; records: ReferralCustomerRecord[]; tacticPack?: GrowthTacticPack; onChange: (updater: (current: ReferralData) => ReferralData) => void; onBack: () => void; onAddLead: (source?: string) => void; onOpenRecord: (record: ReferralCustomerRecord) => void; onToast: (message: string) => void }) {
  const [section, setSection] = useState<ReferralSection>('overview')
  const [relationView, setRelationView] = useState<ReferralRelationType>(tacticPack?.recommendedRelationType || '老客户转介绍')
  const [editingRelation, setEditingRelation] = useState<ReferralRelation | null | undefined>(undefined)
  const [logRelation, setLogRelation] = useState<ReferralRelation | null>(null)
  const readyRelations = data.relations.filter((relation) => relation.status === '可接收推荐' && relation.sourceCode)
  const sourceCodes = readyRelations.map((relation) => relation.sourceCode)
  const channelRecords = records.filter((record) => sourceCodes.some((source) => record.source.includes(source)))
  const activeRecords = channelRecords.filter((record) => record.stage !== 'lost')
  const nextRelation = data.relations.find((relation) => relation.status === '沟通中') || data.relations.find((relation) => relation.status === '待联系') || [...readyRelations].sort((left, right) => (left.nextDate || '9999').localeCompare(right.nextDate || '9999'))[0]
  const summary = useMemo(() => ({
    customers: data.relations.filter((relation) => relation.relationType === '老客户转介绍').length,
    partners: data.relations.filter((relation) => relation.relationType === '合作伙伴推荐').length,
    ready: readyRelations.length,
    referrals: activeRecords.length,
    customersWon: activeRecords.filter((record) => record.stage === 'customer').length,
  }), [activeRecords, data.relations, readyRelations.length])

  const saveRelation = (formData: FormData, relation?: ReferralRelation | null) => {
    const relationType = normalizeRelationType(formData.get('relationType'))
    const next: ReferralRelation = {
      id: relation?.id || createId('referral-relation'),
      contentPackageId: relation?.contentPackageId || (tacticPack?.recommendedRelationType === relationType ? tacticPack.id : ''),
      relationType,
      name: String(formData.get('name') || '').trim(),
      organization: String(formData.get('organization') || '').trim(),
      contact: String(formData.get('contact') || '').trim(),
      relationshipBasis: String(formData.get('relationshipBasis') || '').trim(),
      referralScenario: String(formData.get('referralScenario') || '').trim(),
      idealCustomer: String(formData.get('idealCustomer') || '').trim(),
      cooperationValue: String(formData.get('cooperationValue') || '').trim(),
      introductionMessage: String(formData.get('introductionMessage') || '').trim(),
      handoffMethod: String(formData.get('handoffMethod') || '').trim(),
      feedbackPlan: String(formData.get('feedbackPlan') || '').trim(),
      owner: String(formData.get('owner') || '').trim(),
      nextAction: String(formData.get('nextAction') || '').trim(),
      nextDate: String(formData.get('nextDate') || ''),
      status: relation?.status || '待联系',
      checklist: checklistItems.reduce((current, item) => ({ ...current, [item.key]: formData.get(item.key) === 'on' }), { ...emptyChecklist }),
      sourceCode: relation?.sourceCode || '',
      createdAt: relation?.createdAt || todayISO(),
    }
    if (!next.name) return
    onChange((current) => ({ ...current, relations: relation ? current.relations.map((item) => item.id === relation.id ? next : item) : [next, ...current.relations] }))
    setEditingRelation(undefined)
    setRelationView(relationType)
    onToast(relation ? '推荐关系已更新' : '推荐关系已建立')
  }

  const toggleChecklist = (relation: ReferralRelation, key: keyof ReferralChecklist) => {
    onChange((current) => ({ ...current, relations: current.relations.map((item) => item.id === relation.id ? { ...item, checklist: { ...item.checklist, [key]: !item.checklist[key] } } : item) }))
  }

  const advanceRelation = (relation: ReferralRelation) => {
    if (relation.status === '待联系') {
      onChange((current) => ({ ...current, relations: current.relations.map((item) => item.id === relation.id ? { ...item, status: '沟通中' } : item) }))
      onToast('已进入关系沟通')
      return
    }
    if (relation.status === '沟通中') {
      if (!checklistProgress(relation.checklist).done) {
        onToast('先完成 6 项推荐关系检查，再开放推荐来源')
        return
      }
      onChange((current) => ({ ...current, relations: current.relations.map((item) => item.id === relation.id ? { ...item, status: '可接收推荐', sourceCode: item.sourceCode || createSourceCode(item.relationType) } : item) }))
      setSection('referrals')
      onToast('推荐关系已开放，现在可以登记被推荐客户')
      return
    }
    if (relation.status === '可接收推荐') {
      setSection('referrals')
    }
  }

  const saveLog = (formData: FormData, relation: ReferralRelation) => {
    const nextDate = String(formData.get('nextDate') || '')
    const nextAction = String(formData.get('nextAction') || '').trim()
    const log: ReferralLog = {
      id: createId('referral-log'),
      relationId: relation.id,
      type: String(formData.get('type') || '联系记录') as ReferralLogType,
      date: String(formData.get('date') || todayISO()),
      content: String(formData.get('content') || '').trim(),
      nextAction,
      nextDate,
      createdAt: todayISO(),
    }
    if (!log.content) return
    onChange((current) => ({ ...current, logs: [log, ...current.logs], relations: current.relations.map((item) => item.id === relation.id ? { ...item, nextAction: nextAction || item.nextAction, nextDate: nextDate || item.nextDate } : item) }))
    setLogRelation(null)
    onToast('维护记录已保存')
  }

  const saveSettings = (formData: FormData) => {
    onChange((current) => ({ ...current, settings: {
      businessLabel: String(formData.get('businessLabel') || '').trim(),
      defaultOwner: String(formData.get('defaultOwner') || '').trim(),
      monthlyMaintenanceTarget: formNumber(formData.get('monthlyMaintenanceTarget')) || 4,
      defaultHandoffMethod: String(formData.get('defaultHandoffMethod') || '').trim(),
      defaultFeedbackPlan: String(formData.get('defaultFeedbackPlan') || '').trim(),
      privacyReminder: String(formData.get('privacyReminder') || '').trim(),
    } }))
    onToast('转介绍合作设置已保存')
  }

  const renderSection = () => {
    if (section === 'relations') return <RelationsSection data={data} view={relationView} onView={setRelationView} onNew={(type) => { setRelationView(type); setEditingRelation(null) }} onEdit={setEditingRelation} onToggleChecklist={toggleChecklist} onAdvance={advanceRelation} onLog={setLogRelation} />
    if (section === 'referrals') return <ReferralRegistrationSection data={data} records={channelRecords} onAddLead={onAddLead} onOpenRecord={onOpenRecord} />
    if (section === 'maintenance') return <MaintenanceSection data={data} records={channelRecords} onEdit={setEditingRelation} onLog={setLogRelation} />
    if (section === 'review') return <ReviewSection data={data} records={channelRecords} />
    if (section === 'settings') return <SettingsSection settings={data.settings} onSave={saveSettings} />
    return <OverviewSection data={data} summary={summary} records={activeRecords} nextRelation={nextRelation} onOpenRelations={(type) => { setRelationView(type); setSection('relations') }} onOpenRelation={(relation) => { setEditingRelation(relation); setSection('relations') }} onAdvance={advanceRelation} onOpenReferrals={() => setSection('referrals')} onOpenMaintenance={() => setSection('maintenance')} />
  }

  return <div className="referral-workspace">
    <header className="page-header"><div><h1>转介绍合作</h1><p>建立可以长期带来客户的推荐关系，登记每位被推荐客户，并及时反馈结果、维护关系和复盘贡献。</p></div><div className="page-action"><button className="button button-secondary" onClick={onBack}><ChevronLeft size={16} />返回获客</button></div></header>
    <nav className="douyin-module-tabs" aria-label="转介绍合作工作区">{sectionItems.map((item) => { const badge = item.id === 'referrals' ? readyRelations.length : item.id === 'maintenance' ? data.relations.filter((relation) => relation.nextAction || relation.nextDate).length : 0; return <button key={item.id} type="button" className={section === item.id ? 'active' : ''} onClick={() => setSection(item.id)}>{item.icon}<span>{item.label}</span>{badge > 0 ? <b>{badge}</b> : null}</button> })}</nav>
    {section === 'overview' ? <CommandBand nextRelation={nextRelation} hasRelations={data.relations.length > 0} onNew={() => { setRelationView(tacticPack?.recommendedRelationType || '老客户转介绍'); setEditingRelation(null) }} onAdvance={advanceRelation} /> : null}
    {renderSection()}
    {editingRelation !== undefined ? <RelationDialog relation={editingRelation || undefined} defaultType={relationView} settings={data.settings} tacticPack={tacticPack?.recommendedRelationType === (editingRelation?.relationType || relationView) ? tacticPack : undefined} onClose={() => setEditingRelation(undefined)} onSubmit={saveRelation} /> : null}
    {logRelation ? <LogDialog relation={logRelation} onClose={() => setLogRelation(null)} onSubmit={saveLog} /> : null}
  </div>
}

function CommandBand({ nextRelation, hasRelations, onNew, onAdvance }: { nextRelation?: ReferralRelation; hasRelations: boolean; onNew: () => void; onAdvance: (relation: ReferralRelation) => void }) {
  const action = nextRelation?.status === '待联系' ? '联系并确认是否愿意建立推荐关系' : nextRelation?.status === '沟通中' ? '补齐推荐规则并开放来源' : nextRelation?.status === '可接收推荐' ? '保持联系并及时承接推荐客户' : '建立新的推荐关系'
  return <section className="douyin-command-band"><div><span>当前优先推进</span><h2>{nextRelation?.name || (hasRelations ? '建立下一条推荐关系' : '建立第一条推荐关系')}</h2><p>{action}</p></div>{nextRelation ? <button className="button button-primary" onClick={() => onAdvance(nextRelation)}>{nextRelation.status === '待联系' ? '开始沟通' : nextRelation.status === '沟通中' ? '开放推荐来源' : '登记客户'}<ArrowRight size={15} /></button> : <button className="button button-primary" onClick={onNew}><Plus size={15} />新建关系</button>}</section>
}

function OverviewSection({ data, summary, records, nextRelation, onOpenRelations, onOpenRelation, onAdvance, onOpenReferrals, onOpenMaintenance }: { data: ReferralData; summary: { customers: number; partners: number; ready: number; referrals: number; customersWon: number }; records: ReferralCustomerRecord[]; nextRelation?: ReferralRelation; onOpenRelations: (type: ReferralRelationType) => void; onOpenRelation: (relation: ReferralRelation) => void; onAdvance: (relation: ReferralRelation) => void; onOpenReferrals: () => void; onOpenMaintenance: () => void }) {
  const recent = [...data.relations].sort((left, right) => (left.nextDate || '9999').localeCompare(right.nextDate || '9999')).slice(0, 6)
  return <>
    <section className="douyin-overview-strip referral-overview-strip"><button onClick={() => onOpenRelations('老客户转介绍')}><HeartHandshake size={17} /><span>老客户关系</span><strong>{summary.customers}</strong><small>服务后的持续联系</small></button><button onClick={() => onOpenRelations('合作伙伴推荐')}><Handshake size={17} /><span>合作伙伴</span><strong>{summary.partners}</strong><small>互补关系与客户交接</small></button><button onClick={onOpenReferrals}><ClipboardCheck size={17} /><span>可接收推荐</span><strong>{summary.ready}</strong><small>已有来源编号</small></button><button onClick={onOpenMaintenance}><MessageSquareText size={17} /><span>推荐客户</span><strong>{summary.referrals}</strong><small>{records.filter((record) => record.stage === 'intent' || record.stage === 'customer').length} 个进入意向</small></button><button onClick={onOpenMaintenance}><UsersRound size={17} /><span>成为客户</span><strong>{summary.customersWon}</strong><small>{data.logs.length} 条维护记录</small></button></section>
    <section className="douyin-overview-grid"><div className="work-panel"><div className="section-heading-row"><div><h2>推荐关系</h2><p>优先处理已经安排下一步的推荐人和合作方。</p></div><button className="text-button" onClick={() => onOpenRelations(nextRelation?.relationType || '老客户转介绍')}>查看全部</button></div>{recent.length ? <div className="referral-relation-list">{recent.map((relation) => <button key={relation.id} onClick={() => onOpenRelation(relation)}><span className="referral-relation-icon">{relationMeta[relation.relationType].icon}</span><div><strong>{relation.name}</strong><span>{relationMeta[relation.relationType].shortLabel} · {relation.nextAction || '待安排下一步'}</span></div><time>{formatDate(relation.nextDate)}</time><ChevronRight size={15} /></button>)}</div> : <CompactEmpty icon={<Handshake size={23} />} title="还没有推荐关系" action={<button className="button button-primary" onClick={() => onOpenRelations('老客户转介绍')}><Plus size={15} />新建关系</button>} />}</div><aside className="work-panel quiet-panel"><div className="section-heading-row"><div><h2>关系结果</h2><p>结果来自具体推荐来源，不按维护次数虚构效果。</p></div></div><div className="douyin-source-summary referral-source-summary"><div><span>推荐客户</span><strong>{records.length}</strong></div><div><span>进入意向</span><strong>{records.filter((record) => record.stage === 'intent' || record.stage === 'customer').length}</strong></div><div><span>客户</span><strong>{records.filter((record) => record.stage === 'customer').length}</strong></div></div>{nextRelation ? <button className="button button-secondary" onClick={() => onAdvance(nextRelation)}>推进下一步<ArrowRight size={15} /></button> : null}</aside></section>
  </>
}

function RelationsSection({ data, view, onView, onNew, onEdit, onToggleChecklist, onAdvance, onLog }: { data: ReferralData; view: ReferralRelationType; onView: (view: ReferralRelationType) => void; onNew: (type: ReferralRelationType) => void; onEdit: (relation: ReferralRelation) => void; onToggleChecklist: (relation: ReferralRelation, key: keyof ReferralChecklist) => void; onAdvance: (relation: ReferralRelation) => void; onLog: (relation: ReferralRelation) => void }) {
  const relations = data.relations.filter((relation) => relation.relationType === view)
  return <>
    <div className="douyin-section-head"><div><h2>推荐关系</h2><p>先把推荐对象、适合场景、客户交接和反馈方式说清楚，再长期使用同一个来源。</p></div><button className="button button-primary" onClick={() => onNew(view)}><Plus size={15} />新建{relationMeta[view].shortLabel}</button></div>
    <div className="segmented-control douyin-subtabs referral-relation-tabs" role="tablist" aria-label="推荐关系类型">{relationTypes.map((type) => <button key={type} className={view === type ? 'active' : ''} onClick={() => onView(type)}>{relationMeta[type].shortLabel} <b>{data.relations.filter((relation) => relation.relationType === type).length}</b></button>)}</div>
    <section className="douyin-task-board">{relations.length ? relations.map((relation) => { const progress = checklistProgress(relation.checklist); return <article className="douyin-video-item" key={relation.id}><div className="douyin-video-item-head"><div><span>{relationMeta[relation.relationType].shortLabel}</span><h3>{relation.name}</h3><p>{relation.organization || relation.relationshipBasis || '打开关系档案补充合作基础。'}</p></div><span className={`status-pill ${relationStatusTone(relation.status)}`}>{relation.status}</span></div><div className="douyin-progress-line"><span><b>{progress.completed}</b> / {progress.total} 项完成</span><div><i style={{ width: `${(progress.completed / progress.total) * 100}%` }} /></div></div><div className="douyin-checklist">{checklistItems.map((item) => <label key={item.key}><input type="checkbox" checked={relation.checklist[item.key]} onChange={() => onToggleChecklist(relation, item.key)} /><span>{item.label}</span></label>)}</div>{relation.sourceCode ? <div className="referral-source-code"><Link2 size={14} /><strong>{relation.sourceCode}</strong><span>可以持续登记该关系带来的客户</span></div> : null}<div className="douyin-video-item-foot"><button className="button button-secondary small" onClick={() => onEdit(relation)}><Pencil size={14} />编辑</button><button className="button button-secondary small" onClick={() => onLog(relation)}><MessageSquareText size={14} />记录维护</button>{relation.status !== '暂停' ? <button className="button button-primary small" onClick={() => onAdvance(relation)}>{relation.status === '待联系' ? '开始沟通' : relation.status === '沟通中' ? '开放推荐来源' : '登记客户'}<ArrowRight size={14} /></button> : null}</div></article> }) : <CompactEmpty icon={relationMeta[view].icon} title={`还没有${relationMeta[view].shortLabel}关系`} description="先建立一条真实关系，再确认对方愿意介绍什么样的客户。" action={<button className="button button-primary" onClick={() => onNew(view)}><Plus size={15} />新建关系</button>} />}</section>
  </>
}

function ReferralRegistrationSection({ data, records, onAddLead, onOpenRecord }: { data: ReferralData; records: ReferralCustomerRecord[]; onAddLead: (source?: string) => void; onOpenRecord: (record: ReferralCustomerRecord) => void }) {
  const ready = data.relations.filter((relation) => relation.status === '可接收推荐' && relation.sourceCode)
  const active = records.filter((record) => record.stage !== 'lost')
  return <>
    <div className="douyin-section-head"><div><h2>登记客户</h2><p>收到推荐后直接建立客户记录，保留具体推荐人或合作方来源。</p></div><button className="button button-primary" onClick={() => onAddLead()}><Plus size={15} />补登记客户</button></div>
    <section className="douyin-inquiry-summary"><div><span>可用推荐来源</span><strong>{ready.length}</strong><small>已确认可以接收推荐</small></div><div><span>被推荐客户</span><strong>{active.length}</strong><small>待判断或正在推进</small></div><div><span>进入意向 / 客户</span><strong>{active.filter((record) => record.stage === 'intent' || record.stage === 'customer').length}</strong><small>已经产生业务进展</small></div></section>
    <section className="douyin-inquiry-grid"><div className="work-panel"><div className="section-heading-row"><div><h2>按关系登记</h2><p>选择这位客户具体是谁推荐来的。</p></div></div>{ready.length ? <div className="douyin-source-video-list">{ready.map((relation) => { const count = records.filter((record) => record.source.includes(relation.sourceCode)).length; return <div key={relation.id}><div><strong>{relation.name}</strong><span>{relationMeta[relation.relationType].shortLabel} · {relation.sourceCode} · 已登记 {count} 条</span></div><button className="button button-secondary small" onClick={() => onAddLead(sourceLabel(data, relation))}><UserPlus size={14} />登记客户</button></div> })}</div> : <CompactEmpty icon={<Link2 size={22} />} title="还没有可用推荐来源" description="完成关系检查并开放来源后，才能登记具体推荐人带来的客户。" />}</div><div className="work-panel"><div className="section-heading-row"><div><h2>最近推荐客户</h2><p>客户的联系、意向和成交继续在通用客户链路推进。</p></div></div>{active.length ? <div className="referral-customer-list">{active.slice(0, 10).map((record) => <button key={record.id} onClick={() => onOpenRecord(record)}><span className={`stage-dot ${record.stage}`}></span><div><strong>{record.name}</strong><span>{record.contact || record.need || '未填写联系方式或需求'}</span></div><span className="status-pill neutral">{record.status}</span><ChevronRight size={14} /></button>)}</div> : <CompactEmpty icon={<UserPlus size={22} />} title="还没有被推荐客户" description="收到真实推荐后，从对应关系登记客户。" />}</div></section>
  </>
}

function MaintenanceSection({ data, records, onEdit, onLog }: { data: ReferralData; records: ReferralCustomerRecord[]; onEdit: (relation: ReferralRelation) => void; onLog: (relation: ReferralRelation) => void }) {
  const relations = [...data.relations].filter((relation) => relation.status !== '暂停').sort((left, right) => (left.nextDate || '9999').localeCompare(right.nextDate || '9999'))
  const recentLogs = [...data.logs].sort((left, right) => right.date.localeCompare(left.date)).slice(0, 12)
  return <>
    <div className="douyin-section-head"><div><h2>维护</h2><p>推荐关系需要及时联系、反馈客户进展和表达感谢，而不是只在需要客户时出现。</p></div></div>
    <section className="douyin-inquiry-grid"><div className="work-panel"><div className="section-heading-row"><div><h2>关系下一步</h2><p>按日期处理联系、反馈和感谢事项。</p></div></div>{relations.length ? <div className="referral-maintenance-list">{relations.map((relation) => { const linked = records.filter((record) => relation.sourceCode && record.source.includes(relation.sourceCode)); return <div key={relation.id}><button onClick={() => onEdit(relation)}><span className="referral-relation-icon">{relationMeta[relation.relationType].icon}</span><div><strong>{relation.name}</strong><span>{relation.nextAction || '待安排下一步'} · {linked.length} 位推荐客户</span></div><time>{formatDate(relation.nextDate)}</time><ChevronRight size={14} /></button><button className="button button-secondary small" onClick={() => onLog(relation)}><Plus size={14} />记录维护</button></div> })}</div> : <CompactEmpty icon={<MessageSquareText size={22} />} title="还没有待维护关系" description="建立推荐关系后，在档案中安排下一次联系。" />}</div><div className="work-panel"><div className="section-heading-row"><div><h2>最近维护记录</h2><p>保留联系、结果反馈和感谢记录。</p></div></div>{recentLogs.length ? <div className="referral-log-list">{recentLogs.map((log) => { const relation = data.relations.find((item) => item.id === log.relationId); return <div key={log.id}><span>{log.type}</span><div><strong>{relation?.name || '已移除关系'}</strong><p>{log.content}</p></div><time>{formatDate(log.date)}</time></div> })}</div> : <CompactEmpty icon={<ClipboardCheck size={22} />} title="还没有维护记录" description="联系推荐人、反馈结果或表达感谢后，在这里留下记录。" />}</div></section>
  </>
}

function ReviewSection({ data, records }: { data: ReferralData; records: ReferralCustomerRecord[] }) {
  const relations = data.relations.filter((relation) => relation.sourceCode)
  const active = records.filter((record) => record.stage !== 'lost')
  return <>
    <div className="douyin-section-head"><div><h2>复盘</h2><p>看哪些推荐关系带来了值得推进和最终成交的客户，再决定维护投入。</p></div></div>
    <section className="douyin-review-summary"><div><span>客户</span><strong>{active.filter((record) => record.stage === 'customer').length}</strong></div><div><span>进入意向</span><strong>{active.filter((record) => record.stage === 'intent' || record.stage === 'customer').length}</strong></div><div><span>推荐客户</span><strong>{active.length}</strong></div><div><span>可接收推荐</span><strong>{data.relations.filter((relation) => relation.status === '可接收推荐').length}</strong></div><div><span>推荐关系</span><strong>{data.relations.length}</strong></div><div><span>维护记录</span><strong>{data.logs.length}</strong></div></section>
    <section className="table-panel douyin-data-panel">{relations.length ? <div className="table-scroll"><table><thead><tr><th>推荐关系</th><th>类型</th><th>推荐客户</th><th>进入意向</th><th>客户</th><th>最近维护</th></tr></thead><tbody>{relations.map((relation) => { const linked = records.filter((record) => record.source.includes(relation.sourceCode) && record.stage !== 'lost'); const latestLog = [...data.logs].filter((log) => log.relationId === relation.id).sort((left, right) => right.date.localeCompare(left.date))[0]; return <tr key={relation.id}><td><div className="source-cell"><b>{relation.name}</b><span>{relation.sourceCode}</span></div></td><td>{relationMeta[relation.relationType].shortLabel}</td><td>{linked.length}</td><td>{linked.filter((record) => record.stage === 'intent' || record.stage === 'customer').length}</td><td>{linked.filter((record) => record.stage === 'customer').length}</td><td>{latestLog ? `${latestLog.type} · ${formatDate(latestLog.date)}` : '暂无记录'}</td></tr> })}</tbody></table></div> : <CompactEmpty icon={<BarChart3 size={23} />} title="还没有可复盘的推荐关系" description="开放推荐来源并登记客户后，这里会显示每条关系带来的业务结果。" />}</section>
  </>
}

function SettingsSection({ settings, onSave }: { settings: ReferralSettings; onSave: (formData: FormData) => void }) {
  return <>
    <div className="douyin-section-head"><div><h2>设置</h2><p>保存推荐关系管理需要的默认方式，不读取通讯录，也不自动联系任何人。</p></div></div>
    <form className="work-panel douyin-settings-form" onSubmit={(event) => { event.preventDefault(); onSave(new FormData(event.currentTarget)) }}><div className="form-grid"><label className="field"><span>业务备注名称</span><input name="businessLabel" defaultValue={settings.businessLabel} placeholder="例如：客户推荐与合作关系" /></label><label className="field"><span>默认负责人</span><input name="defaultOwner" defaultValue={settings.defaultOwner} placeholder="例如：王店长" /></label><label className="field"><span>每月计划维护</span><input name="monthlyMaintenanceTarget" type="number" min="1" max="100" defaultValue={settings.monthlyMaintenanceTarget} /></label><label className="field"><span>默认客户交接方式</span><input name="defaultHandoffMethod" defaultValue={settings.defaultHandoffMethod} placeholder="例如：推荐人征得同意后介绍双方联系" /></label><label className="field field-wide"><span>默认结果反馈与感谢方式</span><textarea name="defaultFeedbackPlan" rows={3} defaultValue={settings.defaultFeedbackPlan} placeholder="例如：收到推荐后当天确认，关键进展及时反馈并表达感谢" /></label><label className="field field-wide"><span>隐私提醒</span><textarea name="privacyReminder" rows={3} defaultValue={settings.privacyReminder} placeholder="例如：推荐人先征得客户同意，再提供必要联系方式" /></label></div><div className="douyin-security-note"><Check size={16} /><span>工作台不会读取手机或微信通讯录，不会自动发送邀请、群发消息或抓取推荐对象信息。</span></div><div className="dialog-foot"><button className="button button-primary" type="submit">保存设置<Check size={15} /></button></div></form>
  </>
}

function RelationDialog({ relation, defaultType, settings, tacticPack, onClose, onSubmit }: { relation?: ReferralRelation; defaultType: ReferralRelationType; settings: ReferralSettings; tacticPack?: GrowthTacticPack; onClose: () => void; onSubmit: (formData: FormData, relation?: ReferralRelation) => void }) {
  const [relationType, setRelationType] = useState<ReferralRelationType>(relation?.relationType || defaultType)
  const meta = relationMeta[relationType]
  const activeTactic = tacticPack?.recommendedRelationType === relationType ? tacticPack : undefined
  return <div className="dialog-backdrop" role="presentation"><form className="dialog douyin-dialog douyin-video-dialog" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget), relation) }}><div className="dialog-head"><div><h2>{relation ? '编辑推荐关系' : '新建推荐关系'}</h2><p>{activeTactic ? '先按当前合作获客路径明确项目、交接与反馈边界，再建立推荐关系。' : '记录真实关系和双方确认过的推荐方式，不默认对方一定愿意介绍客户。'}</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div><div className="form-grid">{activeTactic ? <div className="active-tactic-pack field-wide"><ClipboardCheck size={16} /><div><strong>{activeTactic.name}正在组织这段合作</strong><p>{activeTactic.primaryGoal}</p><p><b>主要动作：</b>{activeTactic.callToAction}</p></div><span>v{activeTactic.version}</span></div> : null}<fieldset className="field field-wide cover-mode-field"><legend>关系类型</legend><div className="wechat-action-choice referral-relation-choice">{relationTypes.map((type) => <label key={type} className={relationType === type ? 'selected' : ''}><input type="radio" name="relationType" value={type} checked={relationType === type} onChange={() => setRelationType(type)} /><span>{relationMeta[type].icon}</span><strong>{relationMeta[type].shortLabel}</strong></label>)}</div></fieldset><label className="field"><span>姓名或称呼</span><input name="name" required autoFocus defaultValue={relation?.name || ''} placeholder="推荐人或合作联系人" /></label><label className="field"><span>{meta.organizationLabel}</span><input name="organization" defaultValue={relation?.organization || ''} placeholder={relationType === '合作伙伴推荐' ? '例如：某设计工作室' : '例如：已服务客户 / 完工客户'} /></label><label className="field"><span>联系方式</span><input name="contact" defaultValue={relation?.contact || ''} placeholder="手机号或微信备注名" /></label><label className="field"><span>负责人</span><input name="owner" defaultValue={relation?.owner || settings.defaultOwner} placeholder="负责维护这段关系的人" /></label><label className="field field-wide"><span>{meta.basisLabel}</span><textarea name="relationshipBasis" rows={3} defaultValue={relation?.relationshipBasis || ''} placeholder="为什么适合建立推荐关系，双方已有怎样的了解或合作" /></label><label className="field field-wide"><span>适合推荐的场景</span><textarea name="referralScenario" rows={3} defaultValue={relation?.referralScenario || ''} placeholder="在什么情况下，对方会想到把客户介绍过来" /></label><label className="field field-wide"><span>理想客户</span><textarea name="idealCustomer" rows={3} defaultValue={relation?.idealCustomer || ''} placeholder="描述真正适合被介绍过来的客户，不写行业打法模板" /></label><label className="field field-wide"><span>双方价值</span><textarea name="cooperationValue" rows={3} defaultValue={relation?.cooperationValue || ''} placeholder="客户、推荐人和双方合作能获得什么真实价值" /></label><label className="field field-wide"><span>介绍说明</span><textarea name="introductionMessage" rows={4} defaultValue={relation?.introductionMessage || ''} placeholder="对方需要如何准确介绍你提供的服务和适合的客户" /></label><label className="field field-wide"><span>客户交接方式</span><input name="handoffMethod" defaultValue={relation?.handoffMethod || settings.defaultHandoffMethod} placeholder="例如：先征得客户同意，再介绍双方联系" /></label><label className="field field-wide"><span>结果反馈与感谢</span><textarea name="feedbackPlan" rows={3} defaultValue={relation?.feedbackPlan || settings.defaultFeedbackPlan} placeholder="收到推荐后如何确认、反馈进展并表达感谢" /></label><label className="field"><span>下一步动作</span><input name="nextAction" defaultValue={relation?.nextAction || ''} placeholder="例如：电话确认合作项目与客户交接方式" /></label><label className="field"><span>下一步日期</span><input name="nextDate" type="date" defaultValue={relation?.nextDate || ''} /></label><div className="field field-wide"><span>推荐关系检查</span><div className="douyin-form-checklist">{checklistItems.map((item) => <label key={item.key}><input type="checkbox" name={item.key} defaultChecked={relation?.checklist[item.key] || false} /><span>{item.label}</span></label>)}</div></div></div><div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onClose}>取消</button><button className="button button-primary" type="submit">保存<Check size={15} /></button></div></form></div>
}

function LogDialog({ relation, onClose, onSubmit }: { relation: ReferralRelation; onClose: () => void; onSubmit: (formData: FormData, relation: ReferralRelation) => void }) {
  return <div className="dialog-backdrop" role="presentation"><form className="dialog douyin-dialog" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget), relation) }}><div className="dialog-head"><div><h2>记录关系维护</h2><p>{relation.name} · {relationMeta[relation.relationType].shortLabel}</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div><div className="form-grid"><label className="field"><span>记录类型</span><select name="type" defaultValue="联系记录"><option>联系记录</option><option>收到推荐</option><option>结果反馈</option><option>感谢维护</option></select></label><label className="field"><span>记录日期</span><input name="date" type="date" defaultValue={todayISO()} /></label><label className="field field-wide"><span>记录内容</span><textarea name="content" rows={5} required autoFocus placeholder="记录发生了什么、对方的反馈以及需要注意的事情" /></label><label className="field"><span>下一步动作</span><input name="nextAction" defaultValue={relation.nextAction} placeholder="下一次需要做什么" /></label><label className="field"><span>下一步日期</span><input name="nextDate" type="date" defaultValue={relation.nextDate} /></label></div><div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onClose}>取消</button><button className="button button-primary" type="submit">保存记录<Check size={15} /></button></div></form></div>
}

function CompactEmpty({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return <div className="douyin-compact-empty"><span>{icon}</span><strong>{title}</strong>{description ? <p>{description}</p> : null}{action}</div>
}
