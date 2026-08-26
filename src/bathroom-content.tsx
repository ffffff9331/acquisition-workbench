import { useState } from 'react'
import {
  ArrowRight,
  Camera,
  Check,
  CircleHelp,
  PackageCheck,
  PackageOpen,
  Ruler,
  ShieldCheck,
  Target,
} from 'lucide-react'
import { channelById, type ChannelId } from './channels'
import type { DouyinIdea } from './douyin'
import type { XiaohongshuIdea } from './xiaohongshu'
import type { WechatTask } from './wechat'
import type { OfflineTask } from './offline'
import type { ReferralRelation } from './referral'
import type { BilibiliIdea } from './bilibili'

export const BATHROOM_PACKAGE_ID = 'bathroom-industry-content-v1'

type BathroomChannelTemplate = {
  channelId: ChannelId
  title: string
  scenario: string
  customerProblem: string
  structure: string[]
  proofMaterials: string[]
  callToAction: string
}

export const bathroomContentPack = {
  id: BATHROOM_PACKAGE_ID,
  name: '卫浴行业内容包',
  industry: '家装家居 · 卫浴门店',
  version: '1.0',
  description: '把卫浴客户真正关心的尺寸、安装、排水、动线和交付问题，转换成六个渠道可直接继续制作的内容草稿。',
  contentPillars: [
    '尺寸与安装条件',
    '空间布局与动线',
    '用水、排水与防潮',
    '产品选择与适配',
    '收纳与清洁',
    '旧房改造',
    '适老与安全',
    '真实案例与交付过程',
  ],
  customerQuestions: [
    '坑距、排污方式和安装空间是否匹配？',
    '小卫生间应该先定布局，还是先买产品？',
    '水压是否适合花洒或智能产品？',
    '地漏、排水和返味问题应该怎么判断？',
    '浴室柜如何兼顾防潮、收纳和开门空间？',
    '旧房更换是否需要改水电或排污？',
    '价格是否包含安装、辅材和后续服务？',
  ],
  proofMaterials: [
    '现场尺寸与户型图',
    '坑距、管道和排水位置',
    '水压或排水测试',
    '产品细节与安装过程',
    '改造前后对比',
    '客户授权案例与使用反馈',
  ],
  boundaries: [
    '尺寸、安装和最终效果以真实现场条件为准',
    '价格需说明产品、安装和辅材的包含范围',
    '不使用“最低价”“最好”“永久不坏”等无法证明的表述',
    '客户案例、照片和反馈必须确认授权与来源',
    '不承诺百分之百防水、永不返味等绝对结果',
  ],
} as const

