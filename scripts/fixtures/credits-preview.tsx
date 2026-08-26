import React from 'react'
import ReactDOM from 'react-dom/client'
import '../../src/styles.css'
import { CreditAccountDialog } from '../../src/credits'

const accountData: DesktopCreditAccountData = {
  account: { workspaceId: 'ui-demo', balance: 1280, frozen: 20, lowBalanceThreshold: 200, status: 'active', updatedAt: '2026-08-26T18:30:00+08:00' },
  packages: [
    { id: 'starter', title: '轻量充值', points: 500, bonusPoints: 0, priceFen: 4900, description: '适合偶尔生成内容', recommended: false },
    { id: 'standard', title: '标准充值', points: 1000, bonusPoints: 100, priceFen: 9900, description: '适合持续内容运营', recommended: true },
    { id: 'team', title: '团队充值', points: 3000, bonusPoints: 500, priceFen: 27900, description: '适合多人和多渠道使用', recommended: false },
  ],
  transactions: [
    { id: 'tx-3', type: 'usage', points: -12, balanceAfter: 1280, description: '生成短视频脚本', status: 'completed', createdAt: '2026-08-26T18:26:00+08:00' },
    { id: 'tx-4', type: 'recharge', points: 1000, balanceAfter: 1280, description: '充值订单等待支付确认', status: 'pending', createdAt: '2026-08-26T18:20:00+08:00' },
    { id: 'tx-5', type: 'recharge', points: 500, balanceAfter: 1280, description: '充值订单支付失败', status: 'failed', createdAt: '2026-08-26T17:40:00+08:00' },
    { id: 'tx-2', type: 'gift', points: 100, balanceAfter: 1292, description: '标准充值赠送', status: 'completed', createdAt: '2026-08-26T16:20:00+08:00' },
    { id: 'tx-1', type: 'recharge', points: 1000, balanceAfter: 1192, description: '标准充值到账', status: 'completed', createdAt: '2026-08-26T16:20:00+08:00' },
  ],
}

;(window as unknown as { workbenchDesktop: Window['workbenchDesktop'] }).workbenchDesktop = {
  isDesktop: true,
  ai: {
    getSecretStatus: async () => ({ officialTokenSaved: true, customApiKeySaved: false, secureStorageAvailable: true }),
    saveOfficialToken: async () => undefined,
    saveCustomApiKey: async () => undefined,
    clearSecret: async () => undefined,
    testCustomService: async () => ({ ok: true, message: '已连接到服务。' }),
    getOfficialServiceStatus: async () => ({ configured: true }),
    getCreditAccount: async () => ({ ok: true, data: accountData }),
    createRechargeOrder: async ({ packageId }) => ({ ok: true, order: { orderId: `mock-${packageId}`, checkoutUrl: 'http://127.0.0.1:4180/checkout/mock', expiresAt: '2026-08-26T19:00:00+08:00' } }),
    generateOfficial: async () => ({ ok: true, data: { requestId: 'mock', output: {}, usage: { pointsCharged: 12, balanceAfter: 1268 } } }),
    generateCustom: async () => ({ ok: false, message: '当前预览使用官方模式。' }),
  },
  system: { openExternal: async () => ({ ok: true }) },
  research: {
    getSecretStatus: async () => ({ searchApiKeySaved: false, secureStorageAvailable: true }),
    saveSearchApiKey: async () => undefined,
    clearSearchApiKey: async () => undefined,
    search: async () => ({ ok: true, message: '', results: [] }),
  },
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><div className="app-shell"><CreditAccountDialog settings={{ mode: 'official', officialWorkspaceId: 'ui-demo', customBaseUrl: '', customModel: '' }} secretStatus={{ officialTokenSaved: true, customApiKeySaved: false, secureStorageAvailable: true }} onClose={() => undefined} onOpenAIService={() => undefined} onAccountChange={() => undefined} onToast={() => undefined} /></div></React.StrictMode>)
