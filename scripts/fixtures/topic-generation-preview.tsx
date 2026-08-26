import React, { useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import '../../src/styles.css'
import { TopicResearchPanel, type TopicResearchData } from '../../src/topic-research'

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
    generateOfficial: async () => ({
      ok: true,
      data: {
        requestId: 'fixture-generation',
        output: {
          topics: [
            { title: '旧卫生间换智能马桶，先判断这 4 个尺寸', customerQuestion: '旧卫生间能不能直接换智能马桶？', targetCustomer: '准备翻新老房卫生间、担心买错尺寸的成都业主', buyerStage: '方案比较', demandSignal: '两个来源都出现坑距、电源位置和开门空间冲突问题。', contentAngle: '用现场量尺顺序讲清楚四个尺寸，并展示一组不能直接安装的反例。', keyPromise: '客户看完可以先完成一次基础自查，减少买后返工。', proofNeeded: '真实量尺画面、尺寸标注、安装前后案例；不要使用未授权客户信息。', callToAction: '私信户型和四个尺寸，预约免费初步判断。', leadMagnet: '旧卫生间智能马桶安装自查表', recommendedChannels: ['douyin', 'xiaohongshu'], riskNote: '不同产品安装条件不同，不能承诺仅凭线上尺寸一定可以安装。', fitReason: '问题接近购买决策，且门店能用量尺和案例提供真实证明。', evidenceIds: ['fixture-source', 'fixture-source-2'] },
            { title: '5 平方米卫生间翻新，预算先分到这 3 个地方', customerQuestion: '预算有限时，哪些地方值得投入，哪些可以后换？', targetCustomer: '预算有限但准备在近期启动卫生间翻新的本地业主', buyerStage: '准备购买', demandSignal: '来源反复讨论预算分配、返工成本和隐藏工程。', contentAngle: '用一份真实但隐去客户信息的预算结构解释优先级。', keyPromise: '帮助客户先确定预算顺序，再决定是否预约量尺。', proofNeeded: '匿名报价结构、施工节点照片、可公开的材料样品。', callToAction: '私信面积和预算区间，领取预算分配表。', leadMagnet: '小卫生间翻新预算分配表', recommendedChannels: ['xiaohongshu', 'wechat'], riskNote: '预算会受现场情况影响，必须明确内容不是最终报价。', fitReason: '客户已经接近购买，预算工具能自然筛选出有明确需求的人。', evidenceIds: ['fixture-source', 'fixture-source-2'] },
          ],
        },
        usage: { pointsCharged: 12, balanceAfter: 1268 },
      },
    }),
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
    topicGenerationPreviewRoot?: Root
  }
}

function Preview() {
  const [data, setData] = useState<TopicResearchData>({
    brief: { offer: '旧卫生间局部改造', targetCustomer: '准备翻新老房卫生间的本地业主', serviceArea: '成都高新区及周边 20 公里', conversionGoal: '私信户型，预约免费初步判断', proofAssets: '量尺画面、改造前后案例、匿名报价结构', differentiator: '门店可以到现场量尺并给出分阶段改造建议', constraints: '不承诺仅凭线上信息给出最终报价' },
    evidence: [
      { id: 'fixture-source', query: '旧卫生间 智能马桶 避坑', source: 'web', title: '小户型卫生间改造常见尺寸问题', url: 'https://example.com/source', summary: '整理了坑距、电源、开门空间、清洁死角和返工成本等常见问题。', publishedDate: '2026-08-20', discoveredAt: '2026-08-26T10:00:00+08:00' },
      { id: 'fixture-source-2', query: '卫生间翻新 预算 怎么分', source: 'xiaohongshu', title: '旧卫生间翻新预算和返工问题讨论', url: 'https://example.com/source-2', summary: '讨论了预算分配、隐藏工程和现场尺寸对最终方案的影响。', publishedDate: '2026-08-18', discoveredAt: '2026-08-26T10:05:00+08:00' },
    ],
    generatedTopics: [],
  })
  const [message, setMessage] = useState('')
  const [balance, setBalance] = useState(1280)
  const firstOpportunityId = data.generatedTopics[0]?.id
  const performanceByOpportunity = firstOpportunityId && data.generatedTopics[0].adoptions.length ? {
    [firstOpportunityId]: [{ channelId: 'douyin' as const, itemId: data.generatedTopics[0].adoptions[0].itemId, stage: '已发布', executed: true, reach: 2380, interactions: 146, platformInquiries: 12, registeredLeads: 7, qualifiedLeads: 3, customers: 1 }],
  } : {}
  return <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}><div style={{ marginBottom: 12, color: '#52675e', fontSize: 12 }}>预览余额：{balance} 积分{message ? ` · ${message}` : ''}</div><TopicResearchPanel data={data} aiSettings={{ mode: 'official', officialWorkspaceId: 'ui-demo', customBaseUrl: '', customModel: '' }} aiSecrets={{ officialTokenSaved: true, customApiKeySaved: false, secureStorageAvailable: true }} enabledChannels={['douyin', 'xiaohongshu']} performanceByOpportunity={performanceByOpportunity} onChange={(updater) => setData(updater)} onToast={setMessage} onOpenAIService={() => setMessage('打开 AI 服务设置')} onOfficialUsage={(usage) => setBalance(usage.balanceAfter)} onAdoptOpportunity={(_opportunity, channelId) => { setMessage(`已加入${channelId}`); return `fixture-${channelId}-item` }} onOpenChannel={(channelId) => setMessage(`打开${channelId}`)} /></main>
}

window.topicGenerationPreviewRoot ??= createRoot(document.getElementById('root')!)
window.topicGenerationPreviewRoot.render(<Preview />)
