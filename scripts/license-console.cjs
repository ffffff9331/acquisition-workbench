const { createHash, createPrivateKey, sign } = require('node:crypto')
const fs = require('node:fs')
const http = require('node:http')
const os = require('node:os')
const path = require('node:path')
const { buildSync } = require('esbuild')

function loadAuth(projectRoot) {
  const outputFile = path.join(os.tmpdir(), `acquisition-license-console-${process.pid}-${Date.now()}.cjs`)
  buildSync({ entryPoints: [path.join(projectRoot, 'src/delivery-pack-auth.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: outputFile, logLevel: 'silent' })
  try {
    return require(outputFile)
  } finally {
    fs.rmSync(outputFile, { force: true })
  }
}

function readJson(filePath, fallback) {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    return parsed && typeof parsed === 'object' ? parsed : fallback
  } catch {
    return fallback
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
}

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function dateOnly(value) {
  const date = cleanText(value, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(new Date(`${date}T00:00:00`).getTime()) ? date : ''
}

function licenseId() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `LIC-${stamp}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function jsonResponse(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  response.end(JSON.stringify(payload))
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = ''
    request.setEncoding('utf8')
    request.on('data', (chunk) => {
      body += chunk
      if (body.length > 50_000) reject(new Error('请求内容过大。'))
    })
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        reject(new Error('请求格式不正确。'))
      }
    })
    request.on('error', reject)
  })
}

function pageHtml() {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>方案发行台</title><style>
*{box-sizing:border-box}body{margin:0;color:#2c4239;font:14px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif;background:#f4f6f4}main{max-width:1100px;margin:0 auto;padding:34px 22px 50px}header{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:24px}h1{margin:0;font-size:28px;letter-spacing:0}h2{margin:0;font-size:16px}p{margin:7px 0 0;color:#71827a}.notice{padding:13px 15px;color:#6b5b35;font-size:12px;background:#fff7e5;border:1px solid #ead9ab;border-radius:6px}.grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:16px;margin-top:16px}.panel{min-width:0;background:#fff;border:1px solid #d8e3dd;border-radius:6px}.panel-head{padding:17px 18px;border-bottom:1px solid #e3ebe7}.panel-body{min-width:0;padding:18px}.catalog{display:grid;gap:8px}.catalog label{display:grid;grid-template-columns:18px minmax(0,1fr);gap:9px;align-items:start;padding:11px;border:1px solid #dce6e1;border-radius:5px;cursor:pointer}.catalog label:has(input:checked){background:#f2f9f5;border-color:#7db09e}.catalog input{margin:3px 0 0;accent-color:#247468}.catalog strong,.catalog small{display:block}.catalog strong{font-size:12px}.catalog small{margin-top:3px;color:#76877f;font-size:11px}.field{display:grid;gap:5px;margin-bottom:12px}.field span{font-size:11px;font-weight:700;color:#5b7067}.field input,.field select{min-width:0;min-height:39px;padding:0 10px;color:#314940;font:inherit;font-size:12px;background:#fff;border:1px solid #ceddd6;border-radius:5px;outline:none}.field input:focus,.field select:focus{border-color:#378878;box-shadow:0 0 0 3px rgba(55,136,120,.11)}.button{display:inline-flex;min-height:39px;align-items:center;justify-content:center;gap:6px;padding:0 13px;color:#fff;font:inherit;font-size:12px;font-weight:700;background:#247468;border:1px solid #247468;border-radius:5px;cursor:pointer}.button:disabled{opacity:.55;cursor:wait}.status{min-height:20px;margin-top:10px;color:#687b72;font-size:12px}.status.error{color:#a04a42}.table-wrap{width:100%;max-width:100%;overflow-x:auto;overscroll-behavior-x:contain}.table{width:100%;border-collapse:collapse}.table th,.table td{padding:10px 8px;text-align:left;border-bottom:1px solid #e5ece8}.table th{color:#72837b;font-size:10px}.table td{font-size:11px}.table code{font:inherit;color:#4a665c}.pill{display:inline-block;padding:2px 5px;color:#1b6b5c;font-size:10px;font-weight:700;background:#e1f2e9;border-radius:3px}.pill.revoked{color:#825448;background:#f5e7e3}.table button{padding:4px 7px;color:#865044;font:inherit;font-size:10px;background:#fff;border:1px solid #ddc4bd;border-radius:3px;cursor:pointer}.ledger-note{margin-top:11px;color:#7b8b84;font-size:11px}@media(max-width:760px){main{padding:24px 15px 38px}header{align-items:flex-start;flex-direction:column}.grid{grid-template-columns:minmax(0,1fr)}.table{min-width:760px}}
</style></head><body><main><header><div><h1>方案发行台</h1><p>仅在服务方电脑运行。这里生成客户专属授权包，不运行客户工作台。</p></div></header><div class="notice">发行记录用于服务管理。撤销记录不会让客户离线保存的旧包立即失效；在线撤销、续费和设备管理需要后续接入真实授权服务。</div><section class="grid"><section class="panel"><div class="panel-head"><h2>选择方案</h2><p>选择一个方案方向，再填写客户给你的工作台编号。</p></div><div class="panel-body"><form id="issue-form"><div id="catalog" class="catalog"></div><label class="field"><span>客户名称</span><input name="customerLabel" maxlength="120" required placeholder="例如：杭州某卫浴门店"></label><label class="field"><span>客户工作台编号</span><input name="installationId" maxlength="120" required placeholder="例如：workbench-xxxx"></label><label class="field"><span>有效期至（可选）</span><input name="expiresAt" type="date"></label><button id="issue-button" class="button" type="submit">生成并下载方案包</button><p id="issue-status" class="status"></p></form></div></section><section class="panel"><div class="panel-head"><h2>已发行台账</h2><p>记录客户、工作台编号、方案与状态。</p></div><div class="panel-body"><div class="table-wrap"><table class="table"><thead><tr><th>客户</th><th>方案</th><th>授权编号</th><th>状态</th><th></th></tr></thead><tbody id="ledger"></tbody></table></div><p class="ledger-note">授权包使用当前客户工作台编号绑定；同一文件导入其他工作台会被拒绝。</p></div></section></section></main><script>
const state={catalog:[]};const $=s=>document.querySelector(s);function text(node,value){node.textContent=value}function make(tag,attrs={},children=[]){const node=document.createElement(tag);Object.entries(attrs).forEach(([key,value])=>{if(key==='className')node.className=value;else if(key==='type')node.type=value;else node.setAttribute(key,value)});children.forEach(child=>node.append(child));return node}async function request(url,options){const response=await fetch(url,options);const data=await response.json();if(!response.ok)throw new Error(data.message||'操作失败。');return data}function renderCatalog(){const root=$('#catalog');root.replaceChildren(...state.catalog.map((pack,index)=>{const input=make('input',{type:'radio',name:'solutionPackId',value:pack.id});input.required=true;if(index===0)input.checked=true;const copy=make('span',{},[make('strong',{},[document.createTextNode(pack.title)]),make('small',{},[document.createTextNode(pack.category+' · '+pack.channels.join('、'))])]);return make('label',{},[input,copy])}))}function renderLedger(licenses){const root=$('#ledger');root.replaceChildren(...licenses.map(item=>{const status=make('span',{className:'pill '+(item.status==='revoked'?'revoked':'')},[document.createTextNode(item.status==='revoked'?'已撤销':'有效')]);const revoke=item.status==='active'?make('button',{type:'button'},[document.createTextNode('登记撤销')]):document.createTextNode('');if(item.status==='active')revoke.addEventListener('click',async()=>{if(!confirm('仅登记撤销，不会回收客户离线已有文件。继续？'))return;await request('/api/revoke',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({licenseId:item.licenseId})});await loadLedger()});return make('tr',{},[make('td',{},[document.createTextNode(item.customerLabel||'未填写')]),make('td',{},[document.createTextNode(item.solutionTitle)]),make('td',{},[make('code',{},[document.createTextNode(item.licenseId)])]),make('td',{},[status]),make('td',{},[revoke])])}))}async function loadLedger(){const data=await request('/api/licenses');renderLedger(data.licenses)}async function boot(){const data=await request('/api/catalog');state.catalog=data.packs;renderCatalog();await loadLedger()}$('#issue-form').addEventListener('submit',async event=>{event.preventDefault();const form=new FormData(event.currentTarget);const button=$('#issue-button');const status=$('#issue-status');button.disabled=true;status.className='status';text(status,'正在生成方案包…');try{const result=await request('/api/issue',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(form))});const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([result.content],{type:'application/json'}));link.download=result.fileName;link.click();URL.revokeObjectURL(link.href);text(status,'已生成 '+result.fileName+'，并写入本地发行台账。');await loadLedger()}catch(error){status.className='status error';text(status,error.message)}finally{button.disabled=false}});boot().catch(error=>{const status=$('#issue-status');status.className='status error';text(status,error.message)});
</script></body></html>`
}

function createLicenseConsole(options = {}) {
  const projectRoot = options.projectRoot || path.resolve(__dirname, '..')
  const auth = loadAuth(projectRoot)
  const privateKeyPath = options.privateKeyPath || path.join(projectRoot, '.keys', 'delivery-pack-signing-private.pem')
  const ledgerPath = options.ledgerPath || path.join(projectRoot, '.licenses', 'solution-license-registry.json')
  const outputDir = options.outputDir || path.join(projectRoot, '.licenses', 'issued')

  function catalog() {
    return auth.deliverySolutionPacks.map((pack) => ({ id: pack.id, title: pack.title, category: pack.category, channels: pack.channelIds }))
  }

  function ledger() {
    const data = readJson(ledgerPath, { licenses: [] })
    return Array.isArray(data.licenses) ? data : { licenses: [] }
  }

  function issue(input) {
    const solutionPackId = cleanText(input.solutionPackId, 120)
    const customerLabel = cleanText(input.customerLabel, 120)
    const installationId = cleanText(input.installationId, 120)
    const expiresAt = input.expiresAt ? dateOnly(input.expiresAt) : ''
    const solutionPack = auth.deliverySolutionPacks.find((pack) => pack.id === solutionPackId)
    if (!solutionPack) throw new Error('请选择一个可发行的方案。')
    if (!customerLabel || !installationId || !/^[a-z0-9-]+$/i.test(installationId)) throw new Error('请填写客户名称和有效的工作台编号。')
    if (input.expiresAt && !expiresAt) throw new Error('有效期格式不正确。')
    if (!fs.existsSync(privateKeyPath)) throw new Error('没有找到方案签名私钥，无法发行授权包。')
    const currentLedger = ledger()
    let nextLicenseId = licenseId()
    while (currentLedger.licenses.some((item) => item.licenseId === nextLicenseId)) nextLicenseId = licenseId()
    const manifest = auth.normalizeDeliveryPackManifest({ solutionPackId, licenseId: nextLicenseId, installationId, issuedAt: new Date().toISOString().slice(0, 10), ...(expiresAt ? { expiresAt } : {}), customerLabel })
    if (!manifest) throw new Error('方案授权信息格式不正确。')
    const privateKey = createPrivateKey(fs.readFileSync(privateKeyPath, 'utf8'))
    const artifact = { schemaVersion: 1, manifest, signature: sign(null, Buffer.from(auth.canonicalDeliveryPackPayload(manifest)), privateKey).toString('base64') }
    const content = `${JSON.stringify(artifact, null, 2)}\n`
    const fileName = `${nextLicenseId}.acqpack`
    fs.mkdirSync(outputDir, { recursive: true })
    fs.writeFileSync(path.join(outputDir, fileName), content, { encoding: 'utf8', mode: 0o600 })
    currentLedger.licenses.unshift({ licenseId: nextLicenseId, solutionPackId, solutionTitle: solutionPack.title, customerLabel, installationId, issuedAt: manifest.issuedAt, expiresAt: manifest.expiresAt || '', status: 'active', fileName, contentSha256: createHash('sha256').update(content).digest('hex') })
    writeJson(ledgerPath, currentLedger)
    return { fileName, content }
  }

  function revoke(input) {
    const licenseIdValue = cleanText(input.licenseId, 120)
    const currentLedger = ledger()
    const target = currentLedger.licenses.find((item) => item.licenseId === licenseIdValue)
    if (!target) throw new Error('没有找到这个授权记录。')
    if (target.status !== 'revoked') {
      target.status = 'revoked'
      target.revokedAt = new Date().toISOString().slice(0, 19)
      writeJson(ledgerPath, currentLedger)
    }
    return { ok: true }
  }

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url || '/', 'http://127.0.0.1')
      if (request.method === 'GET' && url.pathname === '/') {
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
        response.end(pageHtml())
        return
      }
      if (request.method === 'GET' && url.pathname === '/api/catalog') return jsonResponse(response, 200, { packs: catalog() })
      if (request.method === 'GET' && url.pathname === '/api/licenses') return jsonResponse(response, 200, { licenses: ledger().licenses })
      if (request.method === 'POST' && url.pathname === '/api/issue') return jsonResponse(response, 200, issue(await readRequestBody(request)))
      if (request.method === 'POST' && url.pathname === '/api/revoke') return jsonResponse(response, 200, revoke(await readRequestBody(request)))
      return jsonResponse(response, 404, { message: '未找到该接口。' })
    } catch (error) {
      return jsonResponse(response, 400, { message: error instanceof Error ? error.message : '操作失败。' })
    }
  })

  return { server, catalog, issue, ledger, revoke, listen: (port = 4290) => new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server.address().port))) }
}

if (require.main === module) {
  const consoleApp = createLicenseConsole()
  consoleApp.listen(Number(process.env.PORT || 4290)).then((port) => {
    console.log(`方案发行台已启动：http://127.0.0.1:${port}/`)
  })
}

module.exports = { createLicenseConsole }
