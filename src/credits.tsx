import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Clock3, Coins, ExternalLink, LoaderCircle, RefreshCw, ShieldCheck, WalletCards, X } from 'lucide-react'
import type { AISecretStatus, AIServiceSettings } from './ai-service'

export type CreditAccountSnapshot = DesktopCreditAccountData['account']

type LoadState = 'loading' | 'ready' | 'setup' | 'unavailable' | 'error'

function formatPoints(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value)
}

function formatMoney(priceFen: number) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: priceFen % 100 === 0 ? 0 : 2 }).format(priceFen / 100)
}

function formatDateTime(value: string) {
  if (!value) return '时间待确认'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}

function transactionLabel(type: DesktopCreditAccountData['transactions'][number]['type']) {
  return { recharge: '充值', usage: '使用', refund: '退回', adjustment: '调整', gift: '赠送' }[type]
}

function transactionStatusLabel(status: DesktopCreditAccountData['transactions'][number]['status']) {
  return { pending: '处理中', completed: '已完成', failed: '失败', refunded: '已退款' }[status]
}

function statusCopy(status: CreditAccountSnapshot['status']) {
  if (status === 'suspended') return '账户已暂停，请联系服务人员处理。'
  if (status === 'closed') return '账户已关闭，暂时无法充值或使用。'
  return ''
}

