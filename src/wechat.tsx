import { useMemo, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Copy,
  Image,
  LayoutDashboard,
  Link2,
  MessageCircleMore,
  MessagesSquare,
  Pencil,
  PlaySquare,
  Plus,
  Send,
  Settings2,
  UsersRound,
  Video,
  X,
} from 'lucide-react'

export type WechatActionType = '朋友圈触达' | '视频号内容' | '社群触达'
export type WechatTaskStatus = '准备中' | '制作中' | '待执行' | '已完成' | '已暂停'
export type WechatExecutionStatus = '待执行' | '已执行' | '已撤回' | '其他'

export type WechatChecklist = {
  audienceReady: boolean
  contentReady: boolean
  materialsReady: boolean
  ctaReady: boolean
  scopeChecked: boolean
  executionChecked: boolean
}

export type WechatTask = {
  id: string
  contentPackageId: string
  actionType: WechatActionType
  title: string
  goal: string
  audience: string
  opening: string
  contentBody: string
  callToAction: string
  assetChecklist: string
  owner: string
  plannedAt: string
  status: WechatTaskStatus
  checklist: WechatChecklist
  createdAt: string
}

export type WechatExecutionRecord = {
  id: string
  taskId: string
  finalContent: string
  plannedAt: string
  executedAt: string
  reference: string
  sourceCode: string
  status: WechatExecutionStatus
  metricUpdatedAt: string
}

export type WechatMetrics = {
  executionRecordId: string
  views: number
  likes: number
  comments: number
  shares: number
  replies: number
  inquiries: number
  updatedAt: string
}

export type WechatSettings = {
  accountLabel: string
  defaultOwner: string
  defaultCallToAction: string
  weeklyTarget: number
  forbiddenExpressions: string
}

export type WechatData = {
  version: 1
  tasks: WechatTask[]
  executionRecords: WechatExecutionRecord[]
  metrics: WechatMetrics[]
  settings: WechatSettings
}

export type WechatLegacyTask = {
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
  videoFormat?: string
  openingHook?: string
  scriptOutline?: string
  shootingChecklist?: string
  viewCount?: number
  interactionCount?: number
  inquiryCount?: number
  createdAt?: string
}

export type WechatCustomerRecord = {
  id: string
  name: string
  source: string
  need: string
  stage: 'lead' | 'intent' | 'customer' | 'lost'
  status: string
  owner: string
  nextAction: string
  nextDate: string
}

type WechatSection = 'overview' | 'actions' | 'execution' | 'inquiries' | 'review' | 'settings'
type ExecutionView = 'pending' | 'history'

const actionTypes: WechatActionType[] = ['朋友圈触达', '视频号内容', '社群触达']

const emptyChecklist: WechatChecklist = {
  audienceReady: false,
  contentReady: false,
  materialsReady: false,
  ctaReady: false,
  scopeChecked: false,
  executionChecked: false,
}

const checklistItems: Array<{ key: keyof WechatChecklist; label: string }> = [
  { key: 'audienceReady', label: '目标人群已明确' },
  { key: 'contentReady', label: '内容已确认' },
  { key: 'materialsReady', label: '素材 / 资料已准备' },
  { key: 'ctaReady', label: '行动引导已确认' },
  { key: 'scopeChecked', label: '触达范围与时间已检查' },
  { key: 'executionChecked', label: '执行内容已检查' },
]

export const emptyWechatData: WechatData = {
  version: 1,
  tasks: [],
  executionRecords: [],
  metrics: [],
  settings: {
    accountLabel: '',
    defaultOwner: '',
    defaultCallToAction: '',
    weeklyTarget: 3,
    forbiddenExpressions: '',
  },
}

const sectionItems: Array<{ id: WechatSection; label: string; icon: ReactNode }> = [
  { id: 'overview', label: '总览', icon: <LayoutDashboard size={15} /> },
  { id: 'actions', label: '触达', icon: <Send size={15} /> },
  { id: 'execution', label: '执行', icon: <ClipboardCheck size={15} /> },
  { id: 'inquiries', label: '咨询', icon: <MessageCircleMore size={15} /> },
  { id: 'review', label: '复盘', icon: <BarChart3 size={15} /> },
  { id: 'settings', label: '设置', icon: <Settings2 size={15} /> },
]

