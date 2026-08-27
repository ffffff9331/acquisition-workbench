import { useEffect, useMemo, useState } from 'react'
import { Check, ClipboardCheck, Clapperboard, Gauge, ListChecks, PackageCheck, Route, Target, UsersRound } from 'lucide-react'
import { channelById, type ChannelId } from './channels'
import type { GrowthTacticPack } from './tactic-packs'

export function TacticPackCatalog({ packs, activePackId, activeIndustryPackId, enabledChannels, selectedChannelId, onActivate }: { packs: GrowthTacticPack[]; activePackId: string; activeIndustryPackId: string; enabledChannels: ChannelId[]; selectedChannelId: ChannelId; onActivate: (packId: string) => void }) {
  const visiblePacks = useMemo(() => packs.filter((pack) => pack.channelId === selectedChannelId), [packs, selectedChannelId])
  const [previewPackId, setPreviewPackId] = useState(activePackId || visiblePacks[0]?.id || '')
  const previewPack = visiblePacks.find((pack) => pack.id === previewPackId) || visiblePacks[0]

  useEffect(() => {
    if (visiblePacks.some((pack) => pack.id === activePackId)) setPreviewPackId(activePackId)
    else setPreviewPackId(visiblePacks[0]?.id || '')
  }, [activePackId, selectedChannelId, visiblePacks])

  if (!previewPack) return null
  const industryReady = activeIndustryPackId === previewPack.industryPackId
  const channelReady = enabledChannels.includes(previewPack.channelId)
  const isActive = activePackId === previewPack.id
  const canActivate = industryReady && channelReady

  return <section className="tactic-pack-section">
    <div className="tactic-pack-heading"><div><span><Route size={20} /></span><div><h2>行业打法包</h2><p>把行业规则和渠道能力组织成一条可执行的获客路径。启用后只约束之后的新研究和成稿，不创建固定内容。</p></div></div><span className={`package-state ${isActive ? 'installed' : ''}`}>{isActive ? <><PackageCheck size={14} />当前使用</> : '可预览'}</span></div>
    <div className="tactic-pack-catalog" role="list" aria-label={`${channelById(selectedChannelId).shortLabel}行业打法包`}>{visiblePacks.map((pack) => <button key={pack.id} className={previewPack.id === pack.id ? 'selected' : ''} type="button" onClick={() => setPreviewPackId(pack.id)} aria-pressed={previewPack.id === pack.id}><span><strong>{pack.name}</strong><small>{pack.primaryGoal}</small></span>{pack.id === activePackId ? <b><Check size={13} />当前使用</b> : <b>预览</b>}</button>)}</div>
    <div className="tactic-pack-summary"><div><strong>{previewPack.name}</strong><span>{channelById(previewPack.channelId).shortLabel} · v{previewPack.version}</span><p>{previewPack.description}</p></div><div className="tactic-pack-state"><span className={industryReady ? 'ready' : ''}>{industryReady ? <Check size={13} /> : null}需要匹配行业规则</span><span className={channelReady ? 'ready' : ''}>{channelReady ? <Check size={13} /> : null}需要对应渠道能力</span></div>{isActive ? <button className="button button-secondary" type="button" disabled><Check size={15} />当前使用</button> : <button className="button button-primary" type="button" disabled={!canActivate} title={canActivate ? '启用这份打法包' : !industryReady ? '请先选择匹配的行业规则' : `请先启用${channelById(previewPack.channelId).shortLabel}能力`} onClick={() => onActivate(previewPack.id)}>{canActivate ? <Target size={15} /> : <ClipboardCheck size={15} />}{canActivate ? '启用此打法包' : !industryReady ? '先选择匹配行业规则' : `先启用${channelById(previewPack.channelId).shortLabel}能力`}</button>}</div>
    <div className="tactic-pack-overview"><div><div className="tactic-pack-column-head"><UsersRound size={18} /><h3>适合的客户</h3></div><ul>{previewPack.customerProfile.map((item) => <li key={item}>{item}</li>)}</ul></div><div><div className="tactic-pack-column-head"><Target size={18} /><h3>触发与承接</h3></div><ul>{previewPack.entryScenarios.map((item) => <li key={item}>{item}</li>)}</ul><p className="tactic-call-to-action"><strong>主要动作</strong>{previewPack.callToAction}</p></div><div><div className="tactic-pack-column-head"><Clapperboard size={18} /><h3>内容与发布</h3></div><p className="tactic-content-promise"><strong>这条内容要让客户明白</strong>{previewPack.contentPromise}</p><ul>{previewPack.prePublishChecks.map((item) => <li key={item}>{item}</li>)}</ul></div><div><div className="tactic-pack-column-head"><ClipboardCheck size={18} /><h3>线索判断</h3></div><ul>{previewPack.leadFields.map((item) => <li key={item.id}><strong>{item.label}{item.required ? ' *' : ''}</strong>{item.purpose}</li>)}</ul></div><div><div className="tactic-pack-column-head"><ListChecks size={18} /><h3>人工执行与跟进</h3></div><ul>{[...previewPack.channelExecutionSteps, ...previewPack.followUpSteps].map((item) => <li key={`${item.timing}-${item.action}`}><strong>{item.timing}</strong>{item.action}</li>)}</ul></div><div><div className="tactic-pack-column-head"><Gauge size={18} /><h3>本轮验证</h3></div><p className="tactic-experiment-focus"><strong>要验证什么</strong>{previewPack.experimentPlan.focus}</p><p className="tactic-experiment-focus"><strong>主要看什么</strong>{previewPack.experimentPlan.primaryMetric}</p><ul>{previewPack.experimentPlan.guardrailMetrics.map((item) => <li key={item}>{item}</li>)}</ul><p className="tactic-one-variable"><strong>每轮调整</strong>{previewPack.experimentPlan.oneVariableRule}</p></div></div>
  </section>
}
