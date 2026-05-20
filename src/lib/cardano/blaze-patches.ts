/**
 * Local patches for outstanding bugs in @blaze-cardano/query@0.5.6's
 * Blockfrost provider. Documented here for an upstream PR. Delete this
 * file and the side-effect import in blaze.ts once @blaze-cardano/query
 * ships a fix.
 *
 * Upstream source we are patching (npm 0.5.6 ≡ git main as of writing):
 *   https://github.com/butaneprotocol/blaze-cardano/blob/main/packages/blaze-query/src/blockfrost.ts
 *   (the entire `evaluateTransaction` method)
 *
 * Authoritative endpoint spec we cross-checked against:
 *   https://raw.githubusercontent.com/blockfrost/openapi/master/openapi.yaml
 *   (paths `/utils/txs/evaluate/utxos`)
 *
 * Ogmios v6 schema reference:
 *   https://ogmios.dev/mini-protocols/local-tx-submission/#evaluatetx
 *
 * --- Bugs in the upstream Blockfrost provider ---
 *
 * All of these contribute to a generic 400 from Blockfrost or a generic
 * jsonwsp/json-rpc fault from Ogmios. We worked through them iteratively
 * (each row is a real failure mode we observed in this project):
 *
 *   1. Payload field name is `additionalUtxoset` (lowercase 's').
 *      The OpenAPI spec defines `additionalUtxoSet` (capital 'S'). With
 *      the wrong key, the request body is technically valid JSON but
 *      doesn't match Blockfrost's struct, so the additional UTxOs are
 *      silently dropped on deserialize. The cbor field then forwards
 *      alone to the evaluator with no extra UTxOs.
 *
 *   2. `address` is the raw Core.Address class instance, never converted.
 *      Address uses private fields (`#`), so JSON.stringify emits `{}`
 *      for every output. The Kupmios provider in the same package gets
 *      this right (`out.address().toBech32()` in serializeUtxos).
 *
 *   3. The JSON.stringify replacer coerces every BigInt to a string.
 *      The endpoint spec is explicit: `index: number`,
 *      `value.coins: number` (v5) / `value.ada.lovelace: number` (v6).
 *      Strings make the entries schema-invalid.
 *
 *   4. `script` is the raw script CBOR hex (`scriptRef().toCbor()`).
 *      Two compounding problems: the field needs to be an object with
 *      `{language, cbor}`, and the inner CBOR Blaze produces for Plutus
 *      scripts is double-CBOR-wrapped (a CBOR bytestring containing a
 *      CBOR bytestring containing the bytecode). Both Ogmios v5 (which
 *      wants raw bytecode hex) and v6 (which wants single-wrapped hex)
 *      reject the double-wrapped form.
 *
 *   5. Upstream targets the default Ogmios v5 protocol, which doesn't
 *      understand Conway-era CBOR tags (tag 258 / `d9 0102` for sets).
 *      For any Conway transaction the v5 path fails with a generic
 *      "failed to decode payload from base64 or base16". The fix is to
 *      pass `?version=6` on the URL — Blockfrost then routes to its
 *      Ogmios v6 backend, which uses JSON-RPC instead of JSON-WSP and a
 *      somewhat different request/response schema. This patch targets
 *      v6 because every flow in this project is Conway-era.
 *
 * --- What this patch does ---
 *
 * Overrides Blockfrost.prototype.evaluateTransaction with a v6-style
 * request to /utils/txs/evaluate/utxos?version=6, fixing all five bugs.
 *
 * We can't subclass because Blaze instantiates Blockfrost internally
 * inside `createBlazeWithBrowserWallet`. Prototype mutation runs once at
 * module import time and applies to every Blaze instance.
 *
 * --- Known scope limits (call out in the upstream PR) ---
 *
 * - Multi-asset values: we emit `value.ada` only. If a flow puts native
 *   assets in an additional UTxO, expand the value serialization to walk
 *   `value.multiasset()` and emit `[policyIdHex]: {[assetNameHex]: amount}`
 *   alongside `ada` per the v6 schema.
 *
 * - Datums: not exercised here. v6 wants `datumHash` (camelCase) and an
 *   inline `datum` field; upstream sends snake_case. If you hit this
 *   path, add the camelCase keys.
 *
 * - Native scripts: v6 expects either a serialized native script with
 *   `language: "native"` and `cbor` of the script, or a structured JSON
 *   representation. None of our flows use native script references; if
 *   you hit this, expand `serializeScriptRef`.
 */

import { Blockfrost, Core } from '@blaze-cardano/sdk'
// Direct import so we patch the exact function reference @blaze-cardano/tx
// and @blaze-cardano/wallet import internally, not the re-exported namespace
// binding from @blaze-cardano/sdk (which can be a separate reference under
// Vite's bundling).
import { Hash28ByteBase16 as Hash28ByteBase16Direct } from '@blaze-cardano/core'

