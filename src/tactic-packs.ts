import type { ChannelId } from './channels'

export type TacticLeadField = {
  id: string
  label: string
  purpose: string
  required: boolean
}

export type TacticFollowUpStep = {
  timing: string
  action: string
  completionSignal: string
}

export type GrowthTacticPack = {
  id: string
  name: string
  version: string
  industryPackId: string
  channelId: ChannelId
  description: string
  primaryGoal: string
  customerProfile: string[]
  entryScenarios: string[]
  researchConstraints: string[]
  contentConstraints: string[]
  callToAction: string
  leadFields: TacticLeadField[]
  qualificationRules: string[]
  followUpSteps: TacticFollowUpStep[]
  reviewMetrics: string[]
  boundaries: string[]
}

export const BATHROOM_DOUYIN_MEASUREMENT_TACTIC_ID = 'bathroom-douyin-measurement-v1'

export const bathroomDouyinMeasurementTactic: GrowthTacticPack = {
  id: BATHROOM_DOUYIN_MEASUREMENT_TACTIC_ID,
  name: '卫浴短视频 · 到店/量尺预约',
  version: '1.0',
  industryPackId: 'bathroom-industry-rules-v2',
  channelId: 'douyin',
  description: '面向本地卫浴门店的短视频预约路径：用真实安装与空间问题吸引接近决策的客户，再把咨询推进到到店或量尺。它不提供固定标题，也不承诺预约或成交结果。',
  primaryGoal: '获得可继续判断的本地卫浴咨询，并推动其中合适客户预约到店或上门量尺。',
  customerProfile: ['本地新房装修、旧房翻新或精装房升级的业主', '已描述卫生间尺寸、安装条件、使用痛点或预算比较的人', '愿意提供基本现场信息并接受人工沟通的人'],
  entryScenarios: ['小户型卫生间布局与产品适配', '旧房更换、局部改造与安装条件判断', '坑距、水压、排污、尺寸、收纳或价格包含范围的比较'],
  researchConstraints: ['优先研究本地客户公开提出的尺寸、安装、价格、交付和旧房问题。', '每个机会都必须说明现场条件、需要证明的材料和一个主要承接动作。', '没有真实来源时，不把泛行业常识写成客户正在关心的问题。'],
  contentConstraints: ['开头从一个可判断的卫生间现场问题切入，不用制造焦虑。', '展示真实产品规格、量尺、安装过程或获得授权的案例作为证明。', '正文只引导一个主要动作，不让客户在私信、加微信、到店和量尺之间猜下一步。'],
  callToAction: '私信卫生间尺寸或户型情况，由门店人工确认是否适合预约到店或量尺。',
  leadFields: [
    { id: 'service-area', label: '所在区域', purpose: '确认是否在当前服务范围内。', required: true },
    { id: 'renovation-stage', label: '装修或更换阶段', purpose: '判断客户是否接近选购、安装或改造决策。', required: true },
    { id: 'bathroom-condition', label: '卫生间尺寸或现场情况', purpose: '确认坑距、空间、水电、排污或布局是否需要进一步判断。', required: true },
    { id: 'target-product', label: '想看或想解决的问题', purpose: '匹配马桶、浴室柜、花洒、淋浴房或局部改造的后续动作。', required: true },
    { id: 'contact-window', label: '可联系时间', purpose: '安排人工回复、到店或量尺沟通。', required: false },
  ],
  qualificationRules: ['服务区域可覆盖，且客户愿意补充基本现场信息。', '存在明确产品、安装、改造、预算或时间窗口中的至少一项真实决策信号。', '不因为评论、点赞或只问泛价格就直接判定为有效预约。'],
  followUpSteps: [
    { timing: '首次咨询当日', action: '确认区域、装修阶段、现场尺寸或问题，并说明下一步需要的资料。', completionSignal: '客户已补充基本情况，或明确暂不符合服务范围。' },
    { timing: '信息完整后', action: '由人工给出到店或量尺建议，确认可选时间与预计沟通内容。', completionSignal: '已形成明确预约，或记录客户暂缓原因。' },
    { timing: '预约前一天', action: '人工核对时间、地址或到店安排，以及需要携带的户型、尺寸和现场照片。', completionSignal: '预约状态已确认或重新安排。' },
    { timing: '到店/量尺后 24 小时内', action: '记录客户需求、下一步方案或报价动作，并更新意向客户状态。', completionSignal: '已进入方案、报价、暂缓或不再跟进中的一个明确状态。' },
  ],
  reviewMetrics: ['已发布短视频数量', '平台咨询数', '补全基本信息的线索数', '有效到店/量尺预约数', '进入方案或报价的客户数', '最终成交数与未推进原因'],
  boundaries: ['最终产品适配、安装方式、价格与预约安排均以现场与人工确认结果为准。', '不自动私信、自动加微信、自动预约或批量发送内容。', '不以播放量或单一评论判断这份打法有效，必须回收到线索、预约和客户阶段。'],
}

export const growthTacticPacks: GrowthTacticPack[] = [bathroomDouyinMeasurementTactic]

export function growthTacticPackById(value: unknown) {
  return typeof value === 'string' ? growthTacticPacks.find((pack) => pack.id === value) : undefined
}

export function growthTacticPackPayload(pack?: GrowthTacticPack) {
  if (!pack) return null
  return {
    id: pack.id,
    name: pack.name,
    version: pack.version,
    industryPackId: pack.industryPackId,
    channelId: pack.channelId,
    primaryGoal: pack.primaryGoal,
    customerProfile: pack.customerProfile,
    entryScenarios: pack.entryScenarios,
    researchConstraints: pack.researchConstraints,
    contentConstraints: pack.contentConstraints,
    callToAction: pack.callToAction,
    leadFields: pack.leadFields,
    qualificationRules: pack.qualificationRules,
    followUpSteps: pack.followUpSteps,
    reviewMetrics: pack.reviewMetrics,
    boundaries: pack.boundaries,
  }
}
