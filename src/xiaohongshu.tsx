import { useMemo, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  BarChart3,
  BookOpenText,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Images,
  LayoutDashboard,
  Lightbulb,
  Link2,
  MessageSquareMore,
  Pencil,
  Plus,
  Settings2,
  X,
} from 'lucide-react'

export type XiaohongshuIdeaStatus = '待判断' | '已采用' | '暂不采用'
export type XiaohongshuNoteStatus = '准备中' | '制作中' | '待发布' | '已完成' | '已暂停'
export type XiaohongshuPublishStatus = '待发布' | '已发布' | '已删除' | '不可见' | '其他'
export type XiaohongshuCoverMode = '产品图加文案' | '标题直接做封面'

export type XiaohongshuIdea = {
  id: string
  contentPackageId: string
  title: string
  customerProblem: string
  contentDirection: string
  targetAction: string
  sourceType: '手工' | 'AI'
  tags: string
  status: XiaohongshuIdeaStatus
  createdAt: string
}

export type XiaohongshuProductionChecklist = {
  titleReady: boolean
  coverReady: boolean
  imagesReady: boolean
  bodyReady: boolean
  topicsReady: boolean
  publishChecked: boolean
}

export type XiaohongshuNoteTask = {
  id: string
  ideaId: string
  contentPackageId: string
  title: string
  goal: string
  noteType: string
  coverMode: XiaohongshuCoverMode
  coverTitle: string
  body: string
  callToAction: string
  imageChecklist: string
  owner: string
  plannedDate: string
  status: XiaohongshuNoteStatus
  checklist: XiaohongshuProductionChecklist
  createdAt: string
}

export type XiaohongshuPublishRecord = {
  id: string
  noteTaskId: string
  finalTitle: string
  finalBody: string
  topics: string
  plannedPublishDate: string
  publishedAt: string
  noteUrl: string
  sourceCode: string
  status: XiaohongshuPublishStatus
  metricUpdatedAt: string
}

export type XiaohongshuMetrics = {
  publishRecordId: string
  views: number
  likes: number
  comments: number
  favorites: number
  shares: number
  inquiries: number
  updatedAt: string
}

export type XiaohongshuSettings = {
  accountLabel: string
  city: string
  defaultOwner: string
  defaultCallToAction: string
  weeklyTarget: number
  forbiddenExpressions: string
}

export type XiaohongshuData = {
  version: 1
  ideas: XiaohongshuIdea[]
  noteTasks: XiaohongshuNoteTask[]
  publishRecords: XiaohongshuPublishRecord[]
  metrics: XiaohongshuMetrics[]
  settings: XiaohongshuSettings
}

