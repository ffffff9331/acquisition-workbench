import { useMemo, useState, type ReactNode } from 'react'
import { BookOpenText, CheckCircle2, ExternalLink, Eye, FileStack, FlaskConical, FolderOpen, HardDrive, ImagePlus, LibraryBig, MapPin, Plus, Upload, X } from 'lucide-react'
import type { ContentProductionData, ContentTask } from './content-production'
import { createOperationsAsset, createOperationsExperiment, createOperationsKnowledgeReference, operationalReadiness, operationsAssetPageSize, paginateOperationsAssets, type OperationsAsset, type OperationsData, type OperationsExperiment, type OperationsKnowledgeReference, type OperationsStoredFile } from './operations-core'

type OperationsHubProps = {
  data: OperationsData
  contentProduction: ContentProductionData
  opportunityCount: number
  leadCount: number
  intentCount: number
  customerCount: number
  onChange: (updater: (current: OperationsData) => OperationsData) => void
  onOpenAcquisition: () => void
  onOpenLeads: () => void
  onOpenContent: () => void
  onToast: (message: string) => void
}

type Editor =
  | { kind: 'asset'; value: OperationsAsset }
  | { kind: 'experiment'; value: OperationsExperiment }
  | { kind: 'knowledge'; value: OperationsKnowledgeReference }
  | null

const assetKinds = ['图片', '视频', '文档', '案例', '截图'] as const
const assetStatuses = ['待整理', '仅内部', '待授权', '可公开'] as const
const experimentStatuses = ['计划中', '验证中', '已完成', '已暂停'] as const

function tagsFromText(value: string) {
  return [...new Set(value.split(/[，,\n]/).map((item) => item.trim().slice(0, 60)).filter(Boolean))].slice(0, 12)
}

function datetimeLabel(value: string) {
  if (!value) return '未记录'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value.slice(0, 10) : new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(date)
}

function taskName(taskId: string, tasks: ContentTask[]) {
  return tasks.find((task) => task.id === taskId)?.title || '未关联内容任务'
}

function assetKindForFile(file: Pick<OperationsStoredFile, 'name' | 'mimeType'>): OperationsAsset['kind'] {
  if (file.mimeType.startsWith('image/')) return '图片'
  if (file.mimeType.startsWith('video/')) return '视频'
  if (/\.(?:png|jpe?g|webp|gif|avif)$/i.test(file.name)) return '图片'
  if (/\.(?:mp4|mov|webm)$/i.test(file.name)) return '视频'
  if (/\.(?:pdf|docx?|xlsx?|pptx?)$/i.test(file.name)) return '文档'
  return '案例'
}

function fileSizeLabel(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function safeExternalUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : ''
  } catch {
    return ''
  }
}

function currentTaskLinkCount(ids: string[], tasks: ContentTask[]) {
  const taskIds = new Set(tasks.map((task) => task.id))
  return ids.filter((id) => taskIds.has(id)).length
}

function AssetPreview({ asset, compact = false }: { asset: OperationsAsset; compact?: boolean }) {
  const previewUrl = asset.file && typeof window !== 'undefined' ? window.workbenchDesktop?.assets.previewUrl(asset.file.id) : ''
  if (!previewUrl) return <span className={`operations-asset-preview ${compact ? 'compact' : ''}`}><HardDrive size={compact ? 15 : 22} /></span>
  if (asset.file?.mimeType.startsWith('image/')) return <span className={`operations-asset-preview ${compact ? 'compact' : ''}`}><img src={previewUrl} alt={`${asset.name} 预览`} /></span>
  if (asset.file?.mimeType.startsWith('video/')) return <span className={`operations-asset-preview ${compact ? 'compact' : ''}`}><video src={previewUrl} muted preload="metadata" aria-label={`${asset.name} 视频预览`} /></span>
  return <span className={`operations-asset-preview ${compact ? 'compact' : ''}`}><HardDrive size={compact ? 15 : 22} /></span>
}

