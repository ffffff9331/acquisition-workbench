const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { buildSync } = require('esbuild')

const projectRoot = path.resolve(__dirname, '..')
const outputDirectory = path.join(projectRoot, 'node_modules', '.tmp')
const outputFile = path.join(outputDirectory, `acquisition-operations-core-${process.pid}.cjs`)

try {
  fs.mkdirSync(outputDirectory, { recursive: true })
  buildSync({
    entryPoints: [path.join(projectRoot, 'src/operations-core.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: outputFile,
    logLevel: 'silent',
  })

  const operations = require(outputFile)
  const empty = operations.normalizeOperationsData(undefined)
  assert.deepEqual(empty, operations.emptyOperationsData, '旧版工作台没有运营字段时，应平滑迁移为空运营区')

  const normalized = operations.normalizeOperationsData({
    assets: [{ id: 'asset-1', name: '安装现场图', kind: '图片', status: '可公开', description: '已取得授权。', location: '客户授权邮件', file: { id: 'file-1', name: '安装现场图.jpg', mimeType: 'image/jpeg', size: 2048, importedAt: '2026-09-20T10:00:00.000Z' }, tags: ['安装', '安装', '卫浴'], contentTaskIds: ['content-1', 'content-1'], createdAt: '2026-09-20T10:00:00.000Z' }],
    experiments: [{ id: 'experiment-1', title: '开头对比', status: '验证中', hypothesis: '先讲安装风险会带来更多有效私信。', changedVariable: '前三秒开头', successSignal: '有效私信', result: '', conclusion: '', contentTaskId: 'content-1', createdAt: '2026-09-20T10:00:00.000Z' }],
    knowledgeReferences: [{ id: 'knowledge-1', title: '抖音首三秒笔记', source: 'Obsidian', summary: '首句先说客户问题。', location: '/notes/douyin.md', tags: ['抖音', '开头'], contentTaskIds: ['content-1'], createdAt: '2026-09-20T10:00:00.000Z' }],
  })
  assert.equal(normalized.assets[0].tags.length, 2, '重复标签应去重')
  assert.equal(normalized.assets[0].contentTaskIds.length, 1, '重复内容关联应去重')
  assert.deepEqual(normalized.assets[0].file, { id: 'file-1', name: '安装现场图.jpg', mimeType: 'image/jpeg', size: 2048, importedAt: '2026-09-20T10:00:00.000Z' }, '已导入原文件的元数据必须随运营记录持久化')
  assert.equal(operations.operationalReadiness(normalized, ['content-1']).publicAssets, 1, '公开素材应被内容运营闭环识别')
  assert.equal(operations.operationalReadiness(normalized, ['content-1']).completedExperiments, 0, '验证中实验不能被当成已验证结论')
  assert.deepEqual(operations.operationalReadiness(normalized, ['content-2']), { linkedAssets: [], publicAssets: 0, linkedExperiments: [], completedExperiments: 0, linkedKnowledge: 0 }, '未关联当前内容任务的运营记录不能被错误计入就绪度')
  const pruned = operations.pruneOperationsContentLinks(normalized, [])
  assert.deepEqual(pruned.assets[0].contentTaskIds, [], '内容任务被删除后，素材关联必须同步清理')
  assert.equal(pruned.experiments[0].contentTaskId, '', '内容任务被删除后，实验关联必须同步清理')
  assert.deepEqual(pruned.knowledgeReferences[0].contentTaskIds, [], '内容任务被删除后，知识关联必须同步清理')

  const invalid = operations.normalizeOperationsData({
    assets: [{ name: 42, kind: '未知', status: '已公开', file: { id: '../unsafe', size: -1 }, tags: '错误类型', contentTaskIds: [null, 3] }],
    experiments: [{ title: 12, status: '完成', contentTaskId: 3 }],
    knowledgeReferences: [{ title: false, tags: ['有效', 7], contentTaskIds: '错误类型' }],
  })
  assert.equal(invalid.assets[0].name, '', '非法素材名称不能进入统一数据')
  assert.equal(invalid.assets[0].kind, '图片', '未知素材类型必须回退到安全默认值')
  assert.equal(invalid.assets[0].status, '待整理', '未知公开状态必须回退到待整理')
  assert.equal(invalid.assets[0].file, null, '非法本机文件标识不能进入统一数据')
  assert.deepEqual(invalid.assets[0].contentTaskIds, [], '非法内容关联不能进入统一数据')
  assert.equal(invalid.experiments[0].status, '计划中', '未知实验状态必须回退到计划中')
  assert.deepEqual(invalid.knowledgeReferences[0].tags, ['有效'], '知识标签只能保存有效字符串')

  const duplicateIds = operations.normalizeOperationsData({
    assets: [{ id: 'same-id', name: 'A' }, { id: 'same-id', name: 'B' }],
    experiments: [{ id: 'same-id', title: 'A' }, { id: 'same-id', title: 'B' }],
    knowledgeReferences: [{ id: 'same-id', title: 'A' }, { id: 'same-id', title: 'B' }],
  })
  assert.equal(new Set(duplicateIds.assets.map((item) => item.id)).size, 2, '素材重复 ID 必须在迁移时修复')
  assert.equal(new Set(duplicateIds.experiments.map((item) => item.id)).size, 2, '实验重复 ID 必须在迁移时修复')
  assert.equal(new Set(duplicateIds.knowledgeReferences.map((item) => item.id)).size, 2, '知识重复 ID 必须在迁移时修复')

  const manyAssets = Array.from({ length: 101 }, (_, index) => ({ id: `page-${index + 1}`, name: `素材 ${index + 1}`, kind: '图片', status: '待整理', description: '', location: '', file: null, tags: [], contentTaskIds: [], createdAt: '', updatedAt: '' }))
  const firstAssetPage = operations.paginateOperationsAssets(manyAssets, 1, 50)
  assert.deepEqual(firstAssetPage.items.map((item) => item.id), manyAssets.slice(0, 50).map((item) => item.id), '素材库首页只能渲染当前页的固定数量')
  assert.deepEqual(operations.paginateOperationsAssets(manyAssets, 3, 50), { items: [manyAssets[100]], page: 3, totalPages: 3, totalItems: 101 }, '最后一页必须仍可访问，不得因分页被隐藏')
  assert.equal(operations.paginateOperationsAssets(manyAssets, 9, 50).page, 3, '越界页码必须回退到最后一个可访问页面')

  console.log('运营合并核心测试通过：旧数据迁移、原文件元数据、内容关联、失效关联清理、分页、实验状态和非法输入边界均已覆盖。')
} finally {
  fs.rmSync(outputFile, { force: true })
}
