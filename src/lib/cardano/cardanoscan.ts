// Cardanoscan block explorer URL builder, keyed off the runtime network:
//   "mainnet" → cardanoscan.io
//   "preview" / "preprod" → preview.cardanoscan.io / preprod.cardanoscan.io

import { config } from '@/lib/config'

const EXPLORER_BASE: Record<string, string> = {
  mainnet: 'https://cardanoscan.io',
  preview: 'https://preview.cardanoscan.io',
  preprod: 'https://preprod.cardanoscan.io',
}

const getExplorerBase = (): string =>
  EXPLORER_BASE[config.blockfrostNetwork] || EXPLORER_BASE.preview

export const getExplorerTxUrl = (txHash: string): string =>
  `${getExplorerBase()}/transaction/${txHash}`
