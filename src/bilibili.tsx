import { useMemo, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Copy,
  FileText,
  LayoutDashboard,
  Lightbulb,
  Link2,
  ListChecks,
  MessageSquareMore,
  Pencil,
  Play,
  Plus,
  Settings2,
  Video,
  X,
} from 'lucide-react'

export type BilibiliIdeaStatus = '待判断' | '已采用' | '暂不采用'
export type BilibiliVideoStatus = '准备中' | '制作中' | '待发布' | '已完成' | '已暂停'
export type BilibiliPublishStatus = '待发布' | '已发布' | '已删除' | '不可见' | '其他'

export type BilibiliIdea = {
  id: string
  contentPackageId: string
  title: string
  audienceQuestion: string
  viewerGain: string
  proofMaterial: string
  seriesName: string
  targetAction: string
  sourceType: '手工' | 'AI'
  tags: string
  status: BilibiliIdeaStatus
  createdAt: string
}

export type BilibiliProductionChecklist = {
  outlineReady: boolean
  proofReady: boolean
  scriptReady: boolean
  filmed: boolean
  edited: boolean
  coverReady: boolean
  publishChecked: boolean
}

export type BilibiliVideoTask = {
  id: string
  ideaId: string
  contentPackageId: string
  title: string
  goal: string
  format: string
  targetDuration: string
  audiencePromise: string
  chapterOutline: string
  script: string
  callToAction: string
  proofChecklist: string
  owner: string
  plannedDate: string
  status: BilibiliVideoStatus
  checklist: BilibiliProductionChecklist
  createdAt: string
}

export type BilibiliPublishRecord = {
  id: string
  videoTaskId: string
  title: string
  description: string
  tags: string
  category: string
  coverTitle: string
  submissionType: '自制' | '转载'
  rightsNote: string
  plannedPublishDate: string
  publishedAt: string
  videoUrl: string
  sourceCode: string
  status: BilibiliPublishStatus
  metricUpdatedAt: string
}

export type BilibiliMetrics = {
  publishRecordId: string
  views: number
  likes: number
  coins: number
  comments: number
  danmaku: number
  favorites: number
  shares: number
  followerGain: number
  inquiries: number
  updatedAt: string
}

export type BilibiliSettings = {
  accountLabel: string
  serviceArea: string
  defaultOwner: string
  defaultCallToAction: string
  monthlyTarget: number
  defaultCategory: string
  defaultSeries: string
  contentBoundaries: string
}

export type BilibiliData = {
  version: 1
  ideas: BilibiliIdea[]
  videoTasks: BilibiliVideoTask[]
  publishRecords: BilibiliPublishRecord[]
  metrics: BilibiliMetrics[]
  settings: BilibiliSettings
}

