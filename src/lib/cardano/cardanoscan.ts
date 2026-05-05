// Cardanoscan block explorer URL builder
// Network is derived from COSPONSOR_BLOCKFROST_NETWORK env var:
//   "mainnet" → cardanoscan.io
//   "preview" / "preprod" → preview.cardanoscan.io / preprod.cardanoscan.io

const NETWORK = (import.meta.env.COSPONSOR_BLOCKFROST_NETWORK as string) || 'preview'

const EXPLORER_BASE: Record<string, string> = {
  mainnet: 'https://cardanoscan.io',
  preview: 'https://preview.cardanoscan.io',
  preprod: 'https://preprod.cardanoscan.io',
}

const getExplorerBase = (): string => EXPLORER_BASE[NETWORK] || EXPLORER_BASE.preview

export const getExplorerTxUrl = (txHash: string): string =>
  `${getExplorerBase()}/transaction/${txHash}`
