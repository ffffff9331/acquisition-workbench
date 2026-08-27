import type { ChannelId } from './channels'

export type DeliverySolutionPack = {
  id: string
  title: string
  category: string
  description: string
  industryPackIds: string[]
  tacticPackIds: string[]
  channelIds: ChannelId[]
}

export const deliverySolutionPacks: DeliverySolutionPack[] = [
  {
    id: 'bathroom-douyin-measurement-solution-v1',
    title: '卫浴短视频到店量尺',
    category: '家装家居 · 卫浴门店',
    description: '围绕真实卫生间问题制作短视频，并把合适咨询推进到人工到店或量尺判断。',
    industryPackIds: ['bathroom-industry-rules-v2'],
    tacticPackIds: ['bathroom-douyin-measurement-v1'],
    channelIds: ['douyin'],
  },
  {
    id: 'bathroom-xiaohongshu-case-solution-v1',
    title: '卫浴装修案例私信承接',
    category: '家装家居 · 卫浴门店',
    description: '用真实、可说明条件的卫浴案例吸引咨询，再由门店人工判断现场适配。',
    industryPackIds: ['bathroom-industry-rules-v2'],
    tacticPackIds: ['bathroom-xiaohongshu-case-v1'],
    channelIds: ['xiaohongshu'],
  },
  {
    id: 'bathroom-referral-cooperation-solution-v1',
    title: '卫浴老客与设计师合作',
    category: '家装家居 · 卫浴门店',
    description: '把老客自愿推荐和设计师项目协同分别记录、人工交接并持续复盘。',
    industryPackIds: ['bathroom-industry-rules-v2'],
    tacticPackIds: ['bathroom-referral-service-experience-v1', 'bathroom-designer-partnership-v1'],
    channelIds: ['referral'],
  },
  {
    id: 'bathroom-community-renovation-solution-v1',
    title: '卫浴老房社区现场判断',
    category: '家装家居 · 卫浴门店',
    description: '围绕获准开展的社区现场咨询，承接老房卫生间改造需求并记录后续结果。',
    industryPackIds: ['bathroom-industry-rules-v2'],
    tacticPackIds: ['bathroom-community-renovation-v1'],
    channelIds: ['offline'],
  },
]

export function deliverySolutionPackById(value: unknown) {
  return typeof value === 'string' ? deliverySolutionPacks.find((pack) => pack.id === value) : undefined
}
