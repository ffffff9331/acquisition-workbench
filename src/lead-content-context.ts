import type { ContentLeadContext } from './content-production'

// A later edit must not replace the commitment a customer originally responded to.
export function contentLeadContextForUpdatedRecord(previousSource: string, nextSource: string, previousContext: ContentLeadContext | null, nextContext: ContentLeadContext | null) {
  return previousSource === nextSource ? previousContext : nextContext
}