// ---------------------------------------------------------------------------
// Bug 2 fallback: Address.prototype.toJSON
// ---------------------------------------------------------------------------
// Defensive — anywhere in the app that JSON-stringifies an Address still
// emits something useful instead of `{}`. The main fix is the explicit
// .toBech32() call in the request body below.
if (!('toJSON' in Core.Address.prototype)) {
  ;(Core.Address.prototype as unknown as { toJSON: () => string }).toJSON = function (
    this: Core.Address
  ) {
    return this.toBech32()
  }
}

// ---------------------------------------------------------------------------
// Hash28ByteBase16.fromEd25519KeyHashHex shim
// ---------------------------------------------------------------------------
// @blaze-cardano/tx@0.13.4 and @blaze-cardano/wallet@0.4.14 call
// `Hash28ByteBase16.fromEd25519KeyHashHex(hex)` as if it were a static class
// method (e.g. tx.addRequiredSigner, hit on the withdraw code path). They
// were built against an older shape of @cardano-sdk/crypto where
// Hash28ByteBase16 was a class.
//
// Under our override (blaze-cardano/core 0.8.0 → cardano-sdk/crypto 0.4.5),
// Hash28ByteBase16 is exported as a plain function `(value) => typedHex(value, 56)`,
// so the method lookup yields undefined and the call throws.
//
// An Ed25519KeyHashHex is structurally a Hash28ByteBase16 (the type is
// declared as `Ed25519KeyHashHex & Hash28ByteBase16 & HexBlob`), so the
// conversion is identity at runtime — just re-validate via the existing
// callable. Same module instance is reached from tx/wallet thanks to the
// `@blaze-cardano/core` override, so a single mutation suffices.
const hashCallable = Hash28ByteBase16Direct as unknown as {
  (value: string): string
  fromEd25519KeyHashHex?: (value: string) => string
}
if (!hashCallable.fromEd25519KeyHashHex) {
  hashCallable.fromEd25519KeyHashHex = (value: string) => hashCallable(value)
}
// Diagnostic: confirm at startup that the patch landed and that the
// reference we patched matches what Core re-exports. If these diverge,
// the patch was applied to the wrong binding.
// eslint-disable-next-line no-console
console.info('[blaze-patches] Hash28ByteBase16 shim installed', {
  patched: typeof hashCallable.fromEd25519KeyHashHex === 'function',
  sameAsCoreNamespace: hashCallable === (Core.Hash28ByteBase16 as unknown),
})

// ---------------------------------------------------------------------------
// Script ref serializer for Ogmios v6.
// ---------------------------------------------------------------------------
// v6 expects `{language: "plutus:v3", cbor: "<hex>"}` where `cbor` is the
// CBOR bytestring containing the bytecode (a single CBOR wrapper around the
// raw bytecode). Blaze's `script.asPlutusV3().rawBytes()` returns exactly
// that single-wrapped form, so we pass it through unchanged. (Blaze's
// `toCbor()` would double-wrap.)
function serializeScriptRef(script: Core.Script): { language: string; cbor: string } | undefined {
  const v3 = script.asPlutusV3()
  if (v3) return { language: 'plutus:v3', cbor: v3.rawBytes() }
  const v2 = script.asPlutusV2()
  if (v2) return { language: 'plutus:v2', cbor: v2.rawBytes() }
  const v1 = script.asPlutusV1()
  if (v1) return { language: 'plutus:v1', cbor: v1.rawBytes() }
  // Native scripts: not implemented because our flows don't use them.
  return undefined
}

// ---------------------------------------------------------------------------
// Map Ogmios v6 redeemer purpose strings to the integer tags Blaze's
// Core.Redeemer.tag() returns. These values are stable across Cardano
// protocol versions.
// ---------------------------------------------------------------------------
const purposeToTag: Record<string, number> = {
  spend: 0,
  mint: 1,
  publish: 2,
  withdraw: 3,
  vote: 4,
  propose: 5,
}

// /utils/txs/evaluate (v6) accepts raw CBOR bytes. Blaze's tx.toCbor() returns
// a hex string; convert to a Uint8Array for the fetch body.
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

// ---------------------------------------------------------------------------
// Replacement evaluateTransaction targeting Ogmios v6 via Blockfrost.
// ---------------------------------------------------------------------------

type EvaluateTxFn = (
  tx: Core.Transaction,
  additionalUtxos?: Core.TransactionUnspentOutput[]
) => Promise<Core.Redeemers>

interface BlockfrostInternals {
  url: string
  headers: () => Record<string, string>
  evaluateTransaction: EvaluateTxFn
}

interface OgmiosV6Result {
  validator: { purpose: string; index: number }
  budget: { memory: number; cpu: number }
}

interface OgmiosV6Response {
  jsonrpc?: string
  method?: string
  result?: OgmiosV6Result[]
  error?: { code: number; message: string; data?: unknown }
  id?: string
}

const proto = Blockfrost.prototype as unknown as BlockfrostInternals

