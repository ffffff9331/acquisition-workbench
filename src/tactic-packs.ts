import type { ChannelId } from './channels'

export type TacticLeadField = {
  id: string
  label: string
  purpose: string
  required: boolean
  inputKind?: 'shortText' | 'longText'
  placeholder?: string
}

export type TacticFollowUpStep = {
  timing: string
  action: string
  completionSignal: string
}

export type TacticExecutionStep = {
  timing: string
  action: string
  completionSignal: string
}

export type TacticExperimentPlan = {
  focus: string
  primaryMetric: string
  guardrailMetrics: string[]
  oneVariableRule: string
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
  contentPromise: string
  prePublishChecks: string[]
  channelExecutionSteps: TacticExecutionStep[]
  experimentPlan: TacticExperimentPlan
  callToAction: string
  leadFields: TacticLeadField[]
  qualificationRules: string[]
  followUpSteps: TacticFollowUpStep[]
  reviewMetrics: string[]
  boundaries: string[]
}

export type TacticLeadValues = Record<string, string>

export type TacticQualificationStatus = '' | '可人工推进' | '暂不符合'

export type TacticQualificationRecommendation = {
  status: '待补充信息' | '可人工推进'
  reasons: string[]
  missingFields: TacticLeadField[]
}

export function normalizeTacticLeadValues(value: unknown): TacticLeadValues {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.entries(value).reduce<TacticLeadValues>((result, [key, fieldValue]) => {
    const id = key.trim().slice(0, 80)
    const text = typeof fieldValue === 'string' ? fieldValue.trim().slice(0, 1000) : ''
    if (id && text) result[id] = text
    return result
  }, {})
}

export function tacticLeadInputName(fieldId: string) {
  return `tactic-lead-${fieldId}`
}

export function tacticLeadProgress(pack: GrowthTacticPack, values: TacticLeadValues) {
  const required = pack.leadFields.filter((field) => field.required)
  const completed = required.filter((field) => Boolean(values[field.id]?.trim()))
  return {
    requiredCount: required.length,
    completedCount: completed.length,
    complete: completed.length === required.length,
    missing: required.filter((field) => !values[field.id]?.trim()),
  }
}

export function normalizeTacticQualificationStatus(value: unknown): TacticQualificationStatus {
  return value === '可人工推进' || value === '暂不符合' ? value : ''
}

export function tacticQualificationRecommendation(pack: GrowthTacticPack, values: TacticLeadValues): TacticQualificationRecommendation {
  const progress = tacticLeadProgress(pack, values)
  if (!progress.complete) {
    return {
      status: '待补充信息',
      reasons: [`还缺少：${progress.missing.map((field) => field.label).join('、')}。`],
      missingFields: progress.missing,
    }
  }

  return {
    status: '可人工推进',
    reasons: [`已补全 ${progress.completedCount}/${progress.requiredCount} 项关键信息。`, '仍需由人工核对服务范围、现场适配和实际沟通意愿。'],
    missingFields: [],
  }
}

export const BATHROOM_DOUYIN_MEASUREMENT_TACTIC_ID = 'bathroom-douyin-measurement-v1'
export const BATHROOM_XIAOHONGSHU_CASE_TACTIC_ID = 'bathroom-xiaohongshu-case-v1'