export function OperationsHub({ data, contentProduction, opportunityCount, leadCount, intentCount, customerCount, onChange, onOpenAcquisition, onOpenLeads, onOpenContent, onToast }: OperationsHubProps) {
  const [editor, setEditor] = useState<Editor>(null)
  const [importing, setImporting] = useState(false)
  const [assetPageNumber, setAssetPageNumber] = useState(1)
  const tasks = contentProduction.tasks
  const readiness = useMemo(() => operationalReadiness(data, tasks.map((task) => task.id)), [data, tasks])
  const actionableTasks = tasks.filter((task) => task.status !== '已锁定')
  const linkedAssets = readiness.linkedAssets.filter((asset) => asset.status === '可公开')
  const assetPage = paginateOperationsAssets(data.assets, assetPageNumber, operationsAssetPageSize)
  const desktopAssets = typeof window !== 'undefined' ? window.workbenchDesktop?.assets : undefined

  const importAssets = async () => {
    if (!desktopAssets) {
      onToast('本机素材导入需要在桌面版工作台中使用')
      return
    }
    setImporting(true)
    try {
      const result = await desktopAssets.importFiles()
      if (!result.ok) {
        onToast('本机素材导入未完成，请稍后重试')
        return
      }
      const importedAssets = result.imported.map((file) => {
        const asset = createOperationsAsset()
        return { ...asset, name: file.name, kind: assetKindForFile(file), file: { ...file, importedAt: file.createdAt }, createdAt: file.createdAt, updatedAt: file.createdAt }
      })
      if (importedAssets.length) onChange((current) => ({ ...current, assets: [...importedAssets, ...current.assets] }))
      if (result.failures.length) onToast(`已导入 ${importedAssets.length} 个素材，${result.failures.length} 个未导入：${result.failures[0].message}`)
      else if (importedAssets.length) onToast(`已导入 ${importedAssets.length} 个本机素材，请补充授权和内容关联`)
    } catch {
      onToast('本机素材导入失败，请检查磁盘空间和文件夹权限后重试')
    } finally {
      setImporting(false)
    }
  }

  const openStoredAsset = async (asset: OperationsAsset, action: 'openFile' | 'revealFile') => {
    if (!asset.file || !desktopAssets) {
      onToast('该素材没有可用的本机原文件')
      return
    }
    const result = await desktopAssets[action](asset.file.id)
    if (!result.ok) onToast(result.message || '无法打开本机素材')
  }

  const openKnowledgeReference = async (reference: OperationsKnowledgeReference) => {
    const url = safeExternalUrl(reference.location)
    if (!url) {
      onToast('这里只能打开 HTTPS 链接；本机素材请通过素材库导入')
      return
    }
    if (window.workbenchDesktop?.system) {
      const result = await window.workbenchDesktop.system.openExternal(url)
      if (!result.ok) onToast(result.message || '无法打开链接')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const saveAsset = (asset: OperationsAsset) => {
    if (!asset.name.trim()) return
    const next = { ...asset, name: asset.name.trim(), updatedAt: new Date().toISOString() }
    onChange((current) => ({ ...current, assets: current.assets.some((item) => item.id === next.id) ? current.assets.map((item) => item.id === next.id ? next : item) : [next, ...current.assets] }))
    setEditor(null)
  }

  const saveExperiment = (experiment: OperationsExperiment) => {
    if (!experiment.title.trim()) return
    const next = { ...experiment, title: experiment.title.trim(), updatedAt: new Date().toISOString() }
    onChange((current) => ({ ...current, experiments: current.experiments.some((item) => item.id === next.id) ? current.experiments.map((item) => item.id === next.id ? next : item) : [next, ...current.experiments] }))
    setEditor(null)
  }

  const saveKnowledge = (reference: OperationsKnowledgeReference) => {
    if (!reference.title.trim()) return
    const next = { ...reference, title: reference.title.trim(), updatedAt: new Date().toISOString() }
    onChange((current) => ({ ...current, knowledgeReferences: current.knowledgeReferences.some((item) => item.id === next.id) ? current.knowledgeReferences.map((item) => item.id === next.id ? next : item) : [next, ...current.knowledgeReferences] }))
    setEditor(null)
  }

  const remove = (kind: NonNullable<Editor>['kind'], id: string) => {
    onChange((current) => kind === 'asset'
      ? { ...current, assets: current.assets.filter((item) => item.id !== id) }
      : kind === 'experiment'
        ? { ...current, experiments: current.experiments.filter((item) => item.id !== id) }
        : { ...current, knowledgeReferences: current.knowledgeReferences.filter((item) => item.id !== id) })
  }

  const removeAsset = async (asset: OperationsAsset) => {
    if (asset.file) {
      if (!window.confirm(`删除“${asset.name}”及工作台保存的原文件？此操作无法恢复。`)) return
      if (!desktopAssets) {
        onToast('请在桌面版工作台中删除已导入的本机原文件')
        return
      }
      const result = await desktopAssets.deleteFile(asset.file.id)
      if (!result.ok) {
        onToast(result.message || '无法删除本机素材')
        return
      }
    }
    remove('asset', asset.id)
  }

  return <>
    <section className="operations-heading">
      <div><span className="operations-heading-icon"><LibraryBig size={18} /></span><div><h1>运营</h1><p>把需求、内容、素材、发布、咨询和结果放在同一条增长链路里。</p></div></div>
      <div className="operations-heading-actions"><button className="button button-secondary" type="button" onClick={onOpenAcquisition}>研究需求</button><button className="button button-primary" type="button" onClick={onOpenContent}><Plus size={15} />制作内容</button></div>
    </section>

    <section className="operations-flow" aria-label="运营增长闭环">
      <button type="button" onClick={onOpenAcquisition}><span>1</span><div><b>需求与机会</b><small>{opportunityCount} 个机会</small></div></button>
      <i />
      <button type="button" onClick={onOpenContent}><span>2</span><div><b>内容与素材</b><small>{tasks.length} 个内容任务</small></div></button>
      <i />
      <button type="button" onClick={onOpenLeads}><span>3</span><div><b>承接与推进</b><small>{leadCount + intentCount + customerCount} 条客户记录</small></div></button>
      <i />
      <button type="button" onClick={onOpenAcquisition}><span>4</span><div><b>复盘与迭代</b><small>{readiness.completedExperiments} 个完成实验</small></div></button>
    </section>

    <section className="operations-overview-grid">
      <article><span className="operations-stat-icon content"><FileStack size={18} /></span><div><b>{actionableTasks.length}</b><small>待继续完成内容</small></div><button type="button" onClick={onOpenContent}>进入内容</button></article>
      <article><span className="operations-stat-icon asset"><FolderOpen size={18} /></span><div><b>{readiness.publicAssets}</b><small>可公开素材</small></div><button type="button" onClick={() => void importAssets()}>导入素材</button></article>
      <article><span className="operations-stat-icon test"><FlaskConical size={18} /></span><div><b>{data.experiments.filter((item) => item.status === '验证中').length}</b><small>验证中的实验</small></div><button type="button" onClick={() => setEditor({ kind: 'experiment', value: createOperationsExperiment() })}>新建实验</button></article>
      <article><span className="operations-stat-icon knowledge"><BookOpenText size={18} /></span><div><b>{data.knowledgeReferences.length}</b><small>已沉淀知识引用</small></div><button type="button" onClick={() => setEditor({ kind: 'knowledge', value: createOperationsKnowledgeReference() })}>引用知识</button></article>
    </section>

    <section className="operations-grid">
      <article className="operations-panel operations-panel-wide">
        <header><div><ImagePlus size={17} /><div><h2>素材库</h2><p>导入原文件、标记公开范围，再关联到内容任务。</p></div></div><div className="operations-panel-actions"><button className="button button-secondary small" type="button" disabled={importing} onClick={() => void importAssets()}><Upload size={14} />{importing ? '正在导入' : '导入本机素材'}</button><button className="icon-button" type="button" aria-label="登记没有原文件的素材" title="登记没有原文件的素材" onClick={() => setEditor({ kind: 'asset', value: createOperationsAsset() })}><Plus size={17} /></button></div></header>
        {data.assets.length ? <><div className="operations-record-list">{assetPage.items.map((asset) => { const linkedCount = currentTaskLinkCount(asset.contentTaskIds, tasks); return <article key={asset.id} className={asset.file ? 'operations-asset-row has-file' : 'operations-asset-row'}><span className={`operations-status ${asset.status === '可公开' ? 'ready' : asset.status === '待授权' ? 'warning' : ''}`}>{asset.status}</span><div className="operations-asset-copy"><AssetPreview asset={asset} compact /><div><strong>{asset.name}</strong><p>{asset.kind}{linkedCount ? ` · 已关联 ${linkedCount} 条内容` : ' · 尚未关联内容'}</p>{asset.file && <small><HardDrive size={12} />已保存原文件 · {fileSizeLabel(asset.file.size)} · {datetimeLabel(asset.file.importedAt)}</small>}{asset.description && <small>{asset.description}</small>}</div></div>{asset.file && <><button className="icon-button" type="button" aria-label={`打开原文件 ${asset.name}`} title="打开原文件" onClick={() => void openStoredAsset(asset, 'openFile')}><Eye size={15} /></button><button className="icon-button" type="button" aria-label={`在文件夹中显示 ${asset.name}`} title="在文件夹中显示" onClick={() => void openStoredAsset(asset, 'revealFile')}><MapPin size={15} /></button></>}<button className="text-button" type="button" onClick={() => setEditor({ kind: 'asset', value: asset })}>编辑</button><button className="icon-button danger" type="button" aria-label={`删除素材及原文件 ${asset.name}`} title="删除素材及工作台保存的原文件" onClick={() => void removeAsset(asset)}><X size={15} /></button></article> })}</div>{assetPage.totalPages > 1 && <nav className="operations-pagination" aria-label="素材库分页"><span>第 {assetPage.page} / {assetPage.totalPages} 页，共 {assetPage.totalItems} 个素材</span><button className="button button-secondary small" type="button" disabled={assetPage.page === 1} onClick={() => setAssetPageNumber(assetPage.page - 1)}>上一页</button><button className="button button-secondary small" type="button" disabled={assetPage.page === assetPage.totalPages} onClick={() => setAssetPageNumber(assetPage.page + 1)}>下一页</button></nav>}</> : <EmptyOperationsState icon={<ImagePlus size={22} />} title="还没有登记素材" note="从电脑选择实拍、案例或经授权截图后，工作台会复制并保存原文件；然后再补充授权和内容关联。" action="导入第一个素材" onAction={() => void importAssets()} />}
        {linkedAssets.length > 0 && <p className="operations-footnote"><CheckCircle2 size={14} />已有 {linkedAssets.length} 条可公开素材与当前内容任务关联。</p>}
      </article>

      <article className="operations-panel">
        <header><div><FlaskConical size={17} /><div><h2>内容实验</h2><p>每轮只测试一个变量，结果回到下一轮内容。</p></div></div><button className="icon-button" type="button" aria-label="新建实验" onClick={() => setEditor({ kind: 'experiment', value: createOperationsExperiment() })}><Plus size={17} /></button></header>
        {data.experiments.length ? <div className="operations-record-list compact">{data.experiments.slice(0, 5).map((experiment) => <article key={experiment.id}><span className={`operations-status ${experiment.status === '已完成' ? 'ready' : experiment.status === '验证中' ? 'warning' : ''}`}>{experiment.status}</span><div><strong>{experiment.title}</strong><p>{experiment.changedVariable || '待确定变量'} · {taskName(experiment.contentTaskId, tasks)}</p></div><button className="text-button" type="button" onClick={() => setEditor({ kind: 'experiment', value: experiment })}>查看</button></article>)}</div> : <EmptyOperationsState icon={<FlaskConical size={22} />} title="还没有实验" note="内容发布后，不只看播放量；记录本轮要验证的业务信号。" action="建立实验" onAction={() => setEditor({ kind: 'experiment', value: createOperationsExperiment() })} />}
      </article>

      <article className="operations-panel operations-panel-wide">
        <header><div><BookOpenText size={17} /><div><h2>知识与方法</h2><p>引用 Obsidian、平台资料或已验证的方法，但不要把参考笔记当成未经确认的经营事实。</p></div></div><button className="button button-secondary small" type="button" onClick={() => setEditor({ kind: 'knowledge', value: createOperationsKnowledgeReference() })}><Plus size={14} />引用知识</button></header>
        {data.knowledgeReferences.length ? <div className="operations-record-list">{data.knowledgeReferences.slice(0, 6).map((reference) => <article key={reference.id}><span className="operations-status neutral">参考</span><div><strong>{reference.title}</strong><p>{reference.source || '未标记来源'}{currentTaskLinkCount(reference.contentTaskIds, tasks) ? ` · 已关联 ${currentTaskLinkCount(reference.contentTaskIds, tasks)} 条内容` : ''}</p>{reference.summary && <small>{reference.summary}</small>}</div>{reference.location && <button className="icon-button" type="button" title="打开 HTTPS 链接" aria-label={`打开 ${reference.title}`} onClick={() => void openKnowledgeReference(reference)}><ExternalLink size={15} /></button>}<button className="text-button" type="button" onClick={() => setEditor({ kind: 'knowledge', value: reference })}>编辑</button><button className="icon-button danger" type="button" aria-label={`删除知识引用 ${reference.title}`} onClick={() => remove('knowledge', reference.id)}><X size={15} /></button></article>)}</div> : <EmptyOperationsState icon={<BookOpenText size={22} />} title="还没有知识引用" note="把真正会影响选题、内容和承接动作的资料引用进来，而不是堆一整个知识库。" action="引用第一条知识" onAction={() => setEditor({ kind: 'knowledge', value: createOperationsKnowledgeReference() })} />}
      </article>
    </section>

    {editor?.kind === 'asset' && <AssetEditor value={editor.value} tasks={tasks} onClose={() => setEditor(null)} onSave={saveAsset} onOpenFile={() => void openStoredAsset(editor.value, 'openFile')} onRevealFile={() => void openStoredAsset(editor.value, 'revealFile')} />}
    {editor?.kind === 'experiment' && <ExperimentEditor value={editor.value} tasks={tasks} onClose={() => setEditor(null)} onSave={saveExperiment} />}
    {editor?.kind === 'knowledge' && <KnowledgeEditor value={editor.value} tasks={tasks} onClose={() => setEditor(null)} onSave={saveKnowledge} />}
  </>
}

function EmptyOperationsState({ icon, title, note, action, onAction }: { icon: ReactNode; title: string; note: string; action: string; onAction: () => void }) {
  return <div className="operations-empty"><span>{icon}</span><div><strong>{title}</strong><p>{note}</p><button className="text-button" type="button" onClick={onAction}>{action}</button></div></div>
}

function TaskMultiSelect({ value, tasks, onChange }: { value: string[]; tasks: ContentTask[]; onChange: (next: string[]) => void }) {
  return <div className="operations-task-select">{tasks.length ? tasks.map((task) => <label key={task.id}><input type="checkbox" checked={value.includes(task.id)} onChange={(event) => onChange(event.target.checked ? [...value, task.id] : value.filter((id) => id !== task.id))} /><span>{task.title}</span></label>) : <small>还没有内容任务。先从“需求与机会”创建选题，再生成内容任务。</small>}</div>
}

function EditorShell({ title, note, children, onClose, onSave }: { title: string; note: string; children: ReactNode; onClose: () => void; onSave: () => void }) {
  return <div className="dialog-backdrop" role="presentation"><section className="dialog operations-editor" role="dialog" aria-modal="true" aria-label={title}><div className="dialog-head"><div><h2>{title}</h2><p>{note}</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div>{children}<div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onClose}>取消</button><button className="button button-primary" type="button" onClick={onSave}>保存</button></div></section></div>
}

function AssetEditor({ value, tasks, onClose, onSave, onOpenFile, onRevealFile }: { value: OperationsAsset; tasks: ContentTask[]; onClose: () => void; onSave: (value: OperationsAsset) => void; onOpenFile: () => void; onRevealFile: () => void }) {
  const [draft, setDraft] = useState(value)
  return <EditorShell title="登记运营素材" note="原文件由桌面版素材库保存；公开范围不清楚的案例不能当作发布证据。" onClose={onClose} onSave={() => onSave(draft)}>{draft.file && <section className="operations-file-detail"><AssetPreview asset={draft} /><div><strong>已保存原文件</strong><p>{draft.file.name} · {fileSizeLabel(draft.file.size)} · 导入于 {datetimeLabel(draft.file.importedAt)}</p><div><button className="button button-secondary small" type="button" onClick={onOpenFile}><Eye size={14} />打开原文件</button><button className="button button-secondary small" type="button" onClick={onRevealFile}><MapPin size={14} />所在文件夹</button></div></div></section>}<div className="form-grid"><label className="field field-wide"><span>素材名称 *</span><input autoFocus value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="例如：智能马桶旧房安装前后实拍" /></label><label className="field"><span>类型</span><select value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as OperationsAsset['kind'] })}>{assetKinds.map((kind) => <option key={kind}>{kind}</option>)}</select></label><label className="field"><span>公开范围</span><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as OperationsAsset['status'] })}>{assetStatuses.map((status) => <option key={status}>{status}</option>)}</select></label><label className="field field-wide"><span>来源说明或 HTTPS 链接</span><input value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder="例如：客户授权邮件 / https://example.com/reference" /></label><label className="field field-wide"><span>素材说明</span><textarea rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="它能证明什么？是否需要打码？" /></label><label className="field field-wide"><span>标签</span><input value={draft.tags.join('，')} onChange={(event) => setDraft({ ...draft, tags: tagsFromText(event.target.value) })} placeholder="例如：旧房改造，量尺，智能马桶" /></label><label className="field field-wide"><span>关联内容任务</span><TaskMultiSelect value={draft.contentTaskIds} tasks={tasks} onChange={(contentTaskIds) => setDraft({ ...draft, contentTaskIds })} /></label></div></EditorShell>
}

