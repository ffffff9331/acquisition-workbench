import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ClipboardCheck, FileKey, PackageOpen, Settings2, Upload } from 'lucide-react'
import { channelById, type ChannelId } from './channels'
import { createDeliveryConfigurationPlan, type DeliveryConfigurationSelection, type DeliveryConfigurationState } from './delivery-configuration'
import type { IndustryRulePack } from './industry-rules'
import { deliverySolutionPacks, type DeliverySolutionPack } from './solution-packs'
import type { GrowthTacticPack } from './tactic-packs'

function toggle(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

export function DeliveryConfigurationPanel({ current, installationId, industryPacks, tacticPacks, importedSolutionPackIds, onImportDeliveryPack, onApply }: { current: DeliveryConfigurationState; installationId: string; industryPacks: IndustryRulePack[]; tacticPacks: GrowthTacticPack[]; importedSolutionPackIds: string[]; onImportDeliveryPack: (raw: string) => Promise<{ ok: boolean; message: string }>; onApply: (selection: DeliveryConfigurationSelection) => void }) {
  const [isOpen, setIsOpen] = useState(!current.activeIndustryPackId && !current.enabledChannels.length)
  const [industryPackId, setIndustryPackId] = useState(current.activeIndustryPackId)
  const [tacticPackIds, setTacticPackIds] = useState<string[]>(() => tacticPacks.filter((pack) => pack.industryPackId === current.activeIndustryPackId && current.installedTacticPacks.includes(pack.id)).map((pack) => pack.id))
  const [defaultTacticPackId, setDefaultTacticPackId] = useState(current.activeTacticPackId)
  const [importMessage, setImportMessage] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const industryTactics = useMemo(() => tacticPacks.filter((pack) => pack.industryPackId === industryPackId), [industryPackId, tacticPacks])
  const plan = useMemo(() => createDeliveryConfigurationPlan(current, { industryPackId, tacticPackIds, defaultTacticPackId }, industryPacks, tacticPacks), [current, defaultTacticPackId, industryPackId, industryPacks, tacticPackIds, tacticPacks])

  useEffect(() => {
    setTacticPackIds((selected) => selected.filter((id) => industryTactics.some((pack) => pack.id === id)))
  }, [industryTactics])

  useEffect(() => {
    if (!tacticPackIds.includes(defaultTacticPackId)) setDefaultTacticPackId(tacticPackIds[0] || '')
  }, [defaultTacticPackId, tacticPackIds])

  useEffect(() => {
    if (industryPackId && !industryPacks.some((pack) => pack.id === industryPackId)) {
      setIndustryPackId('')
      setTacticPackIds([])
      setDefaultTacticPackId('')
    }
  }, [industryPackId, industryPacks])

  const selectIndustry = (nextId: string) => {
    setIndustryPackId(nextId)
    setTacticPackIds([])
    setDefaultTacticPackId('')
  }

  const selectTactic = (packId: string) => {
    const next = toggle(tacticPackIds, packId)
    setTacticPackIds(next)
    if (!next.includes(defaultTacticPackId)) setDefaultTacticPackId(next[0] || '')
  }

  const selectedChannels = plan.requiredChannels.map((channelId) => channelById(channelId))
  const existingChannels = current.enabledChannels.filter((channelId) => !plan.addedChannels.includes(channelId)).map((channelId) => channelById(channelId))

  const importFile = async (file?: File) => {
    if (!file || isImporting) return
    setIsImporting(true)
    try {
      const result = await onImportDeliveryPack(await file.text())
      setImportMessage(result.message)
    } catch {
      setImportMessage('方案包读取失败，请重新下载后再试。')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return <section className={`delivery-configuration ${isOpen ? 'open' : ''}`} aria-label="获客配置">
    <div className="delivery-configuration-head">
      <div className="delivery-configuration-title"><span><Settings2 size={20} /></span><div><h2>获客配置</h2><p>{current.activeIndustryPackId ? '根据客户准备执行的获客方式，补齐本次需要的行业规则、渠道能力和打法。' : '首次交付时先选行业和准备执行的获客方式，工作台只启用本次需要的能力。'}</p></div></div>
      <button className="button button-secondary" type="button" onClick={() => setIsOpen((value) => !value)} aria-expanded={isOpen}>{isOpen ? '收起配置' : '配置当前工作台'}<Settings2 size={15} /></button>
    </div>
    {isOpen && <div className="delivery-configuration-body">
      <div className="delivery-step">
        <div className="delivery-step-label"><span>1</span><div><h3>导入客户已购买的方案包</h3><p>客户可以预览全部方案方向；只有经过签名校验的方案包才能进入后续配置。</p></div></div>
        <input ref={fileInputRef} className="visually-hidden" type="file" accept=".acqpack,application/json" onChange={(event) => { void importFile(event.target.files?.[0]) }} />
        <div className="solution-pack-catalog" role="list" aria-label="方案包目录">{deliverySolutionPacks.map((pack) => <SolutionPackPreview key={pack.id} pack={pack} imported={importedSolutionPackIds.includes(pack.id)} />)}</div>
        <div className="solution-pack-import"><div><FileKey size={17} /><span>{importMessage || '将本机工作台编号提供给服务方，再导入对应的 .acqpack 方案授权包。'}</span></div><button className="button button-secondary" type="button" disabled={isImporting} onClick={() => fileInputRef.current?.click()}><Upload size={15} />{isImporting ? '正在校验' : '导入方案包'}</button></div>
        <p className="installation-id"><span>本机工作台编号</span><code>{installationId}</code></p>
      </div>
      <div className="delivery-step">
        <div className="delivery-step-label"><span>2</span><div><h3>选择客户行业</h3><p>行业规则会进入后续的研究、内容生产和判断流程。</p></div></div>
        {industryPacks.length ? <div className="delivery-industry-options" role="list" aria-label="选择客户行业">{industryPacks.map((pack) => <button key={pack.id} className={industryPackId === pack.id ? 'selected' : ''} type="button" onClick={() => selectIndustry(pack.id)} aria-pressed={industryPackId === pack.id}><strong>{pack.name.replace('行业规则包', '')}</strong><small>{pack.industry}</small>{industryPackId === pack.id && <Check size={15} />}</button>)}</div> : <p className="delivery-empty">请先导入客户已购买的方案包。</p>}
      </div>
      <div className="delivery-step">
        <div className="delivery-step-label"><span>3</span><div><h3>选择准备执行的获客方式</h3><p>只勾选客户近期真的准备做的路径。每种方式会带入对应的渠道能力与线索承接规则。</p></div></div>
        {industryPackId ? industryTactics.length ? <div className="delivery-tactic-options" role="list" aria-label="选择获客方式">{industryTactics.map((pack) => {
          const checked = tacticPackIds.includes(pack.id)
          return <button key={pack.id} className={checked ? 'selected' : ''} type="button" onClick={() => selectTactic(pack.id)} aria-pressed={checked}><span className={`delivery-choice-check ${checked ? 'checked' : ''}`}>{checked && <Check size={14} />}</span><span><strong>{pack.name}</strong><small>{channelById(pack.channelId).shortLabel} · {pack.primaryGoal}</small></span></button>
        })}</div> : <p className="delivery-empty">这个行业暂时还没有可交付的获客方式。可以先保留为行业规则，待后续新增对应打法。</p> : <p className="delivery-empty">请先选择客户行业。</p>}
      </div>
      <div className="delivery-preview">
        <div><div className="delivery-step-label"><span>4</span><div><h3>确认本次工作台</h3><p>应用后只新增所选能力；已有渠道、历史打法、线索和客户记录不会被删除。</p></div></div></div>
        <div className="delivery-preview-grid">
          <div><span>本次启用渠道</span>{selectedChannels.length ? <div className="delivery-preview-items">{selectedChannels.map((channel) => <b key={channel.id} className={plan.addedChannels.includes(channel.id) ? 'new' : ''}>{channel.shortLabel}{plan.addedChannels.includes(channel.id) ? ' 新增' : ' 已有'}</b>)}</div> : <p>选择获客方式后显示。</p>}</div>
          <div><span>当前默认方式</span>{tacticPackIds.length ? <div className="delivery-default-options" role="radiogroup" aria-label="选择默认获客方式">{tacticPackIds.map((id) => {
            const pack = tacticPacks.find((item) => item.id === id)
            if (!pack) return null
            return <label key={pack.id}><input type="radio" name="default-tactic-pack" checked={defaultTacticPackId === pack.id} onChange={() => setDefaultTacticPackId(pack.id)} />{pack.name}</label>
          })}</div> : <p>选择至少一种获客方式后指定。</p>}</div>
        </div>
        {existingChannels.length > 0 && <p className="delivery-existing">当前工作台已保留：{existingChannels.map((channel) => channel.shortLabel).join('、')}。重新应用配置只会增加能力，不会移除已有内容。</p>}
        {plan.errors.length > 0 && <p className="delivery-validation"><ClipboardCheck size={15} />{plan.errors[0]}</p>}
        <div className="delivery-apply-row"><small>应用配置不会创建演示内容、客户、活动、关系或线索，也不会代替人工发布、私信或预约。</small><button className="button button-primary" type="button" disabled={!plan.ok} onClick={() => onApply({ industryPackId, tacticPackIds, defaultTacticPackId })}><PackageOpen size={16} />应用配置</button></div>
      </div>
    </div>}
  </section>
}

function SolutionPackPreview({ pack, imported }: { pack: DeliverySolutionPack; imported: boolean }) {
  return <article className={`solution-pack-card ${imported ? 'imported' : ''}`}><div><span>{pack.category}</span><h4>{pack.title}</h4><p>{pack.description}</p></div><div className="solution-pack-foot"><small>{pack.channelIds.map((channelId) => channelById(channelId).shortLabel).join('、')}</small><b>{imported ? <><Check size={13} />已导入</> : '需要方案包'}</b></div></article>
}
