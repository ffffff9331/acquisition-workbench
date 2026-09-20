export type OperationsAssetKind = '图片' | '视频' | '文档' | '案例' | '截图'
export type OperationsAssetStatus = '待整理' | '仅内部' | '待授权' | '可公开'
export type OperationsExperimentStatus = '计划中' | '验证中' | '已完成' | '已暂停'

export type OperationsStoredFile = {
  id: string
  name: string
  mimeType: string
  size: number
  importedAt: string
}

export type OperationsAsset = {
  id: string
  name: string
  kind: OperationsAssetKind
  status: OperationsAssetStatus
  description: string
  location: string
  file: OperationsStoredFile | null
  tags: string[]
  contentTaskIds: string[]
  createdAt: string
  updatedAt: string
}

export type OperationsExperiment = {
  id: string
  title: string
  status: OperationsExperimentStatus
  hypothesis: string
  changedVariable: string
  successSignal: string
  result: string
  conclusion: string
  contentTaskId: string
  createdAt: string
  updatedAt: string
}

export type OperationsKnowledgeReference = {
  id: string
  title: string
  source: string
  summary: string
  location: string
  tags: string[]
  contentTaskIds: string[]
  createdAt: string
  updatedAt: string
}

export type OperationsData = {
  assets: OperationsAsset[]
  experiments: OperationsExperiment[]
  knowledgeReferences: OperationsKnowledgeReference[]
}

export const emptyOperationsData: OperationsData = {
  assets: [],
  experiments: [],
  knowledgeReferences: [],
}

export const operationsAssetPageSize = 50

const assetKinds: OperationsAssetKind[] = ['图片', '视频', '文档', '案例', '截图']
const assetStatuses: OperationsAssetStatus[] = ['待整理', '仅内部', '待授权', '可公开']
const experimentStatuses: OperationsExperimentStatus[] = ['计划中', '验证中', '已完成', '已暂停']

function clean(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function cleanTags(value: unknown) {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === 'string').map((item) => clean(item, 60)).filter(Boolean))].slice(0, 12)
    : []
}

function cleanIds(value: unknown) {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === 'string').map((item) => clean(item, 120)).filter(Boolean))].slice(0, 80)
    : []
}

