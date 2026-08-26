export type PluginId =
  | 'goal-planning'
  | 'content-workflow'
  | 'lead-attribution'
  | 'review-insights'

export type PluginIcon = 'target' | 'pen' | 'message' | 'chart'

export type PluginDefinition = {
  id: PluginId
  name: string
  navigationLabel: string
  description: string
  category: '获客流程'
  icon: PluginIcon
  dependencies: PluginId[]
  dataOutputs: string[]
}

export const pluginRegistry: Record<PluginId, PluginDefinition> = {
  'goal-planning': {
    id: 'goal-planning',
    name: '获客计划',
    navigationLabel: '获客计划',
    description: '先明确这次想获得什么结果，以及要吸引什么样的人。',
    category: '获客流程',
    icon: 'target',
    dependencies: [],
    dataOutputs: ['项目目标', '目标场景', '内容方向'],
  },
  'content-workflow': {
    id: 'content-workflow',
    name: '内容制作',
    navigationLabel: '内容制作',
    description: '把选题做成脚本、文案和可直接发布的内容。',
    category: '获客流程',
    icon: 'pen',
    dependencies: ['goal-planning'],
    dataOutputs: ['内容项', '渠道版本', 'CTA', '追踪码'],
  },
  'lead-attribution': {
    id: 'lead-attribution',
    name: '咨询记录',
    navigationLabel: '咨询记录',
    description: '记录每一条咨询从哪里来，以及下一步该怎么跟进。',
    category: '获客流程',
    icon: 'message',
    dependencies: ['content-workflow'],
    dataOutputs: ['咨询记录', '咨询来源', '跟进状态'],
  },
  'review-insights': {
    id: 'review-insights',
    name: '效果复盘',
    navigationLabel: '效果复盘',
    description: '根据内容和咨询结果，判断下周哪些做法值得继续。',
    category: '获客流程',
    icon: 'chart',
    dependencies: ['lead-attribution'],
    dataOutputs: ['内容效果', '方向比较', '下一步决策'],
  },
}

export const pluginList = Object.values(pluginRegistry)

export function resolvePluginSelection(ids: PluginId[]) {
  const selected = new Set<PluginId>()
  const addWithDependencies = (id: PluginId) => {
    if (selected.has(id)) return
    selected.add(id)
    pluginRegistry[id].dependencies.forEach(addWithDependencies)
  }
  ids.forEach(addWithDependencies)
  return pluginList.filter((plugin) => selected.has(plugin.id)).map((plugin) => plugin.id)
}

export function dependentPlugins(pluginId: PluginId, installed: PluginId[]) {
  return installed.filter((id) => pluginRegistry[id].dependencies.includes(pluginId))
}
