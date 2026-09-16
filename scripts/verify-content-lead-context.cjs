const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { buildSync } = require('esbuild')

const projectRoot = path.resolve(__dirname, '..')
const outputDirectory = path.join(projectRoot, 'node_modules', '.tmp')
const outputFile = path.join(outputDirectory, `acquisition-content-lead-context-${process.pid}.cjs`)
const historyOutputFile = path.join(outputDirectory, `acquisition-content-lead-history-${process.pid}.cjs`)
const reviewOutputFile = path.join(outputDirectory, `acquisition-content-review-${process.pid}.cjs`)

const readyConfirmation = {
  aiMaterial: '未使用',
  customerMaterial: '未使用',
  promotionMarking: '不需要',
  publishingAccount: '门店号',
  publisher: '小王',
  inquiryOwner: '店长',
  firstResponseTarget: '2小时内',
  inquiryEntry: '抖音私信发送户型图和四个尺寸',
  firstResponsePlan: '当天人工确认地区、现场情况和关键尺寸。',
  customerPreparation: '准备户型图、坑距和电源位置照片。',
  serviceBoundary: '仅服务本地城区，最终方案和报价以现场确认后为准。',
  platformRulesCheckedAt: '2026-09-08',
}

try {
  fs.mkdirSync(outputDirectory, { recursive: true })
  buildSync({
    entryPoints: [path.join(projectRoot, 'src/content-production.tsx')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    jsx: 'automatic',
    outfile: outputFile,
    logLevel: 'silent',
  })
  buildSync({
    entryPoints: [path.join(projectRoot, 'src/content-review.tsx')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    jsx: 'automatic',
    outfile: reviewOutputFile,
    logLevel: 'silent',
  })
  buildSync({
    entryPoints: [path.join(projectRoot, 'src/lead-content-context.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: historyOutputFile,
    logLevel: 'silent',
  })

  const content = require(outputFile)
  const history = require(historyOutputFile)
  const review = require(reviewOutputFile)
  const draft = content.draftFromOutput({
    draft: {
      title: '主标题',
      hook: '主开头',
      outline: ['问题', '判断', '行动'],
      body: '完整正文。',
      callToAction: '私信发送尺寸。',
      coverCopy: '先判断再下单',
      visualPlan: ['镜头一', '镜头二', '镜头三'],
      titleOptions: ['标题一', '标题二', '标题三', '标题四', '标题五'],
      hookOptions: ['开头一', '开头二', '开头三'],
      pinnedComment: '评论区置顶：私信发送尺寸。',
      directMessageReply: '你好，先发城市和尺寸，我人工帮你判断。',
    },
  })
  assert.equal(draft.titleOptions.length, 5, '高潜内容包应保存多个标题备选，供发布前人工选择')
  assert.equal(draft.hookOptions.length, 3, '高潜内容包应保存多个开头备选，供发布前人工选择')
  assert.equal(draft.pinnedComment, '评论区置顶：私信发送尺寸。', '高潜内容包应保存评论区承接文案')
  assert.equal(draft.directMessageReply, '你好，先发城市和尺寸，我人工帮你判断。', '高潜内容包应保存私信首回文案')
  const baseTask = {
    id: 'content-task-1',
    title: '旧卫生间换智能马桶，先判断四个尺寸',
    audienceGain: '帮助客户先完成基础自查，减少买后返工。',
    variants: [{
      id: 'content-variant-1',
      channelId: 'douyin',
      executionItemId: 'douyin-idea-1',
      title: '旧卫生间换智能马桶，先判断四个尺寸',
      callToAction: '私信发送户型图和四个尺寸，安排初步判断。',
      lockedAt: '2026-09-08T09:00:00.000Z',
      releaseConfirmation: readyConfirmation,
    }],
  }
  const data = { tasks: [baseTask], activeTaskId: baseTask.id, learnings: [] }

  const snapshot = content.contentLeadContextForExecution(data, 'douyin', 'douyin-idea-1')
  assert.equal(snapshot?.title, baseTask.title, '线索快照必须保留已锁定内容标题')
  assert.equal(snapshot?.customerPromise, baseTask.audienceGain, '线索快照必须保留内容承诺')
  assert.equal(snapshot?.inquiryOwner, readyConfirmation.inquiryOwner, '线索快照必须保留发布时确认的咨询承接人')
  assert.equal(snapshot?.firstResponseTarget, readyConfirmation.firstResponseTarget, '线索快照必须保留发布时确认的首次承接时效')
  assert.equal(snapshot?.firstResponsePlan, readyConfirmation.firstResponsePlan, '线索快照必须保留首轮人工回应')
  assert.equal(snapshot?.serviceBoundary, readyConfirmation.serviceBoundary, '线索快照必须保留服务边界')
  assert.equal(content.contentLeadContextForExecution(data, 'douyin', 'unknown'), null, '未关联执行项不能伪造内容承接快照')

  const unlocked = { ...data, tasks: [{ ...baseTask, variants: [{ ...baseTask.variants[0], lockedAt: '' }] }] }
  assert.equal(content.contentLeadContextForExecution(unlocked, 'douyin', 'douyin-idea-1'), null, '未锁定草稿不能进入线索承接快照')

  const incomplete = { ...data, tasks: [{ ...baseTask, variants: [{ ...baseTask.variants[0], releaseConfirmation: { ...readyConfirmation, serviceBoundary: '' } }] }] }
  assert.equal(content.contentLeadContextForExecution(incomplete, 'douyin', 'douyin-idea-1'), null, '缺少咨询承接信息的内容不能进入线索承接快照')

  assert.equal(history.contentLeadContextForUpdatedRecord('抖音 · 原内容 · DY-001', '抖音 · 原内容 · DY-001', snapshot, null), snapshot, '线索只补充资料、来源不变时，原始承接快照不能被后续内容状态清空')
  assert.equal(history.contentLeadContextForUpdatedRecord('抖音 · 原内容 · DY-001', '手动到店', snapshot, null), null, '人工更换为非内容来源时，不能保留旧内容承接快照')
  assert.equal(history.contentLeadContextForUpdatedRecord('手动到店', '抖音 · 新内容 · DY-002', null, snapshot), snapshot, '人工更换到新的已锁定内容来源时，应保存新来源的承接快照')

  const platformBase = {
    channelId: 'douyin',
    titleOptions: ['一', '二', '三', '四', '五'],
    hookOptions: ['甲', '乙', '丙'],
    pinnedComment: '评论区发尺寸。',
    directMessageReply: '先发城市和尺寸，我人工判断。',
  }
  assert.equal(review.evaluatePlatformContentRules(platformBase).every((item) => item.status === '通过'), true, '抖音内容包字段齐全时平台规则应全部通过')
  const missingPlatformField = review.evaluatePlatformContentRules({ ...platformBase, directMessageReply: '' })
  assert.equal(missingPlatformField.find((item) => item.id === 'platform-direct-message-reply')?.status, '阻断', '缺少人工私信首回时必须阻断锁定')
  const integratedChecks = review.evaluateContentRules({ evidenceIds: [], proofPlan: '', assetRequirements: '' }, { ...platformBase, title: '', hook: '', outline: '', body: '', callToAction: '', coverCopy: '', visualPlan: '', claimChecks: [] }, [])
  assert.equal(integratedChecks.find((item) => item.id === 'platform-direct-message-reply')?.status, '通过', '平台字段齐全时应在总评审中保留平台规则并通过')
  assert.equal(review.evaluateContentRules({ evidenceIds: [], proofPlan: '', assetRequirements: '' }, { ...platformBase, pinnedComment: '', title: '', hook: '', outline: '', body: '', callToAction: '', coverCopy: '', visualPlan: '', claimChecks: [] }, []).find((item) => item.id === 'platform-pinned-comment')?.status, '阻断', '平台字段缺失时总评审必须出现对应阻断')
  assert.equal(review.evaluatePlatformContentRules({ ...platformBase, channelId: 'wechat', directMessageReply: '' }).length, 0, '微信等相邻渠道不应被抖音小红书专属门槛阻断')
  assert.doesNotThrow(() => review.contentDraftFingerprint({ title: '旧数据', hook: '', outline: '', body: '', callToAction: '', coverCopy: '', visualPlan: '' }), '旧版手工构造内容缺少新数组字段时指纹计算不应崩溃')

  console.log('内容线索承接快照测试通过：仅已锁定且承接完整的内容可以进入客户线索档案，后续编辑不会抹掉历史承接依据。')
} finally {
  fs.rmSync(outputFile, { force: true })
  fs.rmSync(historyOutputFile, { force: true })
  fs.rmSync(reviewOutputFile, { force: true })
}