const actionMeta: Record<WechatActionType, { shortLabel: string; prefix: string; icon: ReactNode; openingLabel: string; bodyLabel: string; assetLabel: string; audienceLabel: string }> = {
  朋友圈触达: { shortLabel: '朋友圈', prefix: 'WXM', icon: <Image size={17} />, openingLabel: '首行文案', bodyLabel: '朋友圈文案', assetLabel: '图片 / 视频清单', audienceLabel: '可见人群' },
  视频号内容: { shortLabel: '视频号', prefix: 'WXV', icon: <Video size={17} />, openingLabel: '开场', bodyLabel: '脚本 / 内容要点', assetLabel: '拍摄 / 剪辑清单', audienceLabel: '目标观众' },
  社群触达: { shortLabel: '社群', prefix: 'WXG', icon: <MessagesSquare size={17} />, openingLabel: '开场消息', bodyLabel: '群内触达内容', assetLabel: '资料 / 海报清单', audienceLabel: '目标社群' },
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`
}

function createSourceCode(actionType: WechatActionType) {
  return `${actionMeta[actionType].prefix}-${todayISO().replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`
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

function normalizeActionType(value: unknown): WechatActionType {
  return actionTypes.includes(value as WechatActionType) ? value as WechatActionType : '朋友圈触达'
}

function normalizeChecklist(value: unknown): WechatChecklist {
  const checklist = value && typeof value === 'object' ? value as Partial<WechatChecklist> : {}
  return {
    audienceReady: Boolean(checklist.audienceReady),
    contentReady: Boolean(checklist.contentReady),
    materialsReady: Boolean(checklist.materialsReady),
    ctaReady: Boolean(checklist.ctaReady),
    scopeChecked: Boolean(checklist.scopeChecked),
    executionChecked: Boolean(checklist.executionChecked),
  }
}

function migrateLegacyStatus(status: string): WechatTaskStatus {
  if (status === '制作中') return '制作中'
  if (status === '待发布') return '待执行'
  if (['已发布', '执行中', '跟进中', '已完成'].includes(status)) return '已完成'
  if (status === '已暂停') return '已暂停'
  return '准备中'
}

function completedChecklist(status: string, task: WechatLegacyTask): WechatChecklist {
  const completed = ['待发布', '已发布', '执行中', '跟进中', '已完成'].includes(status)
  return {
    audienceReady: completed || Boolean(task.goal),
    contentReady: completed || Boolean(task.scriptOutline || task.note),
    materialsReady: completed || Boolean(task.shootingChecklist),
    ctaReady: completed || Boolean(task.callToAction),
    scopeChecked: completed || Boolean(task.plannedDate),
    executionChecked: completed,
  }
}

function inferLegacyActionType(task: WechatLegacyTask): WechatActionType {
  const value = `${stringValue(task.videoFormat)} ${stringValue(task.note)} ${stringValue(task.title)}`
  if (value.includes('视频号') || value.includes('视频')) return '视频号内容'
  if (value.includes('社群') || value.includes('群')) return '社群触达'
  return '朋友圈触达'
}

function migrateLegacyTasks(legacyTasks: WechatLegacyTask[]): WechatData {
  const legacy = legacyTasks.filter((task) => task.channelId === 'wechat' && task.title)
  if (!legacy.length) return emptyWechatData
  const tasks: WechatTask[] = legacy.map((task, index) => ({
    id: `wechat-task-legacy-${task.id || index}`,
    contentPackageId: stringValue(task.contentPackageId),
    actionType: inferLegacyActionType(task),
    title: stringValue(task.title),
    goal: stringValue(task.goal),
    audience: '',
    opening: stringValue(task.openingHook),
    contentBody: stringValue(task.scriptOutline, stringValue(task.note)),
    callToAction: stringValue(task.callToAction),
    assetChecklist: stringValue(task.shootingChecklist),
    owner: stringValue(task.owner),
    plannedAt: stringValue(task.plannedDate),
    status: migrateLegacyStatus(stringValue(task.status)),
    checklist: completedChecklist(stringValue(task.status), task),
    createdAt: stringValue(task.createdAt, todayISO()),
  }))
  const executionRecords: WechatExecutionRecord[] = legacy.flatMap((task, index) => {
    const status = stringValue(task.status)
    if (!['待发布', '已发布', '执行中', '跟进中', '已完成'].includes(status)) return []
    const executed = ['已发布', '执行中', '跟进中', '已完成'].includes(status)
    return [{
      id: `wechat-execution-legacy-${task.id || index}`,
      taskId: tasks[index].id,
      finalContent: tasks[index].contentBody,
      plannedAt: stringValue(task.plannedDate),
      executedAt: executed ? stringValue(task.plannedDate, stringValue(task.createdAt, todayISO())) : '',
      reference: stringValue(task.linkOrLocation),
      sourceCode: stringValue(task.sourceCode, createSourceCode(tasks[index].actionType)),
      status: executed ? '已执行' : '待执行',
      metricUpdatedAt: stringValue(task.createdAt, todayISO()),
    } satisfies WechatExecutionRecord]
  })
  const metrics: WechatMetrics[] = executionRecords.map((record) => {
    const taskIndex = tasks.findIndex((task) => task.id === record.taskId)
    const legacyTask = legacy[taskIndex]
    return {
      executionRecordId: record.id,
      views: numberValue(legacyTask?.viewCount),
      likes: 0,
      comments: 0,
      shares: 0,
      replies: numberValue(legacyTask?.interactionCount),
      inquiries: numberValue(legacyTask?.inquiryCount),
      updatedAt: record.metricUpdatedAt,
    }
  })
  return { ...emptyWechatData, tasks, executionRecords, metrics }
}

export function normalizeWechatData(value: unknown, legacyTasks: WechatLegacyTask[] = []): WechatData {
  if (!value || typeof value !== 'object') return migrateLegacyTasks(legacyTasks)
  const raw = value as Partial<WechatData>
  const tasks = Array.isArray(raw.tasks) ? raw.tasks.filter((task) => task && typeof task.title === 'string').map((task) => ({
    id: stringValue(task.id, createId('wechat-task')),
    contentPackageId: stringValue(task.contentPackageId),
    actionType: normalizeActionType(task.actionType),
    title: stringValue(task.title),
    goal: stringValue(task.goal),
    audience: stringValue(task.audience),
    opening: stringValue(task.opening),
    contentBody: stringValue(task.contentBody),
    callToAction: stringValue(task.callToAction),
    assetChecklist: stringValue(task.assetChecklist),
    owner: stringValue(task.owner),
    plannedAt: stringValue(task.plannedAt),
    status: ['制作中', '待执行', '已完成', '已暂停'].includes(stringValue(task.status)) ? task.status as WechatTaskStatus : '准备中',
    checklist: normalizeChecklist(task.checklist),
    createdAt: stringValue(task.createdAt, todayISO()),
  })) : []
  const executionRecords = Array.isArray(raw.executionRecords) ? raw.executionRecords.filter((record) => record && typeof record.taskId === 'string').map((record) => ({
    id: stringValue(record.id, createId('wechat-execution')),
    taskId: stringValue(record.taskId),
    finalContent: stringValue(record.finalContent),
    plannedAt: stringValue(record.plannedAt),
    executedAt: stringValue(record.executedAt),
    reference: stringValue(record.reference),
    sourceCode: stringValue(record.sourceCode),
    status: ['已执行', '已撤回', '其他'].includes(stringValue(record.status)) ? record.status as WechatExecutionStatus : '待执行',
    metricUpdatedAt: stringValue(record.metricUpdatedAt),
  })) : []
  const metrics = Array.isArray(raw.metrics) ? raw.metrics.filter((metric) => metric && typeof metric.executionRecordId === 'string').map((metric) => ({
    executionRecordId: stringValue(metric.executionRecordId),
    views: numberValue(metric.views),
    likes: numberValue(metric.likes),
    comments: numberValue(metric.comments),
    shares: numberValue(metric.shares),
    replies: numberValue(metric.replies),
    inquiries: numberValue(metric.inquiries),
    updatedAt: stringValue(metric.updatedAt),
  })) : []
  const settings = raw.settings && typeof raw.settings === 'object' ? raw.settings : emptyWechatData.settings
  return {
    version: 1,
    tasks,
    executionRecords,
    metrics,
    settings: {
      accountLabel: stringValue(settings.accountLabel),
      defaultOwner: stringValue(settings.defaultOwner),
      defaultCallToAction: stringValue(settings.defaultCallToAction),
      weeklyTarget: numberValue(settings.weeklyTarget) || 3,
      forbiddenExpressions: stringValue(settings.forbiddenExpressions),
    },
  }
}

export function wechatSourceOptions(data: WechatData) {
  return data.executionRecords.filter((record) => record.status === '已执行').map((record) => {
    const task = data.tasks.find((item) => item.id === record.taskId)
    const type = task?.actionType || '朋友圈触达'
    return { id: record.id, label: `微信 · ${actionMeta[type].shortLabel} · ${task?.title || '未命名触达'} · ${record.sourceCode}` }
  })
}

function formatDateTime(value: string) {
  if (!value) return '未安排'
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: value.length > 10 ? '2-digit' : undefined, minute: value.length > 10 ? '2-digit' : undefined }).format(date)
}

function formatMetric(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value)
}

function taskStatusTone(status: WechatTaskStatus) {
  if (status === '已暂停') return 'muted'
  if (status === '制作中' || status === '待执行') return 'amber'
  if (status === '已完成') return 'teal'
  return 'neutral'
}

function executionStatusTone(status: WechatExecutionStatus) {
  if (status === '已撤回' || status === '其他') return 'muted'
  if (status === '待执行') return 'amber'
  return 'teal'
}

function checklistProgress(checklist: WechatChecklist) {
  const completed = checklistItems.filter((item) => checklist[item.key]).length
  return { completed, total: checklistItems.length, done: completed === checklistItems.length }
}

function metricForRecord(data: WechatData, executionRecordId: string): WechatMetrics {
  return data.metrics.find((metric) => metric.executionRecordId === executionRecordId) || {
    executionRecordId,
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    replies: 0,
    inquiries: 0,
    updatedAt: '',
  }
}

function sourceLabel(data: WechatData, record: WechatExecutionRecord) {
  return wechatSourceOptions(data).find((option) => option.id === record.id)?.label || `微信 · ${record.sourceCode}`
}

function observableResult(task: WechatTask, metric: WechatMetrics) {
  if (task.actionType === '视频号内容') return `${formatMetric(metric.views)} 播放 · ${metric.likes + metric.comments + metric.shares} 互动 · ${metric.inquiries} 咨询`
  if (task.actionType === '社群触达') return `${metric.replies} 回复 · ${metric.inquiries} 咨询`
  return `${metric.likes} 点赞 · ${metric.comments} 评论 · ${metric.inquiries} 咨询`
}

export function WechatWorkspace({ data, records, onChange, onBack, onAddLead, onToast }: { data: WechatData; records: WechatCustomerRecord[]; onChange: (updater: (current: WechatData) => WechatData) => void; onBack: () => void; onAddLead: (source?: string) => void; onToast: (message: string) => void }) {
  const [section, setSection] = useState<WechatSection>('overview')
  const [actionView, setActionView] = useState<WechatActionType>('朋友圈触达')
  const [executionView, setExecutionView] = useState<ExecutionView>('pending')
  const [editingTask, setEditingTask] = useState<WechatTask | null | undefined>(undefined)
  const [editingExecutionId, setEditingExecutionId] = useState<string | null>(null)
  const executedRecords = data.executionRecords.filter((record) => record.status === '已执行')
  const pendingRecords = data.executionRecords.filter((record) => record.status === '待执行')
  const channelSources = executedRecords.map((record) => record.sourceCode)
  const channelRecords = records.filter((record) => channelSources.some((source) => record.source.includes(source)))
  const activeChannelRecords = channelRecords.filter((record) => record.stage !== 'lost')
  const nextTask = data.tasks.find((task) => task.status === '制作中') || data.tasks.find((task) => task.status === '准备中') || data.tasks.find((task) => task.status === '待执行')
  const summary = useMemo(() => ({
    moments: data.tasks.filter((task) => task.actionType === '朋友圈触达').length,
    channels: data.tasks.filter((task) => task.actionType === '视频号内容').length,
    groups: data.tasks.filter((task) => task.actionType === '社群触达').length,
    pending: pendingRecords.length,
    leads: activeChannelRecords.length,
  }), [activeChannelRecords.length, data.tasks, pendingRecords.length])

  const createOrUpdateTask = (formData: FormData, task?: WechatTask | null) => {
    const actionType = normalizeActionType(formData.get('actionType'))
    const nextTask: WechatTask = {
      id: task?.id || createId('wechat-task'),
      contentPackageId: task?.contentPackageId || '',
      actionType,
      title: String(formData.get('title') || '').trim(),
      goal: String(formData.get('goal') || '').trim(),
      audience: String(formData.get('audience') || '').trim(),
      opening: String(formData.get('opening') || '').trim(),
      contentBody: String(formData.get('contentBody') || '').trim(),
      callToAction: String(formData.get('callToAction') || '').trim(),
      assetChecklist: String(formData.get('assetChecklist') || '').trim(),
      owner: String(formData.get('owner') || '').trim(),
      plannedAt: String(formData.get('plannedAt') || ''),
      status: task?.status || '准备中',
      checklist: checklistItems.reduce((current, item) => ({ ...current, [item.key]: formData.get(item.key) === 'on' }), { ...emptyChecklist }),
      createdAt: task?.createdAt || todayISO(),
    }
    if (!nextTask.title) return
    onChange((current) => ({ ...current, tasks: task ? current.tasks.map((item) => item.id === task.id ? nextTask : item) : [nextTask, ...current.tasks] }))
    setEditingTask(undefined)
    setActionView(actionType)
    onToast(task ? '微信触达任务已更新' : '微信触达任务已建立')
  }

  const toggleChecklist = (task: WechatTask, key: keyof WechatChecklist) => {
    onChange((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, checklist: { ...item.checklist, [key]: !item.checklist[key] } } : item) }))
  }

  const advanceTask = (task: WechatTask) => {
    if (task.status === '准备中') {
      onChange((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, status: '制作中' } : item) }))
      onToast('已进入内容准备')
      return
    }
    if (task.status === '制作中') {
      if (!checklistProgress(task.checklist).done) {
        onToast('先完成 6 项触达检查，再进入待执行')
        return
      }
      onChange((current) => {
        const exists = current.executionRecords.some((record) => record.taskId === task.id)
        const record: WechatExecutionRecord = {
          id: createId('wechat-execution'),
          taskId: task.id,
          finalContent: [task.opening, task.contentBody, task.callToAction].filter(Boolean).join('\n\n'),
          plannedAt: task.plannedAt,
          executedAt: '',
          reference: '',
          sourceCode: createSourceCode(task.actionType),
          status: '待执行',
          metricUpdatedAt: '',
        }
        return { ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, status: '待执行' } : item), executionRecords: exists ? current.executionRecords : [record, ...current.executionRecords] }
      })
      setSection('execution')
      setExecutionView('pending')
      onToast('已进入待执行，由客户本人在微信内完成')
      return
    }
    if (task.status === '待执行') {
      setSection('execution')
      setExecutionView('pending')
    }
  }

  const saveExecutionRecord = (formData: FormData, record: WechatExecutionRecord) => {
    const status = String(formData.get('status') || record.status) as WechatExecutionStatus
    const nextRecord: WechatExecutionRecord = {
      ...record,
      finalContent: String(formData.get('finalContent') || '').trim(),
      plannedAt: String(formData.get('plannedAt') || ''),
      executedAt: String(formData.get('executedAt') || ''),
      reference: String(formData.get('reference') || '').trim(),
      status,
      metricUpdatedAt: todayISO(),
    }
    const nextMetrics: WechatMetrics = {
      executionRecordId: record.id,
      views: formNumber(formData.get('views')),
      likes: formNumber(formData.get('likes')),
      comments: formNumber(formData.get('comments')),
      shares: formNumber(formData.get('shares')),
      replies: formNumber(formData.get('replies')),
      inquiries: formNumber(formData.get('inquiries')),
      updatedAt: todayISO(),
    }
    onChange((current) => ({
      ...current,
      executionRecords: current.executionRecords.map((item) => item.id === record.id ? nextRecord : item),
      metrics: current.metrics.some((metric) => metric.executionRecordId === record.id) ? current.metrics.map((metric) => metric.executionRecordId === record.id ? nextMetrics : metric) : [nextMetrics, ...current.metrics],
      tasks: current.tasks.map((task) => task.id === record.taskId ? { ...task, status: status === '已执行' ? '已完成' : status === '待执行' ? '待执行' : task.status } : task),
    }))
    setEditingExecutionId(null)
    if (status === '已执行') setExecutionView('history')
    onToast(status === '已执行' ? '已确认执行，来源编号现在可以关联线索' : '执行记录已更新')
  }

  const saveSettings = (formData: FormData) => {
    onChange((current) => ({ ...current, settings: {
      accountLabel: String(formData.get('accountLabel') || '').trim(),
      defaultOwner: String(formData.get('defaultOwner') || '').trim(),
      defaultCallToAction: String(formData.get('defaultCallToAction') || '').trim(),
      weeklyTarget: formNumber(formData.get('weeklyTarget')) || 3,
      forbiddenExpressions: String(formData.get('forbiddenExpressions') || '').trim(),
    } }))
    onToast('微信设置已保存')
  }

  const copyExecutionText = async (record: WechatExecutionRecord) => {
    if (!record.finalContent) {
      onToast('先补充最终执行内容')
      return
    }
    try {
      await navigator.clipboard.writeText(record.finalContent)
      onToast('执行内容已复制')
    } catch {
      onToast('复制失败，请打开执行记录后手工复制')
    }
  }

  const renderSection = () => {
    if (section === 'actions') return <ActionsSection data={data} view={actionView} onView={setActionView} onNewTask={(type) => { setActionView(type); setEditingTask(null) }} onEditTask={setEditingTask} onToggleChecklist={toggleChecklist} onAdvanceTask={advanceTask} />
    if (section === 'execution') return <ExecutionSection data={data} view={executionView} onView={setExecutionView} onEdit={setEditingExecutionId} onCopy={copyExecutionText} />
    if (section === 'inquiries') return <InquirySection data={data} records={channelRecords} onAddLead={onAddLead} />
    if (section === 'review') return <ReviewSection data={data} records={channelRecords} />
    if (section === 'settings') return <SettingsSection settings={data.settings} onSave={saveSettings} />
    return <OverviewSection data={data} summary={summary} records={activeChannelRecords} nextTask={nextTask} onOpenActions={(type) => { setActionView(type); setSection('actions') }} onOpenTask={(task) => { setEditingTask(task); setSection('actions') }} onAdvanceTask={advanceTask} onOpenExecution={() => setSection('execution')} onAddLead={onAddLead} />
  }

  const editingExecution = editingExecutionId ? data.executionRecords.find((record) => record.id === editingExecutionId) : undefined
  return <div className="wechat-workspace">
    <header className="page-header"><div><h1>微信</h1><p>围绕朋友圈、视频号和社群准备触达内容，由客户本人执行，再把咨询和业务结果带回工作台。</p></div><div className="page-action"><button className="button button-secondary" onClick={onBack}><ChevronLeft size={16} />返回获客</button></div></header>
    <nav className="douyin-module-tabs" aria-label="微信工作区">{sectionItems.map((item) => { const badge = item.id === 'execution' ? pendingRecords.length : item.id === 'inquiries' ? activeChannelRecords.length : 0; return <button key={item.id} type="button" className={section === item.id ? 'active' : ''} onClick={() => setSection(item.id)}>{item.icon}<span>{item.label}</span>{badge > 0 ? <b>{badge}</b> : null}</button> })}</nav>
    {section === 'overview' ? <CommandBand nextTask={nextTask} onNew={() => setEditingTask(null)} onAdvance={advanceTask} /> : null}
    {renderSection()}
    {editingTask !== undefined ? <TaskDialog task={editingTask || undefined} defaultType={actionView} settings={data.settings} onClose={() => setEditingTask(undefined)} onSubmit={createOrUpdateTask} /> : null}
    {editingExecution ? <ExecutionDialog record={editingExecution} task={data.tasks.find((task) => task.id === editingExecution.taskId)} metrics={metricForRecord(data, editingExecution.id)} onClose={() => setEditingExecutionId(null)} onSubmit={saveExecutionRecord} /> : null}
  </div>
}

function CommandBand({ nextTask, onNew, onAdvance }: { nextTask?: WechatTask; onNew: () => void; onAdvance: (task: WechatTask) => void }) {
  const action = nextTask?.status === '制作中' ? '继续完成触达检查' : nextTask?.status === '准备中' ? '补充内容并开始准备' : nextTask?.status === '待执行' ? '等待客户本人执行' : '建立第一条微信触达任务'
  return <section className="douyin-command-band"><div><span>今天优先推进</span><h2>{nextTask?.title || '建立第一条微信触达任务'}</h2><p>{action}</p></div>{nextTask ? <button className="button button-primary" onClick={() => onAdvance(nextTask)}>{nextTask.status === '准备中' ? '开始准备' : nextTask.status === '制作中' ? '进入待执行' : '查看执行'}<ArrowRight size={15} /></button> : <button className="button button-primary" onClick={onNew}><Plus size={15} />新建触达</button>}</section>
}

function OverviewSection({ data, summary, records, nextTask, onOpenActions, onOpenTask, onAdvanceTask, onOpenExecution, onAddLead }: { data: WechatData; summary: { moments: number; channels: number; groups: number; pending: number; leads: number }; records: WechatCustomerRecord[]; nextTask?: WechatTask; onOpenActions: (type: WechatActionType) => void; onOpenTask: (task: WechatTask) => void; onAdvanceTask: (task: WechatTask) => void; onOpenExecution: () => void; onAddLead: (source?: string) => void }) {
  const recent = [...data.tasks].sort((left, right) => (left.plannedAt || '9999').localeCompare(right.plannedAt || '9999')).slice(0, 5)
  return <>
    <section className="douyin-overview-strip"><button onClick={() => onOpenActions('朋友圈触达')}><Image size={17} /><span>朋友圈</span><strong>{summary.moments}</strong><small>文案、素材与触达范围</small></button><button onClick={() => onOpenActions('视频号内容')}><Video size={17} /><span>视频号</span><strong>{summary.channels}</strong><small>脚本、拍摄与发布</small></button><button onClick={() => onOpenActions('社群触达')}><MessagesSquare size={17} /><span>社群</span><strong>{summary.groups}</strong><small>群内内容与资料</small></button><button onClick={onOpenExecution}><ClipboardCheck size={17} /><span>待执行</span><strong>{summary.pending}</strong><small>由客户本人完成</small></button><button onClick={() => onAddLead()}><MessageCircleMore size={17} /><span>微信线索</span><strong>{summary.leads}</strong><small>{records.filter((record) => record.stage === 'intent').length} 个意向客户</small></button></section>
    <section className="douyin-overview-grid"><div className="work-panel"><div className="section-heading-row"><div><h2>近期触达</h2><p>按计划时间查看最需要推进的动作。</p></div><button className="text-button" onClick={() => onOpenActions(nextTask?.actionType || '朋友圈触达')}>查看全部</button></div>{recent.length ? <div className="douyin-plan-list">{recent.map((task) => <button key={task.id} onClick={() => onOpenTask(task)}><span className="wechat-action-icon">{actionMeta[task.actionType].icon}</span><div><strong>{task.title}</strong><span>{actionMeta[task.actionType].shortLabel} · {task.audience || '未填写目标人群'}</span></div><time>{formatDateTime(task.plannedAt)}</time><ChevronRight size={15} /></button>)}</div> : <CompactEmpty icon={<Send size={22} />} title="还没有微信触达任务" action={<button className="button button-primary" onClick={() => onOpenActions('朋友圈触达')}><Plus size={15} />新建触达</button>} />}</div><aside className="work-panel quiet-panel"><div className="section-heading-row"><div><h2>来源结果</h2><p>只统计已经确认执行的微信动作。</p></div></div><div className="douyin-source-summary"><div><span>线索</span><strong>{records.length}</strong></div><div><span>意向客户</span><strong>{records.filter((record) => record.stage === 'intent' || record.stage === 'customer').length}</strong></div><div><span>客户</span><strong>{records.filter((record) => record.stage === 'customer').length}</strong></div></div>{nextTask ? <button className="button button-secondary" onClick={() => onAdvanceTask(nextTask)}>推进下一步<ArrowRight size={15} /></button> : null}</aside></section>
  </>
}

function ActionsSection({ data, view, onView, onNewTask, onEditTask, onToggleChecklist, onAdvanceTask }: { data: WechatData; view: WechatActionType; onView: (view: WechatActionType) => void; onNewTask: (type: WechatActionType) => void; onEditTask: (task: WechatTask) => void; onToggleChecklist: (task: WechatTask, key: keyof WechatChecklist) => void; onAdvanceTask: (task: WechatTask) => void }) {
  const tasks = data.tasks.filter((task) => task.actionType === view)
  return <>
    <div className="douyin-section-head"><div><h2>触达</h2><p>三种微信动作分别准备内容和执行结果，共用来源、线索和复盘。</p></div><button className="button button-primary" onClick={() => onNewTask(view)}><Plus size={15} />新建{actionMeta[view].shortLabel}</button></div>
    <div className="segmented-control douyin-subtabs wechat-action-tabs" role="tablist" aria-label="微信触达类型">{actionTypes.map((type) => <button key={type} className={view === type ? 'active' : ''} onClick={() => onView(type)}>{actionMeta[type].shortLabel} <b>{data.tasks.filter((task) => task.actionType === type).length}</b></button>)}</div>
    <section className="douyin-task-board">{tasks.length ? tasks.map((task) => { const progress = checklistProgress(task.checklist); return <article className="douyin-video-item" key={task.id}><div className="douyin-video-item-head"><div><span>{actionMeta[task.actionType].shortLabel}</span><h3>{task.title}</h3><p>{task.audience ? `目标：${task.audience}` : task.goal || '打开任务补充目标人群和触达目标。'}</p></div><span className={`status-pill ${taskStatusTone(task.status)}`}>{task.status}</span></div><div className="douyin-progress-line"><span><b>{progress.completed}</b> / {progress.total} 项完成</span><div><i style={{ width: `${(progress.completed / progress.total) * 100}%` }} /></div></div><div className="douyin-checklist">{checklistItems.map((item) => <label key={item.key}><input type="checkbox" checked={task.checklist[item.key]} onChange={() => onToggleChecklist(task, item.key)} /><span>{item.label}</span></label>)}</div><div className="douyin-video-item-foot"><button className="button button-secondary small" onClick={() => onEditTask(task)}><Pencil size={14} />编辑</button>{task.status !== '已完成' && task.status !== '已暂停' ? <button className="button button-primary small" onClick={() => onAdvanceTask(task)}>{task.status === '准备中' ? '开始准备' : task.status === '制作中' ? '进入待执行' : '查看执行'}<ArrowRight size={14} /></button> : null}</div></article> }) : <CompactEmpty icon={actionMeta[view].icon} title={`还没有${actionMeta[view].shortLabel}任务`} description="先建立一条准备执行的微信触达动作。" action={<button className="button button-primary" onClick={() => onNewTask(view)}><Plus size={15} />新建{actionMeta[view].shortLabel}</button>} />}</section>
  </>
}

function ExecutionSection({ data, view, onView, onEdit, onCopy }: { data: WechatData; view: ExecutionView; onView: (view: ExecutionView) => void; onEdit: (id: string) => void; onCopy: (record: WechatExecutionRecord) => void }) {
  const records = data.executionRecords.filter((record) => view === 'pending' ? record.status === '待执行' : record.status !== '待执行')
  return <>
    <div className="douyin-section-head"><div><h2>执行</h2><p>工作台准备最终内容，客户本人在微信内发布或发送后回来确认。</p></div></div>
    <div className="segmented-control douyin-subtabs" role="tablist" aria-label="执行视图"><button className={view === 'pending' ? 'active' : ''} onClick={() => onView('pending')}>待执行 <b>{data.executionRecords.filter((record) => record.status === '待执行').length}</b></button><button className={view === 'history' ? 'active' : ''} onClick={() => onView('history')}>执行记录 <b>{data.executionRecords.filter((record) => record.status !== '待执行').length}</b></button></div>
    <section className="douyin-publish-list">{records.length ? records.map((record) => { const task = data.tasks.find((item) => item.id === record.taskId); const metrics = metricForRecord(data, record.id); return <article className="douyin-publish-row" key={record.id}><div className="douyin-publish-main"><span className={`status-pill ${executionStatusTone(record.status)}`}>{record.status}</span><div><strong>{task?.title || '未命名触达'}</strong><span>{task ? `${actionMeta[task.actionType].shortLabel} · ${task.audience || '未填写目标人群'}` : '微信触达'}</span><small>{record.status === '已执行' && task ? observableResult(task, metrics) : '待客户本人在微信内执行'}</small></div></div><div className="douyin-publish-meta"><span>{record.status === '待执行' ? `计划 ${formatDateTime(record.plannedAt)}` : `执行 ${formatDateTime(record.executedAt)}`}</span><span>{record.sourceCode}</span></div><div className="douyin-publish-actions">{record.status === '待执行' ? <button className="button button-secondary small" onClick={() => void onCopy(record)}><Copy size={14} />复制内容</button> : null}<button className="button button-primary small" onClick={() => onEdit(record.id)}>{record.status === '待执行' ? '登记执行' : '更新记录'}<ChevronRight size={14} /></button></div></article> }) : <CompactEmpty icon={<ClipboardCheck size={23} />} title={view === 'pending' ? '没有待执行任务' : '还没有执行记录'} description={view === 'pending' ? '完成触达检查后，任务会进入这里。' : '客户确认执行后，来源编号和结果会保存在这里。'} />}</section>
  </>
}

function InquirySection({ data, records, onAddLead }: { data: WechatData; records: WechatCustomerRecord[]; onAddLead: (source?: string) => void }) {
  const executed = data.executionRecords.filter((record) => record.status === '已执行')
  const activeRecords = records.filter((record) => record.stage !== 'lost')
  return <>
    <div className="douyin-section-head"><div><h2>咨询</h2><p>客户通过私聊、评论、群内回复、电话或到店咨询时，保留具体微信动作来源。</p></div><button className="button button-primary" onClick={() => onAddLead()}><Plus size={15} />登记微信咨询</button></div>
    <section className="douyin-inquiry-summary"><div><span>微信线索</span><strong>{activeRecords.length}</strong><small>待判断或正在推进</small></div><div><span>进入意向客户</span><strong>{activeRecords.filter((record) => record.stage === 'intent' || record.stage === 'customer').length}</strong><small>已确认值得推进</small></div><div><span>成为客户</span><strong>{activeRecords.filter((record) => record.stage === 'customer').length}</strong><small>已形成业务结果</small></div></section>
    <section className="douyin-inquiry-grid"><div className="work-panel"><div className="section-heading-row"><div><h2>按触达动作登记</h2><p>选择客户来自哪条朋友圈、视频号或社群内容。</p></div></div>{executed.length ? <div className="douyin-source-video-list">{executed.map((record) => { const task = data.tasks.find((item) => item.id === record.taskId); const count = records.filter((item) => item.source.includes(record.sourceCode)).length; return <div key={record.id}><div><strong>{task?.title || '未命名触达'}</strong><span>{task ? actionMeta[task.actionType].shortLabel : '微信'} · {record.sourceCode} · 已登记 {count} 条</span></div><button className="button button-secondary small" onClick={() => onAddLead(sourceLabel(data, record))}><Plus size={14} />登记咨询</button></div> })}</div> : <CompactEmpty icon={<Link2 size={22} />} title="还没有已执行的微信动作" description="确认执行后，才能按具体动作登记咨询来源。" />}</div><div className="work-panel"><div className="section-heading-row"><div><h2>最近线索</h2><p>后续联系和推进在线索中完成。</p></div></div>{records.length ? <div className="douyin-lead-list">{records.slice(0, 8).map((record) => <div key={record.id}><span className={`stage-dot ${record.stage}`}></span><div><strong>{record.name}</strong><span>{record.need || record.source}</span></div><span className="status-pill neutral">{record.status}</span></div>)}</div> : <CompactEmpty icon={<MessageCircleMore size={22} />} title="还没有微信线索" description="收到私聊、评论、群内回复、电话或到店咨询后，从这里登记。" action={<button className="button button-primary" onClick={() => onAddLead()}><Plus size={15} />登记咨询</button>} />}</div></section>
  </>
}

function ReviewSection({ data, records }: { data: WechatData; records: WechatCustomerRecord[] }) {
  const executed = data.executionRecords.filter((record) => record.status === '已执行')
  const totals = data.metrics.reduce((current, metric) => ({ views: current.views + metric.views, interactions: current.interactions + metric.likes + metric.comments + metric.shares + metric.replies, inquiries: current.inquiries + metric.inquiries }), { views: 0, interactions: 0, inquiries: 0 })
  const activeRecords = records.filter((record) => record.stage !== 'lost')
  return <>
    <div className="douyin-section-head"><div><h2>复盘</h2><p>先看微信动作带来的线索、意向和客户，再参考各场景能够观察到的互动结果。</p></div></div>
    <section className="douyin-review-summary"><div><span>客户</span><strong>{activeRecords.filter((record) => record.stage === 'customer').length}</strong></div><div><span>进入意向</span><strong>{activeRecords.filter((record) => record.stage === 'intent' || record.stage === 'customer').length}</strong></div><div><span>有效线索</span><strong>{activeRecords.length}</strong></div><div><span>已回填咨询</span><strong>{totals.inquiries}</strong></div><div><span>可观察互动</span><strong>{formatMetric(totals.interactions)}</strong></div><div><span>视频号播放</span><strong>{formatMetric(totals.views)}</strong></div></section>
    <section className="table-panel douyin-data-panel">{executed.length ? <div className="table-scroll"><table><thead><tr><th>微信动作</th><th>类型</th><th>可观察结果</th><th>咨询</th><th>线索</th><th>进入意向</th><th>客户</th></tr></thead><tbody>{executed.map((record) => { const task = data.tasks.find((item) => item.id === record.taskId); const metric = metricForRecord(data, record.id); const linked = records.filter((item) => item.source.includes(record.sourceCode) && item.stage !== 'lost'); return <tr key={record.id}><td><div className="source-cell"><b>{task?.title || '未命名触达'}</b><span>{record.sourceCode}</span></div></td><td>{task ? actionMeta[task.actionType].shortLabel : '微信'}</td><td>{task ? observableResult(task, metric) : '-'}</td><td>{metric.inquiries}</td><td>{linked.length}</td><td>{linked.filter((item) => item.stage === 'intent' || item.stage === 'customer').length}</td><td>{linked.filter((item) => item.stage === 'customer').length}</td></tr> })}</tbody></table></div> : <CompactEmpty icon={<BarChart3 size={23} />} title="还没有可复盘的微信动作" description="确认执行并登记结果后，这里会展示平台可见数据和业务结果。" />}</section>
  </>
}

function SettingsSection({ settings, onSave }: { settings: WechatSettings; onSave: (formData: FormData) => void }) {
  return <>
    <div className="douyin-section-head"><div><h2>设置</h2><p>保存内容准备和任务安排需要的业务背景，不保存微信密码、登录会话或好友通讯录。</p></div></div>
    <form className="work-panel douyin-settings-form" onSubmit={(event) => { event.preventDefault(); onSave(new FormData(event.currentTarget)) }}><div className="form-grid"><label className="field"><span>微信业务备注</span><input name="accountLabel" defaultValue={settings.accountLabel} placeholder="例如：门店业务微信" /></label><label className="field"><span>默认负责人</span><input name="defaultOwner" defaultValue={settings.defaultOwner} placeholder="例如：李店长" /></label><label className="field"><span>每周计划触达</span><input name="weeklyTarget" type="number" min="1" max="30" defaultValue={settings.weeklyTarget} /></label><label className="field"><span>默认行动引导</span><input name="defaultCallToAction" defaultValue={settings.defaultCallToAction} placeholder="例如：私聊说明需求，预约进一步沟通" /></label><label className="field field-wide"><span>禁止使用的表达</span><textarea name="forbiddenExpressions" rows={4} defaultValue={settings.forbiddenExpressions} placeholder="一行一个，记录不符合实际承诺、品牌要求或平台规范的表达" /></label></div><div className="douyin-security-note"><Check size={16} /><span>工作台不会保存微信密码、Cookie、二维码登录信息、好友列表或群成员信息，也不会自动群发。</span></div><div className="dialog-foot"><button className="button button-primary" type="submit">保存设置<Check size={15} /></button></div></form>
  </>
}

function TaskDialog({ task, defaultType, settings, onClose, onSubmit }: { task?: WechatTask; defaultType: WechatActionType; settings: WechatSettings; onClose: () => void; onSubmit: (formData: FormData, task?: WechatTask) => void }) {
  const [actionType, setActionType] = useState<WechatActionType>(task?.actionType || defaultType)
  const meta = actionMeta[actionType]
  return <div className="dialog-backdrop" role="presentation"><form className="dialog douyin-dialog douyin-video-dialog" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget), task) }}><div className="dialog-head"><div><h2>{task ? '编辑微信触达' : '新建微信触达'}</h2><p>工作台负责内容准备和执行记录，实际发布、发送和沟通由客户本人完成。</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div><div className="form-grid"><fieldset className="field field-wide cover-mode-field"><legend>触达类型</legend><div className="wechat-action-choice">{actionTypes.map((type) => <label key={type} className={actionType === type ? 'selected' : ''}><input type="radio" name="actionType" value={type} checked={actionType === type} onChange={() => setActionType(type)} /><span>{actionMeta[type].icon}</span><strong>{actionMeta[type].shortLabel}</strong></label>)}</div></fieldset><label className="field field-wide"><span>任务主题</span><input name="title" required autoFocus defaultValue={task?.title || ''} placeholder="这次触达要围绕什么内容" /></label><label className="field"><span>目标</span><input name="goal" defaultValue={task?.goal || ''} placeholder="例如：获得 5 个有效咨询" /></label><label className="field"><span>{meta.audienceLabel}</span><input name="audience" defaultValue={task?.audience || ''} placeholder={actionType === '社群触达' ? '例如：已交房业主群' : '例如：近期正在比较方案的客户'} /></label><label className="field field-wide"><span>{meta.openingLabel}</span><input name="opening" defaultValue={task?.opening || ''} placeholder="第一句话如何让目标客户愿意继续看" /></label><label className="field field-wide"><span>{meta.bodyLabel}</span><textarea name="contentBody" rows={7} defaultValue={task?.contentBody || ''} placeholder="核心内容、证明或案例，以及客户需要知道的关键信息" /></label><label className="field field-wide"><span>行动引导</span><input name="callToAction" defaultValue={task?.callToAction || settings.defaultCallToAction} placeholder="客户看完或收到后应该做什么" /></label><label className="field field-wide"><span>{meta.assetLabel}</span><textarea name="assetChecklist" rows={4} defaultValue={task?.assetChecklist || ''} placeholder="列出执行前必须准备好的图片、视频、海报、资料或链接" /></label><label className="field"><span>负责人</span><input name="owner" defaultValue={task?.owner || settings.defaultOwner} placeholder="例如：李店长" /></label><label className="field"><span>计划时间</span><input name="plannedAt" type="datetime-local" defaultValue={task?.plannedAt || ''} /></label><div className="field field-wide"><span>触达检查</span><div className="douyin-form-checklist">{checklistItems.map((item) => <label key={item.key}><input type="checkbox" name={item.key} defaultChecked={task?.checklist[item.key] || false} /><span>{item.label}</span></label>)}</div></div></div><div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onClose}>取消</button><button className="button button-primary" type="submit">保存<Check size={15} /></button></div></form></div>
}

function ExecutionDialog({ record, task, metrics, onClose, onSubmit }: { record: WechatExecutionRecord; task?: WechatTask; metrics: WechatMetrics; onClose: () => void; onSubmit: (formData: FormData, record: WechatExecutionRecord) => void }) {
  const actionType = task?.actionType || '朋友圈触达'
  return <div className="dialog-backdrop" role="presentation"><form className="dialog douyin-dialog" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget), record) }}><div className="dialog-head"><div><h2>{record.status === '待执行' ? '登记执行' : '更新执行记录'}</h2><p>{task?.title || '微信触达'}。执行动作由客户本人在微信内完成。</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div><div className="form-grid"><label className="field field-wide"><span>最终执行内容</span><textarea name="finalContent" rows={8} defaultValue={record.finalContent} placeholder="最终发布或发送的内容" /></label><label className="field"><span>计划时间</span><input name="plannedAt" type="datetime-local" defaultValue={record.plannedAt} /></label><label className="field"><span>执行状态</span><select name="status" defaultValue={record.status}><option>待执行</option><option>已执行</option><option>已撤回</option><option>其他</option></select></label><label className="field"><span>实际执行时间</span><input name="executedAt" type="datetime-local" defaultValue={record.executedAt} /></label><label className="field"><span>内容记录 / 链接</span><input name="reference" defaultValue={record.reference} placeholder={actionType === '视频号内容' ? '视频号内容链接' : '可选，填写便于回看的记录'} /></label><div className="field field-wide source-code-field"><span>来源编号</span><div><Link2 size={15} /><strong>{record.sourceCode}</strong><small>只有状态为“已执行”时，才可在线索中选择。</small></div></div><div className="douyin-form-section field-wide"><strong>可观察结果</strong><span>只填写微信界面中实际可见的数据，不要求估算不可见曝光。</span></div>{actionType === '视频号内容' ? <><label className="field"><span>播放量</span><input name="views" type="number" min="0" defaultValue={metrics.views || ''} /></label><label className="field"><span>分享</span><input name="shares" type="number" min="0" defaultValue={metrics.shares || ''} /></label></> : null}{actionType !== '社群触达' ? <><label className="field"><span>点赞</span><input name="likes" type="number" min="0" defaultValue={metrics.likes || ''} /></label><label className="field"><span>评论</span><input name="comments" type="number" min="0" defaultValue={metrics.comments || ''} /></label></> : <label className="field"><span>群内回复</span><input name="replies" type="number" min="0" defaultValue={metrics.replies || ''} /></label>}<label className="field"><span>咨询</span><input name="inquiries" type="number" min="0" defaultValue={metrics.inquiries || ''} /></label></div><div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onClose}>取消</button><button className="button button-primary" type="submit">保存记录<Check size={15} /></button></div></form></div>
}

function CompactEmpty({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return <div className="douyin-compact-empty"><span>{icon}</span><strong>{title}</strong>{description ? <p>{description}</p> : null}{action}</div>
}
