import { deliverySolutionPackById, type DeliverySolutionPack } from './solution-packs'

export { deliverySolutionPacks } from './solution-packs'

const DELIVERY_PACK_SCHEMA_VERSION = 1
const DELIVERY_PACK_PUBLIC_KEY_SPKI_BASE64 = 'MCowBQYDK2VwAyEAzBc+uAY6b2kuPMsuf80C90MAo5L3H0iQmrEppgTFCWs='

export type DeliveryPackManifest = {
  solutionPackId: string
  licenseId: string
  installationId: string
  issuedAt: string
  expiresAt?: string
  customerLabel?: string
}

export type DeliveryPackArtifact = {
  schemaVersion: number
  manifest: DeliveryPackManifest
  signature: string
}

export type VerifiedDeliveryPack = {
  artifact: DeliveryPackArtifact
  solutionPack: DeliverySolutionPack
}

export type DeliveryPackVerification =
  | { ok: true; value: VerifiedDeliveryPack }
  | { ok: false; message: string }

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function normalizedDate(value: unknown) {
  const date = text(value, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(new Date(`${date}T00:00:00`).getTime()) ? date : ''
}

export function normalizeDeliveryPackManifest(value: unknown): DeliveryPackManifest | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const source = value as Record<string, unknown>
  const solutionPackId = text(source.solutionPackId, 120)
  const licenseId = text(source.licenseId, 120)
  const installationId = text(source.installationId, 120)
  const issuedAt = normalizedDate(source.issuedAt)
  const expiresAt = source.expiresAt === undefined || source.expiresAt === null || source.expiresAt === '' ? '' : normalizedDate(source.expiresAt)
  const customerLabel = text(source.customerLabel, 120)
  if (!solutionPackId || !/^[a-z0-9-]+$/i.test(solutionPackId) || !licenseId || !/^[a-z0-9-]+$/i.test(licenseId) || !installationId || !/^[a-z0-9-]+$/i.test(installationId) || !issuedAt || (source.expiresAt && !expiresAt)) return null
  return { solutionPackId, licenseId, installationId, issuedAt, ...(expiresAt ? { expiresAt } : {}), ...(customerLabel ? { customerLabel } : {}) }
}

export function canonicalDeliveryPackPayload(manifest: DeliveryPackManifest) {
  return JSON.stringify({
    schemaVersion: DELIVERY_PACK_SCHEMA_VERSION,
    manifest: {
      solutionPackId: manifest.solutionPackId,
      licenseId: manifest.licenseId,
      installationId: manifest.installationId,
      issuedAt: manifest.issuedAt,
      ...(manifest.expiresAt ? { expiresAt: manifest.expiresAt } : {}),
      ...(manifest.customerLabel ? { customerLabel: manifest.customerLabel } : {}),
    },
  })
}

export function normalizeDeliveryPackArtifact(value: unknown): DeliveryPackArtifact | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const source = value as Record<string, unknown>
  const manifest = normalizeDeliveryPackManifest(source.manifest)
  const signature = text(source.signature, 512)
  if (source.schemaVersion !== DELIVERY_PACK_SCHEMA_VERSION || !manifest || !signature || !/^[a-z0-9+/]+={0,2}$/i.test(signature)) return null
  return { schemaVersion: DELIVERY_PACK_SCHEMA_VERSION, manifest, signature }
}

function base64ToBytes(value: string) {
  const raw = globalThis.atob(value)
  return Uint8Array.from(raw, (character) => character.charCodeAt(0))
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export async function verifyDeliveryPackArtifact(raw: string, publicKeySpkiBase64 = DELIVERY_PACK_PUBLIC_KEY_SPKI_BASE64, expectedInstallationId = ''): Promise<DeliveryPackVerification> {
  if (typeof raw !== 'string' || raw.length > 100_000) return { ok: false, message: '方案包文件无效或内容过大。' }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, message: '方案包不是有效的 JSON 文件。' }
  }
  const artifact = normalizeDeliveryPackArtifact(parsed)
  if (!artifact) return { ok: false, message: '方案包格式不正确。' }
  const solutionPack = deliverySolutionPackById(artifact.manifest.solutionPackId)
  if (!solutionPack) return { ok: false, message: '这个方案包不适用于当前版本的工作台。' }
  if (expectedInstallationId && artifact.manifest.installationId !== expectedInstallationId) return { ok: false, message: '这个方案包不属于当前工作台，请联系服务方重新生成。' }
  if (artifact.manifest.expiresAt && artifact.manifest.expiresAt < today()) return { ok: false, message: '这个方案包已过期，请联系服务方获取新的授权。' }
  if (!globalThis.crypto?.subtle) return { ok: false, message: '当前运行环境不支持方案包签名校验。' }

  try {
    const publicKey = await globalThis.crypto.subtle.importKey('spki', base64ToBytes(publicKeySpkiBase64), { name: 'Ed25519' }, false, ['verify'])
    const verified = await globalThis.crypto.subtle.verify({ name: 'Ed25519' }, publicKey, base64ToBytes(artifact.signature), new TextEncoder().encode(canonicalDeliveryPackPayload(artifact.manifest)))
    return verified ? { ok: true, value: { artifact, solutionPack } } : { ok: false, message: '方案包签名无效，无法确认来源。' }
  } catch {
    return { ok: false, message: '方案包签名校验失败。' }
  }
}