export type BilibiliLegacyTask = {
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

export type BilibiliCustomerRecord = {
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

type BilibiliSection = 'overview' | 'content' | 'publish' | 'inquiries' | 'review' | 'settings'
type ContentView = 'ideas' | 'plan' | 'tasks'
type PublishView = 'pending' | 'history'

const emptyChecklist: BilibiliProductionChecklist = {
  outlineReady: false,
  proofReady: false,
  scriptReady: false,
  filmed: false,
  edited: false,
  coverReady: false,
  publishChecked: false,
}

export const emptyBilibiliData: BilibiliData = {
  version: 1,
  ideas: [],
  videoTasks: [],
  publishRecords: [],
  metrics: [],
  settings: {
    accountLabel: '',
    serviceArea: '',
    defaultOwner: '',
    defaultCallToAction: '',
    monthlyTarget: 2,
    defaultCategory: '',
    defaultSeries: '',
    contentBoundaries: '',
  },
}

const checklistItems: Array<{ key: keyof BilibiliProductionChecklist; label: string }> = [
  { key: 'outlineReady', label: '章节大纲已确认' },
  { key: 'proofReady', label: '案例与证明素材可用' },
  { key: 'scriptReady', label: '脚本已确认' },
  { key: 'filmed', label: '拍摄已完成' },
  { key: 'edited', label: '剪辑已完成' },
  { key: 'coverReady', label: '封面已完成' },
  { key: 'publishChecked', label: '投稿内容已检查' },
]

const sectionItems: Array<{ id: BilibiliSection; label: string; icon: ReactNode }> = [
  { id: 'overview', label: '总览', icon: <LayoutDashboard size={15} /> },
  { id: 'content', label: '内容', icon: <FileText size={15} /> },
  { id: 'publish', label: '投稿', icon: <Play size={15} /> },
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
  return `BILI-${todayISO().replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`
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

function normalizeChecklist(value: unknown): BilibiliProductionChecklist {
  const checklist = value && typeof value === 'object' ? value as Partial<BilibiliProductionChecklist> & { materialsReady?: boolean } : {}
  return {
    outlineReady: Boolean(checklist.outlineReady || checklist.scriptReady),
    proofReady: Boolean(checklist.proofReady || checklist.materialsReady),
    scriptReady: Boolean(checklist.scriptReady),
    filmed: Boolean(checklist.filmed),
    edited: Boolean(checklist.edited),
    coverReady: Boolean(checklist.coverReady),
    publishChecked: Boolean(checklist.publishChecked),
  }
}

function migrateLegacyStatus(status: string): BilibiliVideoStatus {
  if (status === '制作中') return '制作中'
  if (status === '待发布') return '待发布'
  if (status === '已发布' || status === '已完成') return '已完成'
  if (status === '已暂停') return '已暂停'
  return '准备中'
}

function completedChecklist(status: string, task: BilibiliLegacyTask): BilibiliProductionChecklist {
  const completed = ['待发布', '已发布', '已完成'].includes(status)
  return {
    outlineReady: completed || Boolean(task.scriptOutline),
    proofReady: completed || Boolean(task.shootingChecklist),
    scriptReady: completed || Boolean(task.scriptOutline),
    filmed: completed,
    edited: completed,
    coverReady: completed,
    publishChecked: completed,
  }
}

function migrateLegacyTasks(legacyTasks: BilibiliLegacyTask[]): BilibiliData {
  const tasks = legacyTasks.filter((task) => task.channelId === 'bilibili' && task.title)
  if (!tasks.length) return emptyBilibiliData

  const ideas: BilibiliIdea[] = tasks.map((task, index) => ({
    id: `bili-idea-legacy-${task.id || index}`,
    contentPackageId: stringValue(task.contentPackageId),
    title: stringValue(task.title),
    audienceQuestion: stringValue(task.goal),
    viewerGain: stringValue(task.note),
    proofMaterial: stringValue(task.shootingChecklist),
    seriesName: '',
    targetAction: stringValue(task.callToAction),
    sourceType: '手工',
    tags: '',
    status: '已采用',
    createdAt: stringValue(task.createdAt, todayISO()),
  }))

  const videoTasks: BilibiliVideoTask[] = tasks.map((task, index) => ({
    id: `bili-video-legacy-${task.id || index}`,
    ideaId: ideas[index].id,
    contentPackageId: stringValue(task.contentPackageId),
    title: stringValue(task.title),
    goal: stringValue(task.goal),
    format: stringValue(task.videoFormat, '专题讲解'),
    targetDuration: '',
    audiencePromise: stringValue(task.openingHook),
    chapterOutline: stringValue(task.scriptOutline),
    script: stringValue(task.scriptOutline),
    callToAction: stringValue(task.callToAction),
    proofChecklist: stringValue(task.shootingChecklist),
    owner: stringValue(task.owner),
    plannedDate: stringValue(task.plannedDate),
    status: migrateLegacyStatus(stringValue(task.status)),
    checklist: completedChecklist(stringValue(task.status), task),
    createdAt: stringValue(task.createdAt, todayISO()),
  }))

  const publishRecords: BilibiliPublishRecord[] = tasks.flatMap((task, index) => {
    const status = stringValue(task.status)
    if (!['待发布', '已发布', '已完成'].includes(status)) return []
    return [{
      id: `bili-publish-legacy-${task.id || index}`,
      videoTaskId: videoTasks[index].id,
      title: stringValue(task.title),
      description: '',
      tags: '',
      category: '',
      coverTitle: '',
      submissionType: '自制',
      rightsNote: '',
      plannedPublishDate: stringValue(task.plannedDate),
      publishedAt: ['已发布', '已完成'].includes(status) ? stringValue(task.plannedDate, stringValue(task.createdAt, todayISO())) : '',
      videoUrl: stringValue(task.linkOrLocation),
      sourceCode: stringValue(task.sourceCode, createSourceCode()),
      status: ['已发布', '已完成'].includes(status) ? '已发布' : '待发布',
      metricUpdatedAt: stringValue(task.createdAt, todayISO()),
    } satisfies BilibiliPublishRecord]
  })

  const metrics: BilibiliMetrics[] = publishRecords.map((record) => {
    const index = videoTasks.findIndex((task) => task.id === record.videoTaskId)
    const legacyTask = tasks[index]
    return {
      publishRecordId: record.id,
      views: numberValue(legacyTask?.viewCount),
      likes: 0,
      coins: 0,
      comments: 0,
      danmaku: 0,
      favorites: 0,
      shares: 0,
      followerGain: 0,
      inquiries: numberValue(legacyTask?.inquiryCount),
      updatedAt: record.metricUpdatedAt,
    }
  })

  return { ...emptyBilibiliData, ideas, videoTasks, publishRecords, metrics }
}

export function normalizeBilibiliData(value: unknown, legacyTasks: BilibiliLegacyTask[] = []): BilibiliData {
  if (!value || typeof value !== 'object') return migrateLegacyTasks(legacyTasks)
  const raw = value as Partial<BilibiliData>
  const ideas = Array.isArray(raw.ideas) ? raw.ideas.filter((idea) => idea && typeof idea.title === 'string').map((idea) => ({
    id: stringValue(idea.id, createId('bili-idea')),
    contentPackageId: stringValue(idea.contentPackageId),
    title: stringValue(idea.title),
    audienceQuestion: stringValue(idea.audienceQuestion),
    viewerGain: stringValue(idea.viewerGain),
    proofMaterial: stringValue(idea.proofMaterial),
    seriesName: stringValue(idea.seriesName),
    targetAction: stringValue(idea.targetAction),
    sourceType: stringValue(idea.sourceType) === 'AI' ? 'AI' as const : '手工' as const,
    tags: stringValue(idea.tags),
    status: ['已采用', '暂不采用'].includes(stringValue(idea.status)) ? idea.status as BilibiliIdeaStatus : '待判断',
    createdAt: stringValue(idea.createdAt, todayISO()),
  })) : []
  const videoTasks = Array.isArray(raw.videoTasks) ? raw.videoTasks.filter((task) => task && typeof task.title === 'string').map((task) => ({
    id: stringValue(task.id, createId('bili-video')),
    ideaId: stringValue(task.ideaId),
    contentPackageId: stringValue(task.contentPackageId),
    title: stringValue(task.title),
    goal: stringValue(task.goal),
    format: stringValue(task.format, '专题讲解'),
    targetDuration: stringValue(task.targetDuration),
    audiencePromise: stringValue(task.audiencePromise),
    chapterOutline: stringValue(task.chapterOutline),
    script: stringValue(task.script),
    callToAction: stringValue(task.callToAction),
    proofChecklist: stringValue(task.proofChecklist),
    owner: stringValue(task.owner),
    plannedDate: stringValue(task.plannedDate),
    status: ['制作中', '待发布', '已完成', '已暂停'].includes(stringValue(task.status)) ? task.status as BilibiliVideoStatus : '准备中',
    checklist: normalizeChecklist(task.checklist),
    createdAt: stringValue(task.createdAt, todayISO()),
  })) : []
  const publishRecords = Array.isArray(raw.publishRecords) ? raw.publishRecords.filter((record) => record && typeof record.videoTaskId === 'string').map((record) => ({
    id: stringValue(record.id, createId('bili-publish')),
    videoTaskId: stringValue(record.videoTaskId),
    title: stringValue(record.title),
    description: stringValue(record.description),
    tags: stringValue(record.tags),
    category: stringValue(record.category),
    coverTitle: stringValue(record.coverTitle),
    submissionType: stringValue(record.submissionType) === '转载' ? '转载' as const : '自制' as const,
    rightsNote: stringValue(record.rightsNote),
    plannedPublishDate: stringValue(record.plannedPublishDate),
    publishedAt: stringValue(record.publishedAt),
    videoUrl: stringValue(record.videoUrl),
    sourceCode: stringValue(record.sourceCode, createSourceCode()),
    status: ['已发布', '已删除', '不可见', '其他'].includes(stringValue(record.status)) ? record.status as BilibiliPublishStatus : '待发布',
    metricUpdatedAt: stringValue(record.metricUpdatedAt),
  })) : []
  const metrics = Array.isArray(raw.metrics) ? raw.metrics.filter((metric) => metric && typeof metric.publishRecordId === 'string').map((metric) => ({
    publishRecordId: stringValue(metric.publishRecordId),
    views: numberValue(metric.views),
    likes: numberValue(metric.likes),
    coins: numberValue(metric.coins),
    comments: numberValue(metric.comments),
    danmaku: numberValue(metric.danmaku),
    favorites: numberValue(metric.favorites),
    shares: numberValue(metric.shares),
    followerGain: numberValue(metric.followerGain),
    inquiries: numberValue(metric.inquiries),
    updatedAt: stringValue(metric.updatedAt),
  })) : []
  const settings = raw.settings && typeof raw.settings === 'object' ? raw.settings : emptyBilibiliData.settings
  return {
    version: 1,
    ideas,
    videoTasks,
    publishRecords,
    metrics,
    settings: {
      accountLabel: stringValue(settings.accountLabel),
      serviceArea: stringValue(settings.serviceArea),
      defaultOwner: stringValue(settings.defaultOwner),
      defaultCallToAction: stringValue(settings.defaultCallToAction),
      monthlyTarget: numberValue(settings.monthlyTarget) || 2,
      defaultCategory: stringValue(settings.defaultCategory),
      defaultSeries: stringValue(settings.defaultSeries),
      contentBoundaries: stringValue(settings.contentBoundaries),
    },
  }
}

export function bilibiliSourceOptions(data: BilibiliData) {
  return data.publishRecords.filter((record) => record.status === '已发布').map((record) => {
    const task = data.videoTasks.find((item) => item.id === record.videoTaskId)
    return {
      id: record.id,
      label: `B站 · ${task?.title || '未命名视频'} · ${record.sourceCode}`,
    }
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

function videoStatusTone(status: BilibiliVideoStatus) {
  if (status === '已暂停') return 'muted'
  if (status === '制作中' || status === '待发布') return 'amber'
  if (status === '已完成') return 'teal'
  return 'neutral'
}

function publishStatusTone(status: BilibiliPublishStatus) {
  if (status === '已删除' || status === '不可见' || status === '其他') return 'muted'
  if (status === '待发布') return 'amber'
  return 'teal'
}

function checklistProgress(checklist: BilibiliProductionChecklist) {
  const completed = checklistItems.filter((item) => checklist[item.key]).length
  return { completed, total: checklistItems.length, done: completed === checklistItems.length }
}

function metricForRecord(data: BilibiliData, publishRecordId: string) {
  return data.metrics.find((metric) => metric.publishRecordId === publishRecordId) ?? {
    publishRecordId,
    views: 0,
    likes: 0,
    coins: 0,
    comments: 0,
    danmaku: 0,
    favorites: 0,
    shares: 0,
    followerGain: 0,
    inquiries: 0,
    updatedAt: '',
  }
}

function publishRecordForTask(data: BilibiliData, videoTaskId: string) {
  return data.publishRecords.find((record) => record.videoTaskId === videoTaskId)
}

function sourceLabel(data: BilibiliData, record: BilibiliPublishRecord) {
  return bilibiliSourceOptions(data).find((option) => option.id === record.id)?.label || `B站 · ${record.sourceCode}`
}

export function BilibiliWorkspace({ data, records, onChange, onBack, onAddLead, onToast }: { data: BilibiliData; records: BilibiliCustomerRecord[]; onChange: (updater: (current: BilibiliData) => BilibiliData) => void; onBack: () => void; onAddLead: (source?: string) => void; onToast: (message: string) => void }) {
  const [section, setSection] = useState<BilibiliSection>('overview')
  const [contentView, setContentView] = useState<ContentView>('ideas')
  const [publishView, setPublishView] = useState<PublishView>('pending')
  const [editingIdea, setEditingIdea] = useState<BilibiliIdea | null | undefined>(undefined)
  const [editingVideo, setEditingVideo] = useState<BilibiliVideoTask | null | undefined>(undefined)
  const [editingPublishId, setEditingPublishId] = useState<string | null>(null)
  const publishedRecords = data.publishRecords.filter((record) => record.status === '已发布')
  const pendingRecords = data.publishRecords.filter((record) => record.status === '待发布')
  const channelSources = publishedRecords.map((record) => record.sourceCode)
  const channelRecords = records.filter((record) => channelSources.some((source) => record.source.includes(source)))
  const activeChannelRecords = channelRecords.filter((record) => record.stage !== 'lost')
  const taskById = (id: string) => data.videoTasks.find((task) => task.id === id)
  const nextTask = data.videoTasks.find((task) => task.status === '制作中') || data.videoTasks.find((task) => task.status === '准备中') || data.videoTasks.find((task) => task.status === '待发布')

  const summary = useMemo(() => ({
    ideas: data.ideas.filter((idea) => idea.status === '待判断').length,
    planned: data.videoTasks.filter((task) => task.status === '准备中').length,
    producing: data.videoTasks.filter((task) => task.status === '制作中').length,
    pending: pendingRecords.length,
    leads: activeChannelRecords.length,
  }), [activeChannelRecords.length, data.ideas, data.videoTasks, pendingRecords.length])

  const createOrUpdateIdea = (formData: FormData, idea?: BilibiliIdea | null) => {
    const nextIdea: BilibiliIdea = {
      id: idea?.id || createId('bili-idea'),
      contentPackageId: idea?.contentPackageId || '',
      title: String(formData.get('title') || '').trim(),
      audienceQuestion: String(formData.get('audienceQuestion') || '').trim(),
      viewerGain: String(formData.get('viewerGain') || '').trim(),
      proofMaterial: String(formData.get('proofMaterial') || '').trim(),
      seriesName: String(formData.get('seriesName') || '').trim(),
      targetAction: String(formData.get('targetAction') || '').trim(),
      sourceType: String(formData.get('sourceType') || '手工') as BilibiliIdea['sourceType'],
      tags: String(formData.get('tags') || '').trim(),
      status: String(formData.get('status') || '待判断') as BilibiliIdeaStatus,
      createdAt: idea?.createdAt || todayISO(),
    }
    if (!nextIdea.title) return
    onChange((current) => ({ ...current, ideas: idea ? current.ideas.map((item) => item.id === idea.id ? nextIdea : item) : [nextIdea, ...current.ideas] }))
    setEditingIdea(undefined)
    onToast(idea ? '选题已更新' : '选题已加入选题库')
  }

  const adoptIdea = (idea: BilibiliIdea) => {
    const existing = data.videoTasks.find((task) => task.ideaId === idea.id)
    if (existing) {
      setContentView('plan')
      onToast('这个选题已经进入内容计划')
      return
    }
    const task: BilibiliVideoTask = {
      id: createId('bili-video'),
      ideaId: idea.id,
      contentPackageId: idea.contentPackageId,
      title: idea.title,
      goal: idea.viewerGain,
      format: '专题讲解',
      targetDuration: '',
      audiencePromise: idea.viewerGain,
      chapterOutline: '',
      script: '',
      callToAction: idea.targetAction || data.settings.defaultCallToAction,
      proofChecklist: idea.proofMaterial,
      owner: data.settings.defaultOwner,
      plannedDate: '',
      status: '准备中',
      checklist: { ...emptyChecklist },
      createdAt: todayISO(),
    }
    onChange((current) => ({ ...current, ideas: current.ideas.map((item) => item.id === idea.id ? { ...item, status: '已采用' } : item), videoTasks: [task, ...current.videoTasks] }))
    setContentView('plan')
    onToast('已转入内容计划')
  }

  const createOrUpdateVideo = (formData: FormData, task?: BilibiliVideoTask | null) => {
    const ideaId = String(formData.get('ideaId') || task?.ideaId || '')
    const idea = data.ideas.find((item) => item.id === ideaId)
    const status = task?.status || '准备中'
    const nextTask: BilibiliVideoTask = {
      id: task?.id || createId('bili-video'),
      ideaId,
      contentPackageId: task?.contentPackageId || idea?.contentPackageId || '',
      title: String(formData.get('title') || idea?.title || '').trim(),
      goal: String(formData.get('goal') || '').trim(),
      format: String(formData.get('format') || '专题讲解'),
      targetDuration: String(formData.get('targetDuration') || '').trim(),
      audiencePromise: String(formData.get('audiencePromise') || '').trim(),
      chapterOutline: String(formData.get('chapterOutline') || '').trim(),
      script: String(formData.get('script') || '').trim(),
      callToAction: String(formData.get('callToAction') || '').trim(),
      proofChecklist: String(formData.get('proofChecklist') || '').trim(),
      owner: String(formData.get('owner') || '').trim(),
      plannedDate: String(formData.get('plannedDate') || ''),
      status,
      checklist: checklistItems.reduce((current, item) => ({ ...current, [item.key]: formData.get(item.key) === 'on' }), { ...emptyChecklist }),
      createdAt: task?.createdAt || todayISO(),
    }
    if (!nextTask.title) return
    onChange((current) => {
      const videoTasks = task ? current.videoTasks.map((item) => item.id === task.id ? nextTask : item) : [nextTask, ...current.videoTasks]
      const hasPublishRecord = current.publishRecords.some((record) => record.videoTaskId === nextTask.id)
      const publishRecords = status === '待发布' && !hasPublishRecord ? [{
        id: createId('bili-publish'),
        videoTaskId: nextTask.id,
        title: nextTask.title,
        description: nextTask.callToAction,
        tags: '',
        category: current.settings.defaultCategory,
        coverTitle: nextTask.title,
        submissionType: '自制' as const,
        rightsNote: '',
        plannedPublishDate: nextTask.plannedDate,
        publishedAt: '',
        videoUrl: '',
        sourceCode: createSourceCode(),
        status: '待发布' as const,
        metricUpdatedAt: '',
      }, ...current.publishRecords] : current.publishRecords
      return { ...current, videoTasks, publishRecords }
    })
    setEditingVideo(undefined)
    onToast(task ? '视频任务已更新' : '视频任务已建立')
  }

  const toggleChecklist = (task: BilibiliVideoTask, key: keyof BilibiliProductionChecklist) => {
    onChange((current) => ({ ...current, videoTasks: current.videoTasks.map((item) => item.id === task.id ? { ...item, checklist: { ...item.checklist, [key]: !item.checklist[key] } } : item) }))
  }

  const advanceVideo = (task: BilibiliVideoTask) => {
    if (task.status === '准备中') {
      onChange((current) => ({ ...current, videoTasks: current.videoTasks.map((item) => item.id === task.id ? { ...item, status: '制作中' } : item) }))
      onToast('已进入视频制作')
      return
    }
    if (task.status === '制作中') {
      if (!checklistProgress(task.checklist).done) {
        onToast('先完成 7 项制作检查，再进入待投稿')
        return
      }
      onChange((current) => {
        const exists = current.publishRecords.some((record) => record.videoTaskId === task.id)
        const record: BilibiliPublishRecord = {
        id: createId('bili-publish'),
        videoTaskId: task.id,
        title: task.title,
        description: task.callToAction,
        tags: '',
        category: current.settings.defaultCategory,
        coverTitle: task.title,
        submissionType: '自制',
        rightsNote: '',
          plannedPublishDate: task.plannedDate,
          publishedAt: '',
          videoUrl: '',
          sourceCode: createSourceCode(),
          status: '待发布',
          metricUpdatedAt: '',
        }
        return { ...current, videoTasks: current.videoTasks.map((item) => item.id === task.id ? { ...item, status: '待发布' } : item), publishRecords: exists ? current.publishRecords : [record, ...current.publishRecords] }
      })
      setSection('publish')
      setPublishView('pending')
      onToast('视频已进入待投稿')
      return
    }
    if (task.status === '待发布') {
      setSection('publish')
      setPublishView('pending')
    }
  }

  const savePublishRecord = (formData: FormData, record: BilibiliPublishRecord) => {
    const status = String(formData.get('status') || record.status) as BilibiliPublishStatus
    const nextRecord: BilibiliPublishRecord = {
      ...record,
      title: String(formData.get('title') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      tags: String(formData.get('tags') || '').trim(),
      category: String(formData.get('category') || '').trim(),
      coverTitle: String(formData.get('coverTitle') || '').trim(),
      submissionType: String(formData.get('submissionType') || '自制') as BilibiliPublishRecord['submissionType'],
      rightsNote: String(formData.get('rightsNote') || '').trim(),
      plannedPublishDate: String(formData.get('plannedPublishDate') || ''),
      publishedAt: String(formData.get('publishedAt') || ''),
      videoUrl: String(formData.get('videoUrl') || '').trim(),
      status,
      metricUpdatedAt: todayISO(),
    }
    const nextMetrics: BilibiliMetrics = {
      publishRecordId: record.id,
      views: formNumber(formData.get('views')),
      likes: formNumber(formData.get('likes')),
      coins: formNumber(formData.get('coins')),
      comments: formNumber(formData.get('comments')),
      danmaku: formNumber(formData.get('danmaku')),
      favorites: formNumber(formData.get('favorites')),
      shares: formNumber(formData.get('shares')),
      followerGain: formNumber(formData.get('followerGain')),
      inquiries: formNumber(formData.get('inquiries')),
      updatedAt: todayISO(),
    }
    onChange((current) => ({
      ...current,
      publishRecords: current.publishRecords.map((item) => item.id === record.id ? nextRecord : item),
      metrics: current.metrics.some((metric) => metric.publishRecordId === record.id) ? current.metrics.map((metric) => metric.publishRecordId === record.id ? nextMetrics : metric) : [nextMetrics, ...current.metrics],
      videoTasks: current.videoTasks.map((task) => task.id === record.videoTaskId ? { ...task, status: status === '已发布' ? '已完成' : status === '待发布' ? '待发布' : task.status } : task),
    }))
    setEditingPublishId(null)
    if (status === '已发布') setPublishView('history')
    onToast(status === '已发布' ? '已确认发布，来源编号现在可以关联线索' : '发布记录已更新')
  }

  const saveSettings = (formData: FormData) => {
    onChange((current) => ({ ...current, settings: {
      accountLabel: String(formData.get('accountLabel') || '').trim(),
      serviceArea: String(formData.get('serviceArea') || '').trim(),
      defaultOwner: String(formData.get('defaultOwner') || '').trim(),
      defaultCallToAction: String(formData.get('defaultCallToAction') || '').trim(),
      monthlyTarget: formNumber(formData.get('monthlyTarget')) || 2,
      defaultCategory: String(formData.get('defaultCategory') || '').trim(),
      defaultSeries: String(formData.get('defaultSeries') || '').trim(),
      contentBoundaries: String(formData.get('contentBoundaries') || '').trim(),
    } }))
    onToast('B站设置已保存')
  }

  const copyPublishText = async (record: BilibiliPublishRecord) => {
    const text = [record.title, record.description, record.tags, record.category ? `分区：${record.category}` : '', record.coverTitle ? `封面文案：${record.coverTitle}` : '', record.rightsNote].filter(Boolean).join('\n')
    if (!text) {
      onToast('先补充发布标题或话题')
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      onToast('投稿包已复制')
    } catch {
      onToast('复制失败，请打开发布记录后手工复制')
    }
  }

  const renderSection = () => {
    if (section === 'content') return <ContentSection data={data} view={contentView} onView={setContentView} onNewIdea={() => setEditingIdea(null)} onEditIdea={setEditingIdea} onAdoptIdea={adoptIdea} onNewVideo={() => setEditingVideo(null)} onEditVideo={setEditingVideo} onToggleChecklist={toggleChecklist} onAdvanceVideo={advanceVideo} />
    if (section === 'publish') return <PublishSection data={data} view={publishView} onView={setPublishView} onEdit={setEditingPublishId} onCopy={copyPublishText} />
    if (section === 'inquiries') return <InquirySection data={data} records={channelRecords} onAddLead={onAddLead} />
    if (section === 'review') return <ReviewSection data={data} records={channelRecords} />
    if (section === 'settings') return <SettingsSection settings={data.settings} onSave={saveSettings} />
    return <OverviewSection data={data} summary={summary} records={channelRecords} nextTask={nextTask} onOpenContent={() => { setSection('content'); setContentView('ideas') }} onOpenTask={(task) => setEditingVideo(task)} onAdvanceVideo={advanceVideo} onOpenPublish={() => { setSection('publish'); setPublishView('pending') }} onAddLead={onAddLead} />
  }

  const editingPublish = editingPublishId ? data.publishRecords.find((record) => record.id === editingPublishId) : undefined
  return <div className="bilibili-workspace">
    <header className="page-header"><div><h1>B站</h1><p>把一个专业问题讲透，从选题、章节与证明素材到手工投稿、咨询和成交结果全程追踪。</p></div><div className="page-action"><button className="button button-secondary" onClick={onBack}><ChevronLeft size={16} />返回获客</button></div></header>
    <nav className="douyin-module-tabs" aria-label="B站工作区">{sectionItems.map((item) => <button key={item.id} className={section === item.id ? 'active' : ''} onClick={() => setSection(item.id)}>{item.icon}<span>{item.label}</span>{item.id === 'content' && summary.producing > 0 ? <b>{summary.producing}</b> : null}{item.id === 'publish' && summary.pending > 0 ? <b>{summary.pending}</b> : null}{item.id === 'inquiries' && summary.leads > 0 ? <b>{summary.leads}</b> : null}</button>)}</nav>
    {renderSection()}
    {editingIdea !== undefined ? <IdeaDialog idea={editingIdea || undefined} defaultSeries={data.settings.defaultSeries} onClose={() => setEditingIdea(undefined)} onSubmit={createOrUpdateIdea} /> : null}
    {editingVideo !== undefined ? <VideoDialog task={editingVideo || undefined} ideas={data.ideas} settings={data.settings} onClose={() => setEditingVideo(undefined)} onSubmit={createOrUpdateVideo} /> : null}
    {editingPublish ? <PublishDialog record={editingPublish} task={taskById(editingPublish.videoTaskId)} metrics={metricForRecord(data, editingPublish.id)} onClose={() => setEditingPublishId(null)} onSubmit={savePublishRecord} /> : null}
  </div>
}

function OverviewSection({ data, summary, records, nextTask, onOpenContent, onOpenTask, onAdvanceVideo, onOpenPublish, onAddLead }: { data: BilibiliData; summary: { ideas: number; planned: number; producing: number; pending: number; leads: number }; records: BilibiliCustomerRecord[]; nextTask?: BilibiliVideoTask; onOpenContent: () => void; onOpenTask: (task: BilibiliVideoTask) => void; onAdvanceVideo: (task: BilibiliVideoTask) => void; onOpenPublish: () => void; onAddLead: (source?: string) => void }) {
  const nextRecord = data.publishRecords.find((record) => record.status === '待发布')
  const nextAction = nextTask?.status === '制作中' ? '继续完成章节、证明和制作检查' : nextTask?.status === '准备中' ? '补充章节计划并开始制作' : nextRecord ? '核对投稿包并由客户手工投稿' : '从选题库安排下一条专业内容'
  return <>
    <section className="douyin-command-band"><div><span>今天优先推进</span><h2>{nextTask?.title || data.videoTasks.find((task) => task.id === nextRecord?.videoTaskId)?.title || '建立第一条 B站内容计划'}</h2><p>{nextAction}</p></div>{nextTask ? <div className="douyin-command-actions"><button className="button button-secondary" onClick={() => onOpenTask(nextTask)}><Pencil size={15} />打开任务</button><button className="button button-primary" onClick={() => onAdvanceVideo(nextTask)}>{nextTask.status === '制作中' ? '进入待投稿' : nextTask.status === '待发布' ? '查看投稿' : '开始制作'}<ArrowRight size={15} /></button></div> : nextRecord ? <button className="button button-primary" onClick={onOpenPublish}>查看待投稿<ArrowRight size={15} /></button> : <button className="button button-primary" onClick={onOpenContent}><Plus size={15} />建立选题</button>}</section>
    <section className="douyin-overview-strip"><button onClick={onOpenContent}><Lightbulb size={17} /><span>待判断选题</span><strong>{summary.ideas}</strong><small>判断是否值得讲透</small></button><button onClick={onOpenContent}><CalendarDays size={17} /><span>内容计划</span><strong>{summary.planned}</strong><small>待安排章节与日期</small></button><button onClick={onOpenContent}><Video size={17} /><span>制作中</span><strong>{summary.producing}</strong><small>章节、证明与成片</small></button><button onClick={onOpenPublish}><Play size={17} /><span>待投稿</span><strong>{summary.pending}</strong><small>由客户本人投稿</small></button><button onClick={() => onAddLead()}><MessageSquareMore size={17} /><span>B站线索</span><strong>{summary.leads}</strong><small>{records.filter((record) => record.stage === 'intent').length} 个意向客户</small></button></section>
    <section className="douyin-overview-grid"><div className="work-panel"><div className="section-heading-row"><div><h2>近期内容</h2><p>按计划日期查看最需要推进的视频。</p></div><button className="text-button" onClick={onOpenContent}>查看全部</button></div>{data.videoTasks.length ? <div className="douyin-compact-list">{[...data.videoTasks].sort((left, right) => (left.plannedDate || '9999-12-31').localeCompare(right.plannedDate || '9999-12-31')).slice(0, 5).map((task) => <button key={task.id} onClick={() => onOpenTask(task)}><span className={`status-pill ${videoStatusTone(task.status)}`}>{task.status}</span><div><strong>{task.title}</strong><span>{task.format} · {formatDate(task.plannedDate)}</span></div><ChevronRight size={16} /></button>)}</div> : <CompactEmpty icon={<CalendarDays size={21} />} title="还没有内容计划" action={<button className="button button-secondary" onClick={onOpenContent}><Plus size={15} />建立选题</button>} />}</div><aside className="work-panel douyin-source-summary"><div className="section-heading-row"><div><h2>来源结果</h2><p>只统计已经确认发布的视频。</p></div></div><div className="douyin-source-flow"><span>线索<strong>{records.filter((record) => record.stage === 'lead').length}</strong></span><ArrowRight size={16} /><span>意向客户<strong>{records.filter((record) => record.stage === 'intent').length}</strong></span><ArrowRight size={16} /><span>客户<strong>{records.filter((record) => record.stage === 'customer').length}</strong></span></div></aside></section>
  </>
}

function ContentSection({ data, view, onView, onNewIdea, onEditIdea, onAdoptIdea, onNewVideo, onEditVideo, onToggleChecklist, onAdvanceVideo }: { data: BilibiliData; view: ContentView; onView: (view: ContentView) => void; onNewIdea: () => void; onEditIdea: (idea: BilibiliIdea) => void; onAdoptIdea: (idea: BilibiliIdea) => void; onNewVideo: () => void; onEditVideo: (task: BilibiliVideoTask) => void; onToggleChecklist: (task: BilibiliVideoTask, key: keyof BilibiliProductionChecklist) => void; onAdvanceVideo: (task: BilibiliVideoTask) => void }) {
  const sortedTasks = [...data.videoTasks].sort((left, right) => (left.plannedDate || '9999-12-31').localeCompare(right.plannedDate || '9999-12-31'))
  return <>
    <div className="douyin-section-head"><div><h2>选题与制作</h2><p>先确认观众问题、看完收获和可展示的证明，再进入章节大纲、脚本和制作。</p></div><div className="douyin-section-actions"><button className="button button-secondary" onClick={onNewVideo}><Video size={15} />新建视频任务</button><button className="button button-primary" onClick={onNewIdea}><Plus size={15} />新建选题</button></div></div>
    <div className="segmented-control douyin-subtabs" role="tablist" aria-label="内容视图"><button className={view === 'ideas' ? 'active' : ''} onClick={() => onView('ideas')}>选题库 <b>{data.ideas.length}</b></button><button className={view === 'plan' ? 'active' : ''} onClick={() => onView('plan')}>内容计划 <b>{data.videoTasks.filter((task) => task.status === '准备中').length}</b></button><button className={view === 'tasks' ? 'active' : ''} onClick={() => onView('tasks')}>制作任务 <b>{data.videoTasks.length}</b></button></div>
    {view === 'ideas' ? <section className="table-panel douyin-data-panel">{data.ideas.length ? <div className="table-scroll"><table><thead><tr><th>选题</th><th>观众收获</th><th>证明素材</th><th>系列</th><th>状态</th><th aria-label="操作"></th></tr></thead><tbody>{data.ideas.map((idea) => <tr key={idea.id}><td><button className="record-name" onClick={() => onEditIdea(idea)}><strong>{idea.title}</strong><span>{idea.audienceQuestion || '暂未补充观众问题'}</span></button></td><td>{idea.viewerGain || '待补充'}</td><td>{idea.proofMaterial || '待补充'}</td><td>{idea.seriesName || '单期内容'}</td><td><span className={`status-pill ${idea.status === '已采用' ? 'teal' : idea.status === '暂不采用' ? 'muted' : 'neutral'}`}>{idea.status}</span></td><td><div className="row-actions">{idea.status !== '已采用' ? <button className="button button-primary small" onClick={() => onAdoptIdea(idea)}>转为计划<ArrowRight size={14} /></button> : null}<button className="icon-button small" title="编辑选题" aria-label="编辑选题" onClick={() => onEditIdea(idea)}><Pencil size={15} /></button></div></td></tr>)}</tbody></table></div> : <CompactEmpty icon={<Lightbulb size={23} />} title="还没有选题" description="先记录观众真正想弄明白的问题、看完收获和你能提供的证明。" action={<button className="button button-primary" onClick={onNewIdea}><Plus size={15} />新建选题</button>} />}</section> : null}
    {view === 'plan' ? <section className="work-panel douyin-plan-panel">{sortedTasks.length ? <div className="douyin-plan-list">{sortedTasks.map((task) => <div key={task.id} className="douyin-plan-row"><time>{formatDate(task.plannedDate)}</time><div><strong>{task.title}</strong><span>{task.owner || '未分配负责人'} · {task.format}{task.targetDuration ? ` · ${task.targetDuration}` : ''}</span></div><span className={`status-pill ${videoStatusTone(task.status)}`}>{task.status}</span><button className="icon-button small" title="编辑视频任务" aria-label="编辑视频任务" onClick={() => onEditVideo(task)}><ChevronRight size={16} /></button></div>)}</div> : <CompactEmpty icon={<CalendarDays size={23} />} title="还没有内容计划" description="采用一个选题后，它会进入这里等待安排章节、负责人和日期。" action={<button className="button button-primary" onClick={onNewIdea}><Plus size={15} />新建选题</button>} />}</section> : null}
    {view === 'tasks' ? <section className="douyin-task-board">{data.videoTasks.length ? data.videoTasks.map((task) => { const progress = checklistProgress(task.checklist); return <article className="douyin-video-item" key={task.id}><div className="douyin-video-item-head"><div><span>{task.format}{task.targetDuration ? ` · ${task.targetDuration}` : ''}</span><h3>{task.title}</h3><p>{task.audiencePromise || task.goal || '打开任务补充观众看完能得到什么。'}</p></div><span className={`status-pill ${videoStatusTone(task.status)}`}>{task.status}</span></div><div className="bilibili-chapter-preview"><strong>章节结构</strong><p>{task.chapterOutline || '还没有填写章节大纲。'}</p></div><div className="douyin-progress-line"><span><b>{progress.completed}</b> / {progress.total} 项完成</span><div><i style={{ width: `${(progress.completed / progress.total) * 100}%` }} /></div></div><div className="douyin-checklist">{checklistItems.map((item) => <label key={item.key}><input type="checkbox" checked={task.checklist[item.key]} onChange={() => onToggleChecklist(task, item.key)} /><span>{item.label}</span></label>)}</div><div className="douyin-video-item-foot"><button className="button button-secondary small" onClick={() => onEditVideo(task)}><Pencil size={14} />编辑</button>{task.status !== '已完成' && task.status !== '已暂停' ? <button className="button button-primary small" onClick={() => onAdvanceVideo(task)}>{task.status === '准备中' ? '开始制作' : task.status === '制作中' ? '进入待投稿' : '查看投稿' }<ArrowRight size={14} /></button> : null}</div></article> }) : <CompactEmpty icon={<Video size={23} />} title="还没有视频任务" description="采用选题或直接建立任务后，在这里完成章节、证明素材、脚本、拍摄和投稿检查。" action={<button className="button button-primary" onClick={onNewVideo}><Plus size={15} />新建视频任务</button>} />}</section> : null}
  </>
}

function PublishSection({ data, view, onView, onEdit, onCopy }: { data: BilibiliData; view: PublishView; onView: (view: PublishView) => void; onEdit: (id: string) => void; onCopy: (record: BilibiliPublishRecord) => void }) {
  const records = data.publishRecords.filter((record) => view === 'pending' ? record.status === '待发布' : record.status !== '待发布')
  return <>
    <div className="douyin-section-head"><div><h2>投稿</h2><p>工作台准备标题、简介、分区、标签、封面文案与版权说明，客户本人在 B站创作中心完成投稿。</p></div></div>
    <div className="segmented-control douyin-subtabs" role="tablist" aria-label="投稿视图"><button className={view === 'pending' ? 'active' : ''} onClick={() => onView('pending')}>待投稿 <b>{data.publishRecords.filter((record) => record.status === '待发布').length}</b></button><button className={view === 'history' ? 'active' : ''} onClick={() => onView('history')}>投稿记录 <b>{data.publishRecords.filter((record) => record.status !== '待发布').length}</b></button></div>
    <section className="douyin-publish-list">{records.length ? records.map((record) => { const task = data.videoTasks.find((item) => item.id === record.videoTaskId); const metrics = metricForRecord(data, record.id); return <article className="douyin-publish-row" key={record.id}><div className="douyin-publish-main"><span className={`status-pill ${publishStatusTone(record.status)}`}>{record.status === '待发布' ? '待投稿' : record.status}</span><div><strong>{task?.title || record.title || '未命名视频'}</strong><span>{record.title || '待补充投稿标题'}</span><small>{record.category || '待选择分区'} · {record.tags || '待补充标签'} · {record.submissionType}</small></div></div><div className="douyin-publish-meta"><span>{record.status === '待发布' ? `计划 ${formatDate(record.plannedPublishDate)}` : `发布 ${formatDate(record.publishedAt)}`}</span><span>{record.status === '已发布' ? `${formatMetric(metrics.views)} 播放 · ${metrics.coins} 投币 · ${metrics.inquiries} 咨询` : record.sourceCode}</span></div><div className="douyin-publish-actions">{record.status === '待发布' ? <button className="button button-secondary small" onClick={() => void onCopy(record)}><Copy size={14} />复制投稿包</button> : null}<button className="button button-primary small" onClick={() => onEdit(record.id)}>{record.status === '待发布' ? '登记投稿' : '更新记录'}<ChevronRight size={14} /></button></div></article> }) : <CompactEmpty icon={<Play size={23} />} title={view === 'pending' ? '没有待投稿视频' : '还没有投稿记录'} description={view === 'pending' ? '完成七项制作检查后，投稿包会进入这里。' : '客户确认发布后，来源编号和结果会保存在这里。'} />}</section>
  </>
}

function InquirySection({ data, records, onAddLead }: { data: BilibiliData; records: BilibiliCustomerRecord[]; onAddLead: (source?: string) => void }) {
  const published = data.publishRecords.filter((record) => record.status === '已发布')
  const activeRecords = records.filter((record) => record.stage !== 'lost')
  return <>
    <div className="douyin-section-head"><div><h2>咨询</h2><p>收到评论、私信、主页联系方式或线下提及后，手工登记并关联到具体视频。</p></div><button className="button button-primary" onClick={() => onAddLead()}><Plus size={15} />登记 B站咨询</button></div>
    <section className="douyin-inquiry-summary"><div><span>B站线索</span><strong>{activeRecords.length}</strong><small>待判断或正在推进</small></div><div><span>进入意向客户</span><strong>{activeRecords.filter((record) => record.stage === 'intent').length}</strong><small>已确认值得推进</small></div><div><span>成为客户</span><strong>{activeRecords.filter((record) => record.stage === 'customer').length}</strong><small>已形成业务结果</small></div></section>
    <section className="douyin-inquiry-grid"><div className="work-panel"><div className="section-heading-row"><div><h2>按视频登记</h2><p>选择客户从哪条视频认识你，来源会自动带入线索。</p></div></div>{published.length ? <div className="douyin-source-video-list">{published.map((record) => { const task = data.videoTasks.find((item) => item.id === record.videoTaskId); const count = records.filter((item) => item.source.includes(record.sourceCode)).length; return <div key={record.id}><div><strong>{task?.title || record.title}</strong><span>{record.sourceCode} · 已登记 {count} 条</span></div><button className="button button-secondary small" onClick={() => onAddLead(sourceLabel(data, record))}><Plus size={14} />登记咨询</button></div> })}</div> : <CompactEmpty icon={<Link2 size={22} />} title="还没有已发布视频" description="确认发布后，才能按具体视频登记咨询来源。" />}</div><div className="work-panel"><div className="section-heading-row"><div><h2>最近线索</h2><p>后续联系和推进在线索中完成。</p></div></div>{records.length ? <div className="douyin-lead-list">{records.slice(0, 8).map((record) => <div key={record.id}><span className={`stage-dot ${record.stage}`}></span><div><strong>{record.name}</strong><span>{record.need || record.source}</span></div><span className="status-pill neutral">{record.status}</span></div>)}</div> : <CompactEmpty icon={<MessageSquareMore size={22} />} title="还没有 B站线索" description="收到真实咨询后，从这里快速登记，不自动读取私信或抓取用户信息。" action={<button className="button button-primary" onClick={() => onAddLead()}><Plus size={15} />登记咨询</button>} />}</div></section>
  </>
}

function ReviewSection({ data, records }: { data: BilibiliData; records: BilibiliCustomerRecord[] }) {
  const published = data.publishRecords.filter((record) => record.status === '已发布')
  const totals = data.metrics.reduce((current, metric) => ({ views: current.views + metric.views, depthSignals: current.depthSignals + metric.coins + metric.favorites, followerGain: current.followerGain + metric.followerGain, inquiries: current.inquiries + metric.inquiries }), { views: 0, depthSignals: 0, followerGain: 0, inquiries: 0 })
  const activeRecords = records.filter((record) => record.stage !== 'lost')
  return <>
    <div className="douyin-section-head"><div><h2>复盘</h2><p>先看视频是否带来线索、意向与客户，再用投币、收藏和涨粉判断内容是否真正建立信任。</p></div></div>
    <section className="douyin-review-summary"><div><span>客户</span><strong>{activeRecords.filter((record) => record.stage === 'customer').length}</strong></div><div><span>意向客户</span><strong>{activeRecords.filter((record) => record.stage === 'intent').length}</strong></div><div><span>有效线索</span><strong>{activeRecords.length}</strong></div><div><span>咨询</span><strong>{totals.inquiries}</strong></div><div><span>投币 + 收藏</span><strong>{formatMetric(totals.depthSignals)}</strong></div><div><span>涨粉</span><strong>{formatMetric(totals.followerGain)}</strong></div></section>
    <section className="table-panel douyin-data-panel">{published.length ? <div className="table-scroll"><table><thead><tr><th>视频</th><th>播放</th><th>投币 / 收藏</th><th>咨询</th><th>线索</th><th>意向</th><th>客户</th></tr></thead><tbody>{published.map((record) => { const task = data.videoTasks.find((item) => item.id === record.videoTaskId); const metric = metricForRecord(data, record.id); const linked = records.filter((item) => item.source.includes(record.sourceCode) && item.stage !== 'lost'); return <tr key={record.id}><td><div className="source-cell"><b>{task?.title || record.title}</b><span>{record.sourceCode}</span></div></td><td>{formatMetric(metric.views)}</td><td>{formatMetric(metric.coins)} / {formatMetric(metric.favorites)}</td><td>{metric.inquiries}</td><td>{linked.length}</td><td>{linked.filter((item) => item.stage === 'intent').length}</td><td>{linked.filter((item) => item.stage === 'customer').length}</td></tr> })}</tbody></table></div> : <CompactEmpty icon={<BarChart3 size={23} />} title="还没有可复盘的视频" description="确认发布并登记平台结果后，这里会按视频展示信任信号和业务结果。" />}</section>
  </>
}

function SettingsSection({ settings, onSave }: { settings: BilibiliSettings; onSave: (formData: FormData) => void }) {
  return <>
    <div className="douyin-section-head"><div><h2>设置</h2><p>保存选题和任务安排需要的业务背景，不保存账号密码、登录会话或投稿凭证。</p></div></div>
    <form className="work-panel douyin-settings-form" onSubmit={(event) => { event.preventDefault(); onSave(new FormData(event.currentTarget)) }}><div className="form-grid"><label className="field"><span>账号备注名称</span><input name="accountLabel" defaultValue={settings.accountLabel} placeholder="例如：品牌专业知识号" /></label><label className="field"><span>服务地区</span><input name="serviceArea" defaultValue={settings.serviceArea} placeholder="例如：成都及周边；不限地区可留空" /></label><label className="field"><span>默认负责人</span><input name="defaultOwner" defaultValue={settings.defaultOwner} placeholder="负责选题与制作的人" /></label><label className="field"><span>每月计划投稿</span><input name="monthlyTarget" type="number" min="1" max="30" defaultValue={settings.monthlyTarget} /></label><label className="field"><span>默认投稿分区</span><input name="defaultCategory" defaultValue={settings.defaultCategory} placeholder="由客户根据实际内容确认" /></label><label className="field"><span>默认系列名称</span><input name="defaultSeries" defaultValue={settings.defaultSeries} placeholder="例如：完整案例拆解" /></label><label className="field field-wide"><span>默认行动引导</span><input name="defaultCallToAction" defaultValue={settings.defaultCallToAction} placeholder="例如：在主页查看联系方式并说明来自哪条视频" /></label><label className="field field-wide"><span>内容与版权边界</span><textarea name="contentBoundaries" rows={4} defaultValue={settings.contentBoundaries} placeholder="记录不可公开的客户信息、未经授权的素材、不能承诺的效果和品牌表达边界" /></label></div><div className="douyin-security-note"><Check size={16} /><span>工作台不保存 B站密码、Cookie、短信验证码或扫码登录信息，也不会自动投稿、抓取评论或读取私信。</span></div><div className="dialog-foot"><button className="button button-primary" type="submit">保存设置<Check size={15} /></button></div></form>
  </>
}

function IdeaDialog({ idea, defaultSeries, onClose, onSubmit }: { idea?: BilibiliIdea; defaultSeries: string; onClose: () => void; onSubmit: (formData: FormData, idea?: BilibiliIdea) => void }) {
  return <div className="dialog-backdrop" role="presentation"><form className="dialog douyin-dialog" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget), idea) }}><div className="dialog-head"><div><h2>{idea ? '编辑选题' : '新建选题'}</h2><p>一个 B站选题需要能回答明确问题，并且有足够的案例、过程或数据支撑完整解释。</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div><div className="form-grid"><label className="field field-wide"><span>选题标题</span><input name="title" required autoFocus defaultValue={idea?.title || ''} placeholder="例如：从量房到完工，完整拆解一次小空间改造" /></label><label className="field field-wide"><span>观众想解决的问题</span><textarea name="audienceQuestion" rows={3} defaultValue={idea?.audienceQuestion || ''} placeholder="观众为什么会搜索或愿意看完这条内容" /></label><label className="field field-wide"><span>看完能得到什么</span><textarea name="viewerGain" rows={3} defaultValue={idea?.viewerGain || ''} placeholder="例如：知道判断方案是否合理的 4 个关键标准" /></label><label className="field field-wide"><span>可展示的证明素材</span><textarea name="proofMaterial" rows={3} defaultValue={idea?.proofMaterial || ''} placeholder="真实案例、过程录像、测量数据、样品对比、客户授权反馈等" /></label><label className="field"><span>系列名称</span><input name="seriesName" defaultValue={idea?.seriesName || defaultSeries} placeholder="例如：完整案例拆解" /></label><label className="field"><span>目标动作</span><input name="targetAction" defaultValue={idea?.targetAction || ''} placeholder="例如：带着具体问题咨询" /></label><label className="field"><span>选题来源</span><select name="sourceType" defaultValue={idea?.sourceType || '手工'}><option>手工</option><option>AI</option></select></label><label className="field"><span>当前状态</span><select name="status" defaultValue={idea?.status || '待判断'}><option>待判断</option><option>已采用</option><option>暂不采用</option></select></label><label className="field field-wide"><span>标签</span><input name="tags" defaultValue={idea?.tags || ''} placeholder="记录主题关键词，用逗号分隔" /></label></div><div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onClose}>取消</button><button className="button button-primary" type="submit">保存<Check size={15} /></button></div></form></div>
}

function VideoDialog({ task, ideas, settings, onClose, onSubmit }: { task?: BilibiliVideoTask; ideas: BilibiliIdea[]; settings: BilibiliSettings; onClose: () => void; onSubmit: (formData: FormData, task?: BilibiliVideoTask) => void }) {
  return <div className="dialog-backdrop" role="presentation"><form className="dialog douyin-dialog douyin-video-dialog" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget), task) }}><div className="dialog-head"><div><h2>{task ? '编辑视频任务' : '新建视频任务'}</h2><p>围绕一个明确问题组织章节、证明素材和完整解释，制作检查完成后才能进入待投稿。</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div><div className="form-grid"><label className="field field-wide"><span>来源选题</span><select name="ideaId" defaultValue={task?.ideaId || ''}><option value="">不关联选题</option>{ideas.map((idea) => <option key={idea.id} value={idea.id}>{idea.title}</option>)}</select></label><label className="field field-wide"><span>视频主题</span><input name="title" required autoFocus defaultValue={task?.title || ''} placeholder="这条视频最终要帮助观众弄明白什么" /></label><label className="field"><span>业务目标</span><input name="goal" defaultValue={task?.goal || ''} placeholder="例如：获得高质量咨询" /></label><label className="field"><span>视频形式</span><select name="format" defaultValue={task?.format || '专题讲解'}><option>专题讲解</option><option>完整案例拆解</option><option>实测 / 对比</option><option>过程纪录</option><option>访谈 / 对谈</option><option>系列课程</option></select></label><label className="field"><span>目标时长</span><input name="targetDuration" defaultValue={task?.targetDuration || ''} placeholder="例如：8-12 分钟" /></label><label className="field"><span>负责人</span><input name="owner" defaultValue={task?.owner || settings.defaultOwner} placeholder="负责推进这条视频的人" /></label><label className="field field-wide"><span>观众看完的明确收获</span><input name="audiencePromise" defaultValue={task?.audiencePromise || ''} placeholder="例如：能独立判断一个方案是否值得做" /></label><label className="field field-wide"><span>章节大纲</span><textarea name="chapterOutline" rows={6} defaultValue={task?.chapterOutline || ''} placeholder={'00:00 问题与结论\n01:00 背景和常见误区\n03:00 案例或实测证明\n07:00 判断方法与适用边界\n09:00 总结与下一步'} /></label><label className="field field-wide"><span>完整脚本 / 讲述提纲</span><textarea name="script" rows={7} defaultValue={task?.script || ''} placeholder="按章节写清问题、判断、证明、限制条件和行动引导" /></label><label className="field field-wide"><span>证明与素材清单</span><textarea name="proofChecklist" rows={4} defaultValue={task?.proofChecklist || ''} placeholder="真实案例、过程画面、图表、测量结果、授权反馈、引用来源等" /></label><label className="field field-wide"><span>行动引导</span><input name="callToAction" defaultValue={task?.callToAction || settings.defaultCallToAction} placeholder="观众需要咨询时，应该如何准确说明需求和来源" /></label><label className="field"><span>计划日期</span><input name="plannedDate" type="date" defaultValue={task?.plannedDate || ''} /></label><div className="field field-wide"><span>制作检查</span><div className="douyin-form-checklist">{checklistItems.map((item) => <label key={item.key}><input type="checkbox" name={item.key} defaultChecked={task?.checklist[item.key] || false} /><span>{item.label}</span></label>)}</div></div></div><div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onClose}>取消</button><button className="button button-primary" type="submit">保存<Check size={15} /></button></div></form></div>
}