function uniqueIds<T extends { id: string }>(items: T[], prefix: string) {
  const seen = new Set<string>()
  return items.map((item) => {
    if (!seen.has(item.id)) {
      seen.add(item.id)
      return item
    }
    let id = createId(prefix)
    while (seen.has(id)) id = createId(prefix)
    seen.add(id)
    return { ...item, id }
  })
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function nowISO() {
  return new Date().toISOString()
}

export function createOperationsAsset(): OperationsAsset {
  const now = nowISO()
  return { id: createId('asset'), name: '', kind: '图片', status: '待整理', description: '', location: '', file: null, tags: [], contentTaskIds: [], createdAt: now, updatedAt: now }
}

export function createOperationsExperiment(): OperationsExperiment {
  const now = nowISO()
  return { id: createId('experiment'), title: '', status: '计划中', hypothesis: '', changedVariable: '', successSignal: '', result: '', conclusion: '', contentTaskId: '', createdAt: now, updatedAt: now }
}

export function createOperationsKnowledgeReference(): OperationsKnowledgeReference {
  const now = nowISO()
  return { id: createId('knowledge'), title: '', source: '', summary: '', location: '', tags: [], contentTaskIds: [], createdAt: now, updatedAt: now }
}

function normalizeStoredFile(value: unknown): OperationsStoredFile | null {
  if (!value || typeof value !== 'object') return null
  const file = value as Partial<OperationsStoredFile>
  const id = clean(file.id, 120)
  if (!/^[A-Za-z0-9_-]+$/.test(id)) return null
  return {
    id,
    name: clean(file.name, 260) || '未命名文件',
    mimeType: clean(file.mimeType, 160) || 'application/octet-stream',
    size: typeof file.size === 'number' && Number.isFinite(file.size) && file.size >= 0 ? Math.floor(file.size) : 0,
    importedAt: clean(file.importedAt, 60) || nowISO(),
  }
}

export function normalizeOperationsData(value: unknown): OperationsData {
  if (!value || typeof value !== 'object') return emptyOperationsData
  const raw = value as Partial<OperationsData>
  const assets = Array.isArray(raw.assets) ? raw.assets.filter((item) => item && typeof item === 'object').map((item) => {
    const asset = item as Partial<OperationsAsset>
    const createdAt = clean(asset.createdAt, 60) || nowISO()
    return {
      id: clean(asset.id, 120) || createId('asset'),
      name: clean(asset.name, 200),
      kind: assetKinds.includes(asset.kind as OperationsAssetKind) ? asset.kind as OperationsAssetKind : '图片',
      status: assetStatuses.includes(asset.status as OperationsAssetStatus) ? asset.status as OperationsAssetStatus : '待整理',
      description: clean(asset.description, 2000),
      location: clean(asset.location, 1000),
      file: normalizeStoredFile(asset.file),
      tags: cleanTags(asset.tags),
      contentTaskIds: cleanIds(asset.contentTaskIds),
      createdAt,
      updatedAt: clean(asset.updatedAt, 60) || createdAt,
    }
  }).slice(0, 1000) : []
  const experiments = Array.isArray(raw.experiments) ? raw.experiments.filter((item) => item && typeof item === 'object').map((item) => {
    const experiment = item as Partial<OperationsExperiment>
    const createdAt = clean(experiment.createdAt, 60) || nowISO()
    return {
      id: clean(experiment.id, 120) || createId('experiment'),
      title: clean(experiment.title, 240),
      status: experimentStatuses.includes(experiment.status as OperationsExperimentStatus) ? experiment.status as OperationsExperimentStatus : '计划中',
      hypothesis: clean(experiment.hypothesis, 2000),
      changedVariable: clean(experiment.changedVariable, 240),
      successSignal: clean(experiment.successSignal, 1000),
      result: clean(experiment.result, 2000),
      conclusion: clean(experiment.conclusion, 2000),
      contentTaskId: clean(experiment.contentTaskId, 120),
      createdAt,
      updatedAt: clean(experiment.updatedAt, 60) || createdAt,
    }
  }).slice(0, 500) : []
  const knowledgeReferences = Array.isArray(raw.knowledgeReferences) ? raw.knowledgeReferences.filter((item) => item && typeof item === 'object').map((item) => {
    const reference = item as Partial<OperationsKnowledgeReference>
    const createdAt = clean(reference.createdAt, 60) || nowISO()
    return {
      id: clean(reference.id, 120) || createId('knowledge'),
      title: clean(reference.title, 240),
      source: clean(reference.source, 240),
      summary: clean(reference.summary, 3000),
      location: clean(reference.location, 1000),
      tags: cleanTags(reference.tags),
      contentTaskIds: cleanIds(reference.contentTaskIds),
      createdAt,
      updatedAt: clean(reference.updatedAt, 60) || createdAt,
    }
  }).slice(0, 1000) : []
  return {
    assets: uniqueIds(assets, 'asset'),
    experiments: uniqueIds(experiments, 'experiment'),
    knowledgeReferences: uniqueIds(knowledgeReferences, 'knowledge'),
  }
}

export function pruneOperationsContentLinks(data: OperationsData, contentTaskIds: string[]): OperationsData {
  const taskIdSet = new Set(contentTaskIds)
  return {
    ...data,
    assets: data.assets.map((asset) => ({ ...asset, contentTaskIds: asset.contentTaskIds.filter((id) => taskIdSet.has(id)) })),
    experiments: data.experiments.map((experiment) => taskIdSet.has(experiment.contentTaskId) || !experiment.contentTaskId ? experiment : { ...experiment, contentTaskId: '' }),
    knowledgeReferences: data.knowledgeReferences.map((reference) => ({ ...reference, contentTaskIds: reference.contentTaskIds.filter((id) => taskIdSet.has(id)) })),
  }
}

export function operationalReadiness(data: OperationsData, contentTaskIds: string[]) {
  const taskIdSet = new Set(contentTaskIds)
  const linkedAssets = data.assets.filter((asset) => asset.contentTaskIds.some((id) => taskIdSet.has(id)))
  const publicAssets = linkedAssets.filter((asset) => asset.status === '可公开').length
  const linkedExperiments = data.experiments.filter((experiment) => taskIdSet.has(experiment.contentTaskId))
  const completedExperiments = linkedExperiments.filter((experiment) => experiment.status === '已完成').length
  const linkedKnowledge = data.knowledgeReferences.filter((reference) => reference.contentTaskIds.some((id) => taskIdSet.has(id))).length
  return { linkedAssets, publicAssets, linkedExperiments, completedExperiments, linkedKnowledge }
}

export function paginateOperationsAssets(assets: OperationsAsset[], requestedPage: number, pageSize = operationsAssetPageSize) {
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : operationsAssetPageSize
  const totalItems = assets.length
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize))
  const page = Math.min(totalPages, Math.max(1, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1))
  const start = (page - 1) * safePageSize
  return { items: assets.slice(start, start + safePageSize), page, totalPages, totalItems }
}
