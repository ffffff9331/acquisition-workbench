import { bathroomIndustryRulePack } from './bathroom-content'
import type { IndustryRulePack } from './industry-rules'

export { buildIndustrySearchQuery } from './industry-rules'

const sharedOpportunityRules = (industryLabel: string): IndustryRulePack['opportunityRules'] => [
  { id: 'industryFit', label: '行业场景匹配', weight: 15, description: `是否对应明确的${industryLabel}产品、服务或使用场景。` },
  { id: 'decisionIntent', label: '客户决策信号', weight: 25, description: '是否出现量尺、比较、报价、排期或交付等真实决策信号。' },
  { id: 'evidence', label: '来源可追溯', weight: 20, description: '是否关联当前联网研究保存的真实来源。' },
  { id: 'proof', label: '商家能够证明', weight: 20, description: '商家是否有现场、产品、过程、案例或服务资料支撑。' },
  { id: 'conversion', label: '承接动作清楚', weight: 10, description: '内容是否能自然连接到咨询、到店、量尺或其他实际下一步。' },
  { id: 'risk', label: '事实与表达边界', weight: 10, description: '是否说明适用条件并避开绝对承诺。' },
]

const sharedSourceRules: IndustryRulePack['sourceRules'] = {
  prioritize: ['平台真实搜索结果与用户公开提问', '品牌、产品或材料的官方技术资料', '政府、行业协会和标准机构资料', '商家自己的真实测量、方案、交付与售后记录', '获得授权且信息完整的客户案例'],
  downgrade: ['没有说明现场条件的经验帖', '只展示结果、不解释过程的案例', '发布时间过久且可能已失效的价格或产品信息', '无法确认作者身份与原始出处的二次整理'],
  reject: ['与当前搜索问题无关的流量热词', '无法访问或无法核对原文的摘要', '伪造测评、虚构客户反馈或未授权案例', '把广告文案当成客观性能结论的来源'],
}

const sharedChannelRules = (input: {
  shortVideoProof: string
  xhsFormat: string
  offlineAction: string
  referralPartner: string
  bilibiliPath: string
}): IndustryRulePack['channelRules'] => [
  { channelId: 'douyin', focus: '用一个可见的现场问题和一个判断动作快速建立相关性。', required: ['开头对应真实搜索问题', input.shortVideoProof, '只设置一个清楚的咨询、到店或预约动作'], avoid: ['只念产品参数', '用夸张冲突替代真实问题', '自动发布或诱导批量私信'] },
  { channelId: 'xiaohongshu', focus: '用可收藏的决策信息、真实过程或空间判断帮助用户做选择。', required: ['封面使用真实产品或空间图加短文案，或直接使用标题封面', input.xhsFormat, '正文说明适用条件与取舍'], avoid: ['伪装用户体验', '堆砌无来源价格', '把效果图当成交付实拍'] },
  { channelId: 'wechat', focus: '围绕已有关系和近期真实业务进展，推动客户完成一个下一步。', required: ['说明真实服务场景或进度', '使用商家自己的实拍或工作资料', '承接动作与实际服务范围一致'], avoid: ['连续刷屏', '虚构订单或客户反馈', '在未同意时公开客户信息'] },
  { channelId: 'offline', focus: '把线上问题转成可执行的到店、现场咨询或诊断流程。', required: ['明确地区、时间、对象与登记方式', input.offlineAction, '活动后有负责人和跟进计划'], avoid: ['权益描述不完整', '现场收集不必要的个人信息', '用免费名义隐藏强制消费'] },
  { channelId: 'referral', focus: '让合作方清楚适合转介的客户、征得同意的方式和承接反馈。', required: ['明确理想客户与触发场景', input.referralPartner, '转介前取得客户同意并保护客户信息'], avoid: ['购买或滥用个人信息', '未经同意直接拉群', '只谈返利不说明客户价值'] },
  { channelId: 'bilibili', focus: '用完整案例、判断方法和过程证据解释复杂决策。', required: ['问题、条件、方案、取舍和验证形成完整链路', input.bilibiliPath, '引用资料可追溯，章节和画面支持理解'], avoid: ['拉长短视频稿充时长', '用单个案例证明普遍结论', '把品牌资料原样当测评'] },
]

