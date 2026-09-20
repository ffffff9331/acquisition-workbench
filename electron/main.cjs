const { app, BrowserWindow, dialog, ipcMain, net, protocol, safeStorage, shell } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { createOfficialServiceClient, normalizeBaseUrl } = require('./official-service.cjs')
const { createCustomServiceClient } = require('./custom-service.cjs')
const { createAssetLibrary } = require('./asset-library.cjs')
const { enableSingleInstance } = require('./single-instance.cjs')

const isDevelopment = Boolean(process.env.VITE_DEV_SERVER_URL)

function assetLibrary() {
  return createAssetLibrary({ root: path.join(app.getPath('userData'), 'assets') })
}

function secretStorePath() {
  return path.join(app.getPath('userData'), 'ai-service-secrets.json')
}

function canUseSecureStorage() {
  try {
    return safeStorage.isEncryptionAvailable()
  } catch {
    return false
  }
}

function loadSecretStore() {
  try {
    const raw = fs.readFileSync(secretStorePath(), 'utf8')
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveSecretStore(store) {
  fs.mkdirSync(path.dirname(secretStorePath()), { recursive: true })
  fs.writeFileSync(secretStorePath(), JSON.stringify(store), { encoding: 'utf8', mode: 0o600 })
}

function encryptedSecretExists(kind) {
  const value = loadSecretStore()[kind]
  return typeof value === 'string' && value.length > 0
}

function readSecret(kind) {
  const encrypted = loadSecretStore()[kind]
  if (typeof encrypted !== 'string' || !encrypted || !canUseSecureStorage()) return ''
  try {
    return safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
  } catch {
    return ''
  }
}

function saveSecret(kind, value) {
  if (!canUseSecureStorage()) throw new Error('Secure storage is unavailable')
  const store = loadSecretStore()
  store[kind] = safeStorage.encryptString(value).toString('base64')
  saveSecretStore(store)
}

function clearSecret(kind) {
  const store = loadSecretStore()
  delete store[kind]
  saveSecretStore(store)
}

function secretStatus() {
  return {
    officialTokenSaved: encryptedSecretExists('official'),
    customApiKeySaved: encryptedSecretExists('custom'),
    secureStorageAvailable: canUseSecureStorage(),
  }
}

function researchSecretStatus() {
  return {
    searchApiKeySaved: encryptedSecretExists('search'),
    secureStorageAvailable: canUseSecureStorage(),
  }
}

function validSecretInput(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 4096
}

function officialServiceBaseUrl() {
  const environmentUrl = normalizeBaseUrl(process.env.ACQUISITION_WORKBENCH_OFFICIAL_API_URL)
  if (environmentUrl) return environmentUrl
  try {
    const configPath = path.join(__dirname, 'official-service.json')
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    return normalizeBaseUrl(config?.baseUrl)
  } catch {
    return ''
  }
}

function officialServiceClient() {
  return createOfficialServiceClient({
    baseUrl: officialServiceBaseUrl(),
    getToken: () => readSecret('official'),
  })
}

function customServiceClient() {
  return createCustomServiceClient({ getApiKey: () => readSecret('custom') })
}

function registerAIServiceHandlers() {
  ipcMain.handle('ai:get-secret-status', () => secretStatus())

  ipcMain.handle('ai:save-official-token', (_event, token) => {
    if (!validSecretInput(token)) throw new Error('Invalid token')
    saveSecret('official', token.trim())
  })

  ipcMain.handle('ai:save-custom-api-key', (_event, apiKey) => {
    if (!validSecretInput(apiKey)) throw new Error('Invalid API key')
    saveSecret('custom', apiKey.trim())
  })

  ipcMain.handle('ai:clear-secret', (_event, kind) => {
    if (kind !== 'official' && kind !== 'custom') throw new Error('Invalid secret kind')
    clearSecret(kind)
  })

  ipcMain.handle('ai:test-custom-service', async (_event, input) => {
    const suppliedKey = typeof input?.apiKey === 'string' ? input.apiKey.trim() : ''
    const client = suppliedKey ? createCustomServiceClient({ getApiKey: () => suppliedKey }) : customServiceClient()
    return client.test(input?.baseUrl)
  })

  ipcMain.handle('ai:generate-custom', async (_event, input) => {
    return customServiceClient().generate(input)
  })

  ipcMain.handle('ai:get-official-service-status', () => ({ configured: officialServiceClient().configured }))

  ipcMain.handle('ai:get-credit-account', async (_event, input) => {
    return officialServiceClient().getCreditAccount(input?.workspaceId)
  })

  ipcMain.handle('ai:create-recharge-order', async (_event, input) => {
    return officialServiceClient().createRechargeOrder(input?.workspaceId, input?.packageId)
  })

  ipcMain.handle('ai:generate-official', async (_event, input) => {
    return officialServiceClient().generate(input)
  })

  ipcMain.handle('system:open-external', async (_event, rawUrl) => {
    try {
      const url = new URL(rawUrl)
      if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname))) throw new Error('Unsupported URL')
      await shell.openExternal(url.toString())
      return { ok: true }
    } catch {
      return { ok: false, message: '无法打开支付页面。' }
    }
  })
}

