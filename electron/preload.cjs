const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('workbenchDesktop', {
  isDesktop: true,
  ai: {
    getSecretStatus: () => ipcRenderer.invoke('ai:get-secret-status'),
    saveOfficialToken: (token) => ipcRenderer.invoke('ai:save-official-token', token),
    saveCustomApiKey: (apiKey) => ipcRenderer.invoke('ai:save-custom-api-key', apiKey),
    clearSecret: (kind) => ipcRenderer.invoke('ai:clear-secret', kind),
    testCustomService: (input) => ipcRenderer.invoke('ai:test-custom-service', input),
    getOfficialServiceStatus: () => ipcRenderer.invoke('ai:get-official-service-status'),
    getCreditAccount: (input) => ipcRenderer.invoke('ai:get-credit-account', input),
    createRechargeOrder: (input) => ipcRenderer.invoke('ai:create-recharge-order', input),
    generateOfficial: (input) => ipcRenderer.invoke('ai:generate-official', input),
    generateCustom: (input) => ipcRenderer.invoke('ai:generate-custom', input),
  },
  system: {
    openExternal: (url) => ipcRenderer.invoke('system:open-external', url),
  },
  research: {
    getSecretStatus: () => ipcRenderer.invoke('research:get-secret-status'),
    saveSearchApiKey: (apiKey) => ipcRenderer.invoke('research:save-search-api-key', apiKey),
    clearSearchApiKey: () => ipcRenderer.invoke('research:clear-search-api-key'),
    search: (input) => ipcRenderer.invoke('research:search', input),
  },
})