export const WINDOWS_RULE_PACK_ID = 'windows-store-industry-rules-v1'
export const windowsIndustryRulePack: IndustryRulePack = {
  id: WINDOWS_RULE_PACK_ID,
  name: '门窗门店行业规则包',
  industry: '家装家居 · 门窗门店',
  version: '1.0',
  description: '为门窗选配、现场测量、安装交付和性能表达提供判断规则，不预设产品结论或固定选题。',
  taxonomy: {
    products: ['断桥铝窗', '系统窗', '推拉窗', '平开窗', '封阳台', '玻璃', '纱窗', '五金'],
    services: ['上门测量', '方案设计', '拆旧', '安装', '打胶', '验收', '维修', '售后'],
    scenarios: ['新房装修', '封阳台', '临街隔音', '高层防风雨', '旧窗更换', '儿童安全'],
  },
  searchDirections: [
    { id: 'environment-performance', label: '环境与性能', hint: '找噪声来源、朝向、楼层、风雨条件与使用需求之间的真实问题。', intent: '识别需要现场判断而非只看参数的客户', terms: ['临街隔音', '高层门窗', '防风雨', '保温', '窗户漏风'] },
    { id: 'configuration-choice', label: '配置选择', hint: '找型材、玻璃、五金、开启方式的差异与适用条件。', intent: '识别正在比较配置和预算的客户', terms: ['系统窗怎么选', '玻璃配置', '五金区别', '断桥铝', '开启方式'] },
    { id: 'measurement-opening', label: '测量与开启', hint: '找洞口尺寸、窗台、开启冲突、晾晒和安全限制。', intent: '识别需要预约测量或方案核对的客户', terms: ['门窗测量', '窗户尺寸', '开启冲突', '封阳台量尺', '儿童安全窗'] },
    { id: 'installation-sealing', label: '安装与密封', hint: '找拆旧、固定、填缝、打胶、排水和验收节点问题。', intent: '识别重视安装质量和交付过程的客户', terms: ['门窗安装验收', '窗户渗水', '密封胶', '拆旧安装', '排水孔'] },
    { id: 'quote-delivery', label: '报价与交付', hint: '找计价口径、增项、排期、质保和售后范围。', intent: '识别正在确认总价与交付边界的客户', terms: ['门窗报价怎么算', '门窗增项', '安装周期', '门窗质保', '售后范围'] },
  ],
  demandSignals: [
    { id: 'site-condition', label: '描述现场环境', buyerStage: '方案比较', priority: '高', keywords: ['临街', '高层', '西晒', '漏风', '渗水', '噪音'], meaning: '客户已给出具体使用环境，适合继续确认楼层、朝向、洞口和主要诉求。' },
    { id: 'measurement', label: '询问测量安装', buyerStage: '准备购买', priority: '高', keywords: ['量尺', '测量', '安装', '拆旧', '洞口', '什么时候上门'], meaning: '客户正在判断方案能否落地，通常接近预约现场服务。' },
    { id: 'configuration', label: '比较配置', buyerStage: '方案比较', priority: '高', keywords: ['几层玻璃', '型材', '壁厚', '五金', '系统窗', '断桥铝'], meaning: '客户进入配置取舍阶段，需要结合现场条件解释而非给统一答案。' },
    { id: 'quote', label: '确认完整报价', buyerStage: '准备购买', priority: '高', keywords: ['多少钱', '报价', '每平', '增项', '总价', '包含安装'], meaning: '客户在核对计价范围，应说明面积、配置、辅材、拆旧和安装口径。' },
    { id: 'schedule', label: '确认交付时间', buyerStage: '准备购买', priority: '中', keywords: ['多久', '排期', '工期', '什么时候装', '交付'], meaning: '客户有时间窗口，需要结合测量、下单、生产和现场条件核实。' },
  ],
  sourceRules: sharedSourceRules,
  opportunityRules: sharedOpportunityRules('门窗'),
  evidenceRules: [
    { id: 'dimensions', claimType: '尺寸与开启适配', triggerTerms: ['尺寸', '洞口', '开启', '能不能装', '封阳台'], requiredEvidence: ['现场尺寸', '测量单', '方案图', '物业要求'], missingAction: '补充真实测量和物业、结构限制；未测量前只给判断方法，不下最终结论。' },
    { id: 'specification', claimType: '型材玻璃五金配置', triggerTerms: ['型材', '壁厚', '玻璃', '五金', '断桥铝', '系统窗'], requiredEvidence: ['产品规格', '品牌型号', '检测资料', '配置单'], missingAction: '写明具体型号和配置来源，不用模糊等级代替可核对参数。' },
    { id: 'performance', claimType: '隔音保温等性能', triggerTerms: ['隔音', '静音', '保温', '节能', '防晒'], requiredEvidence: ['检测报告', '产品参数', '现场条件', '测试方法'], missingAction: '说明声源、安装和现场条件会影响结果，删除无法证明的确定性效果。' },
    { id: 'weatherproofing', claimType: '防风雨与密封安装', triggerTerms: ['防水', '不漏水', '抗风', '密封', '不漏风'], requiredEvidence: ['安装节点照片', '施工规范', '材料说明', '现场验收'], missingAction: '补充安装节点与适用条件，不承诺所有建筑和极端天气下结果一致。' },
    { id: 'price', claimType: '价格与报价范围', triggerTerms: ['价格', '多少钱', '每平', '总价', '增项'], requiredEvidence: ['报价单', '计价规则', '配置范围', '有效期'], missingAction: '写明面积算法、配置、辅材、拆旧、安装和有效期。' },
    { id: 'case', claimType: '案例前后效果', triggerTerms: ['改造前后', '客户家', '完工案例', '安装后'], requiredEvidence: ['前后照片', '交付记录', '现场条件', '客户授权'], missingAction: '补齐同一项目的真实过程、限制和授权，不能用样板图冒充客户交付。' },
  ],
  productionRules: ['先输入服务地区、主推配置、目标客户、真实服务范围和可提供证明，再开展搜索。', '选题必须来自当前真实搜索、咨询记录、测量记录或交付问题，不从规则词典直接拼标题。', '解释性能时先说明环境和现场条件，再说明配置与安装的作用。', '涉及报价必须列清配置、计价口径、拆旧、辅材、安装和有效期。', '把测量、方案、安装节点和验收过程作为主要证明，不用空泛品牌背书替代。', '每条内容只承接一个主要动作，并由人工完成最终发布和沟通。'],
  boundaries: ['隔音、保温、防风雨等效果受到建筑、洞口、玻璃配置、安装和环境共同影响。', '未完成现场测量和物业条件核对前，不给出最终可安装结论。', '价格和工期以确认后的配置、尺寸、排期与合同范围为准。', '高层、结构、外立面和消防相关事项需遵守物业及当地规定。', '案例与施工资料必须真实、获授权并保护客户隐私。'],
  prohibitedPhrases: ['百分之百隔音', '绝对不漏水', '永不漏风', '终身不用维修', '任何小区都能装', '全网最低价', '零风险封阳台', '保证按天完工'],
  channelRules: sharedChannelRules({ shortVideoProof: '展示测量、配置或安装节点等可见证明', xhsFormat: '用配置取舍、测量清单或真实安装过程组织正文', offlineAction: '测量、样品比较、方案确认和报价流程清楚', referralPartner: '说明设计师、物业服务或相关商家的合作边界', bilibiliPath: '呈现环境判断、配置选择、安装节点与验收过程' }),
}

