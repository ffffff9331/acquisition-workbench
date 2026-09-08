const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { buildSync } = require('esbuild')

const projectRoot = path.resolve(__dirname, '..')
const outputDirectory = path.join(projectRoot, 'node_modules', '.tmp')
const outputFile = path.join(outputDirectory, `acquisition-release-confirmation-${process.pid}.cjs`)

try {
  fs.mkdirSync(outputDirectory, { recursive: true })
  buildSync({
    entryPoints: [path.join(projectRoot, 'src/release-confirmation.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: outputFile,
    logLevel: 'silent',
  })

  const content = require(outputFile)
  const blank = content.normalizeContentReleaseConfirmation({ aiMaterial: '未知', publishingAccount: 23 })
  assert.equal(blank.aiMaterial, '', '未知的 AI 素材状态不能被当成已确认')
  assert.equal(blank.publishingAccount, '', '非文本账号信息不能进入本地记录')
  assert.equal(content.contentReleaseConfirmationReady(blank), false, '缺少发布确认时不能锁定最终版本')

  const aiWithoutLabel = content.normalizeContentReleaseConfirmation({
    aiMaterial: '已使用',
    customerMaterial: '未使用',
    promotionMarking: '不需要',
    publishingAccount: '门店号',
    publisher: '小王',
    inquiryOwner: '店长',
    firstResponseTarget: '当天完成',
    inquiryEntry: '抖音私信说明视频关键词',
    firstResponsePlan: '当天人工确认地区、需求和可预约时段。',
    customerPreparation: '准备户型尺寸和现场照片。',
    serviceBoundary: '仅服务本地城区，最终方案和报价以现场确认后为准。',
    platformRulesCheckedAt: '2026-08-27',
  })
  assert.equal(content.contentReleaseConfirmationReady(aiWithoutLabel), false, '使用 AI 素材但未核对标识时不能通过')

  const caseWithoutAuthorization = content.normalizeContentReleaseConfirmation({
    aiMaterial: '未使用',
    customerMaterial: '已使用',
    promotionMarking: '已按本次平台规则确认',
    publishingAccount: '门店号',
    publisher: '小王',
    inquiryOwner: '店长',
    firstResponseTarget: '当天完成',
    inquiryEntry: '抖音私信说明视频关键词',
    firstResponsePlan: '当天人工确认地区、需求和可预约时段。',
    customerPreparation: '准备户型尺寸和现场照片。',
    serviceBoundary: '仅服务本地城区，最终方案和报价以现场确认后为准。',
    platformRulesCheckedAt: '2026-08-27',
  })
  assert.equal(content.contentReleaseConfirmationReady(caseWithoutAuthorization), false, '使用客户材料但未确认授权时不能通过')

  const ready = content.normalizeContentReleaseConfirmation({
    aiMaterial: '已使用',
    aiLabelChecked: true,
    customerMaterial: '已使用',
    customerMaterialAuthorized: true,
    promotionMarking: '已按本次平台规则确认',
    publishingAccount: '门店号',
    publisher: '小王',
    inquiryOwner: '店长',
    firstResponseTarget: '30分钟内',
    inquiryEntry: '抖音私信说明视频关键词',
    firstResponsePlan: '当天人工确认地区、需求和可预约时段。',
    customerPreparation: '准备户型尺寸和现场照片。',
    serviceBoundary: '仅服务本地城区，最终方案和报价以现场确认后为准。',
    platformRulesCheckedAt: '2026-08-27',
  })
  assert.equal(content.contentReleaseConfirmationReady(ready), true, '补齐必要发布确认后应可进入锁定条件')
  assert.equal(ready.firstResponseTarget, '30分钟内', '发布确认应保留首次人工承接时效')
  const incompleteIntake = content.normalizeContentReleaseConfirmation({ ...ready, serviceBoundary: '' })
  assert.equal(content.contentReleaseConfirmationReady(incompleteIntake), false, '未明确服务与报价边界时不能进入锁定条件')
  console.log('发布确认测试通过：AI 标识、案例授权、推广确认、人工责任和咨询承接卡均已校验。')
} finally {
  fs.rmSync(outputFile, { force: true })
}
