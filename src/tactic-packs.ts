import type { ChannelId } from './channels'
import type { TrafficPlan } from './traffic-campaign'

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
  recommendedRelationType?: '老客户转介绍' | '合作伙伴推荐'
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
  trafficPlan: TrafficPlan
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
export const BATHROOM_REFERRAL_SERVICE_EXPERIENCE_TACTIC_ID = 'bathroom-referral-service-experience-v1'
export const BATHROOM_COMMUNITY_RENOVATION_TACTIC_ID = 'bathroom-community-renovation-v1'
export const BATHROOM_DESIGNER_PARTNERSHIP_TACTIC_ID = 'bathroom-designer-partnership-v1'

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
  trafficPlan: {
    primaryMode: '平台自然推荐',
    backupModes: ['主动需求截流'],
    defaultTestWindowDays: 7,
    successSignal: '7 天内记录来自本地、愿意补全现场资料的有效咨询，以及进入到店或量尺的数量；不只看播放量。',
    evidencePriorities: ['真实量尺或安装现场', '产品规格与不适用条件', '获得授权的本地案例与服务范围'],
    firstExecutionGate: '必须准备可核对的现场画面或尺寸说明，并明确平台内人工承接人和唯一下一步。',
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
  trafficPlan: {
    primaryMode: '主动需求截流',
    backupModes: ['平台自然推荐'],
    defaultTestWindowDays: 14,
    successSignal: '14 天内记录从具体案例场景进入、愿意提交区域与现场资料的有效私信，以及进入到店或量尺的数量；不只看收藏。',
    evidencePriorities: ['条件可说明的真实案例', '改造过程与现场限制', '可公开的尺寸、材料或授权反馈'],
    firstExecutionGate: '至少有两条公开需求证据和一份可以说明条件、授权与不适用边界的案例材料。',
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

export const bathroomReferralServiceExperienceTactic: GrowthTacticPack = {
  id: BATHROOM_REFERRAL_SERVICE_EXPERIENCE_TACTIC_ID,
  name: '卫浴老客服务体验 · 自愿转介绍',
  version: '1.0',
  industryPackId: 'bathroom-industry-rules-v2',
  channelId: 'referral',
  recommendedRelationType: '老客户转介绍',
  description: '面向本地卫浴门店的老客户转介绍路径：先把已完成的服务和遗留问题处理好，再在客户自愿、且新客户同意沟通的前提下承接推荐。它不把老客户当作流量入口，也不承诺推荐或成交结果。',
  primaryGoal: '获得经过本人同意、带有真实卫浴需求的本地咨询，并把适合的客户推进到人工判断、到店或量尺。',
  customerProfile: ['已完成卫浴选购、安装或改造，且愿意持续接受正常服务回访的老客户', '因真实服务体验而愿意在合适场景介绍朋友的客户', '本人同意被介绍、且愿意说明区域、改造阶段或卫生间需求的新客户'],
  entryScenarios: ['完工、安装或售后回访中确认客户的真实使用体验与遗留问题', '老客户主动提到亲友正在装修、换新或遇到类似卫生间问题', '新客户已明确同意由推荐人介绍，并愿意进行一次人工需求确认'],
  researchConstraints: ['优先回收已完成服务中的真实问题、满意点、遗留问题和可改善流程，不把单次好评或关系亲近当成推荐意愿。', '推荐路径必须清楚区分推荐人、被推荐客户和门店各自获得的真实价值，以及新客户同意沟通的方式。', '不以邀请数量、群人数、晒图数量或联系方式数量代替有效获客信号，必须回收到合格线索、预约、成交、负向反馈和服务成本。'],
  contentConstraints: ['与老客户的回访、感谢或服务沟通先围绕真实体验与问题处理，不把推荐请求伪装成售后服务。', '如需使用客户评价、安装照片或体验故事，必须确认授权、可公开范围和个人信息保护方式。', '介绍说明只讲清适合什么需求、如何先征得新客户同意和如何人工交接，不用强制分享、诱导打卡或夸大回报。'],
  contentPromise: '让老客户知道门店会先认真处理服务体验；只有在新客户本人愿意沟通时，才由人工确认对方的真实卫生间需求和下一步。',
  prePublishChecks: [
    '先核对推荐人是否已完成服务体验回访、遗留问题是否已记录或处理，不能把未解决的问题客户直接当作推荐来源。',
    '确认推荐人了解适合介绍的客户场景、客户交接方式和结果反馈方式；不默认其愿意分享或提供联系人。',
    '新客户的联系方式、照片或户型资料仅在本人已同意沟通且为明确服务目的所需时登记，避免收集与承接无关的信息。',
    '如涉及评价、案例、感谢或权益说明，确认真实、可证明、已获授权，不使用虚构、夸大或诱导式表达。',
  ],
  channelExecutionSteps: [
    { timing: '服务回访或维护时', action: '人工确认老客户的实际使用体验、未解决问题和是否愿意继续保持正常服务联系；先安排问题处理，不追求当场获得推荐。', completionSignal: '服务体验和下一步维护事项已记录，或已明确不适合继续请求推荐。' },
    { timing: '客户自愿提及推荐时', action: '人工说明适合介绍的卫浴需求、先征得新客户同意的交接方式，以及门店如何反馈进展；不要求客户公开分享或直接提供未同意的联系方式。', completionSignal: '推荐关系、推荐场景、客户交接方式和结果反馈安排已由双方确认。' },
    { timing: '收到真实介绍后', action: '建立可追溯的推荐来源，登记新客户的真实咨询和同意沟通情况；只因被推荐而来不直接判为有效意向。', completionSignal: '新客户已关联具体推荐来源并登记为线索，或已记录未同意、超出范围或资料不足的原因。' },
    { timing: '本轮预设复盘时点', action: '回看服务体验、推荐客户质量、预约与成交、负向反馈和服务成本，决定是继续维护、调整服务环节还是停止该关系的推荐尝试。', completionSignal: '已记录业务结果、负向信号和下一轮只调整的一项维护或承接变量。' },
  ],
  experimentPlan: {
    focus: '验证哪一种真实服务维护场景，能在不打扰客户的前提下带来本人同意、且愿意说明卫浴需求的推荐咨询。',
    primaryMetric: '补全本打法包必填信息，并由人工确认可继续沟通的推荐线索数。',
    guardrailMetrics: ['老客户的服务问题是否被优先处理，是否出现压力、投诉或负面体验。', '新客户是否明确同意沟通，联系与资料收集是否符合最小必要原则。', '后续预约、方案、报价和成交质量，以及维护和承接所需的服务成本。'],
    oneVariableRule: '一轮只调整一个主要变量，例如回访场景、介绍说明或交接方式；不要同时改变服务内容、感谢方式、推荐对象和承接流程。',
  },
  trafficPlan: {
    primaryMode: '合作转介绍',
    backupModes: [],
    defaultTestWindowDays: 14,
    successSignal: '14 天内记录新客户本人同意沟通后的有效咨询、资料补全和后续到店或量尺，不以转发或推荐次数单独判断。',
    evidencePriorities: ['已完成服务的体验核对', '新客户本人同意沟通的记录', '清晰的资料与结果反馈边界'],
    firstExecutionGate: '先完成服务体验核对并确认客户愿意介绍，不索取或导入未经本人同意的联系方式。',
  },
  callToAction: '由推荐人先确认新客户愿意沟通，再由门店人工确认区域、改造阶段和卫生间需求，判断是否适合到店或量尺。',
  leadFields: [
    { id: 'referral-context', label: '推荐关系与场景', purpose: '确认是谁在什么真实场景下介绍，以及新客户是否已同意沟通。', required: true, inputKind: 'longText', placeholder: '例如：完工老客户王女士介绍其同事；对方已同意由门店联系，计划旧房卫生间换新' },
    { id: 'service-area', label: '所在区域', purpose: '确认是否在当前服务范围内。', required: true, placeholder: '例如：杭州临平区' },
    { id: 'renovation-stage', label: '装修或改造阶段', purpose: '判断客户是否接近选购、安装或改造决策。', required: true, placeholder: '例如：老房改造，计划两周内开工' },
    { id: 'bathroom-need', label: '卫生间问题或服务需求', purpose: '确认新客户要解决的真实产品、安装、空间或改造问题。', required: true, inputKind: 'longText', placeholder: '例如：卫生间空间小，想换马桶和浴室柜，需要先确认尺寸与安装条件' },
    { id: 'site-material', label: '现场资料情况', purpose: '记录是否有照片、户型、尺寸、坑距、水电或排污等可供人工判断的资料。', required: false, inputKind: 'longText', placeholder: '例如：可提供卫生间照片；尺寸还需到店或上门确认' },
    { id: 'feedback-preference', label: '推荐人希望的结果反馈方式', purpose: '按推荐人已同意的方式反馈承接结果，避免披露新客户不应共享的个人信息。', required: false, placeholder: '例如：只确认是否已联系和是否已安排到店，不反馈报价细节' },
  ],
  qualificationRules: ['服务区域可覆盖，且新客户本人愿意沟通或已明确同意被介绍。', '客户存在明确装修、改造、产品、预算或时间窗口中的至少一项真实需求信号。', '不因为推荐人给了联系方式、关系亲近或只问价格就自动判定为有效意向。'],
  followUpSteps: [
    { timing: '首次联系当日', action: '人工确认新客户是否愿意继续沟通、所在区域、改造阶段和卫生间需求，说明仅为判断服务适配所需的信息。', completionSignal: '客户已补充基本情况，或记录未同意、超出服务范围或暂不需要的原因。' },
    { timing: '信息完整后', action: '由人工判断服务范围和现场适配，提出继续沟通、到店或量尺建议，并确认可联系时间。', completionSignal: '已形成明确下一步，或记录条件不匹配、客户暂缓的原因。' },
    { timing: '预约前一天', action: '人工核对到店或量尺的时间、地点、需要准备的户型、照片、尺寸和关注问题。', completionSignal: '预约状态已确认或重新安排。' },
    { timing: '到店/量尺后 24 小时内', action: '记录实际需求、方案或报价动作；只在推荐人与新客户均同意的范围内反馈承接进展并表达感谢。', completionSignal: '已进入方案、报价、成交、暂缓或不再跟进中的一个明确状态。' },
  ],
  reviewMetrics: ['完成服务体验回访的老客户数', '新客户本人同意沟通的推荐咨询数', '补全基本信息并可人工推进的线索数', '有效到店/量尺预约数', '进入方案或报价的客户数', '最终成交、未推进原因、负向反馈和服务成本观察'],
  boundaries: ['先处理老客户的服务体验与遗留问题，不将老客户视为可批量开发的流量入口。', '不强制分享、晒图、打卡、拉群或公开个人信息，也不以红包、折扣或积分替代真实服务价值。', '不保存或使用未经新客户本人同意的联系方式、照片、户型或其他个人资料。', '不自动私信、自动加微信、自动预约、自动发送感谢或批量群发内容。', '不以推荐次数单独判断打法有效，必须回收到合格线索、预约、成交、负向反馈和服务成本。'],
}

export const bathroomDesignerPartnershipTactic: GrowthTacticPack = {
  id: BATHROOM_DESIGNER_PARTNERSHIP_TACTIC_ID,
  name: '卫浴设计师合作 · 需求转介与方案协同',
  version: '1.0',
  industryPackId: 'bathroom-industry-rules-v2',
  channelId: 'referral',
  recommendedRelationType: '合作伙伴推荐',
  description: '面向本地卫浴门店与室内设计师、设计工作室或装修相关合作方的转介路径：先明确双方能为业主解决的空间、产品、安装与交接问题，再在业主本人同意后由门店人工承接。它不把合作伙伴的客户名单当作资源，也不承诺合作一定带来成交。',
  primaryGoal: '获得由合作伙伴按真实项目场景介绍、且业主本人同意沟通的卫浴需求，并推动合适客户进入现场判断、到店或量尺。',
  customerProfile: ['服务本地装修业主、会参与卫生间空间规划或选材决策的室内设计师、设计工作室和装修相关合作方', '正在进行新房装修、旧房改造或精装升级，且有明确卫浴空间、产品、安装或预算协同问题的业主', '愿意由设计师介绍、并接受门店人工核对服务范围、产品适配和现场条件的业主'],
  entryScenarios: ['设计师正在确定卫生间布局、收纳、马桶、浴室柜、淋浴区或适老改善方案，需要核对产品和安装条件', '装修项目进入选材、量房、方案深化或施工协调阶段，需要在空间、预算、排水、水电或交付边界上协同', '合作方已确认业主愿意沟通，且双方能说明由谁负责什么、如何交接资料和如何反馈进展'],
  researchConstraints: ['先研究真实项目中设计师和业主反复出现的空间、安装、选材和交付协同问题，不把泛“设计师渠道”当作明确需求。', '合作关系必须写清理想项目、客户价值、门店与合作方的职责边界、交接方式和结果反馈；不能只留下联系人或合作口号。', '只在业主本人同意且为当前项目服务所必需时接收联系方式、户型、照片或尺寸资料；不索取、购买、交换或批量导入合作方客户名单。'],
  contentConstraints: ['面向合作方的资料和沟通先说明可协同判断的产品、空间、安装和服务边界，用真实规格、案例条件或流程证明，不用未经核实的效果与报价承诺换取转介。', '对业主的介绍只围绕当前项目中的具体问题，清楚说明门店人工下一步要核对什么；不绕开设计师、也不让业主在多方之间猜谁负责。', '如展示案例、图纸、照片、报价、评价或项目资料，必须确认授权、可公开范围和个人信息保护方式。'],
  contentPromise: '让设计师和业主都清楚：门店会围绕当前卫生间项目的具体空间、产品和安装问题进行人工判断；仅在业主同意后接收必要资料，并明确下一步由谁推进。',
  prePublishChecks: [
    '已确认合作方的真实服务范围、理想项目、双方职责和客户交接方式；不把“认识设计师”直接当作可接收推荐。',
    '本次协同只聚焦一个明确项目问题，并准备与之直接相关的规格、样品、安装条件、授权案例或需现场确认的清单。',
    '已说明业主同意沟通的方式、资料使用目的、最小必要字段和结果反馈边界；不默认设计师可以提供客户资料。',
    '已明确报价、施工、设计、安装、售后和项目协调中的责任边界，不替合作方或现场条件作出未经确认的承诺。',
  ],
  channelExecutionSteps: [
    { timing: '建立合作关系前', action: '人工确认合作方服务的项目类型、真实协同场景、双方职责、客户价值和资料交接边界；先判断是否适合长期维护。', completionSignal: '合作基础、适合介绍的场景、理想项目、交接方式和结果反馈安排已记录。' },
    { timing: '合作方出现匹配项目时', action: '由合作方先向业主说明门店能协同判断的具体问题，并确认业主愿意沟通；门店只接收当前项目所需的最小资料。', completionSignal: '业主已明确同意介绍，或已记录暂不愿沟通、项目不匹配或资料不足的原因。' },
    { timing: '门店承接项目后', action: '人工核对区域、装修阶段、卫生间设计或安装问题和已有资料，明确接下来是继续沟通、到店选样、量尺还是暂不推进。', completionSignal: '客户已关联具体合作伙伴来源，并形成明确下一步或未推进原因。' },
    { timing: '项目节点或预设复盘时点', action: '在业主同意的范围内向合作方反馈承接状态，回看项目匹配度、方案或报价进展、成交、负向反馈和协同成本。', completionSignal: '已记录真实项目结果与下一轮只调整的一项合作或交接变量。' },
  ],
  experimentPlan: {
    focus: '验证哪一种设计师协同场景，能带来本人同意沟通、且愿意补全卫浴项目条件的本地业主需求。',
    primaryMetric: '补全本打法包必填项目资料，并由人工确认可继续沟通的合作伙伴转介线索数。',
    guardrailMetrics: ['业主是否明确同意沟通与资料交接，是否出现绕开合作方、误解职责或隐私边界的问题。', '设计师与门店的职责、方案、报价和现场确认是否一致，是否造成返工、投诉或协同压力。', '后续到店、量尺、方案、报价、成交质量，以及维护合作和项目承接所需的人力成本。'],
    oneVariableRule: '一轮只调整一个主要变量，例如协同问题类型、介绍说明或资料交接方式；不要同时改变合作对象、项目场景、产品方案、报价与后续承接。',
  },
  trafficPlan: {
    primaryMode: '合作转介绍',
    backupModes: [],
    defaultTestWindowDays: 14,
    successSignal: '14 天内记录业主本人同意后进入的真实项目协同需求、资料补全和方案或量尺推进，不以拜访数或联系人数量单独判断。',
    evidencePriorities: ['明确的项目协同问题', '业主同意与最小资料交接边界', '门店和设计师的职责说明'],
    firstExecutionGate: '先写清设计师、门店与业主各自负责什么，以及业主同意沟通和资料交接的方式。',
  },
  callToAction: '设计师先确认业主愿意沟通，再由门店人工核对区域、项目阶段、卫生间协同问题和已有资料，判断是否适合到店或量尺。',
  leadFields: [
    { id: 'partner-context', label: '合作方与项目交接场景', purpose: '确认哪位合作伙伴在什么真实项目中介绍，以及业主是否已同意由门店继续沟通。', required: true, inputKind: 'longText', placeholder: '例如：某设计工作室正在做旧房改造；业主已同意门店联系，需确认小卫生间浴室柜和马桶布局' },
    { id: 'service-area', label: '项目所在区域', purpose: '确认是否在当前服务范围内；只记录判断服务所需的大致区域。', required: true, placeholder: '例如：杭州西湖区' },
    { id: 'project-stage', label: '装修或项目阶段', purpose: '判断项目处于方案、选材、量房、施工协调还是已有明确时间窗口。', required: true, placeholder: '例如：设计方案深化，计划两周内确定卫浴产品' },
    { id: 'bathroom-design-need', label: '卫生间协同问题', purpose: '确认需要共同判断的空间布局、产品选择、安装条件、预算或交付边界。', required: true, inputKind: 'longText', placeholder: '例如：主卫空间较窄，需确认智能马桶、浴室柜和淋浴区是否冲突，以及安装条件' },
    { id: 'project-material', label: '已有项目资料情况', purpose: '记录是否已有户型、平面图、照片、尺寸、坑距、水电排水或材料计划等经业主同意交接的资料。', required: false, inputKind: 'longText', placeholder: '例如：有平面图和现场照片；坑距与水电点位需量尺核对' },
    { id: 'partner-feedback-preference', label: '合作方结果反馈方式', purpose: '按双方与业主同意的范围同步承接进展，避免透露不应共享的报价或个人信息。', required: false, placeholder: '例如：只同步是否已联系、是否安排量尺和需要设计师配合的事项' },
  ],
  qualificationRules: ['项目在当前服务范围内，且业主本人愿意沟通或已明确同意由合作方介绍。', '客户能说明装修阶段和至少一个具体的卫生间空间、产品、安装、预算或时间问题。', '不因为合作方提供了联系人、发送了图纸或关系熟悉就自动判定为有效意向。'],
  followUpSteps: [
    { timing: '首次承接当日', action: '人工确认业主同意沟通、项目区域、项目阶段、协同问题和已获得授权的资料，并说明还需要补充什么。', completionSignal: '客户已补充基本情况，或已记录未同意、超出服务范围、项目不匹配或暂不需要的原因。' },
    { timing: '信息完整后', action: '由人工区分可先判断和必须现场核对的条件，给出继续沟通、到店选样或量尺建议，并明确谁负责下一步。', completionSignal: '已形成明确预约或项目推进动作，或记录客户暂缓、条件不匹配的原因。' },
    { timing: '预约前一天', action: '人工与业主确认时间、地点、到店或量尺安排；仅在需要且已同意时与合作方确认配合事项。', completionSignal: '预约状态和项目交接责任已确认或重新安排。' },
    { timing: '到店/量尺后 24 小时内', action: '记录现场判断、方案或报价动作；在业主同意和职责边界内向合作方同步承接进展。', completionSignal: '已进入方案、报价、成交、暂缓或不再跟进中的一个明确状态。' },
  ],
  reviewMetrics: ['已确认真实协同边界的合作伙伴关系数', '业主本人同意沟通的项目转介咨询数', '补全基本项目资料并可人工推进的线索数', '有效到店/量尺预约数', '进入方案或报价的客户数', '最终成交、未推进原因、协同负向反馈和维护成本观察'],
  boundaries: ['不索取、购买、交换、批量导入或擅自使用合作伙伴的客户名单、图纸、照片、联系方式或项目资料。', '不绕开设计师、装修方或业主既有沟通安排，也不以虚构能力、低价承诺或隐蔽利益驱动不匹配转介。', '不在未获得业主同意时向合作方透露报价、联系方式、家庭情况或其他不应共享的个人信息。', '不自动私信、自动加微信、自动预约、自动发送合作消息或批量群发内容。', '不以合作伙伴数量、拜访次数、资料发送量或联系人数量单独判断打法有效，必须回收到合格线索、预约、方案、报价、成交、负向反馈和协同成本。'],
}

export const bathroomCommunityRenovationTactic: GrowthTacticPack = {
  id: BATHROOM_COMMUNITY_RENOVATION_TACTIC_ID,
  name: '卫浴老房改造 · 社区现场判断',
  version: '1.0',
  industryPackId: 'bathroom-industry-rules-v2',
  channelId: 'offline',
  description: '面向本地卫浴门店的社区活动路径：围绕老房卫生间真实的换新、排水、防潮、空间和安装问题开展现场判断，再由门店人工承接到店或量尺。它不靠抽奖、强制留资或泛人流凑数，也不承诺活动一定带来成交。',
  primaryGoal: '验证一个具体社区场景能否带来本人同意沟通、且愿意说明老房卫生间改造需求的本地线索，并推动合适客户进入人工判断、到店或量尺。',
  customerProfile: ['本地老房业主，近期有卫生间换新、局部改造、维修后重新规划或适老改善需求', '愿意说明房屋大致区域、改造阶段、卫生间问题或关注产品的人', '本人同意现场登记或后续人工联系，并接受门店先确认服务范围与现场条件的人'],
  entryScenarios: ['社区内出现旧房卫生间换新、返味积水、潮湿发霉、空间拥挤、收纳不足或产品安装适配问题', '业主正在比较局部改造与整体翻新，想先判断是否需要量尺、到店选样或进一步核对条件', '社区允许在明确场地和时间内开展面向真实问题的咨询、样品说明或预约登记活动'],
  researchConstraints: ['活动立项前先确认社区范围、场地许可、可服务半径和业主真实问题来源；不能把房龄、住户名单或泛人流直接当成改造需求。', '每次活动只围绕一个主要卫生间场景，例如旧房换马桶、局部防潮换新或小空间布局判断，并准备对应的真实产品、现场条件说明和不适用边界。', '活动结果必须把发现、到场、现场服务、登记、预约、后续方案或报价、负向反馈和人力成本放回同一条链路，不以到场、扫码或表单数量单独下结论。'],
  contentConstraints: ['活动预告、现场说明和登记话术只讲清本次可帮助判断的具体问题、服务范围、现场安排和一个后续动作，不用泛“免费福利”吸引无关人流。', '涉及产品适配、改造效果、价格、工期、物业协调或施工条件时，只展示真实可证明材料，并明确最终以现场确认和实际服务范围为准。', '现场登记先说明用途，仅收集预约、后续人工判断所必需的信息；不导入小区住户名单，不因拒绝非必要信息而拒绝基础咨询。'],
  contentPromise: '让有老房卫生间改造需求的业主在现场先判断自己需要补充哪些条件、门店是否在服务范围内，以及下一步只需登记需求后由人工确认是否适合到店或量尺。',
  prePublishChecks: [
    '已确认活动场地、允许范围、时间、负责人和现场秩序安排；不以未经许可的摆点、入户或住户名单作为获客前提。',
    '本次只选择一个主要老房卫生间问题，并准备与之直接相关的样品、规格、现场判断清单或已授权案例材料；不把无法证明的效果、价格或工期写成承诺。',
    '已明确现场登记用途、最小必要字段、人工承接人和活动后跟进时间；客户可以只接受现场咨询，不被强制留下联系方式。',
    '现场流程、人员分工、资料保护和问题升级方式已准备好，避免把超出服务范围、施工安全或物业协调问题随意承诺。',
  ],
  channelExecutionSteps: [
    { timing: '活动立项前', action: '人工核对社区许可、服务半径、目标问题、场地条件和可投入的人力；先设定本轮要验证的社区场景与停止条件。', completionSignal: '活动计划已明确具体社区、单一问题、现场服务边界、负责人、来源编号和复盘时间。' },
    { timing: '活动现场', action: '先帮助业主判断实际问题与需要补充的现场条件；仅在本人愿意继续沟通时登记最小必要信息并关联活动来源，泛路过、扫码或抽奖参与不直接算线索。', completionSignal: '真实咨询已登记为线索，或已记录只咨询、未同意联系、超出范围或资料不足的原因。' },
    { timing: '活动结束后', action: '人工回填真实到场、登记、咨询、预约和现场问题，不用预计数字替代结果；优先处理已明确下一步的客户。', completionSignal: '现场记录和线索来源已完成核对，客户均有明确的下一步或未推进原因。' },
    { timing: '本轮预设复盘时点', action: '比较社区场景、现场服务、预约质量、方案或报价进展、负向反馈和人力成本，决定继续、调整或停止下一轮活动。', completionSignal: '已记录主指标、护栏指标、未推进原因和下一轮唯一调整变量。' },
  ],
  experimentPlan: {
    focus: '验证哪一种老房卫生间问题与社区现场服务形式，能带来本人同意沟通、并愿意补全改造需求的本地线索。',
    primaryMetric: '补全本打法包必填信息，并由人工确认可继续沟通的社区活动线索数。',
    guardrailMetrics: ['社区许可、现场秩序、客户隐私和咨询体验是否出现投诉、压力或负面反馈。', '到场、扫码或登记是否真正回收到有效问题、预约、方案或报价，而不是停在中间指标。', '门店人员、样品、交通、场地和后续承接投入是否在可承担范围内。'],
    oneVariableRule: '一轮只调整一个主要变量，例如社区选择、主问题、现场服务形式或主要行动引导；不要同时更换活动地点、样品、讲解、登记方式和后续承接。',
  },
  trafficPlan: {
    primaryMode: '同城线下触达',
    backupModes: [],
    defaultTestWindowDays: 7,
    successSignal: '7 天内记录本人同意联系、能说明具体改造问题的咨询，以及进入到店或量尺的数量；不以人流、扫码或到场量单独判断。',
    evidencePriorities: ['已确认的社区许可与现场安排', '与本轮问题对应的样品或判断清单', '最小必要的登记与后续承接说明'],
    firstExecutionGate: '先确认社区许可、人员、现场服务边界和登记用途，未具备这些条件不开始活动。',
  },
  callToAction: '现场登记老房卫生间的具体问题和大致区域；由门店人工确认服务范围与现场条件，再判断是否适合到店或量尺。',
  leadFields: [
    { id: 'community-context', label: '社区与现场咨询场景', purpose: '确认客户来自哪场已许可活动、在现场提出了什么真实问题，以及是否同意继续沟通。', required: true, inputKind: 'longText', placeholder: '例如：XX 社区周末咨询日；本人同意后续联系，想确认旧卫生间换马桶和浴室柜是否需要改水电' },
    { id: 'service-area', label: '房屋所在区域', purpose: '先确认是否在门店服务范围内；只记录判断服务所需的大致区域，不要求与咨询无关的详细地址。', required: true, placeholder: '例如：杭州拱墅区某社区附近' },
    { id: 'renovation-stage', label: '老房改造阶段', purpose: '判断客户是在收集信息、比较方案、准备开工还是已有明确时间窗口。', required: true, placeholder: '例如：准备局部翻新，计划下月施工' },
    { id: 'bathroom-need', label: '卫生间问题或改造需求', purpose: '确认客户要解决的空间、排水、防潮、安装、产品或使用问题，避免只记录“感兴趣”。', required: true, inputKind: 'longText', placeholder: '例如：卫生间返味且空间小，想了解换马桶、浴室柜和地漏是否需要大拆' },
    { id: 'site-material', label: '现场条件或资料情况', purpose: '记录客户是否有照片、尺寸、户型、坑距、水电、排水或物业限制等可供人工判断的资料。', required: false, inputKind: 'longText', placeholder: '例如：可提供卫生间照片；尺寸与排水情况需要上门确认' },
    { id: 'contact-window', label: '可联系时间', purpose: '安排人工后续沟通、到店或量尺，避免无差别打扰。', required: false, placeholder: '例如：周末上午方便沟通' },
  ],
  qualificationRules: ['活动在明确许可和服务范围内，新客户本人愿意继续沟通或已在现场明确同意登记。', '客户能说明老房改造阶段和至少一个具体卫生间问题、产品需求、预算考虑或时间窗口。', '不因为到场、扫码、领取物料、参加抽奖或只问活动优惠就自动判定为有效意向。'],
  followUpSteps: [
    { timing: '活动后约定时间内', action: '人工确认客户的沟通同意、服务区域、改造阶段、真实卫生间问题和现有资料，并说明还需要补充什么。', completionSignal: '客户已补充基本情况，或已记录未同意、超出服务范围、仅现场咨询或暂不需要的原因。' },
    { timing: '信息完整后', action: '由人工说明可以先判断与必须现场确认的条件，给出到店、量尺或继续沟通建议并确认可选时间。', completionSignal: '已形成明确预约或下一步，或记录客户暂缓、条件不匹配的原因。' },
    { timing: '预约前一天', action: '人工核对时间、地点、到店或量尺安排，以及需要准备的户型、照片、尺寸和关注问题。', completionSignal: '预约状态已确认或重新安排。' },
    { timing: '到店/量尺后 24 小时内', action: '记录实际需求、服务范围、方案或报价动作，并区分社区现场初步判断与最终现场确认。', completionSignal: '已进入方案、报价、成交、暂缓或不再跟进中的一个明确状态。' },
  ],
  reviewMetrics: ['已完成许可与准备检查的社区活动数', '活动现场提出具体卫生间问题的咨询数', '本人同意继续沟通且补全基本信息的线索数', '有效到店/量尺预约数', '进入方案或报价的客户数', '最终成交、未推进原因、投诉或负向反馈与活动服务成本观察'],
  boundaries: ['不未经许可进小区摆点、入户、拍摄或使用物业、邻里和第三方提供的住户名单。', '不强制扫码、登记、加微信、领取资料或参加抽奖，也不把拒绝提供非必要信息的人排除在基础咨询之外。', '不收集与现场判断和后续服务无关的详细住址、身份证明、家庭成员信息或其他个人资料。', '不自动私信、自动加微信、自动预约、自动群发或批量导入社区住户资料。', '不以人流、到场、扫码或登记数量单独判断活动有效，必须回收到合格线索、预约、方案、报价、成交、负向反馈和服务成本。'],
}

export const growthTacticPacks: GrowthTacticPack[] = [bathroomDouyinMeasurementTactic, bathroomXiaohongshuCaseTactic, bathroomReferralServiceExperienceTactic, bathroomDesignerPartnershipTactic, bathroomCommunityRenovationTactic]

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
    recommendedRelationType: pack.recommendedRelationType,
    primaryGoal: pack.primaryGoal,
    customerProfile: pack.customerProfile,
    entryScenarios: pack.entryScenarios,
    researchConstraints: pack.researchConstraints,
    contentConstraints: pack.contentConstraints,
    contentPromise: pack.contentPromise,
    prePublishChecks: pack.prePublishChecks,
    channelExecutionSteps: pack.channelExecutionSteps,
    experimentPlan: pack.experimentPlan,
    trafficPlan: pack.trafficPlan,
    callToAction: pack.callToAction,
    leadFields: pack.leadFields,
    qualificationRules: pack.qualificationRules,
    followUpSteps: pack.followUpSteps,
    reviewMetrics: pack.reviewMetrics,
    boundaries: pack.boundaries,
  }
}
