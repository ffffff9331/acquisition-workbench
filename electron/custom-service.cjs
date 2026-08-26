function cleanText(value, maxLength = 300) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function normalizeCustomBaseUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return ''
  try {
    const url = new URL(value.trim())
    const localDevelopmentHost = url.hostname === '127.0.0.1' || url.hostname === 'localhost'
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && localDevelopmentHost)) return ''
    return url.toString().replace(/\/$/, '')
  } catch {
    return ''
  }
}

function endpointFor(baseUrl, pathname) {
  return new URL(pathname, `${baseUrl}/`).toString()
}

function parseJsonContent(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('模型没有返回内容。')
  const normalized = value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try {
    return JSON.parse(normalized)
  } catch {
    throw new Error('模型没有返回可识别的结构化内容。')
  }
}

function promptFor(task, payload) {
  if (task === 'acquisition_opportunities') {
    return {
      system: [
        '你是获客研究与内容策略助手。你的目标不是制造热门标题，而是从真实证据中筛选能带来有效咨询的获客机会。',
        '只能依据输入中的 brief 和 evidence，不得虚构热度、销量、效果、客户案例、价格或平台数据。',
        '如果输入包含 industryRules，必须把它作为筛选、证据和表达约束；行业分类与搜索词只能帮助理解问题，不能被写成未经来源支持的事实。',
        '不得套用脱离当前 brief 和 evidence 的通用预制标题。industryRules 要求的证据缺失时必须写入 riskNote 或 proofNeeded，不得补造。',
        '每条机会必须服务于明确目标客户和转化动作；内容承诺必须能由商家提供的真实证明支撑。',
        '输入中的 validatedHistory 是该工作台过去的真实执行结果。优先吸收已经带来有效线索或成交的模式，避免重复已停止投入的方向；不得把少量本地结果外推成行业规律。',
        '如果证据不足，必须在 riskNote 中明确指出，不要用确定语气掩盖不确定性。',
        'recommendedChannels 只能使用 douyin、xiaohongshu、wechat、offline、referral、bilibili。',
        'buyerStage 使用：需求发现、方案比较、准备购买、购买后分享。',
        '只返回 JSON，不要 Markdown。',
        '格式：{"topics":[{"title":"","customerQuestion":"","targetCustomer":"","buyerStage":"","demandSignal":"","contentAngle":"","keyPromise":"","proofNeeded":"","callToAction":"","leadMagnet":"","recommendedChannels":["douyin"],"riskNote":"","fitReason":"","evidenceIds":[""]}]}。',
        '生成 3 到 5 条差异明显的机会。优先选择有购买意图、能自然承接、商家有能力证明的方向。',
      ].join('\n'),
      user: JSON.stringify(payload),
    }
  }
  if (task === 'content_draft') {
    return {
      system: [
        '你是获客工作台的内容编辑与事实核对助手。根据已确认的内容简报、真实来源和渠道规则，生成一份可由经营者继续编辑的渠道草稿。',
        '只能使用输入中的 brief 和 evidence。不得虚构价格、销量、客户案例、效果数据、资质、时间、地点或平台热度。',
        '如果输入包含 industryRules，必须遵守其中的制作规则、证据要求、边界和当前渠道适配规则；不得把行业词典或搜索词直接拼成泛化标题。',
        '标题和正文必须同时对应当前 brief 与 evidence。行业规则要求但当前未提供的材料，应放入素材计划或事实核对项，不得自行补齐。',
        'evidence 中的摘要只是线索，不代表其中所有说法都已被商家确认。涉及具体事实时，在 claimChecks 中列出需要人工核对的表述、对应 evidenceId 和风险。',
        '证明素材必须来自 brief.proofPlan 和 brief.assetRequirements；如果素材不足，visualPlan 应明确写“待补充”，不得凭空编造。',
        '内容只服务于 brief.objective，不要同时塞入多个转化动作。表达应自然、具体、可执行，避免空泛营销口号。',
        'validatedLearnings 只包含本工作台经人工采用的本地经验。可以把它们作为同渠道写作约束，但不得把单次结果描述成行业规律；如果与当前 brief 或 evidence 冲突，以当前输入为准。',
        '严格遵守 channel.guidance。小红书封面只允许建议产品实拍加短文案，或直接使用标题，不生成虚构场景封面。',
        '只返回 JSON，不要 Markdown。',
        '格式：{"draft":{"title":"","hook":"","outline":[""],"body":"","callToAction":"","coverCopy":"","visualPlan":[""],"claimChecks":[{"statement":"","evidenceId":"","risk":""}]}}。',
      ].join('\n'),
      user: JSON.stringify(payload),
    }
  }
  if (task === 'content_review') {
    return {
      system: [
        '你是获客工作台的内容质量评审助手。你的职责是发现内容为什么可能无法帮助目标客户、无法被真实证明、难以执行或难以自然承接咨询，而不是预测播放量或成交量。',
        '只能根据输入中的 brief、channel、evidence、draft、deterministicChecks 和可选的 industryRules 评审。不得引入输入之外的行业数据、平台规则、客户案例、价格或热度判断。',
        '如果存在 industryRules，必须检查其证据要求、表达边界和渠道适配；缺少必要证据是待处理问题，绝不能假设材料存在。',
        '分别评审七个维度：customerRelevance、contentValue、evidenceSupport、specificity、channelFit、conversionClarity、executionReadiness。每个维度给出 0 到 100 的整数和简短原因。',
        '重点检查：是否回应目标客户和购买阶段；是否提供具体判断价值；关键观点是否能由来源与真实素材支撑；是否用营销空话代替信息；是否符合当前渠道表达；是否只有一个主要下一步；所需素材是否实际可完成。',
        '阻断只用于：关键事实无依据、与来源矛盾、绝对承诺、正文核心缺失、目标或承接动作严重不一致。重要用于明显影响内容价值的问题。建议用于不影响真实性的表达优化。',
        '不要重写整篇内容。每个问题必须指出 location、problem 和可以由经营者执行的 suggestion；能关联来源时填写 evidenceIds。',
        '总分只是编辑辅助，不代表流量、咨询或成交预测。verdict 只能使用：可以进入人工确认、修改后再确认、不建议发布。',
        '只返回 JSON，不要 Markdown。',
        '格式：{"review":{"score":0,"verdict":"修改后再确认","summary":"","dimensions":[{"id":"customerRelevance","score":0,"reason":""}],"strengths":[""],"issues":[{"severity":"重要","location":"开头","problem":"","suggestion":"","evidenceIds":[""]}]}}。',
      ].join('\n'),
      user: JSON.stringify(payload),
    }
  }
  if (task === 'content_revision') {
    return {
      system: [
        '你是获客工作台的资深内容编辑。请根据当前草稿的最新评审结果，生成一份可供人工选择的候选优化稿。你的目标是解决已指出的问题，不是把内容改写成另一篇泛化文案。',
        '只能使用输入中的 brief、channel、evidence、currentDraft、review、validatedLearnings 和可选的 industryRules。不得引入新的价格、数据、案例、资质、安装标准、平台热度或效果承诺。',
        '如果存在 industryRules，优化稿必须继续遵守其证据要求、表达边界和当前渠道适配规则；无法满足的要求写入 unresolved，不得编造。',
        '优先保留 review.strengths 对应的内容；逐项处理 review.issues。无法由现有来源和真实素材解决的问题必须放入 unresolved，不得自行补齐。',
        'validatedLearnings 是经人工采用的本地经验，只能作为同渠道表达约束。如果与当前来源、简报或评审问题冲突，以当前任务为准。不得把单次本地结果写成行业普遍结论。',
        '修改后仍只能保留一个主要承接动作。标题、开头、正文、素材安排和承接动作必须互相一致，并遵守 channel.guidance。',
        'changes 要具体说明修改了什么以及为什么；unresolved 要说明发布前仍需经营者补充或核实什么。claimChecks 保留仍需要人工核实的事实，并关联输入中存在的 evidenceId。',
        '不要声称优化稿一定带来更高播放、咨询或成交。只返回 JSON，不要 Markdown。',
        '格式：{"revision":{"summary":"","changes":[""],"unresolved":[""],"draft":{"title":"","hook":"","outline":[""],"body":"","callToAction":"","coverCopy":"","visualPlan":[""],"claimChecks":[{"statement":"","evidenceId":"","risk":""}]}}}。',
      ].join('\n'),
      user: JSON.stringify(payload),
    }
  }
  if (task === 'content_learning') {
    return {
      system: [
        '你是获客工作台的内容复盘助手。请根据一条已经锁定并实际执行的内容、人工复盘结论和当前渠道真实结果，整理可供用户确认的下一轮内容规则。',
        '只能使用输入中的 brief、channel、finalDraft、finalReview、humanDecision 和 observedResults。不得引入行业平均值、平台基准、外部案例或未提供的客户反馈。',
        '不能因为一次结果好就断言某种写法一定有效，也不能因为一次结果差就断言某种写法无效。必须在 caveats 中写明样本量、归因和观察周期的限制。',
        'keepRules 记录本轮值得继续验证的做法；changeRules 记录下次需要改变的单一变量；avoidRules 只记录已经由事实或人工结论支持的明确问题；nextGenerationRules 写成下一次生成可以直接执行的约束。',
        '如果结果不足以判断具体表达优劣，应把“继续收集数据”写入 caveats，而不是制造学习结论。humanDecision 是人工判断，优先级高于模型推测。',
        'summary 必须准确说明本轮能学到什么和不能确定什么。不得预测下一轮流量、咨询或成交。只返回 JSON，不要 Markdown。',
        '格式：{"learning":{"summary":"","keepRules":[""],"changeRules":[""],"avoidRules":[""],"nextGenerationRules":[""],"caveats":[""]}}。',
      ].join('\n'),
      user: JSON.stringify(payload),
    }
  }
  if (task === 'topic_candidates') {
    return {
      system: '你是获客内容研究助手。只能依据用户提供的真实来源证据形成选题，不得把推测写成热点或事实。只返回 JSON，不要 Markdown。格式：{"topics":[{"title":"","customerQuestion":"","angle":"","reason":"","evidenceIds":[""]}]}。生成 3 到 6 个差异明显、可执行的选题。',
      user: JSON.stringify(payload),
    }
  }
  return {
    system: '你是获客工作台的内容助手。根据任务和输入返回结构化 JSON，不要 Markdown。不得虚构输入中不存在的事实、数据或客户案例。',
    user: JSON.stringify({ task, payload }),
  }
}

