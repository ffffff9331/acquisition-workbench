const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { createAssetLibrary } = require('../electron/asset-library.cjs')

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'acquisition-asset-library-'))
const sourceRoot = path.join(root, 'source')
const libraryRoot = path.join(root, 'library')
fs.mkdirSync(sourceRoot)

async function verifyAssetLibrary() {
  try {
  const photoPath = path.join(sourceRoot, '安装现场.jpg')
  const secondPhotoPath = path.join(sourceRoot, '安装现场-2.jpg')
  const oversizedPath = path.join(sourceRoot, '过大素材.mp4')
  fs.writeFileSync(photoPath, 'verified-image-bytes')
  fs.writeFileSync(secondPhotoPath, 'verified-image-bytes-2')
  fs.writeFileSync(oversizedPath, 'this-file-is-over-the-test-limit')

  let sequence = 0
  const library = createAssetLibrary({
    root: libraryRoot,
    maxBytes: 20,
    now: () => '2026-09-20T12:00:00.000Z',
    createId: () => `asset-${++sequence}`,
  })

  const imported = await library.importFiles([photoPath, photoPath])
  assert.equal(imported.imported.length, 1, '同一文件重复选择时只能导入一次')
  assert.equal(imported.failures.length, 0, '正常素材导入不应失败')
  assert.equal(imported.imported[0].mimeType, 'image/jpeg', '应根据文件扩展名记录 MIME 类型')
  assert.equal(fs.readFileSync(library.assetPath('asset-1'), 'utf8'), 'verified-image-bytes', '导入后必须复制原文件而不是仅保存路径')
  assert.equal(createAssetLibrary({ root: libraryRoot }).assetPath('asset-1'), library.assetPath('asset-1'), '重开工作台后仍应从索引读取已导入的原文件')
  assert.equal(library.assetPath('../asset-1'), '', '路径穿越形式的素材 ID 不能解析为本机文件')

  const oversized = await library.importFiles([oversizedPath])
  assert.equal(oversized.imported.length, 0, '超过上限的文件不能写入素材库')
  assert.match(oversized.failures[0].message, /超过/, '超限失败必须说明原因')

  assert.equal(await library.removeFile('asset-1'), true, '已导入素材可以从文件库删除')
  assert.equal(library.assetPath('asset-1'), '', '删除后不能继续解析本机文件路径')
  assert.equal(await library.removeFile('asset-1'), false, '重复删除不能误报成功')

  const concurrentRoot = path.join(root, 'concurrent-library')
  const concurrentFirst = createAssetLibrary({ root: concurrentRoot, createId: () => 'concurrent-a' })
  const concurrentSecond = createAssetLibrary({ root: concurrentRoot, createId: () => 'concurrent-b' })
  const [concurrentA, concurrentB] = await Promise.all([
    concurrentFirst.importFiles([photoPath]),
    concurrentSecond.importFiles([secondPhotoPath]),
  ])
  assert.deepEqual(concurrentA.imported.map((asset) => asset.id), ['concurrent-a'], '并发导入中的第一批素材必须完整返回')
  assert.deepEqual(concurrentB.imported.map((asset) => asset.id), ['concurrent-b'], '并发导入中的第二批素材必须完整返回')
  assert.deepEqual(createAssetLibrary({ root: concurrentRoot }).assets().map((asset) => asset.id).sort(), ['concurrent-a', 'concurrent-b'], '并发导入后素材索引不能丢失任一批记录')

  const blockedRoot = path.join(root, 'not-a-directory')
  fs.writeFileSync(blockedRoot, 'not-a-directory')
  const unavailable = await createAssetLibrary({ root: path.join(blockedRoot, 'library') }).importFiles([photoPath])
  assert.equal(unavailable.imported.length, 0, '素材库目录无法创建时不能误报导入成功')
  assert.match(unavailable.failures[0].message, /无法初始化/, '素材库目录不可用时必须返回可展示的失败原因')

  console.log('本机素材库测试通过：异步复制导入、并发写入、重开读取、重复选择、超限拒绝、路径隔离、删除和目录失败均已覆盖。')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}

verifyAssetLibrary().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
