const assert = require('node:assert/strict')
const { generateKeyPairSync, sign } = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { buildSync } = require('esbuild')

const projectRoot = path.resolve(__dirname, '..')
const outputFile = path.join(os.tmpdir(), `acquisition-delivery-pack-auth-${process.pid}.cjs`)

;(async () => {
try {
  buildSync({ entryPoints: [path.join(projectRoot, 'src/delivery-pack-auth.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: outputFile, logLevel: 'silent' })
  const auth = require(outputFile)
  const pair = generateKeyPairSync('ed25519')
  const publicKey = pair.publicKey.export({ type: 'spki', format: 'der' }).toString('base64')
  const installationId = 'workbench-test-20260827-001'
  const manifest = { solutionPackId: 'bathroom-douyin-measurement-solution-v1', licenseId: 'TEST-20260827-001', installationId, issuedAt: '2026-08-27', customerLabel: '测试门店' }
  const artifact = { schemaVersion: 1, manifest, signature: sign(null, Buffer.from(auth.canonicalDeliveryPackPayload(manifest)), pair.privateKey).toString('base64') }

  const valid = await auth.verifyDeliveryPackArtifact(JSON.stringify(artifact), publicKey, installationId)
  assert.equal(valid.ok, true, '有效签名的方案包必须通过校验')
  assert.equal(valid.value.solutionPack.id, manifest.solutionPackId, '签名方案包必须映射到已知方案定义')
  const tampered = await auth.verifyDeliveryPackArtifact(JSON.stringify({ ...artifact, manifest: { ...manifest, licenseId: 'TEST-20260827-002' } }), publicKey, installationId)
  assert.equal(tampered.ok, false, '篡改已签名内容后必须无法通过校验')
  const expiredManifest = { ...manifest, licenseId: 'TEST-EXPIRED-001', expiresAt: '2026-08-26' }
  const expiredArtifact = { schemaVersion: 1, manifest: expiredManifest, signature: sign(null, Buffer.from(auth.canonicalDeliveryPackPayload(expiredManifest)), pair.privateKey).toString('base64') }
  const expired = await auth.verifyDeliveryPackArtifact(JSON.stringify(expiredArtifact), publicKey, installationId)
  assert.equal(expired.ok, false, '到期方案包不得继续导入')
  const unknownManifest = { ...manifest, solutionPackId: 'not-shipped-solution-pack', licenseId: 'TEST-UNKNOWN-001' }
  const unknownArtifact = { schemaVersion: 1, manifest: unknownManifest, signature: sign(null, Buffer.from(auth.canonicalDeliveryPackPayload(unknownManifest)), pair.privateKey).toString('base64') }
  const unknown = await auth.verifyDeliveryPackArtifact(JSON.stringify(unknownArtifact), publicKey, installationId)
  assert.equal(unknown.ok, false, '当前版本未知的方案包不得导入')
  const wrongInstallation = await auth.verifyDeliveryPackArtifact(JSON.stringify(artifact), publicKey, 'another-workbench')
  assert.equal(wrongInstallation.ok, false, '不属于当前工作台的方案包不得导入')
  assert.equal(auth.normalizeDeliveryPackArtifact({ schemaVersion: 1, manifest, signature: 'not a signature' }), null, '格式不正确的签名必须拒绝')

  console.log('方案包签名测试通过：有效签名、篡改、过期、未知方案和格式错误均已覆盖。')
} finally {
  fs.rmSync(outputFile, { force: true })
}
})().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