function ExperimentEditor({ value, tasks, onClose, onSave }: { value: OperationsExperiment; tasks: ContentTask[]; onClose: () => void; onSave: (value: OperationsExperiment) => void }) {
  const [draft, setDraft] = useState(value)
  return <EditorShell title="建立内容实验" note="一次只改一个变量，用有效咨询、资料补全或到店等业务信号判断，不预测爆款。" onClose={onClose} onSave={() => onSave(draft)}><div className="form-grid"><label className="field field-wide"><span>实验名称 *</span><input autoFocus value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="例如：安装判断型开头是否提高有效私信" /></label><label className="field"><span>状态</span><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as OperationsExperiment['status'] })}>{experimentStatuses.map((status) => <option key={status}>{status}</option>)}</select></label><label className="field"><span>关联内容任务</span><select value={draft.contentTaskId} onChange={(event) => setDraft({ ...draft, contentTaskId: event.target.value })}><option value="">暂不关联</option>{tasks.map((task) => <option value={task.id} key={task.id}>{task.title}</option>)}</select></label><label className="field field-wide"><span>本轮假设</span><textarea rows={2} value={draft.hypothesis} onChange={(event) => setDraft({ ...draft, hypothesis: event.target.value })} placeholder="例如：先说“能不能装”比先讲功能更容易获得愿意提供尺寸的咨询。" /></label><label className="field"><span>唯一调整变量</span><input value={draft.changedVariable} onChange={(event) => setDraft({ ...draft, changedVariable: event.target.value })} placeholder="例如：前三秒开头" /></label><label className="field"><span>成功信号</span><input value={draft.successSignal} onChange={(event) => setDraft({ ...draft, successSignal: event.target.value })} placeholder="例如：有效私信和资料补全" /></label><label className="field field-wide"><span>实际结果</span><textarea rows={3} value={draft.result} onChange={(event) => setDraft({ ...draft, result: event.target.value })} placeholder="发布后回填真实数据和观察到的情况" /></label><label className="field field-wide"><span>复盘结论</span><textarea rows={3} value={draft.conclusion} onChange={(event) => setDraft({ ...draft, conclusion: event.target.value })} placeholder="记录保留什么、调整什么、下轮只测什么" /></label></div></EditorShell>
}

