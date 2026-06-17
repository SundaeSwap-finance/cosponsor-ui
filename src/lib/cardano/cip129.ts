/**
 * CIP-129 governance-action identifier encoding.
 *
 * A governance action is identified on-chain by `(transaction_id, index)`.
 * CIP-129 serialises that as bech32 with the `gov_action` HRP over the bytes
 * `transaction_id (32 bytes) || index (1 byte)`.
 *
 * We inline a minimal bech32 encoder instead of pulling in a dependency: the
 * only bech32 packages in the tree are transitive (not declared in
 * package.json), so importing them directly would break on a clean install.
 * The output is verified byte-for-byte against a known GovTools value in the
 * unit check that accompanied this change.
 *
 * @see https://cips.cardano.org/cip/CIP-129
 */

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const GOV_ACTION_HRP = 'gov_action'

function polymod(values: number[]): number {
  const generators = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
  let chk = 1
  for (const value of values) {
    const top = chk >> 25
    chk = ((chk & 0x1ffffff) << 5) ^ value
    for (let i = 0; i < 5; i++) {
      if ((top >> i) & 1) {
        chk ^= generators[i]
      }
    }
  }
  return chk
}

function hrpExpand(hrp: string): number[] {
  const expanded: number[] = []
  for (let i = 0; i < hrp.length; i++) {
    expanded.push(hrp.charCodeAt(i) >> 5)
  }
  expanded.push(0)
  for (let i = 0; i < hrp.length; i++) {
    expanded.push(hrp.charCodeAt(i) & 31)
  }
  return expanded
}

function createChecksum(hrp: string, data: number[]): number[] {
  const values = hrpExpand(hrp).concat(data, [0, 0, 0, 0, 0, 0])
  const mod = polymod(values) ^ 1
  const checksum: number[] = []
  for (let i = 0; i < 6; i++) {
    checksum.push((mod >> (5 * (5 - i))) & 31)
  }
  return checksum
}

// Regroup 8-bit bytes into 5-bit groups (bech32 data part), padding the tail.
function convertBits(bytes: Uint8Array): number[] {
  let acc = 0
  let bits = 0
  const result: number[] = []
  const maxv = (1 << 5) - 1
  for (const byte of bytes) {
    acc = (acc << 8) | byte
    bits += 8
    while (bits >= 5) {
      bits -= 5
      result.push((acc >> bits) & maxv)
    }
  }
  if (bits > 0) {
    result.push((acc << (5 - bits)) & maxv)
  }
  return result
}

function bech32Encode(hrp: string, bytes: Uint8Array): string {
  const data = convertBits(bytes)
  const combined = data.concat(createChecksum(hrp, data))
  let encoded = `${hrp}1`
  for (const value of combined) {
    encoded += BECH32_CHARSET.charAt(value)
  }
  return encoded
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

const TX_HASH_HEX = /^[0-9a-fA-F]{64}$/

/**
 * Encode a governance action id as a CIP-129 `gov_action1…` bech32 string.
 *
 * Returns an empty string when `txHashHex` is not a valid 32-byte hex hash, so
 * callers can treat "no id" and "bad id" the same way (the details page hides
 * the row when this is empty rather than rendering a malformed value).
 *
 * `index` defaults to 0: GovTools submits each proposal as a single governance
 * action, and the GovTools API does not expose the action index. Revisit if an
 * index ever becomes available (e.g. multi-action submission txs).
 */
export const encodeCip129GovActionId = (txHashHex: string, index: number = 0): string => {
  if (!TX_HASH_HEX.test(txHashHex)) {
    return ''
  }
  const txBytes = hexToBytes(txHashHex)
  const payload = new Uint8Array(txBytes.length + 1)
  payload.set(txBytes, 0)
  payload[txBytes.length] = index & 0xff
  return bech32Encode(GOV_ACTION_HRP, payload)
}