export const CUSTOM_CABINET_RULE_PACK_ID = 'custom-cabinet-store-industry-rules-v1'
export const customCabinetIndustryRulePack: IndustryRulePack = {
  id: CUSTOM_CABINET_RULE_PACK_ID,
  name: '定制柜门店行业规则包',
  industry: '家装家居 · 定制柜门店',
  version: '1.0',
  description: '覆盖阳台柜、衣柜、橱柜等定制场景，约束量尺、材料、报价、效果图和交付表达。',
  taxonomy: {
    products: ['阳台柜', '衣柜', '橱柜', '玄关柜', '电视柜', '书柜', '榻榻米', '柜门', '五金'],
    services: ['上门量尺', '空间规划', '方案设计', '报价', '复尺', '生产', '安装', '售后'],
    scenarios: ['新房装修', '小户型收纳', '阳台改造', '旧房更新', '儿童房', '精装房升级'],
  },
  searchDirections: [
    { id: 'space-storage', label: '空间与收纳', hint: '找尺寸限制、收纳目标、开门动线和使用习惯冲突。', intent: '识别需要量尺和空间规划的客户', terms: ['小户型收纳', '定制柜布局', '柜门开启', '上门量尺', '空间利用'] },
    { id: 'material-hardware', label: '板材与五金', hint: '找板材、封边、柜门、铰链和抽屉配置的选择问题。', intent: '识别正在比较材料与预算的客户', terms: ['定制柜板材', '封边', '柜门材质', '五金怎么选', '铰链抽屉'] },
    { id: 'balcony-utilities', label: '阳台与水电', hint: '找洗衣机尺寸、上下水、插座、防晒防潮和检修空间。', intent: '识别阳台柜和洗衣区改造的现场需求', terms: ['阳台柜洗衣机', '阳台上下水', '插座位置', '阳台防潮', '洗衣区改造'] },
    { id: 'quote-additions', label: '报价与增项', hint: '找投影面积、展开面积、门板、五金和安装增项问题。', intent: '识别正在核算完整预算的客户', terms: ['定制柜报价', '投影面积', '展开面积', '五金增项', '安装费用'] },
    { id: 'production-installation', label: '生产与安装', hint: '找复尺、下单、生产周期、现场保护、收口和验收问题。', intent: '识别重视交付过程和工期的客户', terms: ['定制柜生产周期', '复尺', '安装收口', '柜子验收', '延期'] },
  ],
  demandSignals: [
    { id: 'dimensions', label: '提供空间尺寸', buyerStage: '方案比较', priority: '高', keywords: ['尺寸', '宽度', '高度', '深度', '户型图', '放得下'], meaning: '客户已进入具体空间判断，适合确认现场尺寸并预约量尺。' },
    { id: 'utilities', label: '询问水电设备适配', buyerStage: '方案比较', priority: '高', keywords: ['洗衣机', '烘干机', '上下水', '插座', '水电', '检修'], meaning: '客户有明确设备和现场限制，需要把柜体方案与水电条件一起核对。' },
    { id: 'material', label: '比较材料配置', buyerStage: '方案比较', priority: '高', keywords: ['板材', '封边', '五金', '柜门', '环保', '防潮'], meaning: '客户正在比较材料，应说明型号、等级、适用环境和证明来源。' },
    { id: 'quote', label: '询问完整计价', buyerStage: '准备购买', priority: '高', keywords: ['多少钱', '报价', '投影', '展开', '增项', '总价'], meaning: '客户在确认总预算，需要完整说明计价范围和可能变化项。' },
    { id: 'delivery', label: '确认生产安装', buyerStage: '准备购买', priority: '中', keywords: ['多久', '生产周期', '什么时候装', '复尺', '排期', '交付'], meaning: '客户有明确时间计划，需结合复尺、确认图纸和工厂排期核实。' },
  ],
  sourceRules: sharedSourceRules,
  opportunityRules: sharedOpportunityRules('定制柜'),
  evidenceRules: [
    { id: 'dimensions', claimType: '空间尺寸与适配', triggerTerms: ['尺寸', '放得下', '满墙', '做到顶', '严丝合缝'], requiredEvidence: ['现场尺寸', '复尺单', '户型图', '方案图'], missingAction: '补充真实量尺和误差处理方式，未复尺前不能承诺最终适配。' },
    { id: 'material', claimType: '板材与五金规格', triggerTerms: ['板材', '封边', '五金', '柜门', '铰链', '环保'], requiredEvidence: ['品牌型号', '材料说明', '检测报告', '配置清单'], missingAction: '写明具体材料和五金型号、等级及来源，不用模糊概念替代证据。' },
    { id: 'environment', claimType: '防潮防晒与使用环境', triggerTerms: ['防潮', '防水', '防晒', '不发霉', '阳台柜'], requiredEvidence: ['材料说明', '阳台环境', '遮阳条件', '使用维护要求'], missingAction: '说明阳台朝向、封闭情况和材料适用条件，删除永久防潮防晒承诺。' },
    { id: 'price', claimType: '报价与计价口径', triggerTerms: ['价格', '多少钱', '投影', '展开', '增项', '总价'], requiredEvidence: ['报价单', '计价口径', '配置范围', '有效期'], missingAction: '列清柜体、门板、五金、台面、运输、安装和其他可能增项。' },
    { id: 'render', claimType: '效果图与真实交付', triggerTerms: ['效果图', '设计图', '完工效果', '落地效果'], requiredEvidence: ['效果图标识', '完工照片', '交付记录', '客户授权'], missingAction: '显著区分效果图和实拍，未交付项目不得暗示已经真实落地。' },
    { id: 'case', claimType: '客户案例', triggerTerms: ['客户家', '真实案例', '安装现场', '完工案例'], requiredEvidence: ['客户授权', '原始照片', '方案记录', '交付记录'], missingAction: '核实案例与授权并保护隐私，不借用网络图片冒充本店交付。' },
  ],
  productionRules: ['先输入主营定制品类、服务地区、目标户型、真实材料配置、交付能力和可用案例。', '选题来自当前搜索、真实咨询、量尺、设计修改或安装售后记录，不内置固定标题。', '空间建议必须同时考虑尺寸、动线、设备、水电和检修，不只追求视觉填满。', '涉及材料和环保时使用可核对型号、等级与检测资料，不做概念性承诺。', '报价内容必须解释计价方式、包含范围和可能增项。', '效果图、样板间和客户实拍必须明确标识，不能互相冒充。'],
  boundaries: ['最终尺寸、方案和报价以现场复尺及客户确认图纸为准。', '阳台柜适用性受到日晒、雨水、封窗、水电和设备散热条件影响。', '材料环保、防潮和耐用表述必须对应具体型号、等级、检测与使用条件。', '生产和安装日期需在图纸、配置及订单确认后核实。', '案例、户型图和客户信息必须获得授权并保护隐私。'],
  prohibitedPhrases: ['零甲醛', '百分之百环保', '永久防潮', '永不变形', '任何空间都能做', '保证零增项', '效果图百分百落地', '保证按天交付'],
  channelRules: sharedChannelRules({ shortVideoProof: '展示量尺、空间推演、材料样品或安装收口等可见证明', xhsFormat: '用收纳动线、材料取舍、报价拆解或真实落地过程组织正文', offlineAction: '样品比较、量尺预约、方案确认和报价边界清楚', referralPartner: '说明设计师、装修公司、家电或物业相关合作的承接边界', bilibiliPath: '呈现需求梳理、尺寸推演、材料选择、生产安装与验收过程' }),
}

