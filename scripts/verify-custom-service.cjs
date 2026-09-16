const http = require('node:http')
const assert = require('node:assert/strict')
const { createCustomServiceClient, normalizeCustomBaseUrl } = require('../electron/custom-service.cjs')

async function readJson(request) {
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}
}

async function main() {
  assert.equal(normalizeCustomBaseUrl('http://api.example.com/v1'), '')
  assert.equal(normalizeCustomBaseUrl('https://api.example.com/v1/'), 'https://api.example.com/v1')

  const observed = []
  const server = http.createServer(async (request, response) => {
    observed.push({ method: request.method, url: request.url, authorization: request.headers.authorization, body: await readJson(request) })
    response.setHeader('Content-Type', 'application/json')
    if (request.method === 'GET' && request.url === '/v1/models') {
      response.end(JSON.stringify({ data: [{ id: 'test-model' }] }))
      return
    }
    if (request.method === 'POST' && request.url === '/v1/chat/completions') {
      const taskPrompt = observed[observed.length - 1].body.messages?.[0]?.content || ''
      const output = taskPrompt.includes('内容复盘助手')
        ? { learning: { summary: '本轮说明具体判断步骤值得继续验证，但单次结果不足以判断标题优劣。', keepRules: ['保留具体判断步骤'], changeRules: ['下次只调整开头表达'], avoidRules: ['避免未经核实的金额承诺'], nextGenerationRules: ['正文必须给出至少三个可执行判断步骤'], caveats: ['只有一次本地执行结果，不能外推为行业规律'] } }
        : taskPrompt.includes('资深内容编辑')
          ? { revision: { summary: '保留原有四步结构，收紧无法统一证明的防水表达。', changes: ['把统一标准改为现场确认条件', '明确案例素材授权要求'], unresolved: ['发布前由安装人员核对本地规范'], draft: { title: '证据型优化稿', hook: '先判断现场条件，再选具体型号。', outline: ['判断尺寸', '核对条件', '现场复核'], body: '根据当前来源和评审问题形成的优化正文。', callToAction: '私信发送尺寸，预约初步判断。', coverCopy: '先判断现场条件', visualPlan: ['真实量尺画面', '授权案例画面', '现场复核提示'], claimChecks: [{ statement: '现场条件需要复核', evidenceId: 'source-1', risk: '由安装人员人工确认' }] } } }
          : taskPrompt.includes('内容质量评审助手')
            ? { review: { score: 84, verdict: '修改后再确认', summary: '内容与目标客户相关，证明安排清楚，但开头的结果表述需要人工核对。', dimensions: [{ id: 'customerRelevance', score: 90, reason: '目标客户和购买阶段明确。' }, { id: 'contentValue', score: 86, reason: '提供了可执行的判断步骤。' }, { id: 'evidenceSupport', score: 78, reason: '部分结果表述需要进一步证明。' }, { id: 'specificity', score: 88, reason: '步骤和场景具体。' }, { id: 'channelFit', score: 82, reason: '适合短视频表达。' }, { id: 'conversionClarity', score: 85, reason: '只有一个主要承接动作。' }, { id: 'executionReadiness', score: 80, reason: '素材安排基本可执行。' }], strengths: ['目标客户清楚', '内容结构具体'], issues: [{ severity: '重要', location: '开头', problem: '返工结果表述需要真实案例支撑。', suggestion: '使用可公开的真实案例画面，并避免给出未经核实的金额。', evidenceIds: ['source-1'] }] } }
            : taskPrompt.includes('内容编辑与事实核对助手')
          ? { draft: { title: '证据型渠道草稿', hook: '先看真实问题', outline: ['问题', '证明', '下一步'], body: '只依据真实来源形成的测试正文。', callToAction: '私信咨询', coverCopy: '真实问题怎么判断', visualPlan: ['使用真实案例画面'], claimChecks: [{ statement: '测试事实', evidenceId: 'source-1', risk: '发布前人工核对' }] } }
          : { topics: [{ title: '证据型获客机会', customerQuestion: '客户问题', targetCustomer: '目标客户', buyerStage: '方案比较', demandSignal: '来源反复出现相同问题', contentAngle: '对比讲解', keyPromise: '帮助客户判断', proofNeeded: '真实案例', callToAction: '私信咨询', leadMagnet: '自查清单', recommendedChannels: ['douyin'], riskNote: '不得保证效果', fitReason: '问题接近购买决策', evidenceIds: ['source-1'] }] }
      response.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(output) } }] }))
      return
    }
    response.statusCode = 404
    response.end(JSON.stringify({ message: 'Not found' }))
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const baseUrl = `http://127.0.0.1:${server.address().port}/v1`
  const client = createCustomServiceClient({ getApiKey: () => 'custom-test-key' })
  const industryRules = { id: 'bathroom-industry-rules-v2', industry: '卫浴门店', productionRules: ['标题必须对应当前证据'], evidenceRules: [{ claimType: '尺寸', requiredEvidence: ['现场尺寸'] }] }
  try {
    const connection = await client.test(baseUrl)
    assert.equal(connection.ok, true)

    const generation = await client.generate({ baseUrl, model: 'test-model', task: 'acquisition_opportunities', payload: { brief: { offer: '测试服务', targetCustomer: '测试客户', conversionGoal: '私信咨询' }, industryRules, evidence: [{ id: 'source-1', title: '真实来源' }], validatedHistory: [{ title: '历史机会', decision: '继续投入', results: [{ channel: 'douyin', qualifiedLeads: 3, customers: 1 }] }] } })
    assert.equal(generation.ok, true)
    assert.equal(generation.data.output.topics[0].title, '证据型获客机会')
    assert.equal(observed.length, 2)
    observed.forEach((request) => assert.equal(request.authorization, 'Bearer custom-test-key'))
    assert.equal(observed[1].body.model, 'test-model')
    assert.equal(observed[1].body.response_format.type, 'json_object')
    assert.equal(observed[1].body.messages[0].content.includes('不是制造热门标题'), true)
    assert.equal(observed[1].body.messages[0].content.includes('validatedHistory'), true)
    assert.equal(observed[1].body.messages[0].content.includes('不得套用脱离当前 brief'), true)
    assert.equal(observed[1].body.messages[1].content.includes('继续投入'), true)
    assert.equal(observed[1].body.messages[1].content.includes('bathroom-industry-rules-v2'), true)
    assert.equal(Object.prototype.hasOwnProperty.call(generation.data, 'usage'), false)

    const contentGeneration = await client.generate({ baseUrl, model: 'test-model', task: 'content_draft', payload: { brief: { title: '测试内容', targetCustomer: '测试客户', objective: '私信咨询', proofPlan: '真实案例' }, industryRules, evidence: [{ id: 'source-1', title: '真实来源' }], channel: { id: 'douyin', guidance: '短视频表达' } } })
    assert.equal(contentGeneration.ok, true)
    assert.equal(contentGeneration.data.output.draft.title, '证据型渠道草稿')
    assert.equal(observed[2].body.messages[0].content.includes('内容编辑与事实核对助手'), true)
    assert.equal(observed[2].body.messages[0].content.includes('不得虚构价格'), true)
    assert.equal(observed[2].body.messages[0].content.includes('titleOptions 必须提供 5 个不同'), true)
    assert.equal(observed[2].body.messages[0].content.includes('directMessageReply 是店员人工首回'), true)
    assert.equal(observed[2].body.messages[1].content.includes('真实来源'), true)
    assert.equal(observed[2].body.messages[1].content.includes('标题必须对应当前证据'), true)

    const contentReview = await client.generate({ baseUrl, model: 'test-model', task: 'content_review', payload: { brief: { title: '测试内容', targetCustomer: '测试客户', objective: '私信咨询' }, industryRules, evidence: [{ id: 'source-1', title: '真实来源' }], channel: { id: 'douyin' }, draft: { body: '测试正文' }, deterministicChecks: [] } })
    assert.equal(contentReview.ok, true)
    assert.equal(contentReview.data.output.review.score, 84)
    assert.equal(contentReview.data.output.review.dimensions.length, 7)
    assert.equal(observed[3].body.messages[0].content.includes('不代表流量'), true)
    assert.equal(observed[3].body.messages[0].content.includes('customerRelevance'), true)
    assert.equal(observed[3].body.messages[1].content.includes('deterministicChecks'), true)
    assert.equal(observed[3].body.messages[1].content.includes('requiredEvidence'), true)

    const contentRevision = await client.generate({ baseUrl, model: 'test-model', task: 'content_revision', payload: { brief: { title: '测试内容' }, industryRules, evidence: [{ id: 'source-1', title: '真实来源' }], channel: { id: 'douyin', guidance: '短视频表达' }, currentDraft: { body: '测试正文' }, review: contentReview.data.output.review, validatedLearnings: [{ nextGenerationRules: ['保留具体步骤'] }] } })
    assert.equal(contentRevision.ok, true)
    assert.equal(contentRevision.data.output.revision.draft.title, '证据型优化稿')
    assert.equal(observed[4].body.messages[0].content.includes('不得引入新的价格'), true)
    assert.equal(observed[4].body.messages[1].content.includes('validatedLearnings'), true)
    assert.equal(observed[4].body.messages[1].content.includes('bathroom-industry-rules-v2'), true)

    const contentLearning = await client.generate({ baseUrl, model: 'test-model', task: 'content_learning', payload: { brief: { title: '测试内容' }, channel: { id: 'douyin' }, finalDraft: { body: '最终正文' }, humanDecision: '调整后再试', observedResults: [{ executed: true, platformInquiries: 3, qualifiedLeads: 1, customers: 0 }] } })
    assert.equal(contentLearning.ok, true)
    assert.equal(contentLearning.data.output.learning.nextGenerationRules.length, 1)
    assert.equal(observed[5].body.messages[0].content.includes('不能因为一次结果好'), true)
    assert.equal(observed[5].body.messages[1].content.includes('调整后再试'), true)
    process.stdout.write('Custom AI service contract verified.\n')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`)
  process.exitCode = 1
})