function PublishDialog({ record, task, metrics, onClose, onSubmit }: { record: BilibiliPublishRecord; task?: BilibiliVideoTask; metrics: BilibiliMetrics; onClose: () => void; onSubmit: (formData: FormData, record: BilibiliPublishRecord) => void }) {
  return <div className="dialog-backdrop" role="presentation"><form className="dialog douyin-dialog douyin-video-dialog" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget), record) }}><div className="dialog-head"><div><h2>{record.status === '待发布' ? '登记投稿' : '更新投稿记录'}</h2><p>{task?.title || record.title}。投稿与账号操作由客户本人在 B站创作中心完成。</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div><div className="form-grid"><label className="field field-wide"><span>投稿标题</span><input name="title" required defaultValue={record.title} placeholder="准确说明视频讲什么，不使用无法兑现的承诺" /></label><label className="field field-wide"><span>简介</span><textarea name="description" rows={5} defaultValue={record.description} placeholder="说明内容结构、适用对象、重要边界和行动引导" /></label><label className="field"><span>投稿分区</span><input name="category" defaultValue={record.category} placeholder="以创作中心实际可选分区为准" /></label><label className="field"><span>标签</span><input name="tags" defaultValue={record.tags} placeholder="用逗号分隔关键词" /></label><label className="field field-wide"><span>封面文案</span><input name="coverTitle" defaultValue={record.coverTitle} placeholder="一句话说明观众会看到的具体内容" /></label><label className="field"><span>投稿类型</span><select name="submissionType" defaultValue={record.submissionType}><option>自制</option><option>转载</option></select></label><label className="field"><span>计划投稿日期</span><input name="plannedPublishDate" type="date" defaultValue={record.plannedPublishDate} /></label><label className="field field-wide"><span>版权与授权说明</span><textarea name="rightsNote" rows={3} defaultValue={record.rightsNote} placeholder="记录素材来源、客户授权、引用出处；转载内容应补充原始来源与授权情况" /></label><label className="field"><span>投稿状态</span><select name="status" defaultValue={record.status}><option value="待发布">待投稿</option><option>已发布</option><option>已删除</option><option>不可见</option><option>其他</option></select></label><label className="field"><span>实际发布时间</span><input name="publishedAt" type="datetime-local" defaultValue={record.publishedAt} /></label><label className="field field-wide"><span>视频链接</span><input name="videoUrl" defaultValue={record.videoUrl} placeholder="发布后粘贴 B站视频链接" /></label><div className="field field-wide source-code-field"><span>来源编号</span><div><Link2 size={15} /><strong>{record.sourceCode}</strong><small>只有状态为“已发布”时，才可在线索中选择。</small></div></div><div className="douyin-form-section field-wide"><strong>平台数据</strong><span>发布后手工回填；工作台不会抓取账号、评论或用户数据。</span></div><label className="field"><span>播放量</span><input name="views" type="number" min="0" defaultValue={metrics.views || ''} /></label><label className="field"><span>点赞</span><input name="likes" type="number" min="0" defaultValue={metrics.likes || ''} /></label><label className="field"><span>投币</span><input name="coins" type="number" min="0" defaultValue={metrics.coins || ''} /></label><label className="field"><span>收藏</span><input name="favorites" type="number" min="0" defaultValue={metrics.favorites || ''} /></label><label className="field"><span>评论</span><input name="comments" type="number" min="0" defaultValue={metrics.comments || ''} /></label><label className="field"><span>弹幕</span><input name="danmaku" type="number" min="0" defaultValue={metrics.danmaku || ''} /></label><label className="field"><span>分享</span><input name="shares" type="number" min="0" defaultValue={metrics.shares || ''} /></label><label className="field"><span>涨粉</span><input name="followerGain" type="number" min="0" defaultValue={metrics.followerGain || ''} /></label><label className="field"><span>咨询</span><input name="inquiries" type="number" min="0" defaultValue={metrics.inquiries || ''} /></label></div><div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onClose}>取消</button><button className="button button-primary" type="submit">保存记录<Check size={15} /></button></div></form></div>
}

function CompactEmpty({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return <div className="douyin-compact-empty"><span>{icon}</span><strong>{title}</strong>{description ? <p>{description}</p> : null}{action}</div>
}