export function CreditAccountDialog({ settings, secretStatus, onClose, onOpenAIService, onAccountChange, onToast }: { settings: AIServiceSettings; secretStatus: AISecretStatus; onClose: () => void; onOpenAIService: () => void; onAccountChange: (account: CreditAccountSnapshot | null) => void; onToast: (message: string) => void }) {
  const [state, setState] = useState<LoadState>('loading')
  const [data, setData] = useState<DesktopCreditAccountData | null>(null)
  const [error, setError] = useState('')
  const [rechargingPackageId, setRechargingPackageId] = useState('')
  const [pendingOrder, setPendingOrder] = useState<{ orderId: string; expiresAt: string; balanceBeforeOrder: number } | null>(null)
  const desktopAI = window.workbenchDesktop?.ai
  const dialogRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)

  const accountReady = settings.mode === 'official' && Boolean(settings.officialWorkspaceId) && secretStatus.officialTokenSaved

  const load = async () => {
    setError('')
    if (pendingOrder?.expiresAt && new Date(pendingOrder.expiresAt).getTime() <= Date.now()) setPendingOrder(null)
    if (settings.mode !== 'official' || !settings.officialWorkspaceId || !secretStatus.officialTokenSaved) {
      setState('setup')
      setData(null)
      onAccountChange(null)
      return
    }
    if (!desktopAI) {
      setState('unavailable')
      setData(null)
      onAccountChange(null)
      return
    }
    setState('loading')
    try {
      const service = await desktopAI.getOfficialServiceStatus()
      if (!service.configured) {
        setState('unavailable')
        setData(null)
        onAccountChange(null)
        return
      }
      const response = await desktopAI.getCreditAccount({ workspaceId: settings.officialWorkspaceId })
      if (!response.ok || !response.data) {
        setError(response.message || '暂时无法读取积分账户。')
        setState('error')
        setData(null)
        onAccountChange(null)
        return
      }
      setData(response.data)
      setState('ready')
      onAccountChange(response.data.account)
      if (pendingOrder && response.data.account.balance > pendingOrder.balanceBeforeOrder) setPendingOrder(null)
    } catch {
      setError('暂时无法读取积分账户，请稍后重试。')
      setState('error')
      setData(null)
      onAccountChange(null)
    }
  }

  useEffect(() => {
    void load()
  }, [settings.mode, settings.officialWorkspaceId, secretStatus.officialTokenSaved])

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeButtonRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')].filter((element) => !element.hasAttribute('hidden'))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [])

  const lowBalance = useMemo(() => Boolean(data && data.account.balance <= data.account.lowBalanceThreshold), [data])

  const recharge = async (packageId: string) => {
    if (!desktopAI || !accountReady || !data || data.account.status !== 'active') return
    setRechargingPackageId(packageId)
    setError('')
    try {
      const response = await desktopAI.createRechargeOrder({ workspaceId: settings.officialWorkspaceId, packageId })
      if (!response.ok || !response.order) {
        setError(response.message || '充值订单创建失败，请稍后重试。')
        return
      }
      const opened = await window.workbenchDesktop?.system.openExternal(response.order.checkoutUrl)
      if (!opened?.ok) {
        setError(opened?.message || '无法打开支付页面。')
        return
      }
      setPendingOrder({ orderId: response.order.orderId, expiresAt: response.order.expiresAt, balanceBeforeOrder: data.account.balance })
      onToast('已打开官方充值页面')
    } catch {
      setError('充值订单创建失败，请检查网络后重试。')
    } finally {
      setRechargingPackageId('')
    }
  }

  return <div className="dialog-backdrop" role="presentation">
    <section ref={dialogRef} className="dialog credit-dialog" role="dialog" aria-modal="true" aria-labelledby="credit-title">
      <div className="dialog-head"><div><h2 id="credit-title">积分账户</h2><p>官方 AI 服务按服务端确认的实际用量扣除积分。</p></div><button ref={closeButtonRef} className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div>

      {state === 'loading' && <div className="credit-state"><LoaderCircle className="spin" size={24} /><strong>正在读取积分账户</strong><span>余额与流水以官方网关记录为准。</span></div>}

      {state === 'setup' && <div className="credit-state"><WalletCards size={25} /><strong>先连接官方 AI 服务</strong><span>填写工作台编号和服务授权码后，才能读取余额、充值和使用积分。</span><button className="button button-primary" type="button" onClick={onOpenAIService}>配置官方服务</button></div>}

      {state === 'unavailable' && <div className="credit-state"><ShieldCheck size={25} /><strong>积分服务尚未开通</strong><span>{desktopAI ? '当前安装包还没有配置官方网关地址。配置完成前不会展示虚假余额或充值套餐。' : '积分账户需要在 Windows 桌面版中连接官方网关。浏览器预览不保存授权码，也不创建充值订单。'}</span></div>}

      {state === 'error' && <div className="credit-state credit-error-state"><AlertCircle size={25} /><strong>没有读取到积分账户</strong><span>{error}</span><button className="button button-secondary" type="button" onClick={() => void load()}><RefreshCw size={15} />重新读取</button></div>}

      {state === 'ready' && data && <>
        <section className="credit-summary-band">
          <div className="credit-balance"><span>可用积分</span><strong>{formatPoints(data.account.balance)}</strong><small>{data.account.updatedAt ? `更新于 ${formatDateTime(data.account.updatedAt)}` : '由官方网关实时返回'}</small></div>
          <div className="credit-summary-meta"><span>冻结积分<strong>{formatPoints(data.account.frozen)}</strong></span><span>工作台编号<strong>{data.account.workspaceId || settings.officialWorkspaceId}</strong></span></div>
          <button className="icon-button" type="button" title="刷新积分" aria-label="刷新积分" onClick={() => void load()}><RefreshCw size={16} /></button>
        </section>

        {statusCopy(data.account.status) && <div className="credit-account-warning"><AlertCircle size={16} /><span>{statusCopy(data.account.status)}</span></div>}
        {lowBalance && data.account.status === 'active' && <div className="credit-low-balance"><Coins size={16} /><span>当前积分已达到余额提醒线，充值后可继续稳定使用生成服务。</span></div>}

        <section className="credit-section">
          <div className="credit-section-head"><div><h3>充值积分</h3><p>套餐和到账积分由官方网关返回，支付成功后刷新余额。</p></div></div>
          {data.packages.length ? <div className="credit-package-list">{data.packages.map((item) => <button className={item.recommended ? 'recommended' : ''} type="button" key={item.id} disabled={Boolean(rechargingPackageId) || data.account.status !== 'active'} onClick={() => void recharge(item.id)}><span><strong>{item.title}</strong>{item.description && <small>{item.description}</small>}</span><span className="credit-package-points"><b>{formatPoints(item.points + item.bonusPoints)}</b><small>积分{item.bonusPoints ? `，含赠送 ${formatPoints(item.bonusPoints)}` : ''}</small></span><span className="credit-package-price">{rechargingPackageId === item.id ? <LoaderCircle className="spin" size={16} /> : <>{formatMoney(item.priceFen)}<ExternalLink size={13} /></>}</span></button>)}</div> : <div className="credit-inline-empty">官方网关暂未返回可购买的充值套餐。</div>}
          {pendingOrder && <div className="credit-order-note"><Clock3 size={16} /><div><strong>支付页面已打开</strong><span>订单 {pendingOrder.orderId}{pendingOrder.expiresAt ? `，请在 ${formatDateTime(pendingOrder.expiresAt)} 前完成` : ''}。支付完成后点击右上角刷新。</span></div></div>}
          {error && state === 'ready' && <div className="service-error">{error}</div>}
        </section>

        <section className="credit-section credit-ledger-section">
          <div className="credit-section-head"><div><h3>最近明细</h3><p>充值、使用、退款和人工调整都由服务端留下账务记录。</p></div></div>
          {data.transactions.length ? <div className="credit-ledger">{data.transactions.map((item) => <div key={item.id}><span className={`credit-ledger-type ${item.type}`}>{transactionLabel(item.type)}</span><div><strong>{item.description || transactionLabel(item.type)}</strong><small>{formatDateTime(item.createdAt)}{item.status === 'completed' ? ` · 余额 ${formatPoints(item.balanceAfter)}` : ''}<em className={`credit-ledger-status ${item.status}`}>{transactionStatusLabel(item.status)}</em></small></div>{item.status === 'completed' ? <b className={item.points >= 0 ? 'positive' : 'negative'}>{item.points >= 0 ? '+' : ''}{formatPoints(item.points)}</b> : <b className={`credit-ledger-pending ${item.status}`}>{transactionStatusLabel(item.status)}</b>}</div>)}</div> : <div className="credit-inline-empty">还没有积分明细。</div>}
        </section>
      </>}

      <div className="credit-security-note"><ShieldCheck size={15} /><span>模型供应商 API Key、支付商户密钥和计费规则只保存在你的服务端，不进入客户电脑。</span></div>
      <div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onClose}>关闭</button></div>
    </section>
  </div>
}
