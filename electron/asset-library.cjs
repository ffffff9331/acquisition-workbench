const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const DEFAULT_MAX_ASSET_BYTES = 512 * 1024 * 1024
const mutationQueues = new Map()

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function cleanAssetId(value) {
  const id = cleanText(value, 120)
  return /^[A-Za-z0-9_-]+$/.test(id) ? id : ''
}

function cleanStoredName(value) {
  const name = cleanText(value, 180)
  return name && path.basename(name) === name && /^[A-Za-z0-9._-]+$/.test(name) ? name : ''
}

function mimeTypeFor(name) {
  const extension = path.extname(name).toLowerCase()
  const types = {
    '.avif': 'image/avif',
    '.bmp': 'image/bmp',
    '.gif': 'image/gif',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.pdf': 'application/pdf',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.png': 'image/png',
    '.webm': 'video/webm',
    '.webp': 'image/webp',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }
  return types[extension] || 'application/octet-stream'
}

function normalizeIndex(parsed) {
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.assets)) return []
  const seen = new Set()
  return parsed.assets.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const id = cleanAssetId(item.id)
    const storedName = cleanStoredName(item.storedName)
    if (!id || !storedName || seen.has(id)) return []
    seen.add(id)
    return [{
      id,
      name: cleanText(item.name, 260) || storedName,
      storedName,
      mimeType: cleanText(item.mimeType, 160) || mimeTypeFor(storedName),
      size: Number.isFinite(item.size) && item.size >= 0 ? Math.floor(item.size) : 0,
      createdAt: cleanText(item.createdAt, 60) || new Date(0).toISOString(),
    }]
  })
}

function readIndex(indexPath) {
  try {
    return normalizeIndex(JSON.parse(fs.readFileSync(indexPath, 'utf8')))
  } catch {
    return []
  }
}

async function readIndexAsync(indexPath) {
  try {
    return normalizeIndex(JSON.parse(await fs.promises.readFile(indexPath, 'utf8')))
  } catch {
    return []
  }
}

function withAssetMutation(root, operation) {
  const previous = mutationQueues.get(root) || Promise.resolve()
  const mutation = previous.catch(() => undefined).then(operation)
  mutationQueues.set(root, mutation)
  return mutation.finally(() => {
    if (mutationQueues.get(root) === mutation) mutationQueues.delete(root)
  })
}

async function writeIndexAsync(indexPath, assets) {
  await fs.promises.mkdir(path.dirname(indexPath), { recursive: true })
  const temporaryPath = `${indexPath}.${crypto.randomUUID()}.tmp`
  try {
    await fs.promises.writeFile(temporaryPath, JSON.stringify({ version: 1, assets }, null, 2), { encoding: 'utf8', mode: 0o600 })
    await fs.promises.rename(temporaryPath, indexPath)
  } catch (error) {
    await fs.promises.rm(temporaryPath, { force: true }).catch(() => undefined)
    throw error
  }
}

function createAssetLibrary({ root, maxBytes = DEFAULT_MAX_ASSET_BYTES, now = () => new Date().toISOString(), createId = () => crypto.randomUUID().replace(/-/g, '') } = {}) {
  if (!root || !path.isAbsolute(root)) throw new Error('Asset library root must be an absolute path')
  const assetRoot = path.resolve(root)
  const indexPath = path.join(assetRoot, 'index.json')

  function destinationPath(storedName) {
    const safeName = cleanStoredName(storedName)
    if (!safeName) return ''
    const candidate = path.resolve(assetRoot, safeName)
    return candidate.startsWith(`${assetRoot}${path.sep}`) ? candidate : ''
  }

  function assets() {
    return readIndex(indexPath)
  }

  function assetById(id) {
    const safeId = cleanAssetId(id)
    return safeId ? assets().find((item) => item.id === safeId) || null : null
  }

  function assetPath(id) {
    const asset = assetById(id)
    if (!asset) return ''
    const filePath = destinationPath(asset.storedName)
    return filePath && fs.existsSync(filePath) ? filePath : ''
  }

  async function importFiles(filePaths) {
    if (!Array.isArray(filePaths)) return { imported: [], failures: [] }
    return withAssetMutation(assetRoot, async () => {
      let current
      try {
        await fs.promises.mkdir(assetRoot, { recursive: true })
        current = await readIndexAsync(indexPath)
      } catch (error) {
        return { imported: [], failures: [{ name: '素材库', message: `无法初始化素材库：${error instanceof Error ? error.message : '未知错误'}` }] }
      }
      const imported = []
      const failures = []
      const seenPaths = new Set()

      for (const value of filePaths) {
        if (typeof value !== 'string' || !value) continue
        const sourcePath = path.resolve(value)
        if (seenPaths.has(sourcePath)) continue
        seenPaths.add(sourcePath)
        try {
          const stat = await fs.promises.stat(sourcePath)
          if (!stat.isFile()) throw new Error('请选择文件，不支持导入文件夹')
          if (stat.size > maxBytes) throw new Error(`文件超过 ${Math.floor(maxBytes / 1024 / 1024)} MB 上限`)
          const sourceName = path.basename(sourcePath).slice(0, 260)
          const extension = path.extname(sourceName).toLowerCase().replace(/[^a-z0-9.]/g, '').slice(0, 16)
          let id = cleanAssetId(createId())
          while (!id || current.some((asset) => asset.id === id) || imported.some((asset) => asset.id === id)) id = cleanAssetId(createId())
          const storedName = `${id}${extension}`
          const targetPath = destinationPath(storedName)
          if (!targetPath) throw new Error('无法创建安全的本机素材路径')
          await fs.promises.copyFile(sourcePath, targetPath, fs.constants.COPYFILE_EXCL)
          const asset = { id, name: sourceName, storedName, mimeType: mimeTypeFor(sourceName), size: stat.size, createdAt: now() }
          imported.push(asset)
        } catch (error) {
          failures.push({ name: path.basename(sourcePath), message: error instanceof Error ? error.message : '导入失败' })
        }
      }

      if (!imported.length) return { imported, failures }
      try {
        await writeIndexAsync(indexPath, [...imported, ...current])
      } catch (error) {
        await Promise.allSettled(imported.map((asset) => fs.promises.rm(destinationPath(asset.storedName), { force: true })))
        return { imported: [], failures: [...failures, { name: '素材库', message: `无法保存素材库索引：${error instanceof Error ? error.message : '未知错误'}` }] }
      }
      return { imported, failures }
    })
  }

  async function removeFile(id) {
    return withAssetMutation(assetRoot, async () => {
      const safeId = cleanAssetId(id)
      if (!safeId) return false
      const current = await readIndexAsync(indexPath)
      const asset = current.find((item) => item.id === safeId)
      if (!asset) return false
      const filePath = destinationPath(asset.storedName)
      if (filePath) await fs.promises.rm(filePath, { force: true })
      await writeIndexAsync(indexPath, current.filter((item) => item.id !== asset.id))
      return true
    })
  }

  return { assets, assetById, assetPath, importFiles, removeFile }
}

module.exports = { DEFAULT_MAX_ASSET_BYTES, createAssetLibrary, mimeTypeFor }
