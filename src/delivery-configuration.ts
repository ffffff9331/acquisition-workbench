import type { ChannelId } from './channels'
import type { IndustryRulePack } from './industry-rules'
import type { GrowthTacticPack } from './tactic-packs'

export type DeliveryConfigurationState = {
  enabledChannels: ChannelId[]
  installedIndustryPacks: string[]
  activeIndustryPackId: string
  installedTacticPacks: string[]
  activeTacticPackId: string
}

export type DeliveryConfigurationSelection = {
  industryPackId: string
  tacticPackIds: string[]
  defaultTacticPackId: string
}

export type DeliveryConfigurationPlan = {
  ok: boolean
  errors: string[]
  next?: DeliveryConfigurationState
  requiredChannels: ChannelId[]
  addedChannels: ChannelId[]
  addedTacticPackIds: string[]
  addsIndustryPack: boolean
}

function unique<T>(values: T[]) {
  return [...new Set(values)]
}

export function createDeliveryConfigurationPlan(
  current: DeliveryConfigurationState,
  selection: DeliveryConfigurationSelection,
  industryPacks: IndustryRulePack[],
  tacticPacks: GrowthTacticPack[],
): DeliveryConfigurationPlan {
  const errors: string[] = []
  const industry = industryPacks.find((pack) => pack.id === selection.industryPackId)
  const tacticPackIds = unique(selection.tacticPackIds.filter(Boolean))
  const selectedTactics = tacticPackIds.map((id) => tacticPacks.find((pack) => pack.id === id)).filter((pack): pack is GrowthTacticPack => Boolean(pack))

  if (!industry) errors.push('请选择一个可用行业。')
  if (!tacticPackIds.length) errors.push('请至少选择一种准备执行的获客方式。')
  if (selectedTactics.length !== tacticPackIds.length) errors.push('所选获客方式中包含不可用项目，请重新选择。')
  if (industry && selectedTactics.some((pack) => pack.industryPackId !== industry.id)) errors.push('获客方式必须与当前行业匹配。')
  if (tacticPackIds.length && !tacticPackIds.includes(selection.defaultTacticPackId)) errors.push('请从已选获客方式中指定当前默认方式。')

  const requiredChannels = unique(selectedTactics.map((pack) => pack.channelId))
  const addedChannels = requiredChannels.filter((channelId) => !current.enabledChannels.includes(channelId))
  const addedTacticPackIds = tacticPackIds.filter((packId) => !current.installedTacticPacks.includes(packId))
  const addsIndustryPack = Boolean(industry && !current.installedIndustryPacks.includes(industry.id))

  if (errors.length || !industry) {
    return { ok: false, errors, requiredChannels, addedChannels, addedTacticPackIds, addsIndustryPack }
  }

  return {
    ok: true,
    errors: [],
    requiredChannels,
    addedChannels,
    addedTacticPackIds,
    addsIndustryPack,
    next: {
      enabledChannels: unique([...current.enabledChannels, ...requiredChannels]),
      installedIndustryPacks: unique([...current.installedIndustryPacks, industry.id]),
      activeIndustryPackId: industry.id,
      installedTacticPacks: unique([...current.installedTacticPacks, ...tacticPackIds]),
      activeTacticPackId: selection.defaultTacticPackId,
    },
  }
}