function KnowledgeEditor({ value, tasks, onClose, onSave }: { value: OperationsKnowledgeReference; tasks: ContentTask[]; onClose: () => void; onSave: (value: OperationsKnowledgeReference) => void }) {
  const [draft, setDraft] = useState(value)
  return <EditorShell title="引用运营知识" note="知识库是方法参考。价格、案例、效果、平台热点等具体事实仍必须回到真实来源确认。" onClose={onClose} onSave={() => onSave(draft)}><div className="form-grid"><label className="field field-wide"><span>资料标题 *</span><input autoFocus value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="例如：小红书装修案例的首图结构" /></label><label className="field"><span>来源</span><input value={draft.source} onChange={(event) => setDraft({ ...draft, source: event.target.value })} placeholder="例如：Obsidian / 平台公开资料" /></label><label className="field"><span>HTTPS 链接</span><input value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder="https://example.com/reference" /></label><label className="field field-wide"><span>可复用的方法摘要</span><textarea rows={4} value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} placeholder="只写可执行方法、适用条件和边界，不把它写成已验证的经营事实。" /></label><label className="field field-wide"><span>标签</span><input value={draft.tags.join('，')} onChange={(event) => setDraft({ ...draft, tags: tagsFromText(event.target.value) })} placeholder="例如：抖音，选题，私信承接" /></label><label className="field field-wide"><span>关联内容任务</span><TaskMultiSelect value={draft.contentTaskIds} tasks={tasks} onChange={(contentTaskIds) => setDraft({ ...draft, contentTaskIds })} /></label></div></EditorShell>
}
