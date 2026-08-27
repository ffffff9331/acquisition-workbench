export type ContentReleaseConfirmation = {
  aiMaterial: '' | '未使用' | '已使用'
  aiLabelChecked: boolean
  customerMaterial: '' | '未使用' | '已使用'
  customerMaterialAuthorized: boolean
  promotionMarking: '' | '不需要' | '已按本次平台规则确认'
  publishingAccount: string
  publisher: string
  inquiryOwner: string
  platformRulesCheckedAt: string
}

export const emptyContentReleaseConfirmation: ContentReleaseConfirmation = {
  aiMaterial: '',
  aiLabelChecked: false,
  customerMaterial: '',
  customerMaterialAuthorized: false,
  promotionMarking: '',
  publishingAccount: '',
  publisher: '',
  inquiryOwner: '',
  platformRulesCheckedAt: '',
}

function clean(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

export function normalizeContentReleaseConfirmation(value: unknown): ContentReleaseConfirmation {
  const item = value && typeof value === 'object' ? value as Partial<ContentReleaseConfirmation> : {}
  const aiMaterial = item.aiMaterial === '未使用' || item.aiMaterial === '已使用' ? item.aiMaterial : ''
  const customerMaterial = item.customerMaterial === '未使用' || item.customerMaterial === '已使用' ? item.customerMaterial : ''
  const promotionMarking = item.promotionMarking === '不需要' || item.promotionMarking === '已按本次平台规则确认' ? item.promotionMarking : ''
  return {
    aiMaterial,
    aiLabelChecked: item.aiLabelChecked === true,
    customerMaterial,
    customerMaterialAuthorized: item.customerMaterialAuthorized === true,
    promotionMarking,
    publishingAccount: clean(item.publishingAccount, 160),
    publisher: clean(item.publisher, 120),
    inquiryOwner: clean(item.inquiryOwner, 120),
    platformRulesCheckedAt: /^\d{4}-\d{2}-\d{2}$/.test(clean(item.platformRulesCheckedAt, 20)) ? clean(item.platformRulesCheckedAt, 20) : '',
  }
}

export function contentReleaseConfirmationReady(confirmation: ContentReleaseConfirmation) {
  const aiReady = Boolean(confirmation.aiMaterial) && (confirmation.aiMaterial === '未使用' || confirmation.aiLabelChecked)
  const customerMaterialReady = Boolean(confirmation.customerMaterial) && (confirmation.customerMaterial === '未使用' || confirmation.customerMaterialAuthorized)
  const promotionReady = Boolean(confirmation.promotionMarking)
  const responsibilityReady = Boolean(confirmation.publishingAccount.trim() && confirmation.publisher.trim() && confirmation.inquiryOwner.trim() && confirmation.platformRulesCheckedAt)
  return aiReady && customerMaterialReady && promotionReady && responsibilityReady
}
