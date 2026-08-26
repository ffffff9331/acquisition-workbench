import type { AISecretStatus, AIServiceSettings } from './ai-service'

export type ConfiguredGenerationResult = {
  ok: boolean
  message?: string
  output?: unknown
  service?: 'official' | 'custom'
  usage?: { pointsCharged: number; balanceAfter: number }
}

export async function generateWithConfiguredService(settings: AIServiceSettings, secrets: AISecretStatus, input: { task: string; payload: Record<string, unknown> }): Promise<ConfiguredGenerationResult> {
  const desktopAI = window.workbenchDesktop?.ai
  if (!desktopAI) return { ok: false, message: 'AI 生成只能在 Windows 桌面版中使用。' }

  if (settings.mode === 'official') {
    if (!settings.officialWorkspaceId || !secrets.officialTokenSaved) return { ok: false, message: '请先配置官方 AI 服务。' }
    const response = await desktopAI.generateOfficial({ workspaceId: settings.officialWorkspaceId, task: input.task, payload: input.payload })
    if (!response.ok || !response.data) return { ok: false, message: response.message || '官方生成服务暂时不可用。' }
    return { ok: true, output: response.data.output, service: 'official', usage: response.data.usage }
  }

  if (!settings.customBaseUrl || !settings.customModel || !secrets.customApiKeySaved) return { ok: false, message: '请先配置自有 AI 服务。' }
  const response = await desktopAI.generateCustom({ baseUrl: settings.customBaseUrl, model: settings.customModel, task: input.task, payload: input.payload })
  if (!response.ok || !response.data) return { ok: false, message: response.message || '自有生成服务暂时不可用。' }
  return { ok: true, output: response.data.output, service: 'custom' }
}