function registerAssetHandlers() {
  ipcMain.handle('assets:import-files', async () => {
    const selection = await dialog.showOpenDialog({
      title: '导入本机素材',
      buttonLabel: '导入素材',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: '常用素材', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'mp4', 'mov', 'webm', 'mp3', 'pdf', 'xlsx'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    })
    if (selection.canceled || !selection.filePaths.length) return { ok: true, imported: [], failures: [] }
    try {
      const result = await assetLibrary().importFiles(selection.filePaths)
      return { ok: true, ...result }
    } catch {
      return { ok: false, message: '本机素材导入失败，请检查磁盘空间和文件夹权限。', imported: [], failures: [] }
    }
  })

  ipcMain.handle('assets:open-file', async (_event, id) => {
    const filePath = assetLibrary().assetPath(id)
    if (!filePath) return { ok: false, message: '找不到已导入的本机素材。' }
    const message = await shell.openPath(filePath)
    return message ? { ok: false, message } : { ok: true }
  })

  ipcMain.handle('assets:reveal-file', async (_event, id) => {
    const filePath = assetLibrary().assetPath(id)
    if (!filePath) return { ok: false, message: '找不到已导入的本机素材。' }
    shell.showItemInFolder(filePath)
    return { ok: true }
  })

  ipcMain.handle('assets:delete-file', async (_event, id) => {
    try {
      if (!await assetLibrary().removeFile(id)) return { ok: false, message: '找不到已导入的本机素材。' }
      return { ok: true }
    } catch {
      return { ok: false, message: '无法删除本机素材，请检查磁盘空间和文件夹权限。' }
    }
  })
}

function registerAssetProtocol() {
  protocol.handle('workbench-asset', async (request) => {
    try {
      const url = new URL(request.url)
      if (url.protocol !== 'workbench-asset:' || (url.pathname && url.pathname !== '/')) return new Response('Not found', { status: 404 })
      const filePath = assetLibrary().assetPath(url.hostname)
      if (!filePath) return new Response('Not found', { status: 404 })
      return net.fetch(pathToFileURL(filePath).toString())
    } catch {
      return new Response('Not found', { status: 404 })
    }
  })
}

function safeSearchResult(value) {
  if (!value || typeof value !== 'object') return null
  const title = typeof value.title === 'string' ? value.title.trim().slice(0, 300) : ''
  const rawUrl = typeof value.url === 'string' ? value.url.trim() : ''
  let url = ''
  try {
    const parsed = new URL(rawUrl)
    if (!['https:', 'http:'].includes(parsed.protocol)) return null
    url = parsed.toString()
  } catch {
    return null
  }
  if (!title || !url) return null
  return {
    title,
    url,
    summary: typeof value.content === 'string' ? value.content.trim().slice(0, 1200) : '',
    publishedDate: typeof value.published_date === 'string' ? value.published_date.trim().slice(0, 40) : '',
    score: Number.isFinite(value.score) ? Math.max(0, Math.min(1, value.score)) : 0,
  }
}

function registerResearchHandlers() {
  const sourceDomains = {
    web: [],
    douyin: ['douyin.com'],
    xiaohongshu: ['xiaohongshu.com'],
    wechat: ['mp.weixin.qq.com'],
    bilibili: ['bilibili.com'],
  }

  ipcMain.handle('research:get-secret-status', () => researchSecretStatus())

  ipcMain.handle('research:save-search-api-key', (_event, apiKey) => {
    if (!validSecretInput(apiKey)) throw new Error('Invalid API key')
    saveSecret('search', apiKey.trim())
  })

  ipcMain.handle('research:clear-search-api-key', () => clearSecret('search'))

  ipcMain.handle('research:search', async (_event, input) => {
    const query = typeof input?.query === 'string' ? input.query.trim().slice(0, 300) : ''
    const source = Object.prototype.hasOwnProperty.call(sourceDomains, input?.source) ? input.source : 'web'
    const freshness = ['week', 'month', 'year', 'all'].includes(input?.freshness) ? input.freshness : 'month'
    const apiKey = readSecret('search')
    if (!query) return { ok: false, message: '请先输入搜索词。', results: [] }
    if (!apiKey) return { ok: false, message: '请先配置联网搜索服务。', results: [] }

    const body = {
      query,
      topic: 'general',
      search_depth: 'basic',
      max_results: 8,
      include_answer: false,
      include_raw_content: false,
      include_images: false,
      country: 'china',
      language: 'zh-cn',
      filter_by_language: false,
    }
    if (freshness !== 'all') body.time_range = freshness
    if (sourceDomains[source].length) body.include_domains = sourceDomains[source]

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        redirect: 'error',
        signal: controller.signal,
      })
      if (response.status === 401 || response.status === 403) return { ok: false, message: '搜索服务 API Key 无效或没有权限。', results: [] }
      if (!response.ok) return { ok: false, message: `搜索服务返回了 ${response.status} 状态。`, results: [] }
      const payload = await response.json()
      const results = Array.isArray(payload?.results) ? payload.results.map(safeSearchResult).filter(Boolean) : []
      return { ok: true, message: '', results }
    } catch {
      return { ok: false, message: '无法连接联网搜索服务，请检查网络后重试。', results: [] }
    } finally {
      clearTimeout(timer)
    }
  })
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1480,
    height: 960,
    minWidth: 1040,
    minHeight: 700,
    show: false,
    backgroundColor: '#f6f7f5',
    title: '获客运营工作台',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  window.once('ready-to-show', () => window.show())
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDevelopment) {
    window.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

function focusPrimaryWindow() {
  const window = BrowserWindow.getAllWindows()[0]
  if (!window) return
  if (window.isMinimized()) window.restore()
  window.focus()
}

if (enableSingleInstance(app, focusPrimaryWindow)) {
  app.whenReady().then(() => {
    app.setAppUserModelId('com.acquisitionworkbench.desktop')
    registerAIServiceHandlers()
    registerAssetHandlers()
    registerResearchHandlers()
    registerAssetProtocol()
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
