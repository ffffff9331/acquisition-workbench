import { useState } from 'react'
import { Check, CircleHelp, FileCheck2, PackageCheck, PackageOpen, Search, ShieldCheck, Target } from 'lucide-react'
import { channelById, type ChannelId } from './channels'
import type { IndustryRulePack } from './industry-rules'

export const BATHROOM_RULE_PACK_ID = 'bathroom-industry-rules-v2'
export const LEGACY_BATHROOM_PACKAGE_ID = 'bathroom-industry-content-v1'

export const bathroomIndustryRulePack: IndustryRulePack = {
  id: BATHROOM_RULE_PACK_ID,
  legacyIds: [LEGACY_BATHROOM_PACKAGE_ID],
  name: '卫浴行业规则包',
  industry: '家装家居 · 卫浴门店',
  version: '2.0',
  description: '为联网搜索、机会筛选、证据核验和内容制作补充卫浴行业判断规则。它不会提供固定标题，也不会代替商家真实资料。',
  taxonomy: {
    products: ['马桶', '智能马桶', '浴室柜', '花洒', '淋浴房', '地漏', '龙头'],
    services: ['到店选购', '上门量尺', '安装', '更换', '局部改造', '售后'],
    scenarios: ['新房装修', '旧房翻新', '小户型', '适老改造', '精装房升级'],
  },
  searchDirections: [
    { id: 'installation-fit', label: '安装适配', hint: '找尺寸、坑距、水压、接口和安装条件中的真实问题。', intent: '识别临近选购或安装决策的高意向问题', terms: ['安装条件', '坑距', '水压', '尺寸不合适', '更换注意事项'] },
    { id: 'space-layout', label: '空间动线', hint: '找小空间布局、开门冲突、收纳和使用动线问题。', intent: '识别需要量尺、方案比较或空间诊断的需求', terms: ['卫生间布局', '小户型', '开门动线', '收纳', '量尺'] },
    { id: 'drainage-moisture', label: '排水防潮', hint: '找返味、积水、防潮、渗漏和清洁维护问题。', intent: '识别影响使用体验且需要专业判断的问题', terms: ['地漏返味', '排水慢', '浴室柜防潮', '积水', '清洁维护'] },
    { id: 'price-delivery', label: '价格交付', hint: '找报价包含项、安装辅材、工期和售后边界问题。', intent: '识别正在比价、确认交付范围或准备成交的需求', terms: ['价格包含安装吗', '安装辅材', '交付周期', '售后', '报价对比'] },
    { id: 'old-home-replacement', label: '旧房更换', hint: '找不大拆、水电排污适配和局部更新问题。', intent: '识别有明确旧房更新场景与上门服务需求的客户', terms: ['旧房卫生间更换', '局部改造', '不砸砖', '排污改造', '上门量尺'] },
  ],
  demandSignals: [
    { id: 'measurement', label: '主动询问尺寸', buyerStage: '方案比较', priority: '高', keywords: ['尺寸', '坑距', '宽度', '高度', '能不能装', '放得下吗'], meaning: '客户已把问题带入具体现场，适合引导提供尺寸或预约量尺。' },
    { id: 'installation', label: '确认安装条件', buyerStage: '准备购买', priority: '高', keywords: ['安装', '水压', '排污', '接口', '辅材', '拆旧'], meaning: '客户正在判断产品能否落地，通常接近选购或更换。' },
    { id: 'quote', label: '询问完整报价', buyerStage: '准备购买', priority: '高', keywords: ['多少钱', '报价', '包含什么', '安装费', '总价', '预算'], meaning: '客户在确认成本与交付范围，需要给出可核实的包含项。' },
    { id: 'schedule', label: '询问交付时间', buyerStage: '准备购买', priority: '高', keywords: ['多久', '工期', '什么时候装', '到货', '预约'], meaning: '客户存在明确时间窗口，适合确认地区、库存和服务排期。' },
    { id: 'comparison', label: '比较方案产品', buyerStage: '方案比较', priority: '中', keywords: ['怎么选', '区别', '对比', '哪种适合', '值不值得'], meaning: '客户需要决策标准，内容应解释取舍而不是直接给唯一答案。' },
    { id: 'problem-solving', label: '解决使用问题', buyerStage: '问题认知', priority: '中', keywords: ['返味', '积水', '发霉', '漏水', '不好清洁', '收纳不够'], meaning: '客户有明确痛点，但需先判断原因是否属于门店服务范围。' },
  ],
  sourceRules: {
    prioritize: ['平台真实搜索结果与用户公开提问', '品牌或产品官方技术资料', '政府、行业协会和标准机构资料', '商家自己的真实量尺、安装、交付与售后记录', '获得授权且信息完整的客户案例'],
    downgrade: ['没有说明现场条件的经验帖', '只展示结果、不解释过程的案例', '发布时间过久且可能已失效的价格或产品信息', '无法确认作者身份与原始出处的二次整理'],
    reject: ['与当前搜索问题无关的流量热词', '无法访问或无法核对原文的摘要', '伪造测评、虚构客户反馈或未授权案例', '把广告文案当成客观性能结论的来源'],
  },
  opportunityRules: [
    { id: 'industryFit', label: '行业场景匹配', weight: 15, description: '是否对应明确的卫浴产品、服务或使用场景。' },
    { id: 'decisionIntent', label: '客户决策信号', weight: 25, description: '是否出现尺寸、安装、报价、交期或方案比较等真实决策信号。' },
    { id: 'evidence', label: '来源可追溯', weight: 20, description: '是否关联当前联网研究保存的真实来源。' },
    { id: 'proof', label: '商家能够证明', weight: 20, description: '商家是否有现场、产品、过程、案例或服务资料支撑。' },
    { id: 'conversion', label: '承接动作清楚', weight: 10, description: '内容是否能自然连接到咨询、到店、量尺或其他实际下一步。' },
    { id: 'risk', label: '事实与表达边界', weight: 10, description: '是否说明适用条件并避开绝对承诺。' },
  ],
  evidenceRules: [
    { id: 'dimensions', claimType: '尺寸与安装适配', triggerTerms: ['尺寸', '坑距', '宽度', '高度', '放得下', '能安装'], requiredEvidence: ['现场尺寸', '户型图', '产品尺寸', '安装说明'], missingAction: '补充真实测量数据、产品规格或安装说明；无法确认时明确要求现场核实。' },
    { id: 'price', claimType: '价格与优惠', triggerTerms: ['价格', '多少钱', '优惠', '便宜', '预算', '总价'], requiredEvidence: ['报价单', '活动规则', '包含范围', '有效期'], missingAction: '写明产品、安装、辅材、地区与活动有效期，不使用无依据的最低价承诺。' },
    { id: 'before-after', claimType: '改造前后效果', triggerTerms: ['改造前后', '改造后', '升级后', '效果对比', '焕新'], requiredEvidence: ['改造前照片', '改造后照片', '现场条件', '客户授权'], missingAction: '补齐同一真实案例的前后素材、现场限制与使用授权。' },
    { id: 'performance', claimType: '性能与效果', triggerTerms: ['防潮', '防水', '不返味', '节水', '耐用', '抗菌', '静音'], requiredEvidence: ['官方参数', '检测报告', '适用条件', '现场测试'], missingAction: '引用可核对的技术资料并写清适用条件；删除无法证明的效果承诺。' },
    { id: 'customer-case', claimType: '客户案例与反馈', triggerTerms: ['客户说', '业主反馈', '真实案例', '客户家', '使用后'], requiredEvidence: ['客户授权', '原始记录', '交付记录', '真实照片'], missingAction: '确认案例来源与授权，隐藏个人敏感信息，不编造客户评价。' },
  ],
  productionRules: [
    '先使用商家当前主推产品、目标客户、服务地区、真实优势和承接动作，再决定内容角度。',
    '具体选题必须来自当前联网搜索、客户公开问题、商家真实咨询记录或真实交付记录。',
    '标题必须对应本次搜索证据和客户场景，不得直接把行业词典拼成通用标题。',
    '正文至少讲清客户问题、判断方法、适用条件、真实证明和一个主要下一步动作。',
    '涉及尺寸、价格、性能、案例和效果时，必须按证据规则补充材料或明确待核实。',
    '优先呈现取舍与判断过程，不把单一产品包装成适用于所有现场的标准答案。',
  ],
  boundaries: [
    '尺寸、安装方式与最终效果以真实产品资料和现场条件为准。',
    '价格需说明产品、安装、辅材、地区、时效和其他包含范围。',
    '客户案例、照片和反馈必须确认来源、授权并保护个人信息。',
    '涉及水电、排污、防水或结构改造时，需提示由具备条件的人员现场判断。',
    '行业规则只能帮助筛选和核验，不能代替真实搜索、专业检测或人工确认。',
  ],
  prohibitedPhrases: ['百分之百防水', '永不返味', '永久不坏', '全网最低价', '行业第一', '闭眼买', '任何户型都适合', '保证零风险'],
  channelRules: [
    { channelId: 'douyin', focus: '用一个可见现场问题和一个判断动作快速建立相关性。', required: ['开头对应真实搜索问题', '展示尺寸、产品或安装过程等可见证明', '一个清楚的咨询或量尺动作'], avoid: ['只念产品参数', '用夸张冲突替代真实问题', '自动发布或诱导批量私信'] },
    { channelId: 'xiaohongshu', focus: '用可收藏的决策清单、真实案例过程或空间判断帮助用户做选择。', required: ['封面优先使用真实产品或空间图加短文案，或直接使用标题封面', '正文说明适用条件与取舍', '案例图片获得授权'], avoid: ['伪装用户体验', '堆砌无来源价格', '把效果图当成交付实拍'] },
    { channelId: 'wechat', focus: '围绕已有关系和近期真实业务进展，推动客户完成一个下一步。', required: ['说明真实服务场景或进度', '使用商家自己的实拍资料', '承接动作与服务范围一致'], avoid: ['连续刷屏', '虚构订单或客户反馈', '在未同意时公开客户信息'] },
    { channelId: 'offline', focus: '把线上问题转成可执行的到店、社区咨询、量尺或诊断流程。', required: ['明确地区、时间、对象与登记方式', '现场流程和人员职责清楚', '活动后有跟进计划'], avoid: ['活动权益描述不完整', '现场收集不必要的个人信息', '用免费名义隐藏强制消费'] },
    { channelId: 'referral', focus: '让合作方清楚什么客户适合转介、如何征得同意以及如何反馈。', required: ['明确理想客户与触发场景', '转介前取得客户同意', '保护客户信息并反馈承接状态'], avoid: ['购买或滥用个人信息', '未经同意直接拉群', '只谈返利不说明客户价值'] },
    { channelId: 'bilibili', focus: '用完整案例、判断方法和过程证据解释复杂决策。', required: ['问题、条件、方案、取舍、验证形成完整链路', '引用资料可追溯', '章节和画面支持中长内容理解'], avoid: ['拉长短视频稿充时长', '用单个案例证明普遍结论', '把品牌资料原样当测评'] },
  ],
}

