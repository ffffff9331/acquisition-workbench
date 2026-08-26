export {}

declare global {
  type AISecretKind = 'official' | 'custom'

  type DesktopAISecretStatus = {
    officialTokenSaved: boolean
    customApiKeySaved: boolean
    secureStorageAvailable: boolean
  }

  type DesktopResearchSecretStatus = {
    searchApiKeySaved: boolean
    secureStorageAvailable: boolean
  }

  type DesktopResearchResult = {
    title: string
    url: string
    summary: string
    publishedDate: string
    score: number
  }

  type DesktopCreditAccountData = {
    account: {
      workspaceId: string
      balance: number
      frozen: number
      lowBalanceThreshold: number
      status: 'active' | 'suspended' | 'closed'
      updatedAt: string
    }
    packages: Array<{
      id: string
      title: string
      points: number
      bonusPoints: number
      priceFen: number
      description: string
      recommended: boolean
    }>
    transactions: Array<{
      id: string
      type: 'recharge' | 'usage' | 'refund' | 'adjustment' | 'gift'
      points: number
      balanceAfter: number
      description: string
      status: 'pending' | 'completed' | 'failed' | 'refunded'
      createdAt: string
    }>
  }

  interface Window {
    workbenchDesktop?: {
      isDesktop: boolean
      ai: {
        getSecretStatus: () => Promise<DesktopAISecretStatus>
        saveOfficialToken: (token: string) => Promise<void>
        saveCustomApiKey: (apiKey: string) => Promise<void>
        clearSecret: (kind: AISecretKind) => Promise<void>
        testCustomService: (input: { baseUrl: string; apiKey?: string }) => Promise<{ ok: boolean; message: string }>
        getOfficialServiceStatus: () => Promise<{ configured: boolean }>
        getCreditAccount: (input: { workspaceId: string }) => Promise<{ ok: boolean; message?: string; data?: DesktopCreditAccountData }>
        createRechargeOrder: (input: { workspaceId: string; packageId: string }) => Promise<{ ok: boolean; message?: string; order?: { orderId: string; checkoutUrl: string; expiresAt: string } }>
        generateOfficial: (input: { workspaceId: string; requestId?: string; task: string; payload: Record<string, unknown> }) => Promise<{ ok: boolean; message?: string; data?: { requestId: string; output: unknown; usage: { pointsCharged: number; balanceAfter: number } } }>
        generateCustom: (input: { baseUrl: string; model: string; task: string; payload: Record<string, unknown> }) => Promise<{ ok: boolean; message?: string; data?: { output: unknown } }>
      }
      system: {
        openExternal: (url: string) => Promise<{ ok: boolean; message?: string }>
      }
      research: {
        getSecretStatus: () => Promise<DesktopResearchSecretStatus>
        saveSearchApiKey: (apiKey: string) => Promise<void>
        clearSearchApiKey: () => Promise<void>
        search: (input: { query: string; source: 'web' | 'douyin' | 'xiaohongshu' | 'wechat' | 'bilibili'; freshness: 'week' | 'month' | 'year' | 'all' }) => Promise<{ ok: boolean; message: string; results: DesktopResearchResult[] }>
      }
    }
  }
}
