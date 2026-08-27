import { useMemo, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Link2,
  MapPin,
  MapPinned,
  Pencil,
  Plus,
  Settings2,
  Store,
  UserPlus,
  UsersRound,
  X,
} from 'lucide-react'
import type { GrowthTacticPack } from './tactic-packs'

export type OfflineActivityType = '社区活动' | '到店活动' | '展会地推'
export type OfflineTaskStatus = '策划中' | '准备中' | '待开始' | '进行中' | '已结束' | '已取消'
export type OfflineRunStatus = '待开始' | '进行中' | '已结束' | '已取消'

export type OfflineChecklist = {
  scheduleReady: boolean
  staffReady: boolean
  materialsReady: boolean
  processReady: boolean
  registrationReady: boolean
  followUpReady: boolean
}

export type OfflineTask = {
  id: string
  contentPackageId: string
  activityType: OfflineActivityType
  title: string
  goal: string
  audience: string
  location: string
  startAt: string
  endAt: string
  owner: string
  staffPlan: string
  materialChecklist: string
  onSiteProcess: string
  registrationMethod: string
  callToAction: string
  followUpPlan: string
  status: OfflineTaskStatus
  checklist: OfflineChecklist
  createdAt: string
}

export type OfflineRunRecord = {
  id: string
  taskId: string
  sourceCode: string
  status: OfflineRunStatus
  actualStartAt: string
  actualEndAt: string
  actualLocation: string
  executionNote: string
  updatedAt: string
}

export type OfflineMetrics = {
  runRecordId: string
  attendees: number
  registrations: number
  inquiries: number
  appointments: number
  updatedAt: string
}

export type OfflineSettings = {
  businessLabel: string
  defaultOwner: string
  defaultCallToAction: string
  monthlyTarget: number
  defaultFollowUpDays: number
  registrationReminder: string
}

export type OfflineData = {
  version: 1
  tasks: OfflineTask[]
  runRecords: OfflineRunRecord[]
  metrics: OfflineMetrics[]
  settings: OfflineSettings
}

export type OfflineLegacyTask = {
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
  viewCount?: number
  interactionCount?: number
  inquiryCount?: number
  createdAt?: string
}