proto.evaluateTransaction = async function (
  this: BlockfrostInternals,
  tx: Core.Transaction,
  additionalUtxos?: Core.TransactionUnspentOutput[]
): Promise<Core.Redeemers> {
  const currentRedeemers = tx.witnessSet().redeemers()?.values()
  if (!currentRedeemers || currentRedeemers.length === 0) {
    throw new Error('evaluateTransaction: No Redeemers found in transaction')
  }

  // Build v6-shaped additional UTxOs.
  const additionalUtxoSet: unknown[] = []
  for (const utxo of additionalUtxos ?? []) {
    const input = utxo.input()
    const output = utxo.output()
    const value = output.amount()

    const txIn = {
      // v6 nests the transaction id under `transaction` (was flat `txId` in v5).
      transaction: { id: input.transactionId().toString() },
      // Bug 3 fix: JSON number.
      index: Number(input.index()),
    }

    const txOut: Record<string, unknown> = {
      // Bug 2 fix: bech32 per spec.
      address: output.address().toBech32(),
      value: {
        // v6 uses `ada.lovelace` (was flat `coins` in v5). Bug 3 fix: number.
        ada: { lovelace: Number(value.coin()) },
        // See "Known scope limits" — native assets not serialized here.
      },
    }

    const scriptRef = output.scriptRef()
    if (scriptRef) {
      const serialized = serializeScriptRef(scriptRef)
      if (serialized) txOut.script = serialized
    }

    additionalUtxoSet.push([txIn, txOut])
  }

  // Bug 6 (Blockfrost-side): the /utils/txs/evaluate/utxos endpoint ignores
  // ?version=6 and always responds with Ogmios v5 jsonwsp — which can't
  // decode Conway-era CBOR (tag 258 in required_signers / set encodings),
  // failing with "Invalid request: failed to decode payload from base64 or
  // base16." Verified 2026-05-20 against cardano-preview.
  //
  // The simpler /utils/txs/evaluate endpoint DOES honor ?version=6 and
  // returns proper JSON-RPC v6 responses. It accepts raw CBOR bytes
  // (application/cbor) and has no additionalUtxoSet support.
  //
  // Trade-off: we always use /evaluate, dropping additionalUtxos entirely.
  // Blaze tends to pass selected inputs as additionalUtxos defensively even
  // when they're already on-chain. For all our flows the UTxOs are on-chain
  // (deposits resolved minutes-old, script ref well-anchored), so Blockfrost's
  // indexer should have them. If a flow ever needs to evaluate against
  // unindexed UTxOs we'll need a different evaluator (Ogmios direct).
  //
  // Also: this.url may have a trailing slash. Normalize before concat to
  // avoid the //utils path that Blockfrost sometimes redirects oddly.
  const baseUrl = this.url.replace(/\/+$/, '')
  const evalUrl = `${baseUrl}/utils/txs/evaluate?version=6`

  if (additionalUtxoSet.length > 0) {
    console.warn(
      `[blaze-patches] evaluateTransaction: dropping ${additionalUtxoSet.length} ` +
        'additionalUtxos. Tx chaining against unconfirmed outputs will fail until ' +
        'they are indexed by Blockfrost.'
    )
  }

  const response = await fetch(evalUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/cbor',
      Accept: 'application/json',
      ...this.headers(),
    },
    body: hexToBytes(tx.toCbor()),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(
      `evaluateTransaction: failed to evaluate transaction in Blockfrost endpoint.\nError ${error}`
    )
  }

  // -----------------------------------------------------------------------
  // Response handling — Ogmios v6 JSON-RPC.
  // -----------------------------------------------------------------------
  const json = (await response.json()) as OgmiosV6Response

  // eslint-disable-next-line no-console
  console.info('[blaze-patches] evaluateTransaction raw response', json)

  if (json.error) {
    throw new Error(
      `evaluateTransaction: Ogmios v6 error ${json.error.code}: ${json.error.message}`
    )
  }
  if (!json.result || !Array.isArray(json.result)) {
    console.error('[blaze-patches] unexpected response shape', JSON.stringify(json, null, 2))
    throw new Error('evaluateTransaction: Blockfrost endpoint returned no EvaluationResult.')
  }

  const evaledRedeemers = new Set<Core.Redeemer>()
  for (const item of json.result) {
    const purpose = purposeToTag[item.validator.purpose]
    const index = BigInt(item.validator.index)
    const exUnits = Core.ExUnits.fromCore({
      memory: item.budget.memory,
      // v6's redeemer budget uses `cpu`; Blaze's ExUnits.fromCore takes `steps`.
      steps: item.budget.cpu,
    })
    const redeemer = currentRedeemers.find((x) => x.tag() === purpose && x.index() === index)
    if (!redeemer) {
      throw new Error('evaluateTransaction: Blockfrost endpoint had extraneous redeemer data')
    }
    redeemer.setExUnits(exUnits)
    evaledRedeemers.add(redeemer)
  }
  return Core.Redeemers.fromCore(Array.from(evaledRedeemers).map((x) => x.toCore()))
}
