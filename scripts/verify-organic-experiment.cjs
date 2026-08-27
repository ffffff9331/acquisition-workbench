const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { buildSync } = require('esbuild')

const projectRoot = path.resolve(__dirname, '..')
const outputDirectory = path.join(projectRoot, 'node_modules', '.tmp')
const outputFile = path.join(outputDirectory, `acquisition-organic-experiment-${process.pid}.cjs`)

try {
  fs.mkdirSync(outputDirectory, { recursive: true })
  buildSync({
    entryPoints: [path.join(projectRoot, 'src/organic-experiment.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: outputFile,
    logLevel: 'silent',
  })

  const experiment = require(outputFile)
  const blank = experiment.normalizeOrganicExperimentPlan({ primaryMetric: '播放量', observationUntil: '明天' })
  assert.equal(blank.primaryMetric, '', '播放量不能作为自然获客实验的主要业务信号')
  assert.equal(blank.observationUntil, '', '观察日期必须使用明确日期')
  assert.equal(experiment.organicExperimentReady(blank), false, '空白实验计划不能通过')

  const withoutNaturalConfirmation = experiment.normalizeOrganicExperimentPlan({
    testQuestion: '开头是否会带来更多真实咨询',
    primaryMetric: '真实咨询',
    observationUntil: '2026-09-03',
    changedVariable: '开头',
    guardrail: '出现与内容无关的咨询时调整',
  })
  assert.equal(experiment.organicExperimentReady(withoutNaturalConfirmation), false, '未确认自然发布时不能把结果当作免费渠道实验')

  const ready = experiment.normalizeOrganicExperimentPlan({
    naturalOnlyConfirmed: true,
    testQuestion: '开头是否会带来愿意提供尺寸的真实咨询',
    primaryMetric: '有效线索',
    observationUntil: '2026-09-03',
    changedVariable: '开头',
    guardrail: '客户误解服务范围或咨询无法及时承接时调整',
  })
  assert.equal(experiment.organicExperimentReady(ready), true, '补齐自然发布、目标、指标、日期、变量和护栏后应可通过')
  console.log('自然内容实验测试通过：免费发布确认、业务指标、单一变量和护栏均已校验。')
} finally {
  fs.rmSync(outputFile, { force: true })
}
