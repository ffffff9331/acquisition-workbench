const { createPrivateKey, sign } = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { buildSync } = require('esbuild')

const projectRoot = path.resolve(__dirname, '..')
const args = Object.fromEntries(process.argv.slice(2).flatMap((value, index, values) => value.startsWith('--') ? [[value.slice(2), values[index + 1]]] : []))
const solutionPackId = String(args.solution || '').trim()
const licenseId = String(args.license || '').trim()
const installationId = String(args.installation || '').trim()
const issuedAt = String(args.issued || new Date().toISOString().slice(0, 10)).trim()
const customerLabel = String(args.customer || '').trim()
const expiresAt = String(args.expires || '').trim()
const privateKeyPath = path.resolve(projectRoot, String(args['private-key'] || '.keys/delivery-pack-signing-private.pem'))
const outputPath = path.resolve(projectRoot, String(args.output || `delivery-packs/${solutionPackId || 'solution'}-${licenseId || 'license'}.acqpack`))

if (!solutionPackId || !licenseId || !installationId || !/^\d{4}-\d{2}-\d{2}$/.test(issuedAt) || (expiresAt && !/^\d{4}-\d{2}-\d{2}$/.test(expiresAt))) {
  throw new Error('用法：npm run create:delivery-pack -- --solution <方案ID> --license <授权编号> --installation <工作台编号> [--customer <客户名称>] [--expires YYYY-MM-DD] [--private-key 私钥路径] [--output 输出路径]')
}

const bundled = path.join(os.tmpdir(), `acquisition-delivery-pack-create-${process.pid}.cjs`)
try {
  buildSync({ entryPoints: [path.join(projectRoot, 'src/delivery-pack-auth.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: bundled, logLevel: 'silent' })
  const auth = require(bundled)
  const manifest = { solutionPackId, licenseId, installationId, issuedAt, ...(expiresAt ? { expiresAt } : {}), ...(customerLabel ? { customerLabel } : {}) }
  const normalized = auth.normalizeDeliveryPackManifest(manifest)
  if (!normalized) throw new Error('方案包信息格式不正确。')
  const privateKey = createPrivateKey(fs.readFileSync(privateKeyPath, 'utf8'))
  const signature = sign(null, Buffer.from(auth.canonicalDeliveryPackPayload(normalized)), privateKey).toString('base64')
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify({ schemaVersion: 1, manifest: normalized, signature }, null, 2)}\n`, 'utf8')
  console.log(`已生成方案授权包：${outputPath}`)
} finally {
  fs.rmSync(bundled, { force: true })
}
