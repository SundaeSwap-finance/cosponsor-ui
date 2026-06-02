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
 *   5. Upstream targets the default Ogmios v5 protocol. Historically
 *      that broke on Conway-era CBOR tag 258 (sets) with "failed to
 *      decode payload from base64 or base16." A 2026-05-28 probe against
 *      cardano-preview shows that issue no longer reproduces — modern
 *      txs decode fine through the v5 path. The original fix routed to
 *      Ogmios v6 via `?version=6`, but bug 6 (below) makes that path
 *      incompatible with additionalUtxoset, so this patch is back on v5.
 *
 *   6. Blockfrost-side: `/utils/txs/evaluate/utxos?version=6` silently
 *      drops the version param and always returns Ogmios v5 jsonwsp.
 *      The simpler `/utils/txs/evaluate?version=6` correctly returns v6
 *      JSON-RPC but accepts only raw CBOR — no additionalUtxoset, so
 *      sequential transactions break under it. Verified 2026-05-28 via
 *      `scripts/probe-blockfrost-evaluate.ts`. Re-probe before changing
 *      direction; flip back to v6 if/when bug 6 is fixed upstream.
 *
 * --- What this patch does ---
 *
 * Overrides Blockfrost.prototype.evaluateTransaction with a v5 jsonwsp
 * request to /utils/txs/evaluate/utxos, restoring additionalUtxoset
 * support (chained txs against not-yet-indexed outputs work). The earlier
 * bugs 1–5 are still corrected: lowercase 's' in the field name, bech32
 * address, JSON-number coercion, language-keyed script object, and the
 * older Conway-tag-258 issue (no longer reproducible).
 *
 * We can't subclass because Blaze instantiates Blockfrost internally
 * inside `createBlazeWithBrowserWallet`. Prototype mutation runs once at
 * module import time and applies to every Blaze instance.
 *
 * --- Known scope limits (call out in the upstream PR) ---
 *
 * - Multi-asset values: we emit `value.coins` only. If a flow puts
 *   native assets in an additional UTxO, expand the value serialization
 *   to walk `value.multiasset()` and emit
 *   `assets: { "<policyIdHex>.<assetNameHex>": amount }` alongside coins.
 *
 * - Datums: not exercised here. v5 takes `datum` (hex of the datum, for
 *   inline) and `datumHash` (hex of the hash, for hash-only). Add them
 *   to the txOut object if a flow needs them.
 *
 * - Native scripts: v5 expects a structured JSON object. None of our
 *   flows use native script references in additionalUtxoset; expand
 *   `serializeScriptRefV5` if a future flow needs it.
 */

import { Blockfrost, Core } from '@blaze-cardano/sdk'
import { setInConwayEra } from '@blaze-cardano/core'

