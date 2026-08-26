const { randomUUID } = require('node:crypto')

function cleanText(value, maxLength = 300) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function nonNegativeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0
}

function signedInteger(value) {
  return Number.isSafeInteger(value) ? value : 0
}

function requiredNonNegativeInteger(value, fieldName) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`积分账户的${fieldName}无效。`)
  return value
}

function requiredSignedInteger(value, fieldName) {
  if (!Number.isSafeInteger(value)) throw new Error(`积分账户的${fieldName}无效。`)
  return value
}

function requiredChoice(value, choices, fieldName) {
  if (!choices.includes(value)) throw new Error(`积分账户的${fieldName}无效。`)
  return value
}

function normalizeBaseUrl(value) {
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

function safeCheckoutUrl(value, allowHttp = false) {
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' || allowHttp && url.protocol === 'http:') return url.toString()
  } catch {
    return ''
  }
  return ''
}

function parseCreditAccount(payload) {
  const account = payload?.account
  if (!account || typeof account !== 'object') throw new Error('积分账户响应格式不正确。')
  const workspaceId = cleanText(account.workspaceId, 120)
  if (!workspaceId) throw new Error('积分账户的工作台编号无效。')
  const status = requiredChoice(account.status, ['active', 'suspended', 'closed'], '状态')
  const packages = Array.isArray(payload.packages) ? payload.packages.map((item) => {
    const id = cleanText(item?.id, 100)
    const title = cleanText(item?.title, 80)
    const points = requiredNonNegativeInteger(item?.points, '套餐积分')
    const bonusPoints = requiredNonNegativeInteger(item?.bonusPoints, '赠送积分')
    const priceFen = requiredNonNegativeInteger(item?.priceFen, '套餐价格')
    if (!id || !title || points <= 0 || priceFen <= 0) throw new Error('积分充值套餐响应格式不正确。')
    return { id, title, points, bonusPoints, priceFen, description: cleanText(item?.description, 180), recommended: item?.recommended === true }
  }) : []
  const transactions = Array.isArray(payload.transactions) ? payload.transactions.map((item) => {
    const id = cleanText(item?.id, 120)
    if (!id) throw new Error('积分明细响应格式不正确。')
    return {
      id,
      type: requiredChoice(item?.type, ['recharge', 'usage', 'refund', 'adjustment', 'gift'], '明细类型'),
      points: requiredSignedInteger(item?.points, '明细积分'),
      balanceAfter: requiredNonNegativeInteger(item?.balanceAfter, '明细余额'),
      description: cleanText(item?.description, 180),
      status: requiredChoice(item?.status, ['pending', 'completed', 'failed', 'refunded'], '明细状态'),
      createdAt: cleanText(item?.createdAt, 50),
    }
  }) : []
  return {
    account: {
      workspaceId,
      balance: requiredNonNegativeInteger(account.balance, '可用余额'),
      frozen: requiredNonNegativeInteger(account.frozen, '冻结积分'),
      lowBalanceThreshold: requiredNonNegativeInteger(account.lowBalanceThreshold, '余额提醒线'),
      status,
      updatedAt: cleanText(account.updatedAt, 50),
    },
    packages,
    transactions,
  }
}

function parseRechargeOrder(payload, allowHttp) {
  const orderId = cleanText(payload?.orderId, 120)
  const checkoutUrl = safeCheckoutUrl(payload?.checkoutUrl, allowHttp)
  if (!orderId || !checkoutUrl) throw new Error('充值订单响应格式不正确。')
  return {
    orderId,
    checkoutUrl,
    expiresAt: cleanText(payload?.expiresAt, 50),
  }
}

function parseGeneration(payload) {
  if (!payload || typeof payload !== 'object' || payload.output === undefined) throw new Error('生成服务响应格式不正确。')
  const requestId = cleanText(payload.requestId, 120)
  if (!requestId) throw new Error('生成服务缺少请求编号。')
  return {
    requestId,
    output: payload.output,
    usage: {
      pointsCharged: requiredNonNegativeInteger(payload?.usage?.pointsCharged, '本次扣除积分'),
      balanceAfter: requiredNonNegativeInteger(payload?.usage?.balanceAfter, '扣费后余额'),
    },
  }
}

function errorMessage(status, payload) {
  if (status === 401 || status === 403) return '服务授权码无效或没有权限。'
  if (status === 402) return '积分不足，请先充值后再生成。'
  if (status === 409) return '本次请求正在处理，请稍后刷新。'
  if (status === 429) return '请求过于频繁，请稍后再试。'
  return cleanText(payload?.message, 240) || `官方服务返回了 ${status} 状态。`
}

function createOfficialServiceClient({ baseUrl, getToken, fetchImpl = fetch }) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  const allowHttp = normalizedBaseUrl.startsWith('http://127.0.0.1') || normalizedBaseUrl.startsWith('http://localhost')

  async function request(pathname, options = {}) {
    if (!normalizedBaseUrl) return { ok: false, message: '官方积分服务尚未配置。' }
    const token = cleanText(getToken(), 4096)
    if (!token) return { ok: false, message: '请先保存官方服务授权码。' }
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)
    try {
      const response = await fetchImpl(new URL(pathname, `${normalizedBaseUrl}/`), {
        method: options.method || 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
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
      if (!response.ok) return { ok: false, message: errorMessage(response.status, payload) }
      return { ok: true, payload }
    } catch {
      return { ok: false, message: '无法连接官方服务，请检查网络后重试。' }
    } finally {
      clearTimeout(timer)
    }
  }

  return {
    configured: Boolean(normalizedBaseUrl),
    async getCreditAccount(workspaceId) {
      const id = cleanText(workspaceId, 120)
      if (!id) return { ok: false, message: '请先填写工作台编号。' }
      const response = await request(`v1/workspaces/${encodeURIComponent(id)}/credit-account`)
      if (!response.ok) return response
      try {
        return { ok: true, data: parseCreditAccount(response.payload) }
      } catch (error) {
        return { ok: false, message: error.message }
      }
    },
    async createRechargeOrder(workspaceId, packageId) {
      const id = cleanText(workspaceId, 120)
      const selectedPackageId = cleanText(packageId, 100)
      if (!id || !selectedPackageId) return { ok: false, message: '请选择充值套餐。' }
      const response = await request(`v1/workspaces/${encodeURIComponent(id)}/recharge-orders`, {
        method: 'POST',
        body: { packageId: selectedPackageId, clientRequestId: randomUUID() },
      })
      if (!response.ok) return response
      try {
        return { ok: true, order: parseRechargeOrder(response.payload, allowHttp) }
      } catch (error) {
        return { ok: false, message: error.message }
      }
    },
    async generate(input) {
      const workspaceId = cleanText(input?.workspaceId, 120)
      const task = cleanText(input?.task, 100)
      if (!workspaceId || !task || !input?.payload || typeof input.payload !== 'object') return { ok: false, message: '生成请求信息不完整。' }
      const response = await request('v1/generations', {
        method: 'POST',
        body: {
          workspaceId,
          requestId: cleanText(input.requestId, 120) || randomUUID(),
          task,
          payload: input.payload,
        },
      })
      if (!response.ok) return response
      try {
        return { ok: true, data: parseGeneration(response.payload) }
      } catch (error) {
        return { ok: false, message: error.message }
      }
    },
  }
}

module.exports = { createOfficialServiceClient, normalizeBaseUrl }