type BathroomIndustryRulePanelProps = {
  installed: boolean
  onInstall: () => void
}

export function BathroomIndustryRulePanel({ installed, onInstall }: BathroomIndustryRulePanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | ChannelId>('overview')
  const channelRule = activeTab === 'overview' ? null : bathroomIndustryRulePack.channelRules.find((item) => item.channelId === activeTab) || null

  return <section className="industry-pack-section">
    <div className="industry-pack-heading">
      <div className="industry-pack-title">
        <span><PackageOpen size={20} /></span>
        <div><h2>行业规则包</h2><p>为动态研究与内容制作增加行业判断，不提供固定标题，也不会自动启用任何渠道。</p></div>
      </div>
      <span className={`package-state ${installed ? 'installed' : ''}`}>{installed ? <><PackageCheck size={14} />规则已启用</> : '可预览'}</span>
    </div>

    <div className="industry-pack-summary">
      <div><strong>{bathroomIndustryRulePack.name}</strong><span>{bathroomIndustryRulePack.industry}</span><p>{bathroomIndustryRulePack.description}</p></div>
      <div className="industry-pack-stats"><span><b>{bathroomIndustryRulePack.searchDirections.length}</b>搜索方向</span><span><b>{bathroomIndustryRulePack.evidenceRules.length}</b>证据规则</span><span><b>{bathroomIndustryRulePack.channelRules.length}</b>渠道适配</span></div>
      {installed ? <button className="button button-secondary" type="button" disabled><Check size={15} />规则已启用</button> : <button className="button button-primary" type="button" onClick={onInstall}><PackageOpen size={15} />启用行业规则</button>}
    </div>

    <div className="industry-pack-tabs" role="tablist" aria-label="卫浴行业规则预览">
      <button className={activeTab === 'overview' ? 'active' : ''} type="button" onClick={() => setActiveTab('overview')}>规则总览</button>
      {bathroomIndustryRulePack.channelRules.map((item) => { const channel = channelById(item.channelId); return <button key={item.channelId} className={activeTab === item.channelId ? 'active' : ''} type="button" onClick={() => setActiveTab(item.channelId)}><span className={`mini-channel-icon ${item.channelId}`}>{channel.icon}</span>{channel.shortLabel}</button> })}
    </div>

    {activeTab === 'overview' ? <div className="industry-pack-overview">
      <div className="industry-pack-column"><div className="industry-pack-column-head"><CircleHelp size={18} /><div><h3>行业识别</h3><p>帮助搜索与模型理解当前产品、服务和使用场景。</p></div></div><div className="industry-topic-list">{[...bathroomIndustryRulePack.taxonomy.products, ...bathroomIndustryRulePack.taxonomy.services, ...bathroomIndustryRulePack.taxonomy.scenarios].map((item) => <span key={item}>{item}</span>)}</div></div>
      <div className="industry-pack-column"><div className="industry-pack-column-head"><Search size={18} /><div><h3>搜索与需求信号</h3><p>从客户实际输入出发扩词，再识别接近决策的问题。</p></div></div><ul>{bathroomIndustryRulePack.searchDirections.map((item) => <li key={item.id}><strong>{item.label}：</strong>{item.hint}</li>)}</ul></div>
      <div className="industry-pack-column"><div className="industry-pack-column-head"><FileCheck2 size={18} /><div><h3>证据与制作</h3><p>尺寸、价格、效果、性能和案例均需对应真实材料。</p></div></div><ul>{bathroomIndustryRulePack.productionRules.slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul></div>
      <div className="industry-pack-column"><div className="industry-pack-column-head"><ShieldCheck size={18} /><div><h3>表达边界</h3><p>缺少证据时必须提示补充，绝不能由模型编造。</p></div></div><ul>{bathroomIndustryRulePack.boundaries.map((item) => <li key={item}>{item}</li>)}</ul></div>
    </div> : channelRule ? <div className="industry-channel-preview">
      <div className="industry-channel-intro"><span className={`channel-icon ${channelRule.channelId}`}>{channelById(channelRule.channelId).icon}</span><div><h3>{channelById(channelRule.channelId).shortLabel}行业适配</h3><p>{channelRule.focus}</p></div></div>
      <div className="industry-template-grid">
        <div><span>制作时必须满足</span><ul>{channelRule.required.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div><span>需要避免</span><ul>{channelRule.avoid.map((item) => <li key={item}>{item}</li>)}</ul></div>
      </div>
      <div className="industry-inline-note"><Target size={16} /><span>这里展示的是约束规则。真正的标题和正文会结合商家资料、当前搜索来源和所选渠道动态生成。</span></div>
    </div> : null}
  </section>
}