export type OfflineCustomerRecord = {
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

type OfflineSection = 'overview' | 'activities' | 'onsite' | 'followup' | 'review' | 'settings'

const activityTypes: OfflineActivityType[] = ['社区活动', '到店活动', '展会地推']

const emptyChecklist: OfflineChecklist = {
  scheduleReady: false,
  staffReady: false,
  materialsReady: false,
  processReady: false,
  registrationReady: false,
  followUpReady: false,
}

const checklistItems: Array<{ key: keyof OfflineChecklist; label: string }> = [
  { key: 'scheduleReady', label: '时间地点已确认' },
  { key: 'staffReady', label: '人员分工已确认' },
  { key: 'materialsReady', label: '物料设备已准备' },
  { key: 'processReady', label: '现场流程已确认' },
  { key: 'registrationReady', label: '登记方式已测试' },
  { key: 'followUpReady', label: '后续跟进已安排' },
]

export const emptyOfflineData: OfflineData = {
  version: 1,
  tasks: [],
  runRecords: [],
  metrics: [],
  settings: {
    businessLabel: '',
    defaultOwner: '',
    defaultCallToAction: '',
    monthlyTarget: 2,
    defaultFollowUpDays: 1,
    registrationReminder: '',
  },
}

const sectionItems: Array<{ id: OfflineSection; label: string; icon: ReactNode }> = [
  { id: 'overview', label: '总览', icon: <MapPinned size={15} /> },
  { id: 'activities', label: '活动', icon: <CalendarDays size={15} /> },
  { id: 'onsite', label: '现场', icon: <ClipboardCheck size={15} /> },
  { id: 'followup', label: '跟进', icon: <UsersRound size={15} /> },
  { id: 'review', label: '复盘', icon: <BarChart3 size={15} /> },
  { id: 'settings', label: '设置', icon: <Settings2 size={15} /> },
]

const activityMeta: Record<OfflineActivityType, { shortLabel: string; prefix: string; icon: ReactNode; audienceLabel: string }> = {
  社区活动: { shortLabel: '社区', prefix: 'OFC', icon: <Building2 size={17} />, audienceLabel: '目标社区 / 人群' },
  到店活动: { shortLabel: '到店', prefix: 'OFS', icon: <Store size={17} />, audienceLabel: '邀约人群' },
  展会地推: { shortLabel: '展会地推', prefix: 'OFE', icon: <MapPin size={17} />, audienceLabel: '现场目标人群' },
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`
}

function createSourceCode(activityType: OfflineActivityType) {
  return `${activityMeta[activityType].prefix}-${todayISO().replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`
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

function normalizeActivityType(value: unknown): OfflineActivityType {
  return activityTypes.includes(value as OfflineActivityType) ? value as OfflineActivityType : '社区活动'
}

function normalizeChecklist(value: unknown): OfflineChecklist {
  const checklist = value && typeof value === 'object' ? value as Partial<OfflineChecklist> : {}
  return {
    scheduleReady: Boolean(checklist.scheduleReady),
    staffReady: Boolean(checklist.staffReady),
    materialsReady: Boolean(checklist.materialsReady),
    processReady: Boolean(checklist.processReady),
    registrationReady: Boolean(checklist.registrationReady),
    followUpReady: Boolean(checklist.followUpReady),
  }
}

function inferLegacyType(task: OfflineLegacyTask): OfflineActivityType {
  const value = `${stringValue(task.title)} ${stringValue(task.note)} ${stringValue(task.linkOrLocation)}`
  if (value.includes('到店') || value.includes('门店')) return '到店活动'
  if (value.includes('展会') || value.includes('地推') || value.includes('商场')) return '展会地推'
  return '社区活动'
}

function migrateLegacyStatus(status: string): OfflineTaskStatus {
  if (status === '执行中') return '进行中'
  if (status === '已完成') return '已结束'
  if (status === '已暂停') return '已取消'
  return '策划中'
}

function completeChecklist(status: string): OfflineChecklist {
  const completed = status === '执行中' || status === '已完成'
  return checklistItems.reduce((current, item) => ({ ...current, [item.key]: completed }), { ...emptyChecklist })
}

function migrateLegacyTasks(legacyTasks: OfflineLegacyTask[]): OfflineData {
  const legacy = legacyTasks.filter((task) => task.channelId === 'offline' && task.title)
  if (!legacy.length) return emptyOfflineData
  const tasks: OfflineTask[] = legacy.map((task, index) => ({
    id: `offline-task-legacy-${task.id || index}`,
    contentPackageId: stringValue(task.contentPackageId),
    activityType: inferLegacyType(task),
    title: stringValue(task.title),
    goal: stringValue(task.goal),
    audience: '',
    location: stringValue(task.linkOrLocation),
    startAt: stringValue(task.plannedDate),
    endAt: '',
    owner: stringValue(task.owner),
    staffPlan: '',
    materialChecklist: '',
    onSiteProcess: stringValue(task.note),
    registrationMethod: '',
    callToAction: stringValue(task.callToAction),
    followUpPlan: '',
    status: migrateLegacyStatus(stringValue(task.status)),
    checklist: completeChecklist(stringValue(task.status)),
    createdAt: stringValue(task.createdAt, todayISO()),
  }))
  const runRecords: OfflineRunRecord[] = legacy.flatMap((task, index) => {
    if (!['执行中', '已完成'].includes(stringValue(task.status))) return []
    return [{
      id: `offline-run-legacy-${task.id || index}`,
      taskId: tasks[index].id,
      sourceCode: stringValue(task.sourceCode, createSourceCode(tasks[index].activityType)),
      status: stringValue(task.status) === '已完成' ? '已结束' : '进行中',
      actualStartAt: stringValue(task.plannedDate),
      actualEndAt: stringValue(task.status) === '已完成' ? stringValue(task.plannedDate) : '',
      actualLocation: stringValue(task.linkOrLocation),
      executionNote: stringValue(task.note),
      updatedAt: stringValue(task.createdAt, todayISO()),
    } satisfies OfflineRunRecord]
  })
  const metrics: OfflineMetrics[] = runRecords.map((record) => {
    const taskIndex = tasks.findIndex((task) => task.id === record.taskId)
    const legacyTask = legacy[taskIndex]
    return {
      runRecordId: record.id,
      attendees: numberValue(legacyTask?.viewCount),
      registrations: numberValue(legacyTask?.interactionCount),
      inquiries: numberValue(legacyTask?.inquiryCount),
      appointments: 0,
      updatedAt: record.updatedAt,
    }
  })
  return { ...emptyOfflineData, tasks, runRecords, metrics }
}

export function normalizeOfflineData(value: unknown, legacyTasks: OfflineLegacyTask[] = []): OfflineData {
  if (!value || typeof value !== 'object') return migrateLegacyTasks(legacyTasks)
  const raw = value as Partial<OfflineData>
  const tasks = Array.isArray(raw.tasks) ? raw.tasks.filter((task) => task && typeof task.title === 'string').map((task) => ({
    id: stringValue(task.id, createId('offline-task')),
    contentPackageId: stringValue(task.contentPackageId),
    activityType: normalizeActivityType(task.activityType),
    title: stringValue(task.title),
    goal: stringValue(task.goal),
    audience: stringValue(task.audience),
    location: stringValue(task.location),
    startAt: stringValue(task.startAt),
    endAt: stringValue(task.endAt),
    owner: stringValue(task.owner),
    staffPlan: stringValue(task.staffPlan),
    materialChecklist: stringValue(task.materialChecklist),
    onSiteProcess: stringValue(task.onSiteProcess),
    registrationMethod: stringValue(task.registrationMethod),
    callToAction: stringValue(task.callToAction),
    followUpPlan: stringValue(task.followUpPlan),
    status: ['准备中', '待开始', '进行中', '已结束', '已取消'].includes(stringValue(task.status)) ? task.status as OfflineTaskStatus : '策划中',
    checklist: normalizeChecklist(task.checklist),
    createdAt: stringValue(task.createdAt, todayISO()),
  })) : []
  const runRecords = Array.isArray(raw.runRecords) ? raw.runRecords.filter((record) => record && typeof record.taskId === 'string').map((record) => ({
    id: stringValue(record.id, createId('offline-run')),
    taskId: stringValue(record.taskId),
    sourceCode: stringValue(record.sourceCode),
    status: ['进行中', '已结束', '已取消'].includes(stringValue(record.status)) ? record.status as OfflineRunStatus : '待开始',
    actualStartAt: stringValue(record.actualStartAt),
    actualEndAt: stringValue(record.actualEndAt),
    actualLocation: stringValue(record.actualLocation),
    executionNote: stringValue(record.executionNote),
    updatedAt: stringValue(record.updatedAt),
  })) : []
  const metrics = Array.isArray(raw.metrics) ? raw.metrics.filter((metric) => metric && typeof metric.runRecordId === 'string').map((metric) => ({
    runRecordId: stringValue(metric.runRecordId),
    attendees: numberValue(metric.attendees),
    registrations: numberValue(metric.registrations),
    inquiries: numberValue(metric.inquiries),
    appointments: numberValue(metric.appointments),
    updatedAt: stringValue(metric.updatedAt),
  })) : []
  const settings = raw.settings && typeof raw.settings === 'object' ? raw.settings : emptyOfflineData.settings
  return {
    version: 1,
    tasks,
    runRecords,
    metrics,
    settings: {
      businessLabel: stringValue(settings.businessLabel),
      defaultOwner: stringValue(settings.defaultOwner),
      defaultCallToAction: stringValue(settings.defaultCallToAction),
      monthlyTarget: numberValue(settings.monthlyTarget) || 2,
      defaultFollowUpDays: numberValue(settings.defaultFollowUpDays) || 1,
      registrationReminder: stringValue(settings.registrationReminder),
    },
  }
}

export function offlineSourceOptions(data: OfflineData) {
  return data.runRecords.filter((record) => record.status !== '已取消').map((record) => {
    const task = data.tasks.find((item) => item.id === record.taskId)
    const type = task?.activityType || '社区活动'
    return { id: record.id, label: `线下活动 · ${activityMeta[type].shortLabel} · ${task?.title || '未命名活动'} · ${record.sourceCode}` }
  })
}

function formatDateTime(value: string) {
  if (!value) return '未安排'
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: value.length > 10 ? '2-digit' : undefined, minute: value.length > 10 ? '2-digit' : undefined }).format(date)
}

function taskStatusTone(status: OfflineTaskStatus | OfflineRunStatus) {
  if (status === '已取消') return 'muted'
  if (status === '准备中' || status === '待开始') return 'amber'
  if (status === '进行中') return 'blue'
  if (status === '已结束') return 'teal'
  return 'neutral'
}

function checklistProgress(checklist: OfflineChecklist) {
  const completed = checklistItems.filter((item) => checklist[item.key]).length
  return { completed, total: checklistItems.length, done: completed === checklistItems.length }
}

function metricForRun(data: OfflineData, runRecordId: string): OfflineMetrics {
  return data.metrics.find((metric) => metric.runRecordId === runRecordId) || { runRecordId, attendees: 0, registrations: 0, inquiries: 0, appointments: 0, updatedAt: '' }
}

function sourceLabel(data: OfflineData, run: OfflineRunRecord) {
  return offlineSourceOptions(data).find((option) => option.id === run.id)?.label || `线下活动 · ${run.sourceCode}`
}

export function OfflineWorkspace({ data, records, tacticPack, onChange, onBack, onAddLead, onOpenRecord, onToast }: { data: OfflineData; records: OfflineCustomerRecord[]; tacticPack?: GrowthTacticPack; onChange: (updater: (current: OfflineData) => OfflineData) => void; onBack: () => void; onAddLead: (source?: string) => void; onOpenRecord: (record: OfflineCustomerRecord) => void; onToast: (message: string) => void }) {
  const [section, setSection] = useState<OfflineSection>('overview')
  const [activityView, setActivityView] = useState<OfflineActivityType>('社区活动')
  const [editingTask, setEditingTask] = useState<OfflineTask | null | undefined>(undefined)
  const [editingRunId, setEditingRunId] = useState<string | null>(null)
  const sourceCodes = data.runRecords.filter((record) => record.status !== '已取消').map((record) => record.sourceCode)
  const channelRecords = records.filter((record) => sourceCodes.some((source) => record.source.includes(source)))
  const activeRecords = channelRecords.filter((record) => record.stage !== 'lost')
  const nextTask = data.tasks.find((task) => task.status === '进行中') || data.tasks.find((task) => task.status === '待开始') || data.tasks.find((task) => task.status === '准备中') || data.tasks.find((task) => task.status === '策划中')
  const summary = useMemo(() => ({
    communities: data.tasks.filter((task) => task.activityType === '社区活动').length,
    stores: data.tasks.filter((task) => task.activityType === '到店活动').length,
    events: data.tasks.filter((task) => task.activityType === '展会地推').length,
    active: data.tasks.filter((task) => task.status === '待开始' || task.status === '进行中').length,
    leads: activeRecords.length,
  }), [activeRecords.length, data.tasks])

  const saveTask = (formData: FormData, task?: OfflineTask | null) => {
    const activityType = normalizeActivityType(formData.get('activityType'))
    const next: OfflineTask = {
      id: task?.id || createId('offline-task'),
      contentPackageId: task?.contentPackageId || tacticPack?.id || '',
      activityType,
      title: String(formData.get('title') || '').trim(),
      goal: String(formData.get('goal') || '').trim(),
      audience: String(formData.get('audience') || '').trim(),
      location: String(formData.get('location') || '').trim(),
      startAt: String(formData.get('startAt') || ''),
      endAt: String(formData.get('endAt') || ''),
      owner: String(formData.get('owner') || '').trim(),
      staffPlan: String(formData.get('staffPlan') || '').trim(),
      materialChecklist: String(formData.get('materialChecklist') || '').trim(),
      onSiteProcess: String(formData.get('onSiteProcess') || '').trim(),
      registrationMethod: String(formData.get('registrationMethod') || '').trim(),
      callToAction: String(formData.get('callToAction') || '').trim(),
      followUpPlan: String(formData.get('followUpPlan') || '').trim(),
      status: task?.status || '策划中',
      checklist: checklistItems.reduce((current, item) => ({ ...current, [item.key]: formData.get(item.key) === 'on' }), { ...emptyChecklist }),
      createdAt: task?.createdAt || todayISO(),
    }
    if (!next.title) return
    onChange((current) => ({ ...current, tasks: task ? current.tasks.map((item) => item.id === task.id ? next : item) : [next, ...current.tasks] }))
    setEditingTask(undefined)
    setActivityView(activityType)
    onToast(task ? '活动计划已更新' : '活动计划已建立')
  }

  const toggleChecklist = (task: OfflineTask, key: keyof OfflineChecklist) => {
    onChange((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, checklist: { ...item.checklist, [key]: !item.checklist[key] } } : item) }))
  }

  const advanceTask = (task: OfflineTask) => {
    if (task.status === '策划中') {
      onChange((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, status: '准备中' } : item) }))
      onToast('已进入活动准备')
      return
    }
    if (task.status === '准备中') {
      if (!checklistProgress(task.checklist).done) {
        onToast('先完成 6 项活动检查，再进入待开始')
        return
      }
      onChange((current) => {
        const exists = current.runRecords.some((record) => record.taskId === task.id)
        const run: OfflineRunRecord = { id: createId('offline-run'), taskId: task.id, sourceCode: createSourceCode(task.activityType), status: '待开始', actualStartAt: '', actualEndAt: '', actualLocation: task.location, executionNote: '', updatedAt: todayISO() }
        return { ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, status: '待开始' } : item), runRecords: exists ? current.runRecords : [run, ...current.runRecords] }
      })
      setSection('onsite')
      onToast('活动已准备好，现在可以登记提前预约')
      return
    }
    if (task.status === '待开始') {
      onChange((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, status: '进行中' } : item), runRecords: current.runRecords.map((record) => record.taskId === task.id ? { ...record, status: '进行中', actualStartAt: record.actualStartAt || new Date().toISOString().slice(0, 16), updatedAt: todayISO() } : record) }))
      setSection('onsite')
      onToast('活动已开始，可以持续登记现场客户')
      return
    }
    if (task.status === '进行中') {
      const run = data.runRecords.find((record) => record.taskId === task.id)
      if (run) setEditingRunId(run.id)
    }
  }

  const saveRun = (formData: FormData, run: OfflineRunRecord) => {
    const status = String(formData.get('status') || run.status) as OfflineRunStatus
    const nextRun: OfflineRunRecord = {
      ...run,
      status,
      actualStartAt: String(formData.get('actualStartAt') || ''),
      actualEndAt: String(formData.get('actualEndAt') || ''),
      actualLocation: String(formData.get('actualLocation') || '').trim(),
      executionNote: String(formData.get('executionNote') || '').trim(),
      updatedAt: todayISO(),
    }
    const nextMetrics: OfflineMetrics = {
      runRecordId: run.id,
      attendees: formNumber(formData.get('attendees')),
      registrations: formNumber(formData.get('registrations')),
      inquiries: formNumber(formData.get('inquiries')),
      appointments: formNumber(formData.get('appointments')),
      updatedAt: todayISO(),
    }
    onChange((current) => ({
      ...current,
      runRecords: current.runRecords.map((item) => item.id === run.id ? nextRun : item),
      metrics: current.metrics.some((item) => item.runRecordId === run.id) ? current.metrics.map((item) => item.runRecordId === run.id ? nextMetrics : item) : [nextMetrics, ...current.metrics],
      tasks: current.tasks.map((task) => task.id === run.taskId ? { ...task, status: status === '已结束' ? '已结束' : status === '进行中' ? '进行中' : status === '已取消' ? '已取消' : '待开始' } : task),
    }))
    setEditingRunId(null)
    if (status === '已结束') setSection('followup')
    onToast(status === '已结束' ? '活动已结束，请及时推进登记客户' : '现场记录已更新')
  }

  const saveSettings = (formData: FormData) => {
    onChange((current) => ({ ...current, settings: {
      businessLabel: String(formData.get('businessLabel') || '').trim(),
      defaultOwner: String(formData.get('defaultOwner') || '').trim(),
      defaultCallToAction: String(formData.get('defaultCallToAction') || '').trim(),
      monthlyTarget: formNumber(formData.get('monthlyTarget')) || 2,
      defaultFollowUpDays: formNumber(formData.get('defaultFollowUpDays')) || 1,
      registrationReminder: String(formData.get('registrationReminder') || '').trim(),
    } }))
    onToast('线下活动设置已保存')
  }

  const renderSection = () => {
    if (section === 'activities') return <ActivitiesSection data={data} view={activityView} onView={setActivityView} onNewTask={(type) => { setActivityView(type); setEditingTask(null) }} onEditTask={setEditingTask} onToggleChecklist={toggleChecklist} onAdvanceTask={advanceTask} />
    if (section === 'onsite') return <OnsiteSection data={data} records={channelRecords} onAdvanceTask={advanceTask} onEditRun={setEditingRunId} onAddLead={onAddLead} />
    if (section === 'followup') return <FollowupSection data={data} records={channelRecords} onAddLead={onAddLead} onOpenRecord={onOpenRecord} />
    if (section === 'review') return <ReviewSection data={data} records={channelRecords} />
    if (section === 'settings') return <SettingsSection settings={data.settings} onSave={saveSettings} />
    return <OverviewSection data={data} summary={summary} records={activeRecords} nextTask={nextTask} onOpenActivities={(type) => { setActivityView(type); setSection('activities') }} onOpenTask={(task) => { setEditingTask(task); setSection('activities') }} onAdvanceTask={advanceTask} onOpenOnsite={() => setSection('onsite')} onOpenFollowup={() => setSection('followup')} />
  }

  const editingRun = editingRunId ? data.runRecords.find((record) => record.id === editingRunId) : undefined
  return <div className="offline-workspace">
    <header className="page-header"><div><h1>线下活动</h1><p>从活动计划、现场登记到后续跟进，把每一场社区、到店或展会活动的客户结果留在同一条链路里。</p></div><div className="page-action"><button className="button button-secondary" onClick={onBack}><ChevronLeft size={16} />返回获客</button></div></header>
    <nav className="douyin-module-tabs" aria-label="线下活动工作区">{sectionItems.map((item) => { const badge = item.id === 'onsite' ? data.tasks.filter((task) => task.status === '待开始' || task.status === '进行中').length : item.id === 'followup' ? activeRecords.filter((record) => record.nextAction || record.nextDate).length : 0; return <button key={item.id} type="button" className={section === item.id ? 'active' : ''} onClick={() => setSection(item.id)}>{item.icon}<span>{item.label}</span>{badge > 0 ? <b>{badge}</b> : null}</button> })}</nav>
    {section === 'overview' ? <CommandBand nextTask={nextTask} onNew={() => setEditingTask(null)} onAdvance={advanceTask} /> : null}
    {renderSection()}
    {editingTask !== undefined ? <TaskDialog task={editingTask || undefined} defaultType={activityView} settings={data.settings} tacticPack={tacticPack} onClose={() => setEditingTask(undefined)} onSubmit={saveTask} /> : null}
    {editingRun ? <RunDialog run={editingRun} task={data.tasks.find((task) => task.id === editingRun.taskId)} metrics={metricForRun(data, editingRun.id)} onClose={() => setEditingRunId(null)} onSubmit={saveRun} /> : null}
  </div>
}

function CommandBand({ nextTask, onNew, onAdvance }: { nextTask?: OfflineTask; onNew: () => void; onAdvance: (task: OfflineTask) => void }) {
  const action = nextTask?.status === '策划中' ? '补充安排并进入准备' : nextTask?.status === '准备中' ? '完成活动准备检查' : nextTask?.status === '待开始' ? '核对现场并开始活动' : nextTask?.status === '进行中' ? '登记客户并完成现场记录' : '建立第一场线下活动'
  return <section className="douyin-command-band"><div><span>当前优先推进</span><h2>{nextTask?.title || '安排下一场线下活动'}</h2><p>{nextTask ? action : '建立新的活动计划并明确现场登记与跟进方式'}</p></div>{nextTask ? <button className="button button-primary" onClick={() => onAdvance(nextTask)}>{nextTask.status === '策划中' ? '开始准备' : nextTask.status === '准备中' ? '进入待开始' : nextTask.status === '待开始' ? '开始活动' : '完成现场记录'}<ArrowRight size={15} /></button> : <button className="button button-primary" onClick={onNew}><Plus size={15} />新建活动</button>}</section>
}

function OverviewSection({ data, summary, records, nextTask, onOpenActivities, onOpenTask, onAdvanceTask, onOpenOnsite, onOpenFollowup }: { data: OfflineData; summary: { communities: number; stores: number; events: number; active: number; leads: number }; records: OfflineCustomerRecord[]; nextTask?: OfflineTask; onOpenActivities: (type: OfflineActivityType) => void; onOpenTask: (task: OfflineTask) => void; onAdvanceTask: (task: OfflineTask) => void; onOpenOnsite: () => void; onOpenFollowup: () => void }) {
  const recent = [...data.tasks].sort((left, right) => (left.startAt || '9999').localeCompare(right.startAt || '9999')).slice(0, 5)
  return <>
    <section className="douyin-overview-strip"><button onClick={() => onOpenActivities('社区活动')}><Building2 size={17} /><span>社区活动</span><strong>{summary.communities}</strong><small>社区咨询与现场服务</small></button><button onClick={() => onOpenActivities('到店活动')}><Store size={17} /><span>到店活动</span><strong>{summary.stores}</strong><small>体验、讲解与预约</small></button><button onClick={() => onOpenActivities('展会地推')}><MapPin size={17} /><span>展会地推</span><strong>{summary.events}</strong><small>展会、商场与地推</small></button><button onClick={onOpenOnsite}><ClipboardCheck size={17} /><span>待开始 / 进行中</span><strong>{summary.active}</strong><small>现场登记已开放</small></button><button onClick={onOpenFollowup}><UsersRound size={17} /><span>活动线索</span><strong>{summary.leads}</strong><small>{records.filter((record) => record.stage === 'intent' || record.stage === 'customer').length} 个进入意向</small></button></section>
    <section className="douyin-overview-grid"><div className="work-panel"><div className="section-heading-row"><div><h2>近期活动</h2><p>按计划时间查看接下来需要推进的活动。</p></div><button className="text-button" onClick={() => onOpenActivities(nextTask?.activityType || '社区活动')}>查看全部</button></div>{recent.length ? <div className="douyin-plan-list offline-plan-list">{recent.map((task) => <button key={task.id} onClick={() => onOpenTask(task)}><span className="offline-activity-icon">{activityMeta[task.activityType].icon}</span><div><strong>{task.title}</strong><span>{activityMeta[task.activityType].shortLabel} · {task.location || '未填写地点'}</span></div><time>{formatDateTime(task.startAt)}</time><ChevronRight size={15} /></button>)}</div> : <CompactEmpty icon={<CalendarDays size={22} />} title="还没有线下活动" action={<button className="button button-primary" onClick={() => onOpenActivities('社区活动')}><Plus size={15} />新建活动</button>} />}</div><aside className="work-panel quiet-panel"><div className="section-heading-row"><div><h2>活动结果</h2><p>业务结果由现场来源和客户阶段自动统计。</p></div></div><div className="douyin-source-summary"><div><span>线索</span><strong>{records.length}</strong></div><div><span>意向客户</span><strong>{records.filter((record) => record.stage === 'intent' || record.stage === 'customer').length}</strong></div><div><span>客户</span><strong>{records.filter((record) => record.stage === 'customer').length}</strong></div></div>{nextTask ? <button className="button button-secondary" onClick={() => onAdvanceTask(nextTask)}>推进下一步<ArrowRight size={15} /></button> : null}</aside></section>
  </>
}

function ActivitiesSection({ data, view, onView, onNewTask, onEditTask, onToggleChecklist, onAdvanceTask }: { data: OfflineData; view: OfflineActivityType; onView: (view: OfflineActivityType) => void; onNewTask: (type: OfflineActivityType) => void; onEditTask: (task: OfflineTask) => void; onToggleChecklist: (task: OfflineTask, key: keyof OfflineChecklist) => void; onAdvanceTask: (task: OfflineTask) => void }) {
  const tasks = data.tasks.filter((task) => task.activityType === view)
  return <>
    <div className="douyin-section-head"><div><h2>活动</h2><p>三类线下场景共用计划、准备、登记、跟进和复盘能力。</p></div><button className="button button-primary" onClick={() => onNewTask(view)}><Plus size={15} />新建{activityMeta[view].shortLabel}</button></div>
    <div className="segmented-control douyin-subtabs offline-activity-tabs" role="tablist" aria-label="线下活动类型">{activityTypes.map((type) => <button key={type} className={view === type ? 'active' : ''} onClick={() => onView(type)}>{activityMeta[type].shortLabel} <b>{data.tasks.filter((task) => task.activityType === type).length}</b></button>)}</div>
    <section className="douyin-task-board">{tasks.length ? tasks.map((task) => { const progress = checklistProgress(task.checklist); return <article className="douyin-video-item" key={task.id}><div className="douyin-video-item-head"><div><span>{activityMeta[task.activityType].shortLabel}</span><h3>{task.title}</h3><p>{task.location || task.audience || '打开活动计划补充地点和目标人群。'}</p></div><span className={`status-pill ${taskStatusTone(task.status)}`}>{task.status}</span></div><div className="douyin-progress-line"><span><b>{progress.completed}</b> / {progress.total} 项完成</span><div><i style={{ width: `${(progress.completed / progress.total) * 100}%` }} /></div></div><div className="douyin-checklist">{checklistItems.map((item) => <label key={item.key}><input type="checkbox" checked={task.checklist[item.key]} onChange={() => onToggleChecklist(task, item.key)} /><span>{item.label}</span></label>)}</div><div className="douyin-video-item-foot"><button className="button button-secondary small" onClick={() => onEditTask(task)}><Pencil size={14} />编辑</button>{task.status !== '已结束' && task.status !== '已取消' ? <button className="button button-primary small" onClick={() => onAdvanceTask(task)}>{task.status === '策划中' ? '开始准备' : task.status === '准备中' ? '进入待开始' : task.status === '待开始' ? '开始活动' : '完成现场记录'}<ArrowRight size={14} /></button> : null}</div></article> }) : <CompactEmpty icon={activityMeta[view].icon} title={`还没有${activityMeta[view].shortLabel}活动`} description="先建立一场活动，再逐项完成现场准备。" action={<button className="button button-primary" onClick={() => onNewTask(view)}><Plus size={15} />新建活动</button>} />}</section>
  </>
}

function OnsiteSection({ data, records, onAdvanceTask, onEditRun, onAddLead }: { data: OfflineData; records: OfflineCustomerRecord[]; onAdvanceTask: (task: OfflineTask) => void; onEditRun: (id: string) => void; onAddLead: (source?: string) => void }) {
  const runs = data.runRecords.filter((run) => run.status !== '已取消')
  return <>
    <div className="douyin-section-head"><div><h2>现场</h2><p>来源编号在活动准备完成后开放，可登记提前预约和现场客户。</p></div></div>
    <section className="douyin-publish-list">{runs.length ? runs.map((run) => { const task = data.tasks.find((item) => item.id === run.taskId); const metric = metricForRun(data, run.id); const linked = records.filter((record) => record.source.includes(run.sourceCode)); return <article className="douyin-publish-row offline-run-row" key={run.id}><div className="douyin-publish-main"><span className={`status-pill ${taskStatusTone(run.status)}`}>{run.status}</span><div><strong>{task?.title || '未命名活动'}</strong><span>{task ? `${activityMeta[task.activityType].shortLabel} · ${task.location || '未填写地点'}` : '线下活动'}</span><small>{run.status === '已结束' ? `${metric.attendees} 到场 · ${metric.registrations} 登记 · ${metric.appointments} 预约` : `${linked.length} 条客户记录 · ${run.sourceCode}`}</small></div></div><div className="douyin-publish-meta"><span>{task ? formatDateTime(task.startAt) : '未安排'}</span><span>{run.sourceCode}</span></div><div className="douyin-publish-actions"><button className="button button-secondary small" onClick={() => onAddLead(sourceLabel(data, run))}><UserPlus size={14} />登记客户</button>{task && task.status === '待开始' ? <button className="button button-primary small" onClick={() => onAdvanceTask(task)}>开始活动<ArrowRight size={14} /></button> : <button className="button button-primary small" onClick={() => onEditRun(run.id)}>{run.status === '进行中' ? '结束 / 更新' : '查看记录'}<ChevronRight size={14} /></button>}</div></article> }) : <CompactEmpty icon={<ClipboardCheck size={23} />} title="还没有可执行的活动" description="完成六项准备检查后，活动来源和现场登记入口会出现在这里。" />}</section>
  </>
}

function FollowupSection({ data, records, onAddLead, onOpenRecord }: { data: OfflineData; records: OfflineCustomerRecord[]; onAddLead: (source?: string) => void; onOpenRecord: (record: OfflineCustomerRecord) => void }) {
  const runs = data.runRecords.filter((run) => run.status !== '已取消')
  const active = records.filter((record) => record.stage !== 'lost').sort((left, right) => (left.nextDate || '9999').localeCompare(right.nextDate || '9999'))
  return <>
    <div className="douyin-section-head"><div><h2>跟进</h2><p>现场登记只是开始，联系方式、需求和下一步日期才决定客户能否继续推进。</p></div><button className="button button-primary" onClick={() => onAddLead()}><Plus size={15} />补登记客户</button></div>
    <section className="douyin-inquiry-summary"><div><span>活动线索</span><strong>{active.length}</strong><small>待判断或正在推进</small></div><div><span>已安排下一步</span><strong>{active.filter((record) => record.nextAction || record.nextDate).length}</strong><small>已有明确跟进动作</small></div><div><span>进入意向 / 客户</span><strong>{active.filter((record) => record.stage === 'intent' || record.stage === 'customer').length}</strong><small>已经产生业务进展</small></div></section>
    <section className="douyin-inquiry-grid"><div className="work-panel"><div className="section-heading-row"><div><h2>按活动补登记</h2><p>选择客户实际参加或预约的那场活动。</p></div></div>{runs.length ? <div className="douyin-source-video-list">{runs.map((run) => { const task = data.tasks.find((item) => item.id === run.taskId); const count = records.filter((record) => record.source.includes(run.sourceCode)).length; return <div key={run.id}><div><strong>{task?.title || '未命名活动'}</strong><span>{run.sourceCode} · 已登记 {count} 条</span></div><button className="button button-secondary small" onClick={() => onAddLead(sourceLabel(data, run))}><Plus size={14} />登记客户</button></div> })}</div> : <CompactEmpty icon={<Link2 size={22} />} title="还没有活动来源" description="活动进入待开始后即可登记提前预约和现场客户。" />}</div><div className="work-panel"><div className="section-heading-row"><div><h2>待推进客户</h2><p>打开客户档案补充联系结果和下一步。</p></div></div>{active.length ? <div className="douyin-lead-list offline-followup-list">{active.slice(0, 10).map((record) => <button key={record.id} onClick={() => onOpenRecord(record)}><span className={`stage-dot ${record.stage}`}></span><div><strong>{record.name}</strong><span>{record.contact || record.need || '未填写联系方式或需求'}</span></div><span className="status-pill neutral">{record.nextDate ? formatDateTime(record.nextDate) : record.status}</span><ChevronRight size={14} /></button>)}</div> : <CompactEmpty icon={<UsersRound size={22} />} title="还没有活动客户" description="收到预约或现场咨询后，从活动来源登记客户。" />}</div></section>
  </>
}

function ReviewSection({ data, records }: { data: OfflineData; records: OfflineCustomerRecord[] }) {
  const completed = data.runRecords.filter((run) => run.status === '已结束')
  const totals = data.metrics.reduce((current, metric) => ({ attendees: current.attendees + metric.attendees, registrations: current.registrations + metric.registrations, inquiries: current.inquiries + metric.inquiries, appointments: current.appointments + metric.appointments }), { attendees: 0, registrations: 0, inquiries: 0, appointments: 0 })
  const active = records.filter((record) => record.stage !== 'lost')
  return <>
    <div className="douyin-section-head"><div><h2>复盘</h2><p>把现场数字和后续客户结果放在一起，判断哪类活动真正值得继续。</p></div></div>
    <section className="douyin-review-summary"><div><span>客户</span><strong>{active.filter((record) => record.stage === 'customer').length}</strong></div><div><span>进入意向</span><strong>{active.filter((record) => record.stage === 'intent' || record.stage === 'customer').length}</strong></div><div><span>有效线索</span><strong>{active.length}</strong></div><div><span>现场咨询</span><strong>{totals.inquiries}</strong></div><div><span>登记人数</span><strong>{totals.registrations}</strong></div><div><span>到场人数</span><strong>{totals.attendees}</strong></div></section>
    <section className="table-panel douyin-data-panel">{completed.length ? <div className="table-scroll"><table><thead><tr><th>活动</th><th>类型</th><th>到场 / 登记</th><th>预约</th><th>线索</th><th>进入意向</th><th>客户</th></tr></thead><tbody>{completed.map((run) => { const task = data.tasks.find((item) => item.id === run.taskId); const metric = metricForRun(data, run.id); const linked = records.filter((record) => record.source.includes(run.sourceCode) && record.stage !== 'lost'); return <tr key={run.id}><td><div className="source-cell"><b>{task?.title || '未命名活动'}</b><span>{run.sourceCode}</span></div></td><td>{task ? activityMeta[task.activityType].shortLabel : '线下活动'}</td><td>{metric.attendees} / {metric.registrations}</td><td>{metric.appointments}</td><td>{linked.length}</td><td>{linked.filter((record) => record.stage === 'intent' || record.stage === 'customer').length}</td><td>{linked.filter((record) => record.stage === 'customer').length}</td></tr> })}</tbody></table></div> : <CompactEmpty icon={<BarChart3 size={23} />} title="还没有可复盘的活动" description="活动结束并回填现场结果后，这里会把现场数据和客户结果连接起来。" />}</section>
  </>
}

function SettingsSection({ settings, onSave }: { settings: OfflineSettings; onSave: (formData: FormData) => void }) {
  return <>
    <div className="douyin-section-head"><div><h2>设置</h2><p>保存活动安排需要的默认信息，不导入名单，也不采集与后续服务无关的个人资料。</p></div></div>
    <form className="work-panel douyin-settings-form" onSubmit={(event) => { event.preventDefault(); onSave(new FormData(event.currentTarget)) }}><div className="form-grid"><label className="field"><span>业务备注名称</span><input name="businessLabel" defaultValue={settings.businessLabel} placeholder="例如：线下活动组" /></label><label className="field"><span>默认负责人</span><input name="defaultOwner" defaultValue={settings.defaultOwner} placeholder="例如：王店长" /></label><label className="field"><span>每月计划活动</span><input name="monthlyTarget" type="number" min="1" max="30" defaultValue={settings.monthlyTarget} /></label><label className="field"><span>默认跟进时限</span><input name="defaultFollowUpDays" type="number" min="1" max="30" defaultValue={settings.defaultFollowUpDays} /></label><label className="field field-wide"><span>默认行动引导</span><input name="defaultCallToAction" defaultValue={settings.defaultCallToAction} placeholder="例如：登记需求并预约下一次沟通" /></label><label className="field field-wide"><span>现场登记提醒</span><textarea name="registrationReminder" rows={4} defaultValue={settings.registrationReminder} placeholder="例如：说明登记用途，只记录后续联系必需的信息" /></label></div><div className="douyin-security-note"><Check size={16} /><span>工作台不会自动获取小区住户、展会观众或门店访客名单，也不会在客户不知情时批量导入个人资料。</span></div><div className="dialog-foot"><button className="button button-primary" type="submit">保存设置<Check size={15} /></button></div></form>
  </>
}

function TaskDialog({ task, defaultType, settings, tacticPack, onClose, onSubmit }: { task?: OfflineTask; defaultType: OfflineActivityType; settings: OfflineSettings; tacticPack?: GrowthTacticPack; onClose: () => void; onSubmit: (formData: FormData, task?: OfflineTask) => void }) {
  const [activityType, setActivityType] = useState<OfflineActivityType>(task?.activityType || defaultType)
  return <div className="dialog-backdrop" role="presentation"><form className="dialog douyin-dialog douyin-video-dialog" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget), task) }}><div className="dialog-head"><div><h2>{task ? '编辑活动计划' : '新建活动计划'}</h2><p>{tacticPack ? '先把本次活动按当前获客路径组织好，再明确现场安排和跟进方式。' : '先明确目标、对象、现场安排和跟进方式。'}</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div><div className="form-grid">{tacticPack ? <div className="active-tactic-pack field-wide"><ClipboardCheck size={16} /><div><strong>{tacticPack.name}正在组织这场活动</strong><p>{tacticPack.primaryGoal}</p><p><b>主要动作：</b>{tacticPack.callToAction}</p></div><span>v{tacticPack.version}</span></div> : null}<fieldset className="field field-wide cover-mode-field"><legend>活动类型</legend><div className="wechat-action-choice offline-activity-choice">{activityTypes.map((type) => <label key={type} className={activityType === type ? 'selected' : ''}><input type="radio" name="activityType" value={type} checked={activityType === type} onChange={() => setActivityType(type)} /><span>{activityMeta[type].icon}</span><strong>{activityMeta[type].shortLabel}</strong></label>)}</div></fieldset><label className="field field-wide"><span>活动主题</span><input name="title" required autoFocus defaultValue={task?.title || ''} placeholder="例如：周末老房卫生间现场咨询日" /></label><label className="field"><span>活动目标</span><input name="goal" defaultValue={task?.goal || ''} placeholder="例如：验证是否带来愿意补全改造需求的咨询" /></label><label className="field"><span>{activityMeta[activityType].audienceLabel}</span><input name="audience" defaultValue={task?.audience || ''} placeholder="这场活动主要服务谁" /></label><label className="field field-wide"><span>活动地点</span><input name="location" defaultValue={task?.location || ''} placeholder="填写能让执行人员找到的地点" /></label><label className="field"><span>计划开始</span><input name="startAt" type="datetime-local" defaultValue={task?.startAt || ''} /></label><label className="field"><span>计划结束</span><input name="endAt" type="datetime-local" defaultValue={task?.endAt || ''} /></label><label className="field"><span>负责人</span><input name="owner" defaultValue={task?.owner || settings.defaultOwner} placeholder="例如：王店长" /></label><label className="field"><span>行动引导</span><input name="callToAction" defaultValue={task?.callToAction || tacticPack?.callToAction || settings.defaultCallToAction} placeholder="现场客户接下来应该做什么" /></label><label className="field field-wide"><span>人员分工</span><textarea name="staffPlan" rows={3} defaultValue={task?.staffPlan || ''} placeholder="谁负责接待、讲解、登记、现场协调" /></label><label className="field field-wide"><span>物料与设备</span><textarea name="materialChecklist" rows={3} defaultValue={task?.materialChecklist || ''} placeholder="列出展架、样品、桌椅、电源、登记设备等" /></label><label className="field field-wide"><span>现场流程</span><textarea name="onSiteProcess" rows={4} defaultValue={task?.onSiteProcess || ''} placeholder="客户到场后依次经历什么，哪个环节完成登记和预约" /></label><label className="field field-wide"><span>登记方式</span><input name="registrationMethod" defaultValue={task?.registrationMethod || ''} placeholder="例如：工作人员现场录入工作台 / 使用自有表单后补录" /></label><label className="field field-wide"><span>活动后跟进</span><textarea name="followUpPlan" rows={3} defaultValue={task?.followUpPlan || ''} placeholder={`例如：活动后 ${settings.defaultFollowUpDays} 天内人工确认需求并安排下一步`} /></label><div className="field field-wide"><span>活动准备检查</span><div className="douyin-form-checklist">{checklistItems.map((item) => <label key={item.key}><input type="checkbox" name={item.key} defaultChecked={task?.checklist[item.key] || false} /><span>{item.label}</span></label>)}</div></div></div><div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onClose}>取消</button><button className="button button-primary" type="submit">保存<Check size={15} /></button></div></form></div>
}

function RunDialog({ run, task, metrics, onClose, onSubmit }: { run: OfflineRunRecord; task?: OfflineTask; metrics: OfflineMetrics; onClose: () => void; onSubmit: (formData: FormData, run: OfflineRunRecord) => void }) {
  return <div className="dialog-backdrop" role="presentation"><form className="dialog douyin-dialog" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget), run) }}><div className="dialog-head"><div><h2>{run.status === '进行中' ? '完成现场记录' : '更新活动记录'}</h2><p>{task?.title || '线下活动'}。只填写现场能够确认的真实结果。</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div><div className="form-grid"><label className="field"><span>活动状态</span><select name="status" defaultValue={run.status}><option>待开始</option><option>进行中</option><option>已结束</option><option>已取消</option></select></label><label className="field"><span>实际地点</span><input name="actualLocation" defaultValue={run.actualLocation} /></label><label className="field"><span>实际开始</span><input name="actualStartAt" type="datetime-local" defaultValue={run.actualStartAt} /></label><label className="field"><span>实际结束</span><input name="actualEndAt" type="datetime-local" defaultValue={run.actualEndAt} /></label><div className="field field-wide source-code-field"><span>活动来源编号</span><div><Link2 size={15} /><strong>{run.sourceCode}</strong><small>用于提前预约、现场登记和后续来源归因。</small></div></div><div className="douyin-form-section field-wide"><strong>现场结果</strong><span>登记人数可以和工作台客户记录核对，不用编造预计数据。</span></div><label className="field"><span>到场人数</span><input name="attendees" type="number" min="0" defaultValue={metrics.attendees || ''} /></label><label className="field"><span>登记人数</span><input name="registrations" type="number" min="0" defaultValue={metrics.registrations || ''} /></label><label className="field"><span>现场咨询</span><input name="inquiries" type="number" min="0" defaultValue={metrics.inquiries || ''} /></label><label className="field"><span>预约下一步</span><input name="appointments" type="number" min="0" defaultValue={metrics.appointments || ''} /></label><label className="field field-wide"><span>现场记录</span><textarea name="executionNote" rows={5} defaultValue={run.executionNote} placeholder="记录现场变化、客户常问问题和下一次需要调整的地方" /></label></div><div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onClose}>取消</button><button className="button button-primary" type="submit">保存记录<Check size={15} /></button></div></form></div>
}

function CompactEmpty({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return <div className="douyin-compact-empty"><span>{icon}</span><strong>{title}</strong>{description ? <p>{description}</p> : null}{action}</div>
}
