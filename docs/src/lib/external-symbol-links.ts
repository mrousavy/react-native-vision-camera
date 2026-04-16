import {
  type ExternalSymbolLinkMappings,
  externalSymbolLinkMappings,
} from '../../config/external-symbol-link-mappings'

export function getExternalSymbolLinkMappings(): ExternalSymbolLinkMappings {
  return externalSymbolLinkMappings
}

export function getExternalCodeTypeLinks(): Record<string, string> {
  const result: Record<string, string> = {}

  for (const symbols of Object.values(externalSymbolLinkMappings)) {
    for (const [symbolName, href] of Object.entries(symbols)) {
      // Code token linkification only supports plain identifiers.
      if (!/^[A-Z][A-Za-z0-9_$]*$/.test(symbolName)) {
        continue
      }

      if (result[symbolName] == null) {
        result[symbolName] = href
      }
    }
  }

  return result
}
