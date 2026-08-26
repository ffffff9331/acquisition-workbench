import { useEffect, useMemo, useState } from 'react'
import { Check, CircleHelp, Coins, ExternalLink, KeyRound, LoaderCircle, ShieldCheck, Sparkles, X } from 'lucide-react'

export type AIServiceMode = 'official' | 'custom'

export type AIServiceSettings = {
  mode: AIServiceMode
  officialWorkspaceId: string
  customBaseUrl: string
  customModel: string
}

export type AISecretStatus = {
  officialTokenSaved: boolean
  customApiKeySaved: boolean
  secureStorageAvailable: boolean
}

const SETTINGS_KEY = 'acquisition-workbench-ai-settings-v1'

const defaultSettings: AIServiceSettings = {
  mode: 'official',
  officialWorkspaceId: '',
  customBaseUrl: '',
  customModel: '',
}

export function loadAIServiceSettings(): AIServiceSettings {
  try {
    const saved = window.localStorage.getItem(SETTINGS_KEY)
    if (!saved) return defaultSettings
    const parsed = JSON.parse(saved) as Partial<AIServiceSettings>
    return {
      mode: parsed.mode === 'custom' ? 'custom' : 'official',
      officialWorkspaceId: typeof parsed.officialWorkspaceId === 'string' ? parsed.officialWorkspaceId : '',
      customBaseUrl: typeof parsed.customBaseUrl === 'string' ? parsed.customBaseUrl : '',
      customModel: typeof parsed.customModel === 'string' ? parsed.customModel : '',
    }
  } catch {
    return defaultSettings
  }
}

function isNonEmpty(value: string) {
  return value.trim().length > 0
}

function isAllowedServiceUrl(value: string) {
  try {
    const url = new URL(value.trim())
    const localDevelopmentHost = url.hostname === '127.0.0.1' || url.hostname === 'localhost'
    return url.protocol === 'https:' || url.protocol === 'http:' && localDevelopmentHost
  } catch {
    return false
  }
}

