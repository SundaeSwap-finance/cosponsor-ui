import { config } from '@/lib/config'

/**
 * Build a proposal's CIP-108 anchor URL from the env-configured UI origin
 * (`config.appBaseUrl`, e.g. `https://cosponsor.preview.sundae.fi`).
 *
 * SINGLE SOURCE OF TRUTH: `proposalIdentity.ts`, `ModalPropose` and
 * `ModalSponsor` MUST all build the anchor via this helper. The anchor URL
 * feeds the gADA hash, so any divergence between where a proposal's identity is
 * computed and where its deposit/propose is built would produce a different
 * token and break lookups.
 */
export const proposalAnchorUrl = (urlId: string): string => `${config.appBaseUrl}/proposal/${urlId}`