// Conway-era CBOR flag. Blaze's TxBuilder constructor sets this true, but
// (a) it only fires when a TxBuilder is constructed, and (b) the flag lives
// on a module-instance of `@cardano-sdk/core` that may not be the same one
// the redeemer serializer reads from depending on which tree the tx CBOR
// is produced in. Setting it eagerly here guarantees `Redeemers.toCbor`
// and `CborSet.toCbor` emit Conway-style (CBOR tag 258, map redeemers)
// regardless of order. Ogmios v6 endpoints that demand Conway will
// otherwise reject our txs as `unsupportedEra: "babbage"`.
setInConwayEra(true)
// The cosponsor SDK ships in its own node_modules tree (linked from
// `cosponsor-contracts/offchain`) so its Blockfrost class identity is a
// different one from the UI's @blaze-cardano/sdk. `createProvider` /
// `createBlazeWithBrowserWallet` instantiate the SDK-tree class. Patching
// the UI-tree prototype alone leaves the upstream evaluator in place for
// every Blaze instance the SDK builds (and that's all of ours). Importing
// the SDK-tree Blockfrost here so we can mutate that prototype too.
// Re-exported from `@sundaeswap/cosponsor-sdk/browser`; rebuild the SDK
// (`bun run build` in cosponsor-contracts/offchain) if this import 404s.
import { Blockfrost as BlockfrostFromSdkTree } from '@sundaeswap/cosponsor-sdk/browser'
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
// Script ref serializer for Ogmios v5 additionalUtxoset.
// ---------------------------------------------------------------------------
// v5 expects `{<language>: "<hex>"}` — a single-key object whose key is the
// script language tag and whose value is the script's CBOR-wrapped bytecode
// hex. Blaze's `script.asPlutusV3().rawBytes()` returns that single-wrapped
// hex form (a CBOR bytestring containing the bytecode), which matches what
// v5 wants here.
//
// None of the current sponsor / withdraw flows produce script-ref-carrying
// outputs that would feed back through additionalUtxos (the cosponsor script
// ref lives on-chain at a stable UTxO and is resolved by reference), so this
// branch is rarely exercised. Kept for completeness; add native-script
// support here if a future flow needs it.
function serializeScriptRefV5(script: Core.Script): Record<string, string> | undefined {
  const v3 = script.asPlutusV3()
  if (v3) {
    return { 'plutus:v3': v3.rawBytes() }
  }
  const v2 = script.asPlutusV2()
  if (v2) {
    return { 'plutus:v2': v2.rawBytes() }
  }
  const v1 = script.asPlutusV1()
  if (v1) {
    return { 'plutus:v1': v1.rawBytes() }
  }
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

// ---------------------------------------------------------------------------
// Replacement evaluateTransaction targeting Ogmios v5 jsonwsp via Blockfrost.
// ---------------------------------------------------------------------------
//
// Endpoint choice rationale (bug 6, re-verified 2026-05-28 by
// `scripts/probe-blockfrost-evaluate.ts`):
//
// - `/utils/txs/evaluate/utxos` is the only endpoint that accepts
//   `additionalUtxoset` — required for evaluating chained transactions
//   against outputs Blockfrost hasn't indexed yet (e.g. depositing then
//   immediately depositing again).
// - That endpoint **silently drops** `?version=6` and always speaks Ogmios
//   v5 jsonwsp, regardless of what we ask for. Blockfrost preview confirmed
//   2026-05-28; we re-probe via the script when in doubt.
// - The simpler `/utils/txs/evaluate?version=6` correctly returns v6
//   JSON-RPC but takes only raw CBOR with no additionalUtxoset support, so
//   chained txs against unindexed outputs break under it.
//
// Trade-off taken: speak v5 jsonwsp to the smart endpoint. v5 was the
// original "won't decode Conway tag 258" concern (the comment in the prior
// patch) but the 2026-05-28 probe shows preview's v5 Ogmios now decodes
// modern txs fine — the older error mode is no longer reproducible. If a
// regression bites here, the fix is to fall back to the v6 simple endpoint
// for the duration of that incident and accept the no-additionalUtxoset
// limitation. The probe script tells you which way to go.

type EvaluateTxFn = (
  tx: Core.Transaction,
  additionalUtxos?: Core.TransactionUnspentOutput[]
) => Promise<Core.Redeemers>

interface BlockfrostInternals {
  url: string
  headers: () => Record<string, string>
  evaluateTransaction: EvaluateTxFn
}

// Ogmios v5 jsonwsp response shapes.
//
// Success: result.EvaluationResult keyed by "<purpose>:<index>" with
// `{ memory, steps }` budgets.
// Recoverable / script failure: result.EvaluationFailure with either
// `ScriptFailures` (one or more validators returned error) or specific
// failure variants like `AdditionalUtxoOverlap` / `IncompleteUtxoSet`.
// Protocol fault (malformed CBOR, auth, etc.): type === "jsonwsp/fault".
interface OgmiosV5Budget {
  memory: number
  steps: number
}
interface OgmiosV5SuccessResult {
  EvaluationResult: Record<string, OgmiosV5Budget>
}
interface OgmiosV5FailureResult {
  EvaluationFailure: Record<string, unknown>
}
interface OgmiosV5Response {
  type: 'jsonwsp/response' | 'jsonwsp/fault'
  version?: string
  servicename?: string
  methodname?: string
  result?: OgmiosV5SuccessResult | OgmiosV5FailureResult
  fault?: { code: string; string: string }
  reflection?: unknown
}

// Apply the patch to every Blockfrost prototype reachable from the app.
// At minimum that's the UI's own `@blaze-cardano/sdk` (this file's
// `Blockfrost`) and the SDK-tree's copy (`BlockfrostFromSdkTree`) — the
// latter is the one `createProvider` actually instantiates, so without it
// the patch is a no-op for our flows.
const uiTreeProto = Blockfrost.prototype as unknown as BlockfrostInternals
const sdkTreeProto = BlockfrostFromSdkTree.prototype as unknown as BlockfrostInternals
const prototypesToPatch = new Set<BlockfrostInternals>([uiTreeProto, sdkTreeProto])

// eslint-disable-next-line no-console
console.info('[blaze-patches] patching evaluateTransaction prototypes', {
  count: prototypesToPatch.size,
  sameIdentity: uiTreeProto === sdkTreeProto,
})

const patchedEvaluateTransaction: BlockfrostInternals['evaluateTransaction'] = async function (
  this: BlockfrostInternals,
  tx: Core.Transaction,
  additionalUtxos?: Core.TransactionUnspentOutput[]
): Promise<Core.Redeemers> {
  const currentRedeemers = tx.witnessSet().redeemers()?.values()
  if (!currentRedeemers || currentRedeemers.length === 0) {
    throw new Error('evaluateTransaction: No Redeemers found in transaction')
  }

  // Build v5-shaped additional UTxOs.
  //
  // v5 differences vs the v6 shape the previous patch revision used:
  //   - txIn is flat: `{txId, index}` (not `{transaction: {id}, index}`).
  //   - value is flat: `{coins: number, assets?: {…}}` (not `{ada: {lovelace}}`).
  //   - script is `{<language>: <hex>}` keyed by language (not `{language, cbor}`).
  // The five existing pre-existing bug fixes from the prior revision (1-5
  // in the file header) still apply: lowercase 's' in `additionalUtxoset`,
  // bech32 address, JSON number coercion, script object form, /version=6
  // routing — only the last one inverts now (we explicitly stay on v5).
  // Diagnostic: list the inputs the tx is actually trying to spend so we
  // can cross-check against additionalUtxoset / chain state in case of
  // "missing from UTxO set" failures.
  const inputIds: string[] = []
  for (const inp of tx.body().inputs().values()) {
    inputIds.push(`${inp.transactionId().toString()}#${inp.index().toString()}`)
  }
  // eslint-disable-next-line no-console
  console.info('[blaze-patches] tx inputs', inputIds)

  const additionalUtxoset: unknown[] = []
  const additionalIds: string[] = []
  for (const utxo of additionalUtxos ?? []) {
    const input = utxo.input()
    const output = utxo.output()
    const value = output.amount()

    const txIn = {
      txId: input.transactionId().toString(),
      index: Number(input.index()),
    }

    // Serialize native assets (gADA tokens, etc.). Critical for chained
    // sponsor/withdraw flows: the wallet's change output from a previous tx
    // typically carries gADA tokens that the coin selector pulled in. If we
    // declare the UTxO as coins-only here, Ogmios resolves the input from
    // our entry, finds the value doesn't match what the tx's scripts
    // expect, and surfaces a misleading "Unknown transaction input
    // (missing from UTxO set)" — even though the txhash#index is right
    // there in additionalUtxoset. v5 schema:
    //   value: { coins: Number, assets?: { "<policyHex>.<assetNameHex>": Number } }
    const assets: Record<string, number> = {}
    const multiasset = value.multiasset()
    if (multiasset) {
      for (const [assetId, amount] of multiasset.entries()) {
        // assetId is a concatenation of policy id (56 hex chars) + asset
        // name hex. v5 expects them dotted: "<policy>.<assetName>".
        const idStr = assetId.toString()
        const policy = idStr.slice(0, 56)
        const assetName = idStr.slice(56)
        assets[`${policy}.${assetName}`] = Number(amount)
      }
    }

    const txOut: Record<string, unknown> = {
      address: output.address().toBech32(),
      value: {
        coins: Number(value.coin()),
        ...(Object.keys(assets).length > 0 ? { assets } : {}),
      },
    }

    // Inline datum (full PlutusData hex) and datum hash, both v5
    // snake_case-ish here per the OpenAPI. Cosponsor script outputs carry
    // inline datums; when one of them shows up in additionalUtxoset (e.g.
    // a script UTxO produced by a chained deposit), Ogmios needs the
    // datum bytes to resolve it.
    const datum = output.datum()
    if (datum) {
      const inline = datum.asInlineData?.()
      if (inline) {
        // Ogmios v5 accepts the full datum bytes as hex under the `datum`
        // key. Use `toCbor()` so the wire form matches the on-chain bytes
        // exactly.
        txOut.datum = inline.toCbor()
      } else {
        const dh = datum.asDataHash?.()
        if (dh) {
          txOut.datumHash = dh.toString()
        }
      }
    }

    const scriptRef = output.scriptRef()
    if (scriptRef) {
      const serialized = serializeScriptRefV5(scriptRef)
      if (serialized) {
        txOut.script = serialized
      }
    }

    additionalUtxoset.push([txIn, txOut])
    additionalIds.push(`${txIn.txId}#${txIn.index}`)
  }

  // Cross-reference: which tx inputs are covered by additionalUtxoset vs
  // need to come from chain state? On a "missing from UTxO set" failure
  // the gap shows up here clearly: the failing input is in `inputIds`
  // but not in `additionalIds`, and Blockfrost also doesn't know it.
  const additionalIdSet = new Set(additionalIds)
  const coveredByAdditional: string[] = []
  const expectedFromChain: string[] = []
  for (const id of inputIds) {
    ;(additionalIdSet.has(id) ? coveredByAdditional : expectedFromChain).push(id)
  }
  // eslint-disable-next-line no-console
  console.info('[blaze-patches] additionalUtxoset coverage', {
    additional: additionalIds,
    coveredByAdditional,
    expectedFromChain,
  })

  // For each tx input covered by additionalUtxoset, dump the exact entry
  // we're sending. If Ogmios rejects it as "Unknown transaction input"
  // despite being in additionalUtxoset, the rejected entry's JSON is the
  // smoking gun for the serialization issue.
  for (const id of coveredByAdditional) {
    const idx = additionalIds.indexOf(id)
    if (idx >= 0) {
      // eslint-disable-next-line no-console
      console.info(
        `[blaze-patches] additionalUtxoset entry for ${id}`,
        JSON.stringify(additionalUtxoset[idx], null, 2)
      )
    }
  }

  // this.url may have a trailing slash; normalize before concat.
  const baseUrl = this.url.replace(/\/+$/, '')
  const evalUrl = `${baseUrl}/utils/txs/evaluate/utxos`

  // Field name is the lowercase-'s' `additionalUtxoset` (bug 1 in the
  // header). Tried including both casings as duplicate keys to hedge
  // against Blockfrost flip-flopping; that broke decoding entirely
  // ("Invalid request: failed to decode payload from base64 or base16."
  // on even simple initial txs), so we're back to the single key.
  const body = {
    cbor: tx.toCbor(),
    additionalUtxoset,
  }

  // eslint-disable-next-line no-console
  console.info('[blaze-patches] evaluateTransaction request body', {
    url: evalUrl,
    cborByteLength: tx.toCbor().length / 2,
    additionalCount: additionalUtxoset.length,
    firstEntry: additionalUtxoset[0],
  })

  const response = await fetch(evalUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...this.headers(),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(
      `evaluateTransaction: failed to evaluate transaction in Blockfrost endpoint.\nError ${error}`
    )
  }

  // -----------------------------------------------------------------------
  // Response handling — Ogmios v5 jsonwsp.
  // -----------------------------------------------------------------------
  const json = (await response.json()) as OgmiosV5Response

  // eslint-disable-next-line no-console
  console.info('[blaze-patches] evaluateTransaction raw response', json)

  if (json.type === 'jsonwsp/fault') {
    // Protocol-level rejection: malformed CBOR, auth issue, request shape
    // problem. The `fault.string` carries the diagnostic. Match the
    // ModalSponsor / ModalWithdraw error-catch families by also surfacing
    // the legacy "missing from UTxO set" / "Unknown transaction input"
    // signals when applicable.
    const faultMsg = json.fault?.string ?? 'unknown fault'
    throw new Error(`evaluateTransaction: Ogmios v5 fault (${json.fault?.code}): ${faultMsg}`)
  }

  if (!json.result) {
    console.error('[blaze-patches] unexpected response shape', JSON.stringify(json, null, 2))
    throw new Error('evaluateTransaction: Blockfrost endpoint returned no result.')
  }

  // EvaluationFailure: either a script-side rejection or a UTxO-resolution
  // problem. Try to extract the actionable bits so the upstream catch can
  // tell the two apart without parsing free-form prose.
  if ('EvaluationFailure' in json.result) {
    const failure = json.result.EvaluationFailure
    const parts = ['evaluateTransaction: Ogmios v5 EvaluationFailure']

    // ScriptFailures: validator returned `error` from on-chain code, or
    // UTxO referenced isn't in the resolved set Ogmios was given.
    if (failure && typeof failure === 'object' && 'ScriptFailures' in failure) {
      const scriptFailures = (failure as { ScriptFailures: Record<string, unknown> }).ScriptFailures
      const keys = Object.keys(scriptFailures ?? {})
      if (keys.length > 0) {
        // Emit the first <purpose>:<index> tag so the catch in ModalSponsor
        // can branch on `validator=mint#0` etc.
        const [k] = keys
        const [purpose, idx] = k.split(':')
        parts.push(`validator=${purpose}#${idx}`)

        // v5 jsonwsp `ScriptFailures` values come in two real-world shapes:
        //   - **Single object** keyed by failure kind, e.g.
        //       { CannotCreateEvaluationContext: { reason: "Unknown transaction input …" } }
        //       { validatorFailed: { error, traces } }
        //       { missingRequiredDatums: { provided, missing } }
        //   - **Array of those objects**, when more than one failure stacks
        //     up for the same redeemer (rare).
        // Earlier draft only handled the array shape, so the object cases
        // (which is what Blockfrost+Ogmios actually returns for the
        // CannotCreateEvaluationContext family) fell through and the
        // diagnostic message lost the most useful line. Handle both.
        const v = scriptFailures[k]
        const failures = Array.isArray(v) ? v : v != null ? [v] : []

        if (failures.length > 0 && failures[0]) {
          const firstFailure = failures[0]
          parts.push(`reason: ${JSON.stringify(firstFailure).slice(0, 600)}`)

          // CannotCreateEvaluationContext.reason is the canonical place
          // Ogmios v5 puts "Unknown transaction input (missing from UTxO
          // set): <txhash>#<ix>". Pull that string up to the top level so
          // ModalSponsor's catch (which string-matches "Unknown transaction
          // input" / "missing from UTxO set") fires and the user gets the
          // helpful "refresh and try again" message instead of a stack
          // trace.
          if (
            firstFailure &&
            typeof firstFailure === 'object' &&
            'CannotCreateEvaluationContext' in firstFailure
          ) {
            const ctx = (firstFailure as { CannotCreateEvaluationContext: { reason?: string } })
              .CannotCreateEvaluationContext
            if (ctx?.reason) {
              parts.push(ctx.reason)
            }
          }
        }
      }
    }

    // MissingInputs / AdditionalUtxoOverlap / IncompleteUtxoSet: tx
    // references UTxOs not on-chain and not in additionalUtxoset. These
    // appear at the EvaluationFailure top level in some Ogmios v5 shapes;
    // the CannotCreateEvaluationContext path above covers the more
    // common "input referenced but unindexed" case. Both surface the
    // legacy "missing from UTxO set" token so the upstream catch
    // matches uniformly.
    const utxoFailureKeys = [
      'MissingInputs',
      'AdditionalUtxoOverlap',
      'IncompleteUtxoSet',
      'UnknownInputs',
      'NotEnoughCollateral',
    ]
    for (const key of utxoFailureKeys) {
      if (failure && typeof failure === 'object' && key in failure) {
        const data = (failure as Record<string, unknown>)[key]
        parts.push(`${key}: ${JSON.stringify(data).slice(0, 400)}`)
        parts.push('Unknown transaction input (missing from UTxO set)')
      }
    }

    // Fallback: include the whole failure object so we can debug a shape
    // we haven't enumerated yet.
    if (parts.length === 1) {
      parts.push(JSON.stringify(failure).slice(0, 600))
    }

    throw new Error(parts.join(' | '))
  }

  // EvaluationResult: the happy path. Keys are "<purpose>:<index>",
  // values are { memory, steps }.
  if (!('EvaluationResult' in json.result)) {
    console.error('[blaze-patches] unexpected result shape', JSON.stringify(json, null, 2))
    throw new Error('evaluateTransaction: result is neither EvaluationResult nor EvaluationFailure')
  }

  const evalResult = json.result.EvaluationResult
  const evaledRedeemers = new Set<Core.Redeemer>()
  for (const [key, budget] of Object.entries(evalResult)) {
    const [purposeStr, indexStr] = key.split(':')
    const purpose = purposeToTag[purposeStr]
    if (purpose === undefined) {
      throw new Error(`evaluateTransaction: unknown redeemer purpose "${purposeStr}" in result`)
    }
    const index = BigInt(indexStr)
    const exUnits = Core.ExUnits.fromCore({
      memory: budget.memory,
      steps: budget.steps,
    })
    const redeemer = currentRedeemers.find((x) => x.tag() === purpose && x.index() === index)
    if (!redeemer) {
      throw new Error(
        `evaluateTransaction: Blockfrost endpoint returned redeemer ${key} not present in tx`
      )
    }
    redeemer.setExUnits(exUnits)
    evaledRedeemers.add(redeemer)
  }
  return Core.Redeemers.fromCore(Array.from(evaledRedeemers).map((x) => x.toCore()))
}

for (const proto of prototypesToPatch) {
  proto.evaluateTransaction = patchedEvaluateTransaction
}

// ---------------------------------------------------------------------------
// Chained-tx evaluator wrapper.
// ---------------------------------------------------------------------------
//
// Blaze's default evaluator chain passes `additionalUtxos` containing only
// UTxOs the TxBuilder itself produced within the current tx — it does NOT
// include the wallet's own UTxOs. That's fine when every wallet input is
// already indexed by Blockfrost, but when the wallet just spent a change
// output from a previous (unconfirmed) tx, Ogmios can't resolve it
// (Blockfrost hasn't indexed it yet) and the eval fails with
// `CannotCreateEvaluationContext: Unknown transaction input (missing from
// UTxO set): <txhash>#<ix>` — the chained-tx blocker.
//
// This wrapper turns any base evaluator into a wallet-aware one: it pulls
// the wallet's current UTxOs and unions them with Blaze's
// `additionalUtxos` before delegating. The wallet authoritatively knows
// about its own pending change outputs (CIP-30 wallets like Eternl/Nami
// include unconfirmed change in `getUtxos()`), so this closes the gap
// without needing Blockfrost to catch up.
//
// Use it whether the underlying evaluator is our patched Blockfrost or an
// Ogmios direct endpoint — the wallet-utxo concern is identical either
// way. Call sites in ModalSponsor / ModalWithdraw wire it in via
// `txBuilder.useEvaluator(...)`.
// `blaze` and the underlying evaluator come from the SDK-tree's
// `@blaze-cardano/sdk` (linked from cosponsor-contracts), whose `Core`
// type identities differ from the UI-tree's despite being structurally
// identical (the @cardano-sdk/core 0.45-vs-0.46 version-skew documented
// in TODO.md "Tech Debt: Blaze Override Stack"). The helpers are written
// against the UI's `Core` types and rely on inline casts to bridge the
// runtime-identical / type-distinct boundary. Both inputs and the
// returned function shadow the SDK's analog interfaces structurally, so
// `txBuilder.useEvaluator(...)` accepts the return without further
// casting at call sites.
type ChainedEvaluator = (
  tx: Core.Transaction,
  additionalUtxos?: Core.TransactionUnspentOutput[]
) => Promise<Core.Redeemers>

interface BlazeLike {
  wallet: { getUnspentOutputs: () => Promise<Core.TransactionUnspentOutput[]> }
  provider: { evaluateTransaction: ChainedEvaluator }
}

const utxoId = (utxo: Core.TransactionUnspentOutput): string => {
  const input = utxo.input()
  return `${input.transactionId().toString()}#${input.index().toString()}`
}

export const wrapEvaluatorWithWalletUtxos = (
  blaze: unknown,
  baseEvaluator: unknown
): ChainedEvaluator => {
  const b = blaze as BlazeLike
  const underlying = baseEvaluator as ChainedEvaluator
  return async (tx, additionalUtxos) => {
    let walletUtxos: Core.TransactionUnspentOutput[] = []
    try {
      walletUtxos = await b.wallet.getUnspentOutputs()
    } catch (err) {
      console.warn('[blaze-patches] wallet.getUnspentOutputs failed; evaluating without it', err)
    }

    // Union by `txhash#index` — Blaze's `additionalUtxos` is authoritative
    // when it knows about an output (e.g. self-spend within the same tx),
    // so it shadows the wallet's copy.
    const byId = new Map<string, Core.TransactionUnspentOutput>()
    for (const u of walletUtxos) {
      byId.set(utxoId(u), u)
    }
    for (const u of additionalUtxos ?? []) {
      byId.set(utxoId(u), u)
    }
    const merged = Array.from(byId.values())

    // eslint-disable-next-line no-console
    console.info('[blaze-patches] wrapEvaluatorWithWalletUtxos merged', {
      walletUtxoCount: walletUtxos.length,
      blazeAdditionalCount: (additionalUtxos ?? []).length,
      walletIds: walletUtxos.map(utxoId),
      mergedIds: merged.map(utxoId),
    })

    return underlying(tx, merged)
  }
}

// Convenience for the common case: wrap the Blaze provider's own evaluator
// (which is our patched v5 jsonwsp one if Blockfrost; else upstream).
export const buildChainedTxEvaluator = (blaze: unknown): ChainedEvaluator => {
  const b = blaze as BlazeLike
  return wrapEvaluatorWithWalletUtxos(
    b,
    (tx: Core.Transaction, extra?: Core.TransactionUnspentOutput[]) =>
      b.provider.evaluateTransaction(tx, extra)
  )
}
