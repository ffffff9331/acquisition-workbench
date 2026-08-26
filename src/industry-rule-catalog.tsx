import { useEffect, useState } from 'react'
import { Check, CircleHelp, FileCheck2, PackageCheck, PackageOpen, Search, ShieldCheck, Target } from 'lucide-react'
import { channelById, type ChannelId } from './channels'
import type { IndustryRulePack } from './industry-rules'

export function IndustryRuleCatalog({ packs, activePackId, onActivate }: { packs: IndustryRulePack[]; activePackId: string; onActivate: (packId: string) => void }) {
  const [previewPackId, setPreviewPackId] = useState(activePackId || packs[0]?.id || '')
  const [activeTab, setActiveTab] = useState<'overview' | ChannelId>('overview')
  const previewPack = packs.find((pack) => pack.id === previewPackId) || packs[0]
  const isActive = previewPack?.id === activePackId

  useEffect(() => {
    if (activePackId) setPreviewPackId(activePackId)
  }, [activePackId])

  useEffect(() => setActiveTab('overview'), [previewPackId])

  if (!previewPack) return null
  const channelRule = activeTab === 'overview' ? null : previewPack.channelRules.find((item) => item.channelId === activeTab) || null

  return <section className="industry-pack-section">
    <div className="industry-pack-heading">
      <div className="industry-pack-title"><span><PackageOpen size={20} /></span><div><h2>行业规则包</h2><p>先预览，再选择当前行业。规则只约束后续搜索和制作，不会启用渠道或添加固定内容。</p></div></div>
      <span className={`package-state ${activePackId ? 'installed' : ''}`}>{activePackId ? <><PackageCheck size={14} />已有规则在使用</> : '尚未选择'}</span>
    </div>

    <div className="industry-pack-catalog" role="list" aria-label="行业规则包目录">
      {packs.map((pack) => {
        const active = pack.id === activePackId
        const previewing = pack.id === previewPack.id
        return <button key={pack.id} className={previewing ? 'selected' : ''} type="button" onClick={() => setPreviewPackId(pack.id)} aria-pressed={previewing}>
          <span className="industry-pack-catalog-name"><strong>{pack.name.replace('行业规则包', '')}</strong><small>{pack.industry}</small></span>
          <span className={`package-state ${active ? 'installed' : ''}`}>{active ? <><Check size={13} />当前使用</> : '可预览'}</span>
        </button>
      })}
    </div>

    <div className="industry-pack-summary">
      <div><strong>{previewPack.name}</strong><span>{previewPack.industry} · v{previewPack.version}</span><p>{previewPack.description}</p></div>
      <div className="industry-pack-stats"><span><b>{previewPack.searchDirections.length}</b>搜索方向</span><span><b>{previewPack.evidenceRules.length}</b>证据规则</span><span><b>{previewPack.channelRules.length}</b>渠道适配</span></div>
      {isActive ? <button className="button button-secondary" type="button" disabled><Check size={15} />当前使用</button> : <button className="button button-primary" type="button" onClick={() => onActivate(previewPack.id)}><PackageOpen size={15} />{activePackId ? '切换行业规则' : '启用此规则包'}</button>}
    </div>

    <div className="industry-pack-tabs" role="tablist" aria-label={`${previewPack.name}预览`}>
      <button className={activeTab === 'overview' ? 'active' : ''} type="button" onClick={() => setActiveTab('overview')}>规则总览</button>
      {previewPack.channelRules.map((item) => { const channel = channelById(item.channelId); return <button key={item.channelId} className={activeTab === item.channelId ? 'active' : ''} type="button" onClick={() => setActiveTab(item.channelId)}><span className={`mini-channel-icon ${item.channelId}`}>{channel.icon}</span>{channel.shortLabel}</button> })}
    </div>

    {activeTab === 'overview' ? <div className="industry-pack-overview">
      <div className="industry-pack-column"><div className="industry-pack-column-head"><CircleHelp size={18} /><div><h3>行业识别</h3><p>帮助搜索与模型理解产品、服务和使用场景。</p></div></div><div className="industry-topic-list">{[...previewPack.taxonomy.products, ...previewPack.taxonomy.services, ...previewPack.taxonomy.scenarios].map((item, index) => <span key={`${index}-${item}`}>{item}</span>)}</div></div>
      <div className="industry-pack-column"><div className="industry-pack-column-head"><Search size={18} /><div><h3>搜索与需求信号</h3><p>从客户实际输入扩词，再识别接近决策的问题。</p></div></div><ul>{previewPack.searchDirections.map((item) => <li key={item.id}><strong>{item.label}：</strong>{item.hint}</li>)}</ul></div>
      <div className="industry-pack-column"><div className="industry-pack-column-head"><FileCheck2 size={18} /><div><h3>证据与制作</h3><p>重要事实必须对应真实材料，缺少时明确待核实。</p></div></div><ul>{previewPack.productionRules.slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul></div>
      <div className="industry-pack-column"><div className="industry-pack-column-head"><ShieldCheck size={18} /><div><h3>表达边界</h3><p>规则负责阻止无法证明的承诺，不替代人工确认。</p></div></div><ul>{previewPack.boundaries.map((item) => <li key={item}>{item}</li>)}</ul></div>
    </div> : channelRule ? <div className="industry-channel-preview">
      <div className="industry-channel-intro"><span className={`channel-icon ${channelRule.channelId}`}>{channelById(channelRule.channelId).icon}</span><div><h3>{channelById(channelRule.channelId).shortLabel}行业适配</h3><p>{channelRule.focus}</p></div></div>
      <div className="industry-template-grid"><div><span>制作时必须满足</span><ul>{channelRule.required.map((item) => <li key={item}>{item}</li>)}</ul></div><div><span>需要避免</span><ul>{channelRule.avoid.map((item) => <li key={item}>{item}</li>)}</ul></div></div>
      <div className="industry-inline-note"><Target size={16} /><span>真正的选题、标题和正文会结合商家资料、当前联网来源、当前行业规则和所选渠道动态生成。</span></div>
    </div> : null}
  </section>
}