export const bathroomChannelTemplates: BathroomChannelTemplate[] = [
  {
    channelId: 'douyin',
    title: '小户型卫生间最容易买错的 3 个东西',
    scenario: '短视频避坑选题，用真实尺寸和安装条件换取有效咨询。',
    customerProblem: '空间小、产品多，客户容易只看外观和价格，忽略坑距、开门动线与安装空间。',
    structure: ['开头点出三个常见误区', '逐项展示尺寸或现场条件', '说明错误选择的后果', '给出下单前检查动作'],
    proofMaterials: ['卫生间现场尺寸', '马桶坑距', '浴室柜开门动线', '安装前后画面'],
    callToAction: '发送所在城市、卫生间尺寸和现场照片，先判断安装条件。',
  },
  {
    channelId: 'xiaohongshu',
    title: '5㎡卫生间改造前后：不是买小，而是先定动线',
    scenario: '真实案例笔记，用空间判断过程建立信任，不做产品参数堆砌。',
    customerProblem: '客户以为小户型只能买更小的产品，却不知道布局和开门方向才是核心限制。',
    structure: ['原始空间问题', '尺寸与动线判断', '方案取舍', '落地结果', '适用条件与边界'],
    proofMaterials: ['真实空间产品图', '原始尺寸图', '方案对比图', '落地照片'],
    callToAction: '发送户型、尺寸和装修阶段，领取安装条件检查清单。',
  },
  {
    channelId: 'wechat',
    title: '本周量尺案例：同样 5㎡，先解决动线再选产品',
    scenario: '朋友圈触达近期咨询和正在装修的客户，用一条真实案例推动下一步。',
    customerProblem: '已经咨询或量尺的客户迟迟不行动，需要看到与自己相似的现场和清晰判断。',
    structure: ['一句话说明现场问题', '展示尺寸与方案对比', '解释为什么这样取舍', '邀请提供现场信息'],
    proofMaterials: ['现场尺寸图', '方案对比', '产品与安装细节', '落地照片'],
    callToAction: '把卫生间照片和尺寸发来，先确认是否需要到店看样或现场量尺。',
  },
  {
    channelId: 'offline',
    title: '老房卫生间安全与收纳诊断日',
    scenario: '面向老小区的轻咨询活动，以现场问题诊断换取预约与后续量尺。',
    customerProblem: '老房家庭面临湿滑、返味、收纳不足和局部老化，但不确定要不要整体翻新。',
    structure: ['现场照片与尺寸登记', '排水返味问题初筛', '适老安全检查', '局部更新建议', '预约后续量尺'],
    proofMaterials: ['检查表', '案例前后对比', '常见问题样品', '预约登记表'],
    callToAction: '带现场照片和大致尺寸，预约 15 分钟卫生间诊断。',
  },
  {
    channelId: 'referral',
    title: '设计师 / 工长合作推荐',
    scenario: '在客户进入卫浴选品或现场条件确认阶段时，由可信合作方完成合规转介。',
    customerProblem: '合作方遇到卫浴选品与安装条件问题，但缺少稳定、可反馈的承接人。',
    structure: ['确认适合推荐的客户', '先征得客户同意', '介绍双方联系', '及时反馈承接结果', '持续维护合作关系'],
    proofMaterials: ['服务区域', '量尺与方案流程', '真实交付案例', '售后边界说明'],
    callToAction: '合作方先征得客户同意，再介绍双方联系并说明现场情况。',
  },
  {
    channelId: 'bilibili',
    title: '从量房到安装，完整拆解一个小卫生间方案',
    scenario: '中长视频案例拆解，让观众掌握尺寸、动线、排水和维护四项判断方法。',
    customerProblem: '客户能看到大量好看的效果图，却不会判断方案能否在自己的现场真正落地。',
    structure: ['原始问题', '现场条件', '方案取舍', '安装过程', '交付验收', '适用边界'],
    proofMaterials: ['量房数据', '方案对比', '安装过程', '验收结果', '使用反馈'],
    callToAction: '发送户型、尺寸和装修阶段，先做一次安装条件判断。',
  },
]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`
}

function createSourceCode() {
  return `REF-${todayISO().replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`
}

export type BathroomPackDraft =
  | { channelId: 'douyin'; item: DouyinIdea }
  | { channelId: 'xiaohongshu'; item: XiaohongshuIdea }
  | { channelId: 'wechat'; item: WechatTask }
  | { channelId: 'offline'; item: OfflineTask }
  | { channelId: 'referral'; item: ReferralRelation }
  | { channelId: 'bilibili'; item: BilibiliIdea }

export function createBathroomPackDraft(channelId: ChannelId, referralName = ''): BathroomPackDraft | null {
  const createdAt = todayISO()
  const template = bathroomChannelTemplates.find((item) => item.channelId === channelId)
  if (!template) return null

  if (channelId === 'douyin') {
    return { channelId, item: { id: createId('dy-idea-bathroom'), contentPackageId: BATHROOM_PACKAGE_ID, title: template.title, customerProblem: template.customerProblem, contentDirection: '尺寸与安装条件避坑 · 用真实现场证明', targetAction: template.callToAction, sourceType: '手工', tags: '卫浴,小户型,装修避坑,尺寸', status: '待判断', createdAt } }
  }
  if (channelId === 'xiaohongshu') {
    return { channelId, item: { id: createId('xhs-idea-bathroom'), contentPackageId: BATHROOM_PACKAGE_ID, title: template.title, customerProblem: template.customerProblem, contentDirection: `封面：真实空间产品图 + “5㎡先定动线”\n正文：${template.structure.join(' → ')}`, targetAction: template.callToAction, sourceType: '手工', tags: '卫浴改造,小户型卫生间,装修避坑,收纳动线', status: '待判断', createdAt } }
  }
  if (channelId === 'wechat') {
    return { channelId, item: { id: createId('wx-task-bathroom'), contentPackageId: BATHROOM_PACKAGE_ID, actionType: '朋友圈触达', title: template.title, goal: '推动近期咨询或已量尺客户提供现场信息并确认下一步', audience: '近期咨询、装修中的客户、已量尺未定方案客户', opening: '同样是 5㎡卫生间，真正影响使用感受的往往不是产品大小，而是动线。', contentBody: '这周量尺时遇到一个典型小卫生间：原方案只想着把产品买小，却忽略了开门、使用和清洁空间。我们先按现场尺寸调整动线，再确定产品规格。尺寸接近的空间，也要根据坑距、管道和使用习惯分别判断。', callToAction: template.callToAction, assetChecklist: template.proofMaterials.join('、'), owner: '', plannedAt: '', status: '准备中', checklist: { audienceReady: true, contentReady: true, materialsReady: false, ctaReady: true, scopeChecked: false, executionChecked: false }, createdAt } }
  }
  if (channelId === 'offline') {
    return { channelId, item: { id: createId('offline-task-bathroom'), contentPackageId: BATHROOM_PACKAGE_ID, activityType: '社区活动', title: template.title, goal: '获得真实老房卫生间问题登记与后续量尺预约', audience: '服务区域内有卫生间老化、返味、湿滑或收纳问题的家庭', location: '', startAt: '', endAt: '', owner: '', staffPlan: '1 人负责问题登记，1 人负责案例与方案讲解，1 人负责预约确认', materialChecklist: template.proofMaterials.join('、'), onSiteProcess: template.structure.join(' → '), registrationMethod: '登记称呼、联系方式、小区、卫生间照片或大致尺寸，并获得客户同意', callToAction: template.callToAction, followUpPlan: '活动后 24 小时内按问题类型回访，确认到店看样或上门量尺', status: '策划中', checklist: { scheduleReady: false, staffReady: false, materialsReady: false, processReady: true, registrationReady: true, followUpReady: true }, createdAt } }
  }
  if (channelId === 'referral') {
    const name = referralName.trim()
    if (!name) return null
    return { channelId, item: { id: createId('ref-relation-bathroom'), contentPackageId: BATHROOM_PACKAGE_ID, relationType: '合作伙伴推荐', name, organization: '', contact: '', relationshipBasis: '对方服务的客户可能进入卫浴选品、安装条件确认或旧房更新阶段', referralScenario: '客户需要确认坑距、尺寸、排水、水压、布局或预约到店看样与现场量尺时', idealCustomer: '服务区域内，有明确装修或更新计划，愿意提供尺寸、现场照片或预约量尺的客户', cooperationValue: '提供清晰的现场判断、选品建议、进度反馈与交付边界，减少合作方协调成本', introductionMessage: '我认识一位做卫浴方案和安装条件确认的服务人员，可以先帮你看看现场尺寸和照片。你同意的话，我把你们互相介绍。', handoffMethod: template.callToAction, feedbackPlan: '收到推荐后及时确认是否联系；关键节点向合作方反馈，但不泄露客户隐私和敏感信息', owner: '', nextAction: '联系合作方，确认推荐场景和客户交接方式', nextDate: '', status: '待联系', checklist: { relationshipConfirmed: false, referralScenarioReady: true, idealCustomerReady: true, introductionReady: true, handoffReady: true, feedbackReady: true }, sourceCode: createSourceCode(), createdAt } }
  }
  return { channelId: 'bilibili', item: { id: createId('bili-idea-bathroom'), contentPackageId: BATHROOM_PACKAGE_ID, title: template.title, audienceQuestion: '如何判断一个卫生间方案不只是看起来好看，而是真的能安装、好使用、易维护？', viewerGain: '看完能用尺寸、动线、排水和维护四项检查自己的方案', proofMaterial: template.proofMaterials.join('、'), seriesName: '真实卫浴方案拆解', targetAction: template.callToAction, sourceType: '手工', tags: '卫生间改造,卫浴选购,装修避坑,小户型', status: '待判断', createdAt } }
}

type BathroomContentPackPanelProps = {
  installed: boolean
  enabledChannels: ChannelId[]
  appliedChannels: ChannelId[]
  onInstall: () => void
  onSelectChannel: (channelId: ChannelId) => void
  onApply: (channelId: ChannelId, referralName?: string) => void
}

export function BathroomContentPackPanel({ installed, enabledChannels, appliedChannels, onInstall, onSelectChannel, onApply }: BathroomContentPackPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | ChannelId>('overview')
  const [referralName, setReferralName] = useState('')
  const template = activeTab === 'overview' ? null : bathroomChannelTemplates.find((item) => item.channelId === activeTab) || null

  return <section className="industry-pack-section">
    <div className="industry-pack-heading">
      <div className="industry-pack-title">
        <span><PackageOpen size={20} /></span>
        <div><h2>行业内容包</h2><p>安装内容包不会启用任何渠道；只为你选择的渠道补充行业内容与业务规则。</p></div>
      </div>
      <span className={`package-state ${installed ? 'installed' : ''}`}>{installed ? <><PackageCheck size={14} />已安装</> : '可预览'}</span>
    </div>

    <div className="industry-pack-summary">
      <div><strong>{bathroomContentPack.name}</strong><span>{bathroomContentPack.industry}</span><p>{bathroomContentPack.description}</p></div>
      <div className="industry-pack-stats"><span><b>8</b>内容方向</span><span><b>6</b>渠道适配</span><span><b>5</b>表达边界</span></div>
      {installed ? <button className="button button-secondary" type="button" disabled><Check size={15} />已安装</button> : <button className="button button-primary" type="button" onClick={onInstall}><PackageOpen size={15} />安装内容包</button>}
    </div>

    <div className="industry-pack-tabs" role="tablist" aria-label="卫浴内容包预览">
      <button className={activeTab === 'overview' ? 'active' : ''} type="button" onClick={() => setActiveTab('overview')}>内容总览</button>
      {bathroomChannelTemplates.map((item) => { const channel = channelById(item.channelId); return <button key={item.channelId} className={activeTab === item.channelId ? 'active' : ''} type="button" onClick={() => setActiveTab(item.channelId)}><span className={`mini-channel-icon ${item.channelId}`}>{channel.icon}</span>{channel.shortLabel}{appliedChannels.includes(item.channelId) && <Check size={12} />}</button> })}
    </div>

    {activeTab === 'overview' ? <div className="industry-pack-overview">
      <div className="industry-pack-column"><div className="industry-pack-column-head"><CircleHelp size={18} /><div><h3>客户问题库</h3><p>内容从客户决策问题出发，而不是从产品参数出发。</p></div></div><ul>{bathroomContentPack.customerQuestions.map((item) => <li key={item}>{item}</li>)}</ul></div>
      <div className="industry-pack-column"><div className="industry-pack-column-head"><Target size={18} /><div><h3>内容方向</h3><p>六个渠道共享同一套行业认知。</p></div></div><div className="industry-topic-list">{bathroomContentPack.contentPillars.map((item) => <span key={item}>{item}</span>)}</div></div>
      <div className="industry-pack-column"><div className="industry-pack-column-head"><Camera size={18} /><div><h3>可信证明</h3><p>发布前先确认能拿出什么真实材料。</p></div></div><ul>{bathroomContentPack.proofMaterials.map((item) => <li key={item}>{item}</li>)}</ul></div>
      <div className="industry-pack-column"><div className="industry-pack-column-head"><ShieldCheck size={18} /><div><h3>表达边界</h3><p>减少夸大承诺、案例侵权和价格误解。</p></div></div><ul>{bathroomContentPack.boundaries.map((item) => <li key={item}>{item}</li>)}</ul></div>
    </div> : template ? <div className="industry-channel-preview">
      <div className="industry-channel-intro"><span className={`channel-icon ${template.channelId}`}>{channelById(template.channelId).icon}</span><div><h3>{template.title}</h3><p>{template.scenario}</p></div></div>
      <div className="industry-template-grid">
        <div><span>客户问题</span><p>{template.customerProblem}</p></div>
        <div><span>行动引导</span><p>{template.callToAction}</p></div>
        <div><span>内容结构</span><ol>{template.structure.map((item) => <li key={item}>{item}</li>)}</ol></div>
        <div><span>需要准备</span><ul>{template.proofMaterials.map((item) => <li key={item}>{item}</li>)}</ul></div>
      </div>
      {template.channelId === 'xiaohongshu' && <div className="industry-inline-note"><Ruler size={16} /><span>封面建议：使用真实空间产品图加“5㎡先定动线”，或直接用标题做封面。</span></div>}
      {template.channelId === 'referral' && installed && enabledChannels.includes('referral') && !appliedChannels.includes('referral') && <label className="industry-referral-field"><span>推荐人 / 合作方称呼</span><input value={referralName} onChange={(event) => setReferralName(event.target.value)} placeholder="例如：李设计师 / 王工长" /></label>}
      <div className="industry-apply-bar">
        <small>{!installed ? '先安装内容包，再选择要应用的渠道。' : !enabledChannels.includes(template.channelId) ? `当前还没有启用${channelById(template.channelId).shortLabel}，可以前往上方完成启用。` : appliedChannels.includes(template.channelId) ? '这份演示草稿已经进入对应渠道，可到渠道工作区继续编辑。' : '只在本机添加一份可编辑草稿，不会自动发布、群发、抓取平台数据或联系任何人。'}</small>
        {!installed ? <button className="button button-primary" type="button" onClick={onInstall}>安装后使用<PackageOpen size={15} /></button> : !enabledChannels.includes(template.channelId) ? <button className="button button-secondary" type="button" onClick={() => onSelectChannel(template.channelId)}>前往启用{channelById(template.channelId).shortLabel}<ArrowRight size={15} /></button> : appliedChannels.includes(template.channelId) ? <button className="button button-secondary" type="button" disabled><Check size={15} />已添加草稿</button> : <button className="button button-primary" type="button" disabled={template.channelId === 'referral' && !referralName.trim()} onClick={() => onApply(template.channelId, referralName)}>添加到{channelById(template.channelId).shortLabel}<ArrowRight size={15} /></button>}
      </div>
    </div> : null}
  </section>
}
