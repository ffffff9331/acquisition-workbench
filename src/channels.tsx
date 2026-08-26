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

export type ContentPackageDefinition = {
  id: string
  channelId: ChannelId
  sectorId: string
  sector: string
  sectorDescription: string
  industry: string
  title: string
  description: string
  contentFocus: string[]
  leadFocus: string
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
    taskPlaceholder: '例如：小户型卫生间最容易买错的 3 个东西',
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
    taskPlaceholder: '例如：5 平方米卫生间改造前后对比',
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

type ChannelFocus = Record<ChannelId, readonly string[]>

type IndustryPackage = {
  id: string
  sectorId: string
  sector: string
  sectorDescription: string
  industry: string
  focus: ChannelFocus
}

const homeLivingSector = {
  sectorId: 'home-living',
  sector: '家装家居',
  sectorDescription: '面向家庭装修、居住改造与门店服务，把内容、预约、到店、量尺和后续线索统一管理。',
}

function homeLivingPackage(id: string, industry: string, focus: ChannelFocus): IndustryPackage {
  return { id, industry, focus, ...homeLivingSector }
}

const industryPackages: IndustryPackage[] = [
  homeLivingPackage('bathroom', '卫浴门店', {
    douyin: ['小户型避坑', '旧房改造', '到店量尺'],
    xiaohongshu: ['改造前后案例', '尺寸与收纳', '装修避坑'],
    wechat: ['门店案例', '到店预约', '老客晒单'],
    offline: ['小区量尺活动', '旧卫浴咨询', '到店体验'],
    referral: ['完工回访', '晒单邀请', '老客推荐'],
    bilibili: ['完整改造案例', '尺寸讲解', '方案拆解'],
  }),
  homeLivingPackage('windows', '门窗门店', {
    douyin: ['隔音问题', '封阳台案例', '上门测量'],
    xiaohongshu: ['防晒隔音案例', '新房避坑', '测量攻略'],
    wechat: ['封阳台案例', '小区实拍', '测量预约'],
    offline: ['新小区测量日', '隔音咨询', '样角体验'],
    referral: ['老客回访', '设计师合作', '邻居推荐'],
    bilibili: ['窗型方案拆解', '隔音原理', '案例讲解'],
  }),
  homeLivingPackage('balcony-cabinet', '定制柜门店', {
    douyin: ['收纳改造', '尺寸避坑', '现场设计'],
    xiaohongshu: ['收纳案例', '空间灵感', '设计预约'],
    wechat: ['收纳案例', '设计前后对比', '预约设计'],
    offline: ['小区收纳咨询', '现场设计日', '样品体验'],
    referral: ['老客晒单', '邻居推荐', '异业合作'],
    bilibili: ['收纳改造全案', '空间规划', '材质选择'],
  }),
  homeLivingPackage('whole-house-custom', '全屋定制门店', {
    douyin: ['户型规划', '全屋收纳', '设计预约'],
    xiaohongshu: ['全屋案例', '柜体细节', '预算避坑'],
    wechat: ['落地案例', '设计过程', '到店咨询'],
    offline: ['小区设计咨询', '样板间参观', '量房预约'],
    referral: ['完工回访', '设计师合作', '业主推荐'],
    bilibili: ['全屋设计拆解', '空间规划', '落地过程'],
  }),
  homeLivingPackage('tile-stone', '瓷砖 / 岩板门店', {
    douyin: ['铺贴效果', '选砖避坑', '到店看样'],
    xiaohongshu: ['搭配案例', '尺寸选择', '预算清单'],
    wechat: ['实景案例', '新品上样', '到店预约'],
    offline: ['小区选材咨询', '样板展示', '到店体验'],
    referral: ['完工晒单', '设计师合作', '老客推荐'],
    bilibili: ['选材攻略', '铺贴案例', '空间搭配'],
  }),
  homeLivingPackage('lighting', '灯具照明门店', {
    douyin: ['无主灯效果', '照明避坑', '到店体验'],
    xiaohongshu: ['氛围案例', '灯光搭配', '选灯清单'],
    wechat: ['实景灯光', '新品推荐', '到店预约'],
    offline: ['灯光体验日', '样板间参观', '方案咨询'],
    referral: ['老客晒单', '设计师合作', '邻居推荐'],
    bilibili: ['灯光方案拆解', '选灯逻辑', '案例讲解'],
  }),
  homeLivingPackage('kitchen-appliances', '厨电门店', {
    douyin: ['厨房改造', '产品实测', '到店体验'],
    xiaohongshu: ['厨房案例', '使用清单', '选购避坑'],
    wechat: ['新品体验', '客户反馈', '到店预约'],
    offline: ['烹饪体验活动', '新品试用', '到店咨询'],
    referral: ['老客回访', '晒单分享', '邻居推荐'],
    bilibili: ['厨电实测', '厨房方案', '安装讲解'],
  }),
  homeLivingPackage('smart-home', '智能家居门店', {
    douyin: ['智能场景', '安装案例', '到店体验'],
    xiaohongshu: ['全屋联动', '生活场景', '配置避坑'],
    wechat: ['案例演示', '新品体验', '方案预约'],
    offline: ['智能体验日', '样板间参观', '方案咨询'],
    referral: ['老客体验回访', '设计师合作', '朋友推荐'],
    bilibili: ['智能方案拆解', '设备讲解', '安装案例'],
  }),
  homeLivingPackage('renovation', '装修公司', {
    douyin: ['装修避坑', '施工实拍', '预约咨询'],
    xiaohongshu: ['案例拆解', '预算规划', '装修清单'],
    wechat: ['施工进度', '完工案例', '到店咨询'],
    offline: ['小区装修咨询', '样板房活动', '量房预约'],
    referral: ['完工客户回访', '设计师合作', '业主推荐'],
    bilibili: ['装修全流程', '预算拆解', '施工案例'],
  }),
  homeLivingPackage('old-home-renovation', '旧房翻新', {
    douyin: ['旧房改造前后', '翻新避坑', '上门评估'],
    xiaohongshu: ['旧改案例', '改造预算', '空间焕新'],
    wechat: ['翻新实录', '完工对比', '上门预约'],
    offline: ['老小区咨询', '旧改评估日', '样板参观'],
    referral: ['旧客户回访', '邻居推荐', '物业合作'],
    bilibili: ['旧改全过程', '预算拆解', '难点讲解'],
  }),
  homeLivingPackage('partial-renovation', '局部改造', {
    douyin: ['卫生间改造', '厨房焕新', '快速预约'],
    xiaohongshu: ['局改案例', '预算参考', '前后对比'],
    wechat: ['局改实录', '完工反馈', '上门咨询'],
    offline: ['小区局改咨询', '旧房焕新日', '现场评估'],
    referral: ['老客回访', '邻居推荐', '物业合作'],
    bilibili: ['局改流程', '工期讲解', '案例复盘'],
  }),
  homeLivingPackage('interior-design', '室内设计工作室', {
    douyin: ['户型优化', '设计过程', '咨询预约'],
    xiaohongshu: ['设计案例', '平面方案', '审美灵感'],
    wechat: ['方案分享', '项目进度', '咨询预约'],
    offline: ['设计咨询日', '样板参观', '户型诊断'],
    referral: ['老客回访', '合作转介', '朋友推荐'],
    bilibili: ['设计方案拆解', '户型分析', '项目讲解'],
  }),
  homeLivingPackage('soft-furnishing', '软装设计', {
    douyin: ['空间搭配', '改造前后', '方案咨询'],
    xiaohongshu: ['软装灵感', '单品搭配', '案例清单'],
    wechat: ['搭配案例', '新品推荐', '咨询预约'],
    offline: ['软装体验日', '样板参观', '搭配咨询'],
    referral: ['完工晒单', '设计师合作', '朋友推荐'],
    bilibili: ['搭配方案拆解', '风格讲解', '落地案例'],
  }),
]

const packageDescriptions: Record<ChannelId, string> = {
  douyin: '短视频选题、脚本方向、案例证明和咨询行动引导。',
  xiaohongshu: '图文笔记方向、产品图文案建议或标题封面、正文结构和私信行动引导。',
  wechat: '朋友圈、视频号和社群的内容方向与咨询承接。',
  offline: '社区、到店和地推活动的主题、登记与后续跟进方向。',
  referral: '老客回访、合作伙伴推荐和关系维护的内容方向。',
  bilibili: '专业案例、长视频大纲和信任内容的表达方向。',
}

export const contentPackages: ContentPackageDefinition[] = channelDefinitions.flatMap((channel) => industryPackages.map((industryPackage) => ({
  id: `${industryPackage.id}-${channel.id}-content-v1`,
  channelId: channel.id,
  sectorId: industryPackage.sectorId,
  sector: industryPackage.sector,
  sectorDescription: industryPackage.sectorDescription,
  industry: industryPackage.industry,
  title: `${industryPackage.industry}内容包`,
  description: packageDescriptions[channel.id],
  contentFocus: [...industryPackage.focus[channel.id]],
  leadFocus: industryPackage.focus[channel.id][industryPackage.focus[channel.id].length - 1],
})))

export function contentPackageById(id: string) {
  return contentPackages.find((contentPackage) => contentPackage.id === id)
}

export function packagesForChannel(channelId: ChannelId) {
  return contentPackages.filter((contentPackage) => contentPackage.channelId === channelId)
}
