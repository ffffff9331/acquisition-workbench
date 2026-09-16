import React, { useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import '../../src/styles.css'
import { ContentProductionPanel, createContentTaskFromOpportunity, type ContentProductionData } from '../../src/content-production'
import type { GeneratedTopicCandidate, ResearchEvidence } from '../../src/topic-research'

const evidence: ResearchEvidence[] = [
  { id: 'fixture-source', query: '旧卫生间 智能马桶 尺寸', source: 'web', title: '小户型卫生间改造常见尺寸问题', url: 'https://example.com/source', summary: '来源讨论了坑距、电源位置、开门空间和返工风险。', publishedDate: '2026-08-20', discoveredAt: '2026-08-26T10:00:00+08:00' },
  { id: 'fixture-source-2', query: '智能马桶 安装 条件', source: 'xiaohongshu', title: '旧卫生间安装条件讨论', url: 'https://example.com/source-2', summary: '多位用户提到量错坑距和忽略插座位置会导致退换或改电。', publishedDate: '2026-08-18', discoveredAt: '2026-08-26T10:05:00+08:00' },
]

const opportunity: GeneratedTopicCandidate = {
  id: 'fixture-opportunity',
  title: '旧卫生间换智能马桶，先判断这 4 个尺寸',
  customerQuestion: '旧卫生间能不能直接换智能马桶？',
  targetCustomer: '准备翻新老房卫生间、担心买错尺寸的成都业主',
  buyerStage: '方案比较',
  demandSignal: '两个来源都出现坑距、电源位置和开门空间冲突问题。',
  contentAngle: '用现场量尺顺序讲清楚四个尺寸，并展示一组不能直接安装的反例。',
  keyPromise: '客户看完可以先完成一次基础自查，减少买后返工。',
  proofNeeded: '真实量尺画面、尺寸标注、安装前后案例；不要使用未授权客户信息。',
  callToAction: '私信户型和四个尺寸，预约免费初步判断。',
  leadMagnet: '旧卫生间智能马桶安装自查表',
  recommendedChannels: ['douyin', 'xiaohongshu'],
  trafficMode: '主动需求截流',
  testWindowDays: 14,
  successSignal: '14 天内记录有效咨询、资料补全和到店或量尺推进，不只看播放量。',
  campaignStatus: '已复盘',
  campaignOwner: '店长',
  campaignStartedAt: '2026-08-26T10:30',
  campaignEndsAt: '2026-09-09T10:30',
  campaignNote: '已人工发布并由店长承接咨询。',
  campaignReviewedAt: '2026-09-09T11:00',
  riskNote: '不同产品安装条件不同，不能承诺仅凭线上尺寸一定可以安装。',
  fitReason: '问题接近购买决策，且门店能用量尺和案例提供真实证明。',
  evidenceIds: evidence.map((item) => item.id),
  service: 'official',
  status: '已采用',
  adoptedChannels: ['douyin'],
  adoptions: [{ channelId: 'douyin', itemId: 'fixture-video-task', adoptedAt: '2026-08-26T10:12:00+08:00' }],
  reviewDecision: '调整后再试',
  createdAt: '2026-08-26T10:10:00+08:00',
}

window.workbenchDesktop = {
  isDesktop: true,
  ai: {
    getSecretStatus: async () => ({ officialTokenSaved: true, customApiKeySaved: false, secureStorageAvailable: true }),
    saveOfficialToken: async () => undefined,
    saveCustomApiKey: async () => undefined,
    clearSecret: async () => undefined,
    testCustomService: async () => ({ ok: true, message: '已连接到服务。' }),
    getOfficialServiceStatus: async () => ({ configured: true }),
    getCreditAccount: async () => ({ ok: true }),
    createRechargeOrder: async () => ({ ok: false, message: '预览不创建订单。' }),
    generateOfficial: async (input) => {
      window.contentProductionPreviewInputs ??= []
      window.contentProductionPreviewInputs.push(input)
      document.documentElement.dataset.lastAiTask = input.task
      document.documentElement.dataset.lastValidatedLearningCount = String(Array.isArray(input.payload.validatedLearnings) ? input.payload.validatedLearnings.length : 0)
      return input.task === 'content_review' ? ({
      ok: true,
      data: {
        requestId: 'fixture-content-review',
        output: {
          review: {
            score: 86,
            verdict: '修改后再确认',
            summary: '内容与老房卫生间业主的购买问题高度相关，步骤和素材安排具体；发布前仍需核对防水条件表述，并确保反例来自可公开案例。',
            dimensions: [
              { id: 'customerRelevance', score: 94, reason: '明确面向准备更换智能马桶、担心尺寸冲突的老房业主。' },
              { id: 'contentValue', score: 90, reason: '客户可以按四个位置完成初步自查。' },
              { id: 'evidenceSupport', score: 78, reason: '尺寸问题有来源支撑，但防水条件需要安装人员再次确认。' },
              { id: 'specificity', score: 92, reason: '量尺位置、常见冲突和画面安排都较具体。' },
              { id: 'channelFit', score: 85, reason: '开头进入问题较快，适合真人口播与现场演示。' },
              { id: 'conversionClarity', score: 84, reason: '主要承接动作是私信发送户型和尺寸。' },
              { id: 'executionReadiness', score: 82, reason: '四个镜头可执行，但真实反例需要确认授权。' },
            ],
            strengths: ['目标客户、问题和购买阶段一致。', '正文给出了可操作的量尺顺序。', '每个观点都有对应的实拍画面安排。'],
            issues: [
              { severity: '重要', location: '第二段与镜头 2', problem: '插座防水条件的表达可能被理解为统一标准。', suggestion: '由安装人员核对本地规范，并改为“具体位置和防水条件需现场确认”。', evidenceIds: ['fixture-source-2'] },
              { severity: '建议', location: '镜头 4', problem: '反例素材的授权状态没有写清。', suggestion: '只使用门店自有或已获得授权的匿名案例。', evidenceIds: ['fixture-source'] },
            ],
          },
        },
        usage: { pointsCharged: 8, balanceAfter: 1242 },
      },
    }) : input.task === 'content_revision' ? ({
      ok: true,
      data: {
        requestId: 'fixture-content-revision',
        output: {
          revision: {
            summary: '保留四步量尺结构，收紧防水条件表述，并把案例授权写进素材要求。',
            changes: ['把插座位置改成“具体位置和防水条件需现场确认”', '把镜头 4 改为仅使用门店自有或已授权案例', '让承接动作与“四个尺寸初步判断”直接衔接'],
            unresolved: ['发布前由安装人员核对本地安装规范', '确认镜头 4 使用的案例已经获得公开授权'],
            draft: {
              title: '旧卫生间换智能马桶，先核对这 4 个位置',
              hook: '旧卫生间换智能马桶，先别只看功能。现场这四个位置没核对清楚，型号再合适也可能装不了。',
              outline: ['量完成墙面到排污口中心的坑距', '现场确认电源位置和防水条件', '检查门扇、淋浴房和马桶盖冲突', '预留坐下、起身和清洁空间'],
              body: '第一，量坑距。量的是完成墙面到排污口中心，不是墙面到马桶边缘。\n\n第二，看电源。插座能不能使用，不能只看距离，具体位置和防水条件需要结合现场确认。\n\n第三，看开门和淋浴房。门扇、玻璃门、马桶盖打开以后是否冲突，要用现场尺寸实际核对。\n\n第四，看使用空间。纸面上能放下，还要确认坐下、起身和日常清洁是否方便。\n\n这四项只能帮助你做初步判断，具体型号仍要结合现场和产品安装要求复核。',
              callToAction: '私信发送户型图和这四个位置的尺寸，我们先帮你做一次初步判断。',
              coverCopy: '换智能马桶\n先核对这 4 处',
              visualPlan: ['镜头 1：实拍完成墙面到排污口中心的量尺过程', '镜头 2：实拍电源位置，并标注“防水条件需现场确认”', '镜头 3：现场演示门扇、玻璃门和马桶盖可能发生的冲突', '镜头 4：使用门店自有或已授权匿名案例，标注“线上只能初判”'],
              titleOptions: ['旧卫生间换智能马桶，先核对这 4 个位置', '小卫生间买智能马桶，最容易漏掉这 4 个尺寸', '别先看功能，换智能马桶先核对这 4 处', '智能马桶能不能装，先看这 4 个现场条件', '不到 4 平的卫生间，买智能马桶前先量这里'],
              hookOptions: ['先别急着看功能，旧卫生间换智能马桶，先量这 4 个位置。', '很多人不是买错型号，而是下单前漏量了这 4 个现场条件。', '你家卫生间能不能装，不看品牌，先看这 4 个尺寸和空间冲突。'],
              pinnedComment: '不确定自家能不能装，评论区或私信发“尺寸”，先把城市、坑距和现场照片发来。',
              directMessageReply: '你好，先发所在城市、坑距、卫生间平面或现场照片，我按实际情况帮你做初步判断；最终安装条件仍需现场确认。',
              claimChecks: [
                { statement: '具体位置和防水条件需要现场确认', evidenceId: 'fixture-source-2', risk: '发布前由安装人员核对表达。' },
                { statement: '四个位置只能用于初步判断', evidenceId: 'fixture-source', risk: '不能承诺线上判断等同于现场安装结论。' },
              ],
            },
          },
        },
        usage: { pointsCharged: 12, balanceAfter: 1230 },
      },
    }) : input.task === 'content_learning' ? ({
      ok: true,
      data: {
        requestId: 'fixture-content-learning',
        output: {
          learning: {
            summary: '本轮已经产生咨询和有效线索，说明具体量尺步骤值得继续验证；尚无成交，不能判断标题或承接动作已经稳定有效。',
            keepRules: ['保留“四个位置逐项判断”的具体结构', '继续使用真实量尺画面对应正文观点'],
            changeRules: ['下一轮只调整开头，直接说明“先判断能不能装”', '承接动作继续收集户型和尺寸，但记录无效咨询原因'],
            avoidRules: ['避免把插座和防水条件说成所有现场统一适用的标准', '不使用授权状态不清楚的客户案例'],
            nextGenerationRules: ['抖音正文必须提供至少三个可现场执行的判断步骤', '每个判断步骤必须安排对应的真实画面', '承接动作只要求发送户型图和关键尺寸'],
            caveats: ['当前只有一次本地执行结果，不能外推为卫浴行业规律', '尚未产生成交，无法判断咨询质量能否稳定转化'],
          },
        },
        usage: { pointsCharged: 10, balanceAfter: 1220 },
      },
    }) : ({
      ok: true,
      data: {
        requestId: 'fixture-content-generation',
        output: {
          draft: {
            title: '旧卫生间换智能马桶，先量这 4 个位置',
            titleOptions: ['旧卫生间换智能马桶，先量这 4 个位置', '小卫生间买智能马桶，最容易漏掉这 4 个尺寸', '别先看功能，换智能马桶先核对这 4 处', '智能马桶能不能装，先看这 4 个现场条件', '不到 4 平的卫生间，买智能马桶前先量这里'],
            hook: '先别急着看功能。旧卫生间换智能马桶，尺寸错一处，都可能多花一笔返工钱。',
            hookOptions: ['先别急着看功能，旧卫生间换智能马桶，先量这 4 个位置。', '很多人不是买错型号，而是下单前漏量了这 4 个现场条件。', '你家卫生间能不能装，不看品牌，先看这 4 个尺寸和空间冲突。'],
            outline: ['先量墙面到排污口中心的坑距', '再看插座位置与防水条件', '确认开门、淋浴房和腿部空间', '用真实反例说明为什么需要现场复核'],
            body: '第一，量坑距。不是量墙到马桶边缘，而是量完成墙面到排污口中心。\n\n第二，看电源。插座不仅要够得到，还要确认位置不会被水直接喷溅。\n\n第三，看开门和淋浴房。小卫生间最容易忽略的是门扇、玻璃门和马桶盖打开后的冲突。\n\n第四，留出使用空间。纸面尺寸能放下，不代表坐下、起身和清洁都方便。\n\n这四项只能做初步判断，具体型号仍要结合现场和产品安装要求复核。',
            callToAction: '私信发送户型图和四个尺寸，我们先帮你做一次免费初步判断。',
            coverCopy: '换智能马桶\n先量这 4 处',
            visualPlan: ['镜头 1：店员手持卷尺，实拍排污口并标注“量到中心”', '镜头 2：实拍插座与淋浴区距离，说明防水条件需现场确认', '镜头 3：展示门扇与马桶可能冲突的真实演示', '镜头 4：匿名案例局部图，标注“线上只能初判”'],
            pinnedComment: '不确定自家能不能装，评论区或私信发“尺寸”，先把城市、坑距和现场照片发来。',
            directMessageReply: '你好，先发所在城市、坑距、卫生间平面或现场照片，我按实际情况帮你做初步判断；最终安装条件仍需现场确认。',
            claimChecks: [
              { statement: '尺寸错一处可能产生返工费用', evidenceId: 'fixture-source', risk: '不要给出未经门店核实的具体金额。' },
              { statement: '插座位置需要考虑防水条件', evidenceId: 'fixture-source-2', risk: '发布前由安装人员确认表达符合本地安装规范。' },
            ],
          },
        },
        usage: { pointsCharged: 18, balanceAfter: 1250 },
      },
      })
    },
    generateCustom: async () => ({ ok: false, message: '当前预览使用官方模式。' }),
  },
  system: { openExternal: async () => ({ ok: true }) },
  research: {
    getSecretStatus: async () => ({ searchApiKeySaved: true, secureStorageAvailable: true }),
    saveSearchApiKey: async () => undefined,
    clearSearchApiKey: async () => undefined,
    search: async () => ({ ok: true, message: '', results: [] }),
  },
}

declare global {
  interface Window {
    contentProductionPreviewRoot?: Root
    contentProductionPreviewInputs?: Array<{ task: string; payload: Record<string, unknown> }>
  }
}

function Preview() {
  const [data, setData] = useState<ContentProductionData>(() => {
    const task = createContentTaskFromOpportunity(opportunity, 'douyin')
    return { tasks: [task], activeTaskId: task.id, learnings: [] }
  })
  const [message, setMessage] = useState('')
  const [balance, setBalance] = useState(1268)
  return <main style={{ maxWidth: 1240, margin: '0 auto', padding: 32 }}><div style={{ marginBottom: 12, color: '#52675e', fontSize: 12 }}>预览余额：{balance} 积分{message ? ` · ${message}` : ''}</div><ContentProductionPanel data={data} opportunities={[opportunity]} evidence={evidence} enabledChannels={['douyin', 'xiaohongshu']} performanceByOpportunity={{ 'fixture-opportunity': [{ channelId: 'douyin', itemId: 'fixture-video-task', stage: '已发布', executed: true, reach: 3280, interactions: 186, platformInquiries: 12, registeredLeads: 7, qualifiedLeads: 3, customers: 0 }] }} aiSettings={{ mode: 'official', officialWorkspaceId: 'ui-demo', customBaseUrl: '', customModel: '' }} aiSecrets={{ officialTokenSaved: true, customApiKeySaved: false, secureStorageAvailable: true }} onChange={(updater) => setData(updater)} onToast={setMessage} onOpenAIService={() => setMessage('打开 AI 服务设置')} onOfficialUsage={(usage) => setBalance(usage.balanceAfter)} onOpenChannel={(channelId) => setMessage(`进入${channelId}手工发布`)} /></main>
}

window.contentProductionPreviewRoot ??= createRoot(document.getElementById('root')!)
window.contentProductionPreviewRoot.render(<Preview />)
