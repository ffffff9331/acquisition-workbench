import type { ReactNode } from 'react'
import { Handshake, Image, MapPinned, MessageCircleMore, Play, Tv2 } from 'lucide-react'

export type ChannelId = 'douyin' | 'xiaohongshu' | 'wechat' | 'offline' | 'referral' | 'bilibili'

export type ChannelDefinition = {
  id: ChannelId
  label: string
  shortLabel: string
  description: string
  icon: ReactNode
  kind: 'content' | 'offline' | 'relationship'
  sourcePrefix: string
  taskLabel: string
  taskPlaceholder: string
  actionLabel: string
  linkLabel: string
  workflow: string[]
}

export const channelDefinitions: ChannelDefinition[] = [
  {
    id: 'douyin',
    label: '抖音获客',
    shortLabel: '抖音',
    description: '安排短视频内容、记录发布、承接咨询并看到每条视频带来的结果。',
    icon: <Play size={20} />,
    kind: 'content',
    sourcePrefix: 'DY',
    taskLabel: '视频任务',
    taskPlaceholder: '填写本次真实研究确认的短视频主题',
    actionLabel: '发布到抖音',
    linkLabel: '视频链接',
    workflow: ['内容计划', '视频制作', '发布任务', '咨询承接', '结果复盘'],
  },
  {
    id: 'xiaohongshu',
    label: '小红书获客',
    shortLabel: '小红书',
    description: '把选题、图片、笔记和私信承接放进同一条可追踪的获客流程。',
    icon: <Image size={20} />,
    kind: 'content',
    sourcePrefix: 'XHS',
    taskLabel: '笔记任务',
    taskPlaceholder: '填写本次真实研究确认的笔记主题',
    actionLabel: '发布小红书笔记',
    linkLabel: '笔记链接',
    workflow: ['选题笔记', '封面方式', '发布任务', '评论私信', '结果复盘'],
  },
  {
    id: 'wechat',
    label: '微信获客',
    shortLabel: '微信',
    description: '围绕朋友圈、视频号和社群，准备内容、安排触达并记录咨询来源。',
    icon: <MessageCircleMore size={20} />,
    kind: 'content',
    sourcePrefix: 'WX',
    taskLabel: '触达任务',
    taskPlaceholder: '例如：周末到店预约朋友圈内容',
    actionLabel: '确认完成触达',
    linkLabel: '内容记录 / 链接',
    workflow: ['选择触达场景', '内容与素材', '客户手工执行', '咨询承接', '结果复盘'],
  },
  {
    id: 'offline',
    label: '线下活动获客',
    shortLabel: '线下活动',
    description: '管理社区、到店、展会和地推活动，从预约与现场登记到活动后跟进。',
    icon: <MapPinned size={20} />,
    kind: 'offline',
    sourcePrefix: 'OFF',
    taskLabel: '活动任务',
    taskPlaceholder: '例如：XX 社区周末咨询体验日',
    actionLabel: '开始执行活动',
    linkLabel: '活动地点 / 记录',
    workflow: ['活动计划', '人员物料', '预约与现场登记', '活动后跟进', '结果复盘'],
  },
  {
    id: 'referral',
    label: '转介绍合作获客',
    shortLabel: '转介绍合作',
    description: '管理老客户与合作伙伴推荐关系，让每位被推荐客户和后续结果都可追踪。',
    icon: <Handshake size={20} />,
    kind: 'relationship',
    sourcePrefix: 'REF',
    taskLabel: '转介绍任务',
    taskPlaceholder: '例如：与一位老客户确认推荐和客户交接方式',
    actionLabel: '开始跟进转介绍',
    linkLabel: '推荐人 / 合作方',
    workflow: ['建立推荐关系', '确认推荐规则', '登记被推荐客户', '反馈与维护', '结果复盘'],
  },
  {
    id: 'bilibili',
    label: 'B站获客',
    shortLabel: 'B站',
    description: '围绕专业问题规划中长视频，用章节、案例和证明素材建立长期信任与咨询来源。',
    icon: <Tv2 size={20} />,
    kind: 'content',
    sourcePrefix: 'BILI',
    taskLabel: '视频任务',
    taskPlaceholder: '例如：完整拆解一次真实改造，从问题到落地结果',
    actionLabel: '确认已投稿到 B站',
    linkLabel: '视频链接',
    workflow: ['确认观众问题', '章节与证明素材', '视频制作检查', '客户手工投稿', '咨询与结果复盘'],
  },
]

export function channelById(id: ChannelId) {
  return channelDefinitions.find((channel) => channel.id === id) ?? channelDefinitions[0]
}

export function channelStatusOptions(channel: ChannelDefinition) {
  if (channel.kind === 'offline') return ['准备中', '执行中', '已完成', '已暂停'] as const
  if (channel.kind === 'relationship') return ['准备中', '跟进中', '已完成', '已暂停'] as const
  return ['准备中', '制作中', '待发布', '已发布', '已完成', '已暂停'] as const
}

export function nextChannelStatus(channel: ChannelDefinition) {
  if (channel.kind === 'offline') return '执行中'
  if (channel.kind === 'relationship') return '跟进中'
  return '制作中'
}