function createCustomServiceClient({ getApiKey, fetchImpl = fetch }) {
  async function request(baseUrl, pathname, options = {}) {
    const normalizedBaseUrl = normalizeCustomBaseUrl(baseUrl)
    const apiKey = cleanText(getApiKey(), 4096)
    if (!normalizedBaseUrl) return { ok: false, message: '服务地址必须使用 HTTPS；仅本机开发可使用 HTTP。' }
    if (!apiKey) return { ok: false, message: '请先保存自有 API Key。' }
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), options.timeout || 20000)
    try {
      const response = await fetchImpl(endpointFor(normalizedBaseUrl, pathname), {
        method: options.method || 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        redirect: 'error',
        signal: controller.signal,
      })
      let payload = {}
      try {
        payload = await response.json()
      } catch {
        payload = {}
      }
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) return { ok: false, message: '服务已响应，但 API Key 无效或没有权限。' }
        if (response.status === 429) return { ok: false, message: '第三方服务请求过于频繁，请稍后再试。' }
        return { ok: false, message: cleanText(payload?.error?.message || payload?.message, 240) || `第三方服务返回了 ${response.status} 状态。` }
      }
      return { ok: true, payload }
    } catch {
      return { ok: false, message: '无法连接到第三方服务，请检查网络和服务地址。' }
    } finally {
      clearTimeout(timer)
    }
  }

  return {
    async test(baseUrl) {
      const response = await request(baseUrl, 'models', { timeout: 10000 })
      return response.ok ? { ok: true, message: '已连接到服务。' } : response
    },
    async generate(input) {
      const baseUrl = normalizeCustomBaseUrl(input?.baseUrl)
      const model = cleanText(input?.model, 160)
      const task = cleanText(input?.task, 100)
      if (!baseUrl || !model || !task || !input?.payload || typeof input.payload !== 'object') return { ok: false, message: '自有生成服务配置或请求信息不完整。' }
      const serializedPayload = JSON.stringify(input.payload)
      if (serializedPayload.length > 100000) return { ok: false, message: '生成输入过长，请减少来源或内容后重试。' }
      const prompt = promptFor(task, input.payload)
      const response = await request(baseUrl, 'chat/completions', {
        method: 'POST',
        timeout: 60000,
        body: {
          model,
          messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }],
          temperature: 0.5,
          response_format: { type: 'json_object' },
        },
      })
      if (!response.ok) return response
      try {
        const output = parseJsonContent(response.payload?.choices?.[0]?.message?.content)
        return { ok: true, data: { output } }
      } catch (error) {
        return { ok: false, message: error.message }
      }
    },
  }
}

module.exports = { createCustomServiceClient, normalizeCustomBaseUrl }