export const RENOVATION_COMPANY_RULE_PACK_ID = 'renovation-company-industry-rules-v1'
export const renovationCompanyIndustryRulePack: IndustryRulePack = {
  id: RENOVATION_COMPANY_RULE_PACK_ID,
  name: '装修公司行业规则包',
  industry: '家装家居 · 装修公司',
  version: '1.0',
  description: '面向量房、设计、预算、施工和验收等服务过程，重点约束报价、工期、案例与工艺证明。',
  taxonomy: {
    products: ['主材', '辅材', '设计方案', '预算清单', '施工图', '验收记录'],
    services: ['量房', '设计', '预算', '施工', '项目管理', '验收', '局部改造', '旧房翻新', '售后'],
    scenarios: ['新房装修', '旧房翻新', '局部改造', '小户型', '精装房改造', '适老改造'],
  },
  searchDirections: [
    { id: 'layout-tradeoffs', label: '户型与方案', hint: '找家庭需求、户型限制、动线和方案取舍中的真实问题。', intent: '识别需要量房和方案沟通的客户', terms: ['户型改造', '装修布局', '小户型动线', '适老改造', '量房设计'] },
    { id: 'budget-scope', label: '预算与增项', hint: '找报价项目、主辅材、计价口径、漏项和变更问题。', intent: '识别正在比较公司和核对预算的客户', terms: ['装修报价', '装修增项', '预算清单', '半包全包', '主材辅材'] },
    { id: 'process-acceptance', label: '工艺与验收', hint: '找水电、泥木、油漆、防水和阶段验收节点。', intent: '识别重视施工透明度和质量判断的客户', terms: ['装修工艺', '水电验收', '防水验收', '施工节点', '竣工验收'] },
    { id: 'timeline-management', label: '工期与管理', hint: '找排期、交叉施工、现场管理、延期和沟通机制。', intent: '识别正在确认交付能力的客户', terms: ['装修工期', '施工排期', '项目经理', '装修延期', '现场管理'] },
    { id: 'old-home-hidden', label: '旧房与隐蔽工程', hint: '找拆除、结构、水电老化、防水和现场不可预见问题。', intent: '识别需要现场勘察和风险说明的旧改客户', terms: ['旧房翻新', '老房水电改造', '拆除注意', '隐蔽工程', '局部改造'] },
  ],
  demandSignals: [
    { id: 'floor-plan', label: '提供户型与需求', buyerStage: '方案比较', priority: '高', keywords: ['户型图', '面积', '几室', '怎么改', '家庭成员', '量房'], meaning: '客户已进入具体方案阶段，适合继续确认居住需求、预算和现场条件。' },
    { id: 'budget', label: '确认预算报价', buyerStage: '准备购买', priority: '高', keywords: ['预算', '报价', '多少钱', '全包', '半包', '增项'], meaning: '客户正在比较服务范围，需要提供可核对的项目、数量、材料和边界。' },
    { id: 'process', label: '询问工艺验收', buyerStage: '方案比较', priority: '高', keywords: ['工艺', '水电', '防水', '验收', '施工标准', '材料'], meaning: '客户重视质量与过程透明，应以真实工地和验收资料回应。' },
    { id: 'timeline', label: '询问工期排期', buyerStage: '准备购买', priority: '高', keywords: ['多久', '工期', '什么时候开工', '排期', '延期', '入住'], meaning: '客户有明确时间窗口，但工期需基于范围、现场和供应条件确认。' },
    { id: 'old-home-risk', label: '描述旧房问题', buyerStage: '问题认知', priority: '中', keywords: ['旧房', '老房', '漏水', '水电老化', '墙体', '拆除'], meaning: '客户有明确改造痛点，需要先勘察隐蔽工程和结构边界。' },
  ],
  sourceRules: sharedSourceRules,
  opportunityRules: sharedOpportunityRules('装修服务'),
  evidenceRules: [
    { id: 'budget', claimType: '预算与报价范围', triggerTerms: ['预算', '报价', '多少钱', '全包', '半包', '增项'], requiredEvidence: ['预算清单', '工程量', '材料品牌型号', '包含与不包含范围'], missingAction: '补充项目、数量、单价、材料和边界；现场未确认前不得承诺固定总价。' },
    { id: 'process', claimType: '施工工艺', triggerTerms: ['工艺', '标准施工', '水电', '防水', '验收'], requiredEvidence: ['施工节点照片', '工艺说明', '验收记录', '适用标准'], missingAction: '用真实工地节点和可核对标准证明，不用口号代替施工记录。' },
    { id: 'timeline', claimType: '工期与完工时间', triggerTerms: ['工期', '多久完工', '按时交付', '延期', '入住'], requiredEvidence: ['项目范围', '施工计划', '供应排期', '现场条件'], missingAction: '说明工期起算条件、项目范围和可能影响因素，未确认前不给保证日期。' },
    { id: 'case', claimType: '改造案例', triggerTerms: ['改造前后', '业主家', '真实案例', '完工案例'], requiredEvidence: ['前后照片', '设计施工记录', '项目条件', '客户授权'], missingAction: '补齐同一项目的前后过程、预算范围与授权，不借用网络案例。' },
    { id: 'qualification', claimType: '人员与资质', triggerTerms: ['资深设计师', '专业施工队', '持证', '资质', '多年经验'], requiredEvidence: ['人员身份', '证书或资质', '项目记录', '有效期'], missingAction: '核实人员、证书与公司关系，不使用无法证明的资历背书。' },
    { id: 'warranty', claimType: '质保与售后', triggerTerms: ['质保', '终身售后', '免费维修', '保修'], requiredEvidence: ['合同条款', '质保范围', '期限', '响应条件'], missingAction: '写明项目、期限、责任边界和响应条件，不用无限责任承诺。' },
    { id: 'hidden-work', claimType: '隐蔽工程与现场风险', triggerTerms: ['隐蔽工程', '旧房', '拆除', '墙体', '水电老化'], requiredEvidence: ['现场勘察', '检测记录', '物业或结构资料', '变更记录'], missingAction: '说明需现场勘察，发现新增问题后按确认流程处理，不能远程下确定结论。' },
  ],
  productionRules: ['先输入服务地区、擅长项目、目标客户、预算区间、真实工地与服务边界，再开展联网研究。', '选题必须来自当前搜索、咨询、量房、方案修改、工地或售后记录，不内置固定题库。', '内容优先解释决策方法、项目边界和真实过程，不用装修焦虑制造虚假紧迫感。', '报价必须与项目范围、工程量、材料和现场条件绑定。', '工艺内容使用真实节点、人员责任和验收记录作为证明。', '每条内容只设置一个主要承接动作，发布和客户沟通均由人工确认。'],
  boundaries: ['方案、预算和工期以量房、现场勘察、确认图纸及合同范围为准。', '旧房隐蔽工程、结构和水电问题可能在拆除或检测后才能确认。', '材料、工艺、质保和人员资质表述必须有当前有效资料。', '效果图、样板间和完工实拍必须明确区分。', '客户案例、户型和施工现场资料必须获得授权并保护隐私。'],
  prohibitedPhrases: ['保证零增项', '绝对不超预算', '固定一口价包全部', '保证按天完工', '百分百还原效果图', '终身免费维修', '任何户型都能改', '全城最低价'],
  channelRules: sharedChannelRules({ shortVideoProof: '展示量房判断、施工节点、材料核对或验收等可见证明', xhsFormat: '用户型取舍、预算拆解、工艺节点或真实改造过程组织正文', offlineAction: '量房、需求梳理、方案沟通和预算边界清楚', referralPartner: '说明设计师、房产经纪、物业或建材商家的合作边界', bilibiliPath: '呈现需求、方案、预算、施工节点、变更与验收完整过程' }),
}

export const industryRulePacks: IndustryRulePack[] = [
  bathroomIndustryRulePack,
  windowsIndustryRulePack,
  customCabinetIndustryRulePack,
  renovationCompanyIndustryRulePack,
]

const packIds = new Map(industryRulePacks.flatMap((pack) => [pack.id, ...(pack.legacyIds || [])].map((id) => [id, pack.id] as const)))

export function normalizeIndustryPackId(value: unknown) {
  return typeof value === 'string' ? packIds.get(value) || '' : ''
}

export function industryRulePackById(value: unknown) {
  const id = normalizeIndustryPackId(value)
  return industryRulePacks.find((pack) => pack.id === id)
}