export const bathroomDouyinMeasurementTactic: GrowthTacticPack = {
  id: BATHROOM_DOUYIN_MEASUREMENT_TACTIC_ID,
  name: '卫浴短视频 · 到店/量尺预约',
  version: '1.1',
  industryPackId: 'bathroom-industry-rules-v2',
  channelId: 'douyin',
  description: '面向本地卫浴门店的短视频预约路径：用真实安装与空间问题吸引接近决策的客户，再把咨询推进到到店或量尺。它不提供固定标题，也不承诺预约或成交结果。',
  primaryGoal: '获得可继续判断的本地卫浴咨询，并推动其中合适客户预约到店或上门量尺。',
  customerProfile: ['本地新房装修、旧房翻新或精装房升级的业主', '已描述卫生间尺寸、安装条件、使用痛点或预算比较的人', '愿意提供基本现场信息并接受人工沟通的人'],
  entryScenarios: ['小户型卫生间布局与产品适配', '旧房更换、局部改造与安装条件判断', '坑距、水压、排污、尺寸、收纳或价格包含范围的比较'],
  researchConstraints: ['优先研究本地客户公开提出的尺寸、安装、价格、交付和旧房问题。', '每个机会都必须说明现场条件、需要证明的材料和一个主要承接动作。', '没有真实来源时，不把泛行业常识写成客户正在关心的问题。'],
  contentConstraints: ['开头从一个可判断的卫生间现场问题切入，不用制造焦虑。', '展示真实产品规格、量尺、安装过程或获得授权的案例作为证明。', '正文只引导一个主要动作，不让客户在私信、加微信、到店和量尺之间猜下一步。'],
  contentPromise: '帮助本地、接近装修或换新的卫生间业主判断需要先补充什么现场信息，并明确下一步只需私信尺寸或户型情况。',
  prePublishChecks: [
    '封面、标题、开头和主体只兑现同一个具体现场问题，不用泛“卫生间避坑”承诺替代实际判断。',
    '内容中保留与问题直接相关的真实规格、量尺、安装过程或已获授权的案例材料，无法证明的结论不写成事实。',
    '发布前确认唯一下一步是私信尺寸或户型情况，并由门店人工承接；不同时要求加微信、到店和量尺。',
    '明确本次内容面对的本地服务范围和人工回复安排，不把不确定的适配、价格或预约写成承诺。',
  ],
  channelExecutionSteps: [
    { timing: '发布前', action: '确认内容关联的来源编号、人工承接人和本次服务范围，确保客户咨询后能被真实记录与回复。', completionSignal: '发布任务已具备来源编号，负责人和承接安排已明确。' },
    { timing: '出现目标问题的评论或私信时', action: '人工识别具体的尺寸、安装、改造或时间问题，将真实咨询登记为线索并关联来源；泛互动不直接算有效线索。', completionSignal: '真实咨询已进入线索，或已记录不匹配原因。' },
    { timing: '本轮预设复盘时点', action: '回看内容承诺、咨询质量、资料补全和后续预约，不以播放量单独判断是否继续投入。', completionSignal: '已记录主指标、护栏指标和下一轮仅调整的一项内容变量。' },
  ],
  experimentPlan: {
    focus: '验证哪一种本地卫生间现场问题切入，能带来愿意补全现场资料的咨询。',
    primaryMetric: '补全打法包必填现场信息的线索数。',
    guardrailMetrics: ['封面、标题、开头与正文是否兑现同一承诺。', '人工是否能在明确服务范围和回复节奏内承接咨询。', '负向反馈、无效咨询和后续服务成本是否异常。'],
    oneVariableRule: '一轮只改变一个主要变量，例如现场问题切入、首屏表达或主要动作的表述；其余条件尽量保持一致。',
  },
  callToAction: '私信卫生间尺寸或户型情况，由门店人工确认是否适合预约到店或量尺。',
  leadFields: [
    { id: 'service-area', label: '所在区域', purpose: '确认是否在当前服务范围内。', required: true, placeholder: '例如：杭州临平区' },
    { id: 'renovation-stage', label: '装修或更换阶段', purpose: '判断客户是否接近选购、安装或改造决策。', required: true, placeholder: '例如：旧房翻新，准备下月施工' },
    { id: 'bathroom-condition', label: '卫生间尺寸或现场情况', purpose: '确认坑距、空间、水电、排污或布局是否需要进一步判断。', required: true, inputKind: 'longText', placeholder: '例如：主卫约 2 平方米，想换马桶和浴室柜；已知坑距约 305mm' },
    { id: 'target-product', label: '想看或想解决的问题', purpose: '匹配马桶、浴室柜、花洒、淋浴房或局部改造的后续动作。', required: true, inputKind: 'longText', placeholder: '例如：想确认智能马桶是否能装，预算包含安装' },
    { id: 'contact-window', label: '可联系时间', purpose: '安排人工回复、到店或量尺沟通。', required: false, placeholder: '例如：工作日 19:00 后方便沟通' },
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

export const bathroomXiaohongshuCaseTactic: GrowthTacticPack = {
  id: BATHROOM_XIAOHONGSHU_CASE_TACTIC_ID,
  name: '卫浴装修案例 · 私信现场判断',
  version: '1.0',
  industryPackId: 'bathroom-industry-rules-v2',
  channelId: 'xiaohongshu',
  description: '面向本地卫浴门店的案例笔记咨询路径：用真实、可说明条件的装修案例帮助客户判断自己的空间问题，再由门店人工确认是否适合继续沟通、到店或量尺。它不提供固定标题，不承诺同款效果或成交结果。',
  primaryGoal: '获得与本地卫浴案例场景匹配、愿意补充现场信息的咨询，并把合适客户推进到人工判断和预约。',
  customerProfile: ['正在新房装修、旧房翻新或精装房升级，且希望参考相似卫生间场景的本地业主', '会描述空间限制、改造难点、产品偏好或预算比较的人', '愿意提供所在区域、现场照片或户型情况，并接受人工沟通的人'],
  entryScenarios: ['小户型卫生间的布局、收纳和产品适配', '旧房卫生间换新、局部改造和施工条件确认', '智能马桶、浴室柜、淋浴区或花洒的真实安装和使用问题'],
  researchConstraints: ['优先研究用户搜索、评论、私信和真实咨询中出现的具体空间问题、改造障碍和案例比较需求。', '案例类机会必须说明案例条件、可证明材料和不适用的情况，不把一个现场结果直接泛化为所有客户都能复刻。', '本地服务相关的机会要明确地域、服务边界和人工承接动作；平台入口与导流规则在执行当日由经营者核验。'],
  contentConstraints: ['封面、标题、开头和正文围绕同一个卫生间场景与判断问题，让用户一眼看懂案例和自己是否相关。', '正文清楚交代客户原始问题、判断方法、实际条件、可证明材料和一个下一步，不只展示前后对比图片。', '案例照片、客户反馈、尺寸、价格和效果必须确认来源与授权；不能把相似空间写成同款效果保证。'],
  contentPromise: '让本地业主通过一个条件讲清楚的卫浴装修案例，判断自己的卫生间是否属于相似问题，并知道下一步只需私信所在区域和现场照片或户型情况。',
  prePublishChecks: [
    '封面、标题、前 30 字或视频前 3 秒与正文都指向同一个案例场景和客户问题，不用泛“改造前后对比”吸引无关点击。',
    '案例已说明真实条件、产品或施工范围、适用限制，并已确认图片、客户反馈和可识别信息的授权与保护方式。',
    '正文把客户问题、判断方法、可证明材料和一个主要动作说清，避免只展示结果或把无法验证的效果写成承诺。',
    '发布前确认唯一下一步是私信所在区域和现场照片或户型情况，并安排门店人工在平台内承接。',
  ],
  channelExecutionSteps: [
    { timing: '发布前', action: '确认笔记关联的来源编号、人工承接人、服务范围和案例材料，确保咨询后能回到真实线索与后续服务。', completionSignal: '发布任务已具备来源编号、负责人、服务边界和可追溯案例材料。' },
    { timing: '出现具体场景的评论或私信时', action: '人工确认客户提到的空间、改造或安装问题，并邀请其按实际情况补充区域和现场资料；泛收藏、点赞或只问同款价格不直接算有效线索。', completionSignal: '真实咨询已关联来源并登记为线索，或已记录不匹配、资料缺失的原因。' },
    { timing: '本轮预设复盘时点', action: '回看案例场景是否带来匹配咨询、资料是否能补全、承接是否顺畅和后续预约，不用收藏或单次浏览独自判断路径有效。', completionSignal: '已记录主指标、护栏指标和下一轮只调整的一项内容变量。' },
  ],
  experimentPlan: {
    focus: '验证哪一种真实卫浴案例场景，能带来愿意提供区域与现场资料的本地咨询。',
    primaryMetric: '补全本打法包必填信息的线索数。',
    guardrailMetrics: ['封面、标题、开头和正文是否兑现同一案例承诺。', '案例条件、授权和服务边界是否清楚，是否出现误解或负向反馈。', '人工承接后进入预约、方案或报价的质量，以及相应服务成本。'],
    oneVariableRule: '一轮只调整一个主要变量，例如案例场景、封面承诺、前 30 字或主要动作的表述；不要同时更换案例、标题、正文和承接方式。',
  },
  callToAction: '私信所在区域和卫生间照片或户型情况，由门店人工判断是否适合继续沟通、到店或量尺。',
  leadFields: [
    { id: 'service-area', label: '所在区域', purpose: '确认是否在当前服务范围内。', required: true, placeholder: '例如：杭州临平区' },
    { id: 'renovation-stage', label: '装修或更换阶段', purpose: '判断客户是否接近选购、施工或改造决策。', required: true, placeholder: '例如：精装房升级，计划下月更换' },
    { id: 'case-problem', label: '想参考的案例或空间问题', purpose: '确认客户被哪种案例场景吸引，以及自己的真实决策问题。', required: true, inputKind: 'longText', placeholder: '例如：卫生间约 2 平方米，想参考小空间浴室柜和智能马桶的布局' },
    { id: 'site-material', label: '卫生间现场情况', purpose: '确认是否已提供照片、户型、尺寸、坑距、水电或排污等需要进一步判断的信息。', required: true, inputKind: 'longText', placeholder: '例如：可提供卫生间照片；坑距约 305mm，淋浴区较窄' },
    { id: 'contact-window', label: '可联系时间', purpose: '安排人工回复、到店或量尺沟通。', required: false, placeholder: '例如：工作日 19:00 后方便沟通' },
  ],
  qualificationRules: ['服务区域可覆盖，且客户愿意补充区域、装修阶段和实际现场情况。', '客户能说明希望参考的案例场景或自己要解决的空间、安装、改造问题。', '不因为收藏、点赞、只问同款价格或要求站外联系方式就直接判定为有效预约。'],
  followUpSteps: [
    { timing: '首次咨询当日', action: '确认客户的区域、装修阶段、想参考的案例问题和现有现场资料，并说明还需要补充什么。', completionSignal: '客户已补充基本情况，或明确暂不在服务范围内。' },
    { timing: '信息完整后', action: '由人工说明案例与客户现场的可比与不可比条件，给出继续沟通、到店或量尺建议。', completionSignal: '已形成明确预约，或记录客户暂缓、条件不匹配的原因。' },
    { timing: '预约前一天', action: '人工核对时间、地址或到店安排，以及需要携带或发送的户型、照片、尺寸和关注问题。', completionSignal: '预约状态已确认或重新安排。' },
    { timing: '到店/量尺后 24 小时内', action: '记录实际需求、方案或报价动作，并区分案例参考与现场最终判断。', completionSignal: '已进入方案、报价、暂缓或不再跟进中的一个明确状态。' },
  ],
  reviewMetrics: ['已发布案例笔记数量', '带有具体空间问题的平台咨询数', '补全基本信息的线索数', '有效到店/量尺预约数', '进入方案或报价的客户数', '最终成交、未推进原因和服务成本观察'],
  boundaries: ['案例仅用于说明当时客户的真实条件和解决思路，不承诺其他空间可获得同款效果。', '不自动私信、自动加微信、自动预约或批量发送内容。', '不以收藏、浏览或单一评论判断这份打法有效，必须回收到线索、预约、客户阶段和服务质量。', '平台内承接与后续联系方式的使用必须由经营者在执行当日按平台规则和客户同意情况人工确认。'],
}

export const growthTacticPacks: GrowthTacticPack[] = [bathroomDouyinMeasurementTactic, bathroomXiaohongshuCaseTactic]

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
    contentPromise: pack.contentPromise,
    prePublishChecks: pack.prePublishChecks,
    channelExecutionSteps: pack.channelExecutionSteps,
    experimentPlan: pack.experimentPlan,
    callToAction: pack.callToAction,
    leadFields: pack.leadFields,
    qualificationRules: pack.qualificationRules,
    followUpSteps: pack.followUpSteps,
    reviewMetrics: pack.reviewMetrics,
    boundaries: pack.boundaries,
  }
}