export type XiaohongshuLegacyTask = {
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

export type XiaohongshuCustomerRecord = {
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

type XiaohongshuSection = 'overview' | 'content' | 'publish' | 'inquiries' | 'review' | 'settings'
type ContentView = 'ideas' | 'plan' | 'tasks'
type PublishView = 'pending' | 'history'

const emptyChecklist: XiaohongshuProductionChecklist = {
  titleReady: false,
  coverReady: false,
  imagesReady: false,
  bodyReady: false,
  topicsReady: false,
  publishChecked: false,
}

export const emptyXiaohongshuData: XiaohongshuData = {
  version: 1,
  ideas: [],
  noteTasks: [],
  publishRecords: [],
  metrics: [],
  settings: {
    accountLabel: '',
    city: '',
    defaultOwner: '',
    defaultCallToAction: '',
    weeklyTarget: 3,
    forbiddenExpressions: '',
  },
}

const checklistItems: Array<{ key: keyof XiaohongshuProductionChecklist; label: string }> = [
  { key: 'titleReady', label: '标题已确认' },
  { key: 'coverReady', label: '封面方式已确认' },
  { key: 'imagesReady', label: '图片 / 视频已准备' },
  { key: 'bodyReady', label: '正文已确认' },
  { key: 'topicsReady', label: '话题已确认' },
  { key: 'publishChecked', label: '发布内容已检查' },
]

const sectionItems: Array<{ id: XiaohongshuSection; label: string; icon: ReactNode }> = [
  { id: 'overview', label: '总览', icon: <LayoutDashboard size={15} /> },
  { id: 'content', label: '内容', icon: <FileText size={15} /> },
  { id: 'publish', label: '发布', icon: <BookOpenText size={15} /> },
  { id: 'inquiries', label: '咨询', icon: <MessageSquareMore size={15} /> },
  { id: 'review', label: '复盘', icon: <BarChart3 size={15} /> },
  { id: 'settings', label: '设置', icon: <Settings2 size={15} /> },
]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`
}

function createSourceCode() {
  return `XHS-${todayISO().replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`
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

function normalizeChecklist(value: unknown): XiaohongshuProductionChecklist {
  const checklist = value && typeof value === 'object' ? value as Partial<XiaohongshuProductionChecklist> : {}
  return {
    titleReady: Boolean(checklist.titleReady),
    coverReady: Boolean(checklist.coverReady),
    imagesReady: Boolean(checklist.imagesReady),
    bodyReady: Boolean(checklist.bodyReady),
    topicsReady: Boolean(checklist.topicsReady),
    publishChecked: Boolean(checklist.publishChecked),
  }
}

function migrateLegacyStatus(status: string): XiaohongshuNoteStatus {
  if (status === '制作中') return '制作中'
  if (status === '待发布') return '待发布'
  if (status === '已发布' || status === '已完成') return '已完成'
  if (status === '已暂停') return '已暂停'
  return '准备中'
}

function completedChecklist(status: string, task: XiaohongshuLegacyTask): XiaohongshuProductionChecklist {
  const completed = ['待发布', '已发布', '已完成'].includes(status)
  return {
    titleReady: completed || Boolean(task.title),
    coverReady: completed,
    imagesReady: completed || Boolean(task.shootingChecklist),
    bodyReady: completed || Boolean(task.scriptOutline),
    topicsReady: completed,
    publishChecked: completed,
  }
}

function migrateLegacyTasks(legacyTasks: XiaohongshuLegacyTask[]): XiaohongshuData {
  const tasks = legacyTasks.filter((task) => task.channelId === 'xiaohongshu' && task.title)
  if (!tasks.length) return emptyXiaohongshuData

  const ideas: XiaohongshuIdea[] = tasks.map((task, index) => ({
    id: `xhs-idea-legacy-${task.id || index}`,
    contentPackageId: stringValue(task.contentPackageId),
    title: stringValue(task.title),
    customerProblem: stringValue(task.goal),
    contentDirection: stringValue(task.note),
    targetAction: stringValue(task.callToAction),
    sourceType: '手工',
    tags: '',
    status: '已采用',
    createdAt: stringValue(task.createdAt, todayISO()),
  }))

  const noteTasks: XiaohongshuNoteTask[] = tasks.map((task, index) => ({
    id: `xhs-note-legacy-${task.id || index}`,
    ideaId: ideas[index].id,
    contentPackageId: stringValue(task.contentPackageId),
    title: stringValue(task.title),
    goal: stringValue(task.goal),
    noteType: stringValue(task.videoFormat, '图文笔记'),
    coverMode: stringValue(task.openingHook) ? '产品图加文案' : '标题直接做封面',
    coverTitle: stringValue(task.openingHook),
    body: stringValue(task.scriptOutline),
    callToAction: stringValue(task.callToAction),
    imageChecklist: stringValue(task.shootingChecklist),
    owner: stringValue(task.owner),
    plannedDate: stringValue(task.plannedDate),
    status: migrateLegacyStatus(stringValue(task.status)),
    checklist: completedChecklist(stringValue(task.status), task),
    createdAt: stringValue(task.createdAt, todayISO()),
  }))

  const publishRecords: XiaohongshuPublishRecord[] = tasks.flatMap((task, index) => {
    const status = stringValue(task.status)
    if (!['待发布', '已发布', '已完成'].includes(status)) return []
    return [{
      id: `xhs-publish-legacy-${task.id || index}`,
      noteTaskId: noteTasks[index].id,
      finalTitle: stringValue(task.title),
      finalBody: stringValue(task.scriptOutline),
      topics: '',
      plannedPublishDate: stringValue(task.plannedDate),
      publishedAt: ['已发布', '已完成'].includes(status) ? stringValue(task.plannedDate, stringValue(task.createdAt, todayISO())) : '',
      noteUrl: stringValue(task.linkOrLocation),
      sourceCode: stringValue(task.sourceCode, createSourceCode()),
      status: ['已发布', '已完成'].includes(status) ? '已发布' : '待发布',
      metricUpdatedAt: stringValue(task.createdAt, todayISO()),
    } satisfies XiaohongshuPublishRecord]
  })

  const metrics: XiaohongshuMetrics[] = publishRecords.map((record) => {
    const index = noteTasks.findIndex((task) => task.id === record.noteTaskId)
    const legacyTask = tasks[index]
    return {
      publishRecordId: record.id,
      views: numberValue(legacyTask?.viewCount),
      likes: 0,
      comments: 0,
      favorites: numberValue(legacyTask?.interactionCount),
      shares: 0,
      inquiries: numberValue(legacyTask?.inquiryCount),
      updatedAt: record.metricUpdatedAt,
    }
  })

  return { ...emptyXiaohongshuData, ideas, noteTasks, publishRecords, metrics }
}

export function normalizeXiaohongshuData(value: unknown, legacyTasks: XiaohongshuLegacyTask[] = []): XiaohongshuData {
  if (!value || typeof value !== 'object') return migrateLegacyTasks(legacyTasks)
  const raw = value as Partial<XiaohongshuData>
  const ideas = Array.isArray(raw.ideas) ? raw.ideas.filter((idea) => idea && typeof idea.title === 'string').map((idea) => ({
    id: stringValue(idea.id, createId('xhs-idea')),
    contentPackageId: stringValue(idea.contentPackageId),
    title: stringValue(idea.title),
    customerProblem: stringValue(idea.customerProblem),
    contentDirection: stringValue(idea.contentDirection),
    targetAction: stringValue(idea.targetAction),
    sourceType: stringValue(idea.sourceType) === 'AI' ? 'AI' as const : '手工' as const,
    tags: stringValue(idea.tags),
    status: ['已采用', '暂不采用'].includes(stringValue(idea.status)) ? idea.status as XiaohongshuIdeaStatus : '待判断',
    createdAt: stringValue(idea.createdAt, todayISO()),
  })) : []
  const noteTasks = Array.isArray(raw.noteTasks) ? raw.noteTasks.filter((task) => task && typeof task.title === 'string').map((task) => ({
    id: stringValue(task.id, createId('xhs-note')),
    ideaId: stringValue(task.ideaId),
    contentPackageId: stringValue(task.contentPackageId),
    title: stringValue(task.title),
    goal: stringValue(task.goal),
    noteType: stringValue(task.noteType, '图文笔记'),
    coverMode: stringValue(task.coverMode) === '标题直接做封面' ? '标题直接做封面' as const : '产品图加文案' as const,
    coverTitle: stringValue(task.coverTitle),
    body: stringValue(task.body),
    callToAction: stringValue(task.callToAction),
    imageChecklist: stringValue(task.imageChecklist),
    owner: stringValue(task.owner),
    plannedDate: stringValue(task.plannedDate),
    status: ['制作中', '待发布', '已完成', '已暂停'].includes(stringValue(task.status)) ? task.status as XiaohongshuNoteStatus : '准备中',
    checklist: normalizeChecklist(task.checklist),
    createdAt: stringValue(task.createdAt, todayISO()),
  })) : []
  const publishRecords = Array.isArray(raw.publishRecords) ? raw.publishRecords.filter((record) => record && typeof record.noteTaskId === 'string').map((record) => ({
    id: stringValue(record.id, createId('xhs-publish')),
    noteTaskId: stringValue(record.noteTaskId),
    finalTitle: stringValue(record.finalTitle),
    finalBody: stringValue(record.finalBody),
    topics: stringValue(record.topics),
    plannedPublishDate: stringValue(record.plannedPublishDate),
    publishedAt: stringValue(record.publishedAt),
    noteUrl: stringValue(record.noteUrl),
    sourceCode: stringValue(record.sourceCode, createSourceCode()),
    status: ['已发布', '已删除', '不可见', '其他'].includes(stringValue(record.status)) ? record.status as XiaohongshuPublishStatus : '待发布',
    metricUpdatedAt: stringValue(record.metricUpdatedAt),
  })) : []
  const metrics = Array.isArray(raw.metrics) ? raw.metrics.filter((metric) => metric && typeof metric.publishRecordId === 'string').map((metric) => ({
    publishRecordId: stringValue(metric.publishRecordId),
    views: numberValue(metric.views),
    likes: numberValue(metric.likes),
    comments: numberValue(metric.comments),
    favorites: numberValue(metric.favorites),
    shares: numberValue(metric.shares),
    inquiries: numberValue(metric.inquiries),
    updatedAt: stringValue(metric.updatedAt),
  })) : []
  const settings = raw.settings && typeof raw.settings === 'object' ? raw.settings : emptyXiaohongshuData.settings
  return {
    version: 1,
    ideas,
    noteTasks,
    publishRecords,
    metrics,
    settings: {
      accountLabel: stringValue(settings.accountLabel),
      city: stringValue(settings.city),
      defaultOwner: stringValue(settings.defaultOwner),
      defaultCallToAction: stringValue(settings.defaultCallToAction),
      weeklyTarget: numberValue(settings.weeklyTarget) || 3,
      forbiddenExpressions: stringValue(settings.forbiddenExpressions),
    },
  }
}

export function xiaohongshuSourceOptions(data: XiaohongshuData) {
  return data.publishRecords.filter((record) => record.status === '已发布').map((record) => {
    const task = data.noteTasks.find((item) => item.id === record.noteTaskId)
    return { id: record.id, label: `小红书 · ${task?.title || record.finalTitle || '未命名笔记'} · ${record.sourceCode}` }
  })
}

function formatDate(value: string) {
  if (!value) return '未安排'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(date)
}

function formatMetric(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value)
}

function noteStatusTone(status: XiaohongshuNoteStatus) {
  if (status === '已暂停') return 'muted'
  if (status === '制作中' || status === '待发布') return 'amber'
  if (status === '已完成') return 'teal'
  return 'neutral'
}

function publishStatusTone(status: XiaohongshuPublishStatus) {
  if (status === '已删除' || status === '不可见' || status === '其他') return 'muted'
  if (status === '待发布') return 'amber'
  return 'teal'
}

function checklistProgress(checklist: XiaohongshuProductionChecklist) {
  const completed = checklistItems.filter((item) => checklist[item.key]).length
  return { completed, total: checklistItems.length, done: completed === checklistItems.length }
}

function metricForRecord(data: XiaohongshuData, publishRecordId: string): XiaohongshuMetrics {
  return data.metrics.find((metric) => metric.publishRecordId === publishRecordId) || {
    publishRecordId,
    views: 0,
    likes: 0,
    comments: 0,
    favorites: 0,
    shares: 0,
    inquiries: 0,
    updatedAt: '',
  }
}

function sourceLabel(data: XiaohongshuData, record: XiaohongshuPublishRecord) {
  return xiaohongshuSourceOptions(data).find((option) => option.id === record.id)?.label || `小红书 · ${record.sourceCode}`
}

function coverSummary(task: XiaohongshuNoteTask) {
  if (task.coverMode === '标题直接做封面') return `封面：直接使用标题“${task.title}”`
  return task.coverTitle ? `封面文案建议：${task.coverTitle}` : '封面：产品图 + 待补充文案建议'
}

export function XiaohongshuWorkspace({ data, records, onChange, onBack, onAddLead, onToast }: { data: XiaohongshuData; records: XiaohongshuCustomerRecord[]; onChange: (updater: (current: XiaohongshuData) => XiaohongshuData) => void; onBack: () => void; onAddLead: (source?: string) => void; onToast: (message: string) => void }) {
  const [section, setSection] = useState<XiaohongshuSection>('overview')
  const [contentView, setContentView] = useState<ContentView>('ideas')
  const [publishView, setPublishView] = useState<PublishView>('pending')
  const [editingIdea, setEditingIdea] = useState<XiaohongshuIdea | null | undefined>(undefined)
  const [editingNote, setEditingNote] = useState<XiaohongshuNoteTask | null | undefined>(undefined)
  const [editingPublishId, setEditingPublishId] = useState<string | null>(null)
  const publishedRecords = data.publishRecords.filter((record) => record.status === '已发布')
  const pendingRecords = data.publishRecords.filter((record) => record.status === '待发布')
  const channelSources = publishedRecords.map((record) => record.sourceCode)
  const channelRecords = records.filter((record) => channelSources.some((source) => record.source.includes(source)))
  const activeChannelRecords = channelRecords.filter((record) => record.stage !== 'lost')
  const taskById = (id: string) => data.noteTasks.find((task) => task.id === id)
  const nextTask = data.noteTasks.find((task) => task.status === '制作中') || data.noteTasks.find((task) => task.status === '准备中') || data.noteTasks.find((task) => task.status === '待发布')
  const summary = useMemo(() => ({
    ideas: data.ideas.filter((idea) => idea.status === '待判断').length,
    planned: data.noteTasks.filter((task) => task.status === '准备中').length,
    producing: data.noteTasks.filter((task) => task.status === '制作中').length,
    pending: pendingRecords.length,
    leads: activeChannelRecords.length,
  }), [activeChannelRecords.length, data.ideas, data.noteTasks, pendingRecords.length])

  const createOrUpdateIdea = (formData: FormData, idea?: XiaohongshuIdea | null) => {
    const nextIdea: XiaohongshuIdea = {
      id: idea?.id || createId('xhs-idea'),
      contentPackageId: idea?.contentPackageId || '',
      title: String(formData.get('title') || '').trim(),
      customerProblem: String(formData.get('customerProblem') || '').trim(),
      contentDirection: String(formData.get('contentDirection') || '').trim(),
      targetAction: String(formData.get('targetAction') || '').trim(),
      sourceType: String(formData.get('sourceType') || '手工') as XiaohongshuIdea['sourceType'],
      tags: String(formData.get('tags') || '').trim(),
      status: String(formData.get('status') || '待判断') as XiaohongshuIdeaStatus,
      createdAt: idea?.createdAt || todayISO(),
    }
    if (!nextIdea.title) return
    onChange((current) => ({ ...current, ideas: idea ? current.ideas.map((item) => item.id === idea.id ? nextIdea : item) : [nextIdea, ...current.ideas] }))
    setEditingIdea(undefined)
    onToast(idea ? '选题已更新' : '选题已加入选题库')
  }

  const adoptIdea = (idea: XiaohongshuIdea) => {
    const existing = data.noteTasks.find((task) => task.ideaId === idea.id)
    if (existing) {
      setContentView('plan')
      onToast('这个选题已经进入笔记计划')
      return
    }
    const task: XiaohongshuNoteTask = {
      id: createId('xhs-note'),
      ideaId: idea.id,
      contentPackageId: idea.contentPackageId,
      title: idea.title,
      goal: idea.customerProblem,
      noteType: '图文笔记',
      coverMode: '产品图加文案',
      coverTitle: '',
      body: '',
      callToAction: idea.targetAction || data.settings.defaultCallToAction,
      imageChecklist: '',
      owner: data.settings.defaultOwner,
      plannedDate: '',
      status: '准备中',
      checklist: { ...emptyChecklist },
      createdAt: todayISO(),
    }
    onChange((current) => ({ ...current, ideas: current.ideas.map((item) => item.id === idea.id ? { ...item, status: '已采用' } : item), noteTasks: [task, ...current.noteTasks] }))
    setContentView('plan')
    onToast('已转入笔记计划')
  }

  const createOrUpdateNote = (formData: FormData, task?: XiaohongshuNoteTask | null) => {
    const ideaId = String(formData.get('ideaId') || task?.ideaId || '')
    const idea = data.ideas.find((item) => item.id === ideaId)
    const nextTask: XiaohongshuNoteTask = {
      id: task?.id || createId('xhs-note'),
      ideaId,
      contentPackageId: task?.contentPackageId || idea?.contentPackageId || '',
      title: String(formData.get('title') || idea?.title || '').trim(),
      goal: String(formData.get('goal') || '').trim(),
      noteType: String(formData.get('noteType') || '图文笔记'),
      coverMode: String(formData.get('coverMode') || '产品图加文案') as XiaohongshuCoverMode,
      coverTitle: String(formData.get('coverTitle') || '').trim(),
      body: String(formData.get('body') || '').trim(),
      callToAction: String(formData.get('callToAction') || '').trim(),
      imageChecklist: String(formData.get('imageChecklist') || '').trim(),
      owner: String(formData.get('owner') || '').trim(),
      plannedDate: String(formData.get('plannedDate') || ''),
      status: task?.status || '准备中',
      checklist: checklistItems.reduce((current, item) => ({ ...current, [item.key]: formData.get(item.key) === 'on' }), { ...emptyChecklist }),
      createdAt: task?.createdAt || todayISO(),
    }
    if (!nextTask.title) return
    onChange((current) => ({ ...current, noteTasks: task ? current.noteTasks.map((item) => item.id === task.id ? nextTask : item) : [nextTask, ...current.noteTasks] }))
    setEditingNote(undefined)
    onToast(task ? '笔记任务已更新' : '笔记任务已建立')
  }

  const toggleChecklist = (task: XiaohongshuNoteTask, key: keyof XiaohongshuProductionChecklist) => {
    onChange((current) => ({ ...current, noteTasks: current.noteTasks.map((item) => item.id === task.id ? { ...item, checklist: { ...item.checklist, [key]: !item.checklist[key] } } : item) }))
  }

  const advanceNote = (task: XiaohongshuNoteTask) => {
    if (task.status === '准备中') {
      onChange((current) => ({ ...current, noteTasks: current.noteTasks.map((item) => item.id === task.id ? { ...item, status: '制作中' } : item) }))
      onToast('已进入笔记制作')
      return
    }
    if (task.status === '制作中') {
      if (!checklistProgress(task.checklist).done) {
        onToast('先完成 6 项内容检查，再进入待发布')
        return
      }
      onChange((current) => {
        const exists = current.publishRecords.some((record) => record.noteTaskId === task.id)
        const record: XiaohongshuPublishRecord = {
          id: createId('xhs-publish'),
          noteTaskId: task.id,
          finalTitle: task.title,
          finalBody: task.body,
          topics: '',
          plannedPublishDate: task.plannedDate,
          publishedAt: '',
          noteUrl: '',
          sourceCode: createSourceCode(),
          status: '待发布',
          metricUpdatedAt: '',
        }
        return { ...current, noteTasks: current.noteTasks.map((item) => item.id === task.id ? { ...item, status: '待发布' } : item), publishRecords: exists ? current.publishRecords : [record, ...current.publishRecords] }
      })
      setSection('publish')
      setPublishView('pending')
      onToast('笔记已进入待发布')
      return
    }
    if (task.status === '待发布') {
      setSection('publish')
      setPublishView('pending')
    }
  }

  const savePublishRecord = (formData: FormData, record: XiaohongshuPublishRecord) => {
    const status = String(formData.get('status') || record.status) as XiaohongshuPublishStatus
    const nextRecord: XiaohongshuPublishRecord = {
      ...record,
      finalTitle: String(formData.get('finalTitle') || '').trim(),
      finalBody: String(formData.get('finalBody') || '').trim(),
      topics: String(formData.get('topics') || '').trim(),
      plannedPublishDate: String(formData.get('plannedPublishDate') || ''),
      publishedAt: String(formData.get('publishedAt') || ''),
      noteUrl: String(formData.get('noteUrl') || '').trim(),
      status,
      metricUpdatedAt: todayISO(),
    }
    const nextMetrics: XiaohongshuMetrics = {
      publishRecordId: record.id,
      views: formNumber(formData.get('views')),
      likes: formNumber(formData.get('likes')),
      comments: formNumber(formData.get('comments')),
      favorites: formNumber(formData.get('favorites')),
      shares: formNumber(formData.get('shares')),
      inquiries: formNumber(formData.get('inquiries')),
      updatedAt: todayISO(),
    }
    onChange((current) => ({
      ...current,
      publishRecords: current.publishRecords.map((item) => item.id === record.id ? nextRecord : item),
      metrics: current.metrics.some((metric) => metric.publishRecordId === record.id) ? current.metrics.map((metric) => metric.publishRecordId === record.id ? nextMetrics : metric) : [nextMetrics, ...current.metrics],
      noteTasks: current.noteTasks.map((task) => task.id === record.noteTaskId ? { ...task, status: status === '已发布' ? '已完成' : status === '待发布' ? '待发布' : task.status } : task),
    }))
    setEditingPublishId(null)
    if (status === '已发布') setPublishView('history')
    onToast(status === '已发布' ? '已确认发布，来源编号现在可以关联线索' : '发布记录已更新')
  }

  const saveSettings = (formData: FormData) => {
    onChange((current) => ({ ...current, settings: {
      accountLabel: String(formData.get('accountLabel') || '').trim(),
      city: String(formData.get('city') || '').trim(),
      defaultOwner: String(formData.get('defaultOwner') || '').trim(),
      defaultCallToAction: String(formData.get('defaultCallToAction') || '').trim(),
      weeklyTarget: formNumber(formData.get('weeklyTarget')) || 3,
      forbiddenExpressions: String(formData.get('forbiddenExpressions') || '').trim(),
    } }))
    onToast('小红书设置已保存')
  }

  const copyPublishText = async (record: XiaohongshuPublishRecord) => {
    const text = [record.finalTitle, record.finalBody, record.topics].filter(Boolean).join('\n\n')
    if (!text) {
      onToast('先补充笔记标题或正文')
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      onToast('笔记内容已复制')
    } catch {
      onToast('复制失败，请打开发布记录后手工复制')
    }
  }

  const renderSection = () => {
    if (section === 'content') return <ContentSection data={data} view={contentView} onView={setContentView} onNewIdea={() => setEditingIdea(null)} onEditIdea={setEditingIdea} onAdoptIdea={adoptIdea} onNewNote={() => setEditingNote(null)} onEditNote={setEditingNote} onToggleChecklist={toggleChecklist} onAdvanceNote={advanceNote} />
    if (section === 'publish') return <PublishSection data={data} view={publishView} onView={setPublishView} onEdit={setEditingPublishId} onCopy={copyPublishText} />
    if (section === 'inquiries') return <InquirySection data={data} records={channelRecords} onAddLead={onAddLead} />
    if (section === 'review') return <ReviewSection data={data} records={channelRecords} />
    if (section === 'settings') return <SettingsSection settings={data.settings} onSave={saveSettings} />
    return <OverviewSection data={data} summary={summary} records={channelRecords} nextTask={nextTask} onOpenContent={() => { setSection('content'); setContentView('ideas') }} onOpenTask={setEditingNote} onAdvanceNote={advanceNote} onOpenPublish={() => { setSection('publish'); setPublishView('pending') }} onAddLead={onAddLead} />
  }

  const editingPublish = editingPublishId ? data.publishRecords.find((record) => record.id === editingPublishId) : undefined
  return <div className="xiaohongshu-workspace">
    <header className="page-header"><div><h1>小红书</h1><p>从选题、封面方式与正文准备、手工发布到评论私信和客户结果，管理一条可追踪的获客流程。</p></div><div className="page-action"><button className="button button-secondary" onClick={onBack}><ChevronLeft size={16} />返回获客</button></div></header>
    <nav className="douyin-module-tabs" aria-label="小红书工作区">{sectionItems.map((item) => <button key={item.id} className={section === item.id ? 'active' : ''} onClick={() => setSection(item.id)}>{item.icon}<span>{item.label}</span>{item.id === 'content' && summary.producing > 0 ? <b>{summary.producing}</b> : null}{item.id === 'publish' && summary.pending > 0 ? <b>{summary.pending}</b> : null}{item.id === 'inquiries' && summary.leads > 0 ? <b>{summary.leads}</b> : null}</button>)}</nav>
    {renderSection()}
    {editingIdea !== undefined ? <IdeaDialog idea={editingIdea || undefined} onClose={() => setEditingIdea(undefined)} onSubmit={createOrUpdateIdea} /> : null}
    {editingNote !== undefined ? <NoteDialog task={editingNote || undefined} ideas={data.ideas} settings={data.settings} onClose={() => setEditingNote(undefined)} onSubmit={createOrUpdateNote} /> : null}
    {editingPublish ? <PublishDialog record={editingPublish} task={taskById(editingPublish.noteTaskId)} metrics={metricForRecord(data, editingPublish.id)} onClose={() => setEditingPublishId(null)} onSubmit={savePublishRecord} /> : null}
  </div>
}

function OverviewSection({ data, summary, records, nextTask, onOpenContent, onOpenTask, onAdvanceNote, onOpenPublish, onAddLead }: { data: XiaohongshuData; summary: { ideas: number; planned: number; producing: number; pending: number; leads: number }; records: XiaohongshuCustomerRecord[]; nextTask?: XiaohongshuNoteTask; onOpenContent: () => void; onOpenTask: (task: XiaohongshuNoteTask) => void; onAdvanceNote: (task: XiaohongshuNoteTask) => void; onOpenPublish: () => void; onAddLead: (source?: string) => void }) {
  const nextRecord = data.publishRecords.find((record) => record.status === '待发布')
  const nextAction = nextTask?.status === '制作中' ? '继续完成标题、封面方式、素材和正文检查' : nextTask?.status === '准备中' ? '补充计划并开始制作' : nextRecord ? '准备手工发布' : '从选题库安排下一篇笔记'
  return <>
    <section className="douyin-command-band"><div><span>今天优先推进</span><h2>{nextTask?.title || data.noteTasks.find((task) => task.id === nextRecord?.noteTaskId)?.title || '建立第一篇小红书笔记计划'}</h2><p>{nextAction}</p></div>{nextTask ? <div className="douyin-command-actions"><button className="button button-secondary" onClick={() => onOpenTask(nextTask)}><Pencil size={15} />打开任务</button><button className="button button-primary" onClick={() => onAdvanceNote(nextTask)}>{nextTask.status === '制作中' ? '进入待发布' : nextTask.status === '待发布' ? '查看发布' : '开始制作'}<ArrowRight size={15} /></button></div> : nextRecord ? <button className="button button-primary" onClick={onOpenPublish}>查看待发布<ArrowRight size={15} /></button> : <button className="button button-primary" onClick={onOpenContent}><Plus size={15} />建立选题</button>}</section>
    <section className="douyin-overview-strip"><button onClick={onOpenContent}><Lightbulb size={17} /><span>待判断选题</span><strong>{summary.ideas}</strong><small>先判断是否值得做</small></button><button onClick={onOpenContent}><CalendarDays size={17} /><span>笔记计划</span><strong>{summary.planned}</strong><small>待安排或待开始</small></button><button onClick={onOpenContent}><Images size={17} /><span>制作中</span><strong>{summary.producing}</strong><small>标题、封面方式与正文</small></button><button onClick={onOpenPublish}><BookOpenText size={17} /><span>待发布</span><strong>{summary.pending}</strong><small>由客户手工发布</small></button><button onClick={() => onAddLead()}><MessageSquareMore size={17} /><span>小红书线索</span><strong>{summary.leads}</strong><small>{records.filter((record) => record.stage === 'intent').length} 个意向客户</small></button></section>
    <section className="douyin-overview-grid"><div className="work-panel"><div className="section-heading-row"><div><h2>近期笔记</h2><p>按计划日期查看最需要推进的内容。</p></div><button className="text-button" onClick={onOpenContent}>查看全部</button></div>{data.noteTasks.length ? <div className="douyin-compact-list">{[...data.noteTasks].sort((left, right) => (left.plannedDate || '9999-12-31').localeCompare(right.plannedDate || '9999-12-31')).slice(0, 5).map((task) => <button key={task.id} onClick={() => onOpenTask(task)}><span className={`status-pill ${noteStatusTone(task.status)}`}>{task.status}</span><div><strong>{task.title}</strong><span>{task.noteType} · {formatDate(task.plannedDate)}</span></div><ChevronRight size={16} /></button>)}</div> : <CompactEmpty icon={<CalendarDays size={21} />} title="还没有笔记计划" action={<button className="button button-secondary" onClick={onOpenContent}><Plus size={15} />建立选题</button>} />}</div><aside className="work-panel douyin-source-summary"><div className="section-heading-row"><div><h2>来源结果</h2><p>只统计已经确认发布的笔记。</p></div></div><div className="douyin-source-flow"><span>线索<strong>{records.filter((record) => record.stage === 'lead').length}</strong></span><ArrowRight size={16} /><span>意向客户<strong>{records.filter((record) => record.stage === 'intent').length}</strong></span><ArrowRight size={16} /><span>客户<strong>{records.filter((record) => record.stage === 'customer').length}</strong></span></div></aside></section>
  </>
}

function ContentSection({ data, view, onView, onNewIdea, onEditIdea, onAdoptIdea, onNewNote, onEditNote, onToggleChecklist, onAdvanceNote }: { data: XiaohongshuData; view: ContentView; onView: (view: ContentView) => void; onNewIdea: () => void; onEditIdea: (idea: XiaohongshuIdea) => void; onAdoptIdea: (idea: XiaohongshuIdea) => void; onNewNote: () => void; onEditNote: (task: XiaohongshuNoteTask) => void; onToggleChecklist: (task: XiaohongshuNoteTask, key: keyof XiaohongshuProductionChecklist) => void; onAdvanceNote: (task: XiaohongshuNoteTask) => void }) {
  const sortedTasks = [...data.noteTasks].sort((left, right) => (left.plannedDate || '9999-12-31').localeCompare(right.plannedDate || '9999-12-31'))
  return <>
    <div className="douyin-section-head"><div><h2>内容</h2><p>选题、笔记计划和制作任务分别管理，封面只确认“产品图加文案”或“标题直接做封面”。</p></div><div className="douyin-section-actions"><button className="button button-secondary" onClick={onNewNote}><Images size={15} />新建笔记任务</button><button className="button button-primary" onClick={onNewIdea}><Plus size={15} />新建选题</button></div></div>
    <div className="segmented-control douyin-subtabs" role="tablist" aria-label="内容视图"><button className={view === 'ideas' ? 'active' : ''} onClick={() => onView('ideas')}>选题库 <b>{data.ideas.length}</b></button><button className={view === 'plan' ? 'active' : ''} onClick={() => onView('plan')}>笔记计划 <b>{data.noteTasks.filter((task) => task.status === '准备中').length}</b></button><button className={view === 'tasks' ? 'active' : ''} onClick={() => onView('tasks')}>笔记任务 <b>{data.noteTasks.length}</b></button></div>
    {view === 'ideas' ? <section className="table-panel douyin-data-panel">{data.ideas.length ? <div className="table-scroll"><table><thead><tr><th>选题</th><th>内容方向</th><th>目标动作</th><th>来源</th><th>状态</th><th aria-label="操作"></th></tr></thead><tbody>{data.ideas.map((idea) => <tr key={idea.id}><td><button className="record-name" onClick={() => onEditIdea(idea)}><strong>{idea.title}</strong><span>{idea.customerProblem || '暂未补充客户问题'}</span></button></td><td>{idea.contentDirection || '待补充'}</td><td>{idea.targetAction || '待补充'}</td><td>{idea.sourceType}</td><td><span className={`status-pill ${idea.status === '已采用' ? 'teal' : idea.status === '暂不采用' ? 'muted' : 'neutral'}`}>{idea.status}</span></td><td><div className="row-actions">{idea.status !== '已采用' ? <button className="button button-primary small" onClick={() => onAdoptIdea(idea)}>转为计划<ArrowRight size={14} /></button> : null}<button className="icon-button small" title="编辑选题" aria-label="编辑选题" onClick={() => onEditIdea(idea)}><Pencil size={15} /></button></div></td></tr>)}</tbody></table></div> : <CompactEmpty icon={<Lightbulb size={23} />} title="还没有选题" description="先记录客户主动搜索、收藏或反复询问的问题，再决定哪些值得做成笔记。" action={<button className="button button-primary" onClick={onNewIdea}><Plus size={15} />新建选题</button>} />}</section> : null}
    {view === 'plan' ? <section className="work-panel douyin-plan-panel">{sortedTasks.length ? <div className="douyin-plan-list">{sortedTasks.map((task) => <div key={task.id} className="douyin-plan-row"><time>{formatDate(task.plannedDate)}</time><div><strong>{task.title}</strong><span>{task.owner || '未分配负责人'} · {task.noteType}</span></div><span className={`status-pill ${noteStatusTone(task.status)}`}>{task.status}</span><button className="icon-button small" title="编辑笔记任务" aria-label="编辑笔记任务" onClick={() => onEditNote(task)}><ChevronRight size={16} /></button></div>)}</div> : <CompactEmpty icon={<CalendarDays size={23} />} title="还没有笔记计划" description="采用一个选题后，它会进入这里等待安排日期。" action={<button className="button button-primary" onClick={onNewIdea}><Plus size={15} />新建选题</button>} />}</section> : null}
    {view === 'tasks' ? <section className="douyin-task-board">{data.noteTasks.length ? data.noteTasks.map((task) => { const progress = checklistProgress(task.checklist); return <article className="douyin-video-item" key={task.id}><div className="douyin-video-item-head"><div><span>{task.noteType}</span><h3>{task.title}</h3><p>{coverSummary(task)}</p></div><span className={`status-pill ${noteStatusTone(task.status)}`}>{task.status}</span></div><div className="douyin-progress-line"><span><b>{progress.completed}</b> / {progress.total} 项完成</span><div><i style={{ width: `${(progress.completed / progress.total) * 100}%` }} /></div></div><div className="douyin-checklist">{checklistItems.map((item) => <label key={item.key}><input type="checkbox" checked={task.checklist[item.key]} onChange={() => onToggleChecklist(task, item.key)} /><span>{item.label}</span></label>)}</div><div className="douyin-video-item-foot"><button className="button button-secondary small" onClick={() => onEditNote(task)}><Pencil size={14} />编辑</button>{task.status !== '已完成' && task.status !== '已暂停' ? <button className="button button-primary small" onClick={() => onAdvanceNote(task)}>{task.status === '准备中' ? '开始制作' : task.status === '制作中' ? '进入待发布' : '查看发布'}<ArrowRight size={14} /></button> : null}</div></article> }) : <CompactEmpty icon={<Images size={23} />} title="还没有笔记任务" description="采用选题或直接建立笔记任务后，在这里完成标题、封面方式、素材、正文和发布检查。" action={<button className="button button-primary" onClick={onNewNote}><Plus size={15} />新建笔记任务</button>} />}</section> : null}
  </>
}

function PublishSection({ data, view, onView, onEdit, onCopy }: { data: XiaohongshuData; view: PublishView; onView: (view: PublishView) => void; onEdit: (id: string) => void; onCopy: (record: XiaohongshuPublishRecord) => void }) {
  const records = data.publishRecords.filter((record) => view === 'pending' ? record.status === '待发布' : record.status !== '待发布')
  return <>
    <div className="douyin-section-head"><div><h2>发布</h2><p>工作台准备最终笔记内容，客户本人在小红书内发布后回来确认。</p></div></div>
    <div className="segmented-control douyin-subtabs" role="tablist" aria-label="发布视图"><button className={view === 'pending' ? 'active' : ''} onClick={() => onView('pending')}>待发布 <b>{data.publishRecords.filter((record) => record.status === '待发布').length}</b></button><button className={view === 'history' ? 'active' : ''} onClick={() => onView('history')}>发布记录 <b>{data.publishRecords.filter((record) => record.status !== '待发布').length}</b></button></div>
    <section className="douyin-publish-list">{records.length ? records.map((record) => { const task = data.noteTasks.find((item) => item.id === record.noteTaskId); const metrics = metricForRecord(data, record.id); return <article className="douyin-publish-row" key={record.id}><div className="douyin-publish-main"><span className={`status-pill ${publishStatusTone(record.status)}`}>{record.status}</span><div><strong>{task?.title || record.finalTitle || '未命名笔记'}</strong><span>{record.finalTitle || '待补充最终标题'}</span><small>{record.topics || '待补充话题'} · {task?.noteType || '笔记'}</small></div></div><div className="douyin-publish-meta"><span>{record.status === '待发布' ? `计划 ${formatDate(record.plannedPublishDate)}` : `发布 ${formatDate(record.publishedAt)}`}</span><span>{record.status === '已发布' ? `${formatMetric(metrics.views)} 浏览 · ${metrics.favorites} 收藏 · ${metrics.inquiries} 咨询` : record.sourceCode}</span></div><div className="douyin-publish-actions">{record.status === '待发布' ? <button className="button button-secondary small" onClick={() => void onCopy(record)}><Copy size={14} />复制笔记</button> : null}<button className="button button-primary small" onClick={() => onEdit(record.id)}>{record.status === '待发布' ? '登记发布' : '更新记录'}<ChevronRight size={14} /></button></div></article> }) : <CompactEmpty icon={<BookOpenText size={23} />} title={view === 'pending' ? '没有待发布笔记' : '还没有发布记录'} description={view === 'pending' ? '完成内容检查后，笔记会进入这里。' : '客户确认发布后，来源编号和结果会保存在这里。'} />}</section>
  </>
}

function InquirySection({ data, records, onAddLead }: { data: XiaohongshuData; records: XiaohongshuCustomerRecord[]; onAddLead: (source?: string) => void }) {
  const published = data.publishRecords.filter((record) => record.status === '已发布')
  const activeRecords = records.filter((record) => record.stage !== 'lost')
  return <>
    <div className="douyin-section-head"><div><h2>咨询</h2><p>评论、私信、电话或到店咨询直接进入线索，这里保留对应笔记来源。</p></div><button className="button button-primary" onClick={() => onAddLead()}><Plus size={15} />登记小红书咨询</button></div>
    <section className="douyin-inquiry-summary"><div><span>小红书线索</span><strong>{activeRecords.length}</strong><small>待判断或正在推进</small></div><div><span>进入意向客户</span><strong>{activeRecords.filter((record) => record.stage === 'intent').length}</strong><small>已确认值得推进</small></div><div><span>成为客户</span><strong>{activeRecords.filter((record) => record.stage === 'customer').length}</strong><small>已形成业务结果</small></div></section>
    <section className="douyin-inquiry-grid"><div className="work-panel"><div className="section-heading-row"><div><h2>按笔记登记</h2><p>选择客户咨询的具体笔记，来源会自动带入线索。</p></div></div>{published.length ? <div className="douyin-source-video-list">{published.map((record) => { const task = data.noteTasks.find((item) => item.id === record.noteTaskId); const count = records.filter((item) => item.source.includes(record.sourceCode)).length; return <div key={record.id}><div><strong>{task?.title || record.finalTitle}</strong><span>{record.sourceCode} · 已登记 {count} 条</span></div><button className="button button-secondary small" onClick={() => onAddLead(sourceLabel(data, record))}><Plus size={14} />登记咨询</button></div> })}</div> : <CompactEmpty icon={<Link2 size={22} />} title="还没有已发布笔记" description="确认发布后，才能按具体笔记登记咨询来源。" />}</div><div className="work-panel"><div className="section-heading-row"><div><h2>最近线索</h2><p>后续联系和推进在线索中完成。</p></div></div>{records.length ? <div className="douyin-lead-list">{records.slice(0, 8).map((record) => <div key={record.id}><span className={`stage-dot ${record.stage}`}></span><div><strong>{record.name}</strong><span>{record.need || record.source}</span></div><span className="status-pill neutral">{record.status}</span></div>)}</div> : <CompactEmpty icon={<MessageSquareMore size={22} />} title="还没有小红书线索" description="收到评论、私信、电话或到店咨询后，从这里快速登记。" action={<button className="button button-primary" onClick={() => onAddLead()}><Plus size={15} />登记咨询</button>} />}</div></section>
  </>
}

function ReviewSection({ data, records }: { data: XiaohongshuData; records: XiaohongshuCustomerRecord[] }) {
  const published = data.publishRecords.filter((record) => record.status === '已发布')
  const totals = data.metrics.reduce((current, metric) => ({ views: current.views + metric.views, interactions: current.interactions + metric.likes + metric.comments + metric.favorites + metric.shares, favorites: current.favorites + metric.favorites, inquiries: current.inquiries + metric.inquiries }), { views: 0, interactions: 0, favorites: 0, inquiries: 0 })
  const activeRecords = records.filter((record) => record.stage !== 'lost')
  return <>
    <div className="douyin-section-head"><div><h2>复盘</h2><p>先看笔记带来的线索、意向和客户，再参考浏览、收藏和互动。</p></div></div>
    <section className="douyin-review-summary"><div><span>客户</span><strong>{activeRecords.filter((record) => record.stage === 'customer').length}</strong></div><div><span>意向客户</span><strong>{activeRecords.filter((record) => record.stage === 'intent').length}</strong></div><div><span>有效线索</span><strong>{activeRecords.length}</strong></div><div><span>已回填咨询</span><strong>{totals.inquiries}</strong></div><div><span>收藏</span><strong>{formatMetric(totals.favorites)}</strong></div><div><span>浏览</span><strong>{formatMetric(totals.views)}</strong></div></section>
    <section className="table-panel douyin-data-panel">{published.length ? <div className="table-scroll"><table><thead><tr><th>笔记</th><th>浏览</th><th>收藏</th><th>互动</th><th>咨询</th><th>线索</th><th>客户</th></tr></thead><tbody>{published.map((record) => { const task = data.noteTasks.find((item) => item.id === record.noteTaskId); const metric = metricForRecord(data, record.id); const linked = records.filter((item) => item.source.includes(record.sourceCode) && item.stage !== 'lost'); return <tr key={record.id}><td><div className="source-cell"><b>{task?.title || record.finalTitle}</b><span>{record.sourceCode}</span></div></td><td>{formatMetric(metric.views)}</td><td>{formatMetric(metric.favorites)}</td><td>{formatMetric(metric.likes + metric.comments + metric.favorites + metric.shares)}</td><td>{metric.inquiries}</td><td>{linked.length}</td><td>{linked.filter((item) => item.stage === 'customer').length}</td></tr> })}</tbody></table></div> : <CompactEmpty icon={<BarChart3 size={23} />} title="还没有可复盘的笔记" description="确认发布并登记结果后，这里会按笔记展示平台数据和业务结果。" />}</section>
  </>
}

function SettingsSection({ settings, onSave }: { settings: XiaohongshuSettings; onSave: (formData: FormData) => void }) {
  return <>
    <div className="douyin-section-head"><div><h2>设置</h2><p>保存内容制作和任务安排需要的小红书业务背景，不保存账号密码或登录会话。</p></div></div>
    <form className="work-panel douyin-settings-form" onSubmit={(event) => { event.preventDefault(); onSave(new FormData(event.currentTarget)) }}><div className="form-grid"><label className="field"><span>账号备注名称</span><input name="accountLabel" defaultValue={settings.accountLabel} placeholder="例如：本地家居改造小红书号" /></label><label className="field"><span>所在城市</span><input name="city" defaultValue={settings.city} placeholder="例如：成都" /></label><label className="field"><span>默认负责人</span><input name="defaultOwner" defaultValue={settings.defaultOwner} placeholder="例如：李店长" /></label><label className="field"><span>每周计划发布</span><input name="weeklyTarget" type="number" min="1" max="30" defaultValue={settings.weeklyTarget} /></label><label className="field field-wide"><span>默认行动引导</span><input name="defaultCallToAction" defaultValue={settings.defaultCallToAction} placeholder="例如：私信户型和城市，领取清单或预约咨询" /></label><label className="field field-wide"><span>禁止使用的表达</span><textarea name="forbiddenExpressions" rows={4} defaultValue={settings.forbiddenExpressions} placeholder="一行一个，记录不符合实际承诺、平台规则或品牌要求的表达" /></label></div><div className="douyin-security-note"><Check size={16} /><span>这里不会保存小红书密码、Cookie、短信验证码或扫码登录信息。</span></div><div className="dialog-foot"><button className="button button-primary" type="submit">保存设置<Check size={15} /></button></div></form>
  </>
}

function IdeaDialog({ idea, onClose, onSubmit }: { idea?: XiaohongshuIdea; onClose: () => void; onSubmit: (formData: FormData, idea?: XiaohongshuIdea) => void }) {
  return <div className="dialog-backdrop" role="presentation"><form className="dialog douyin-dialog" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget), idea) }}><div className="dialog-head"><div><h2>{idea ? '编辑选题' : '新建选题'}</h2><p>先记录客户会搜索、收藏或主动询问的问题，采用后再进入笔记计划。</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div><div className="form-grid"><label className="field field-wide"><span>选题标题</span><input name="title" required autoFocus defaultValue={idea?.title || ''} placeholder="例如：小户型卫生间显大的 5 个设计细节" /></label><label className="field field-wide"><span>目标客户问题</span><textarea name="customerProblem" rows={3} defaultValue={idea?.customerProblem || ''} placeholder="客户正在搜索、比较或不知道怎么选择的事情" /></label><label className="field"><span>内容方向</span><input name="contentDirection" defaultValue={idea?.contentDirection || ''} placeholder="例如：清单、案例、攻略、避坑" /></label><label className="field"><span>目标动作</span><input name="targetAction" defaultValue={idea?.targetAction || ''} placeholder="例如：私信咨询、领取清单" /></label><label className="field"><span>选题来源</span><select name="sourceType" defaultValue={idea?.sourceType || '手工'}><option>手工</option><option>AI</option></select></label><label className="field"><span>当前状态</span><select name="status" defaultValue={idea?.status || '待判断'}><option>待判断</option><option>已采用</option><option>暂不采用</option></select></label><label className="field field-wide"><span>标签</span><input name="tags" defaultValue={idea?.tags || ''} placeholder="例如：小户型、收纳、旧房，用逗号分隔" /></label></div><div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onClose}>取消</button><button className="button button-primary" type="submit">保存<Check size={15} /></button></div></form></div>
}

function NoteDialog({ task, ideas, settings, onClose, onSubmit }: { task?: XiaohongshuNoteTask; ideas: XiaohongshuIdea[]; settings: XiaohongshuSettings; onClose: () => void; onSubmit: (formData: FormData, task?: XiaohongshuNoteTask) => void }) {
  const [coverMode, setCoverMode] = useState<XiaohongshuCoverMode>(task?.coverMode || '产品图加文案')
  return <div className="dialog-backdrop" role="presentation"><form className="dialog douyin-dialog douyin-video-dialog" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget), task) }}><div className="dialog-head"><div><h2>{task ? '编辑笔记任务' : '新建笔记任务'}</h2><p>工作台只给出封面方式和文案建议，图片准备与发布由客户本人完成。</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div><div className="form-grid"><label className="field field-wide"><span>来源选题</span><select name="ideaId" defaultValue={task?.ideaId || ''}><option value="">不关联选题</option>{ideas.map((idea) => <option key={idea.id} value={idea.id}>{idea.title}</option>)}</select></label><label className="field field-wide"><span>笔记主题</span><input name="title" required autoFocus defaultValue={task?.title || ''} placeholder="这篇笔记要解决什么问题" /></label><label className="field"><span>目标</span><input name="goal" defaultValue={task?.goal || ''} placeholder="例如：获得 10 个有效私信" /></label><label className="field"><span>笔记形式</span><select name="noteType" defaultValue={task?.noteType || '图文笔记'}><option>图文笔记</option><option>视频笔记</option><option>清单笔记</option><option>案例笔记</option><option>测评笔记</option></select></label><fieldset className="field field-wide cover-mode-field"><legend>封面方式</legend><div className="cover-mode-choice"><label className={coverMode === '产品图加文案' ? 'selected' : ''}><input type="radio" name="coverMode" value="产品图加文案" checked={coverMode === '产品图加文案'} onChange={() => setCoverMode('产品图加文案')} /><Images size={17} /><span><strong>产品图 + 文案</strong><small>使用清晰产品图，工作台只记录封面文案建议。</small></span></label><label className={coverMode === '标题直接做封面' ? 'selected' : ''}><input type="radio" name="coverMode" value="标题直接做封面" checked={coverMode === '标题直接做封面'} onChange={() => setCoverMode('标题直接做封面')} /><FileText size={17} /><span><strong>标题直接做封面</strong><small>不另写封面文案，直接使用上方笔记主题。</small></span></label></div></fieldset>{coverMode === '产品图加文案' ? <label className="field field-wide"><span>封面文案建议</span><input name="coverTitle" defaultValue={task?.coverTitle || ''} placeholder="例如：小户型卫生间，最容易买错这 3 样" /></label> : <div className="field field-wide cover-title-note"><FileText size={16} /><div><strong>封面将直接使用笔记主题</strong><span>修改上方“笔记主题”即可调整封面标题。</span></div><input type="hidden" name="coverTitle" value={task?.coverTitle || ''} /></div>}<label className="field field-wide"><span>正文</span><textarea name="body" rows={7} defaultValue={task?.body || ''} placeholder="开头问题、核心内容、案例或证明、行动引导" /></label><label className="field field-wide"><span>行动引导</span><input name="callToAction" defaultValue={task?.callToAction || settings.defaultCallToAction} placeholder="客户看完后应该做什么" /></label><label className="field field-wide"><span>图片 / 视频清单</span><textarea name="imageChecklist" rows={4} defaultValue={task?.imageChecklist || ''} placeholder="产品图、整体图、细节图、前后对比、尺寸图、过程图等" /></label><label className="field"><span>负责人</span><input name="owner" defaultValue={task?.owner || settings.defaultOwner} placeholder="例如：李店长" /></label><label className="field"><span>计划日期</span><input name="plannedDate" type="date" defaultValue={task?.plannedDate || ''} /></label><div className="field field-wide"><span>内容检查</span><div className="douyin-form-checklist">{checklistItems.map((item) => <label key={item.key}><input type="checkbox" name={item.key} defaultChecked={task?.checklist[item.key] || false} /><span>{item.label}</span></label>)}</div></div></div><div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onClose}>取消</button><button className="button button-primary" type="submit">保存<Check size={15} /></button></div></form></div>
}

function PublishDialog({ record, task, metrics, onClose, onSubmit }: { record: XiaohongshuPublishRecord; task?: XiaohongshuNoteTask; metrics: XiaohongshuMetrics; onClose: () => void; onSubmit: (formData: FormData, record: XiaohongshuPublishRecord) => void }) {
  return <div className="dialog-backdrop" role="presentation"><form className="dialog douyin-dialog" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget), record) }}><div className="dialog-head"><div><h2>{record.status === '待发布' ? '登记发布' : '更新发布记录'}</h2><p>{task?.title || record.finalTitle}。发布动作由客户本人在小红书内完成。</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div><div className="form-grid"><label className="field field-wide"><span>最终标题</span><input name="finalTitle" defaultValue={record.finalTitle} placeholder="最终发布标题" /></label><label className="field field-wide"><span>最终正文</span><textarea name="finalBody" rows={7} defaultValue={record.finalBody} placeholder="最终发布正文" /></label><label className="field field-wide"><span>话题</span><input name="topics" defaultValue={record.topics} placeholder="#小户型改造 #装修避坑" /></label><label className="field"><span>计划发布日期</span><input name="plannedPublishDate" type="date" defaultValue={record.plannedPublishDate} /></label><label className="field"><span>发布状态</span><select name="status" defaultValue={record.status}><option>待发布</option><option>已发布</option><option>已删除</option><option>不可见</option><option>其他</option></select></label><label className="field"><span>实际发布时间</span><input name="publishedAt" type="datetime-local" defaultValue={record.publishedAt} /></label><label className="field field-wide"><span>笔记链接</span><input name="noteUrl" defaultValue={record.noteUrl} placeholder="发布后粘贴小红书笔记链接" /></label><div className="field field-wide source-code-field"><span>来源编号</span><div><Link2 size={15} /><strong>{record.sourceCode}</strong><small>只有状态为“已发布”时，才可在线索中选择。</small></div></div><div className="douyin-form-section field-wide"><strong>平台数据</strong><span>发布后手工回填；关联线索由工作台自动统计。</span></div><label className="field"><span>浏览量</span><input name="views" type="number" min="0" defaultValue={metrics.views || ''} /></label><label className="field"><span>点赞</span><input name="likes" type="number" min="0" defaultValue={metrics.likes || ''} /></label><label className="field"><span>评论</span><input name="comments" type="number" min="0" defaultValue={metrics.comments || ''} /></label><label className="field"><span>收藏</span><input name="favorites" type="number" min="0" defaultValue={metrics.favorites || ''} /></label><label className="field"><span>分享</span><input name="shares" type="number" min="0" defaultValue={metrics.shares || ''} /></label><label className="field"><span>评论 / 私信咨询</span><input name="inquiries" type="number" min="0" defaultValue={metrics.inquiries || ''} /></label></div><div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onClose}>取消</button><button className="button button-primary" type="submit">保存记录<Check size={15} /></button></div></form></div>
}

function CompactEmpty({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return <div className="douyin-compact-empty"><span>{icon}</span><strong>{title}</strong>{description ? <p>{description}</p> : null}{action}</div>
}