export function AIServiceDialog({ settings, secretStatus, onClose, onSave, onToast }: { settings: AIServiceSettings; secretStatus: AISecretStatus; onClose: () => void; onSave: (settings: AIServiceSettings, secretStatus: AISecretStatus) => void; onToast: (message: string) => void }) {
  const [mode, setMode] = useState<AIServiceMode>(settings.mode)
  const [officialWorkspaceId, setOfficialWorkspaceId] = useState(settings.officialWorkspaceId)
  const [officialToken, setOfficialToken] = useState('')
  const [customBaseUrl, setCustomBaseUrl] = useState(settings.customBaseUrl)
  const [customModel, setCustomModel] = useState(settings.customModel)
  const [customApiKey, setCustomApiKey] = useState('')
  const [currentSecrets, setCurrentSecrets] = useState(secretStatus)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [error, setError] = useState('')

  const desktopAI = window.workbenchDesktop?.ai
  const hasCurrentCredential = mode === 'official' ? currentSecrets.officialTokenSaved : currentSecrets.customApiKeySaved
  const canSaveOfficial = isNonEmpty(officialWorkspaceId) && (isNonEmpty(officialToken) || currentSecrets.officialTokenSaved)
  const canSaveCustom = isNonEmpty(customBaseUrl) && isNonEmpty(customModel) && (isNonEmpty(customApiKey) || currentSecrets.customApiKeySaved)
  const saveAllowed = mode === 'official' ? canSaveOfficial : canSaveCustom
  const selectedCopy = useMemo(() => mode === 'official'
    ? { title: '官方 AI 服务', note: '由工作台提供生成服务，使用额度按预付余额计算。' }
    : { title: '接入自己的 AI 服务', note: '模型费用由您直接向服务商支付，生成质量取决于所选模型。' }, [mode])

  useEffect(() => {
    setError('')
    setTestResult(null)
  }, [mode])

  const refreshSecretStatus = async () => {
    if (!desktopAI) return currentSecrets
    const next = await desktopAI.getSecretStatus()
    setCurrentSecrets(next)
    return next
  }

  const save = async () => {
    setError('')
    if (!desktopAI) {
      setError('请在 Windows 桌面版中保存 AI 服务凭据。')
      return
    }
    if (!saveAllowed) {
      setError(mode === 'official' ? '请填写工作台编号和服务授权码。' : '请填写服务地址、模型名称和 API Key。')
      return
    }
    if (mode === 'custom' && !isAllowedServiceUrl(customBaseUrl)) {
      setError('服务地址必须使用 HTTPS；仅本机开发可使用 HTTP。')
      return
    }
    setSaving(true)
    try {
      if (mode === 'official' && isNonEmpty(officialToken)) await desktopAI.saveOfficialToken(officialToken.trim())
      if (mode === 'custom' && isNonEmpty(customApiKey)) await desktopAI.saveCustomApiKey(customApiKey.trim())
      const nextSecrets = await refreshSecretStatus()
      onSave({ mode, officialWorkspaceId: officialWorkspaceId.trim(), customBaseUrl: customBaseUrl.trim().replace(/\/$/, ''), customModel: customModel.trim() }, nextSecrets)
    } catch {
      setError('凭据保存失败，请确认当前 Windows 账户可以使用系统安全存储。')
    } finally {
      setSaving(false)
    }
  }

  const testCustomService = async () => {
    setError('')
    setTestResult(null)
    if (!desktopAI) {
      setError('连通性测试仅可在 Windows 桌面版中运行。')
      return
    }
    if (!isNonEmpty(customBaseUrl) || (!isNonEmpty(customApiKey) && !currentSecrets.customApiKeySaved)) {
      setError('请先填写服务地址和 API Key，或保存已有的 API Key。')
      return
    }
    setTesting(true)
    try {
      const result = await desktopAI.testCustomService({ baseUrl: customBaseUrl.trim(), apiKey: customApiKey.trim() || undefined })
      setTestResult(result)
    } catch {
      setTestResult({ ok: false, message: '无法完成测试，请检查网络、服务地址和 API Key。' })
    } finally {
      setTesting(false)
    }
  }

  const removeCurrentCredential = async () => {
    if (!desktopAI) return
    const key = mode === 'official' ? 'official' : 'custom'
    await desktopAI.clearSecret(key)
    setOfficialToken('')
    setCustomApiKey('')
    const nextSecrets = await refreshSecretStatus()
    onToast(key === 'official' ? '官方服务授权码已移除' : '自有 API Key 已移除')
    setCurrentSecrets(nextSecrets)
  }

  return <div className="dialog-backdrop" role="presentation">
    <section className="dialog ai-service-dialog" role="dialog" aria-modal="true" aria-labelledby="ai-service-title">
      <div className="dialog-head"><div><span className="eyebrow"><Sparkles size={14} />AI 服务</span><h2 id="ai-service-title">选择生成服务</h2><p>获客能力会调用这里配置的服务来生成选题、脚本、话术和内容结构。</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={18} /></button></div>

      <div className="service-choice" role="radiogroup" aria-label="AI 服务类型">
        <button className={mode === 'official' ? 'selected' : ''} type="button" role="radio" aria-checked={mode === 'official'} onClick={() => setMode('official')}><span className="service-choice-icon official"><Sparkles size={18} /></span><span><strong>官方 AI 服务</strong><small>推荐，充值积分使用</small></span><Check size={16} /></button>
        <button className={mode === 'custom' ? 'selected' : ''} type="button" role="radio" aria-checked={mode === 'custom'} onClick={() => setMode('custom')}><span className="service-choice-icon custom"><KeyRound size={18} /></span><span><strong>接入自己的 AI 服务</strong><small>使用自己的 API Key</small></span><Check size={16} /></button>
      </div>

      <div className="service-info"><ShieldCheck size={17} /><div><strong>{selectedCopy.title}</strong><span>{selectedCopy.note}</span></div></div>

      {mode === 'official' ? <div className="ai-form">
        <label className="field"><span>工作台编号</span><input value={officialWorkspaceId} onChange={(event) => setOfficialWorkspaceId(event.target.value)} autoFocus placeholder="由部署人员提供" /></label>
        <label className="field"><span>服务授权码</span><input type="password" value={officialToken} onChange={(event) => setOfficialToken(event.target.value)} placeholder={currentSecrets.officialTokenSaved ? '已安全保存，输入新码可替换' : '由部署人员提供'} autoComplete="off" /></label>
        <div className="service-detail official-detail"><Coins size={18} /><div><strong>充值积分后使用官方生成服务</strong><p>余额、充值套餐、到账结果和使用明细由官方网关统一管理；每次生成成功后，按服务端确认的实际消耗扣除积分。</p></div></div>
      </div> : <div className="ai-form">
        <label className="field field-wide"><span>服务地址</span><input type="url" value={customBaseUrl} onChange={(event) => setCustomBaseUrl(event.target.value)} autoFocus placeholder="例如：https://api.example.com/v1" /></label>
        <label className="field"><span>模型名称</span><input value={customModel} onChange={(event) => setCustomModel(event.target.value)} placeholder="例如：your-model-name" /></label>
        <label className="field"><span>API Key</span><input type="password" value={customApiKey} onChange={(event) => setCustomApiKey(event.target.value)} placeholder={currentSecrets.customApiKeySaved ? '已安全保存，输入新 Key 可替换' : '由服务商提供'} autoComplete="off" /></label>
        <div className="self-service-warning"><CircleHelp size={17} /><p>工作台会继续提供行业流程和内容结构；第三方模型的质量、速度、限流、价格和可用性由对应服务商决定。</p></div>
        <div className="test-row"><button className="button button-secondary" type="button" disabled={testing} onClick={() => void testCustomService()}>{testing ? <LoaderCircle className="spin" size={16} /> : <ExternalLink size={15} />}{testing ? '正在测试' : '测试连接'}</button>{testResult && <span className={testResult.ok ? 'test-result success' : 'test-result error'}>{testResult.message}</span>}</div>
      </div>}

      {hasCurrentCredential && <div className="credential-note"><ShieldCheck size={15} /><span>当前凭据已加密保存于这台 Windows 电脑，不会写入客户资料或导出文件。</span><button type="button" onClick={() => void removeCurrentCredential()}>移除凭据</button></div>}
      {!currentSecrets.secureStorageAvailable && <div className="service-error">当前设备未检测到系统安全存储。为保护凭据，工作台不会保存 API Key 或服务授权码。</div>}
      {error && <div className="service-error">{error}</div>}
      <div className="dialog-foot"><button className="button button-secondary" type="button" onClick={onClose}>取消</button><button className="button button-primary" type="button" onClick={() => void save()} disabled={saving}>{saving ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}{saving ? '正在保存' : '保存服务'}</button></div>
    </section>
  </div>
}
