/**
 * Unit tests for the compose-graph builder (Workstream #7).
 *
 * Dependency-free: uses node:assert and a tiny runner so it executes under
 * `bun src/lib/workspace/compose-graph.test.ts` (see the "test" script)
 * without pulling in a test framework or Bun global types that could clash
 * with the Next.js DOM lib. Workstream #6.2 can later fold this into a
 * formal harness.
 */
import assert from "node:assert/strict";

import { buildComposeGraph, getAdapterManifest } from "@/lib/workspace/compose-graph";
import type { GraphMutation } from "@/lib/workspace/mutations";

let passed = 0;
let failed = 0;
function test(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`FAIL  ${name}`);
    console.log(`        ${err instanceof Error ? err.message : String(err)}`);
  }
}

function nodePositions(mutations: GraphMutation[]): { x: number; y: number }[] {
  return mutations
    .filter((m) => m.kind === "add-node")
    .map((m) => (m.kind === "add-node" ? m.node.position : { x: 0, y: 0 }));
}

// 1. Single-node entry derives a base-unit source amount + lays out at origin.
test("single-node stake: valid, amount -> lamports, one exec node", () => {
  const out = buildComposeGraph({
    nodes: [{ ref: "n1", catalogItemId: "jito-sol-stake", widgets: { amount: 0.1 } }],
    summary: "stake",
    rationale: "why",
    riskTier: "Shallows",
  });
  assert.equal(out.valid, true);
  assert.deepEqual(out.errors, []);
  assert.equal(out.executable.nodes.length, 1);
  assert.equal(out.executable.edges.length, 0);
  assert.equal(out.executable.nodes[0]?.sourceAmount, "100000000"); // 0.1 * 1e9
  assert.deepEqual(nodePositions(out.mutations), [{ x: 200, y: 200 }]);
});

// 2. Two-node chain: asset-compatible, entry amount set, downstream inherits.
test("swap -> supply chain: compatible, laid out left-to-right", () => {
  const out = buildComposeGraph({
    nodes: [
      {
        ref: "a",
        catalogItemId: "jupiter-swap-sol-usdc",
        widgets: { inputAsset: "SOL", outputAsset: "USDC", amount: 0.05 },
      },
      { ref: "b", catalogItemId: "kamino-usdc-supply" },
    ],
    edges: [{ from: "a", to: "b" }],
    summary: "swap then supply",
    rationale: "why",
    riskTier: "Shallows",
  });
  assert.equal(out.valid, true);
  assert.deepEqual(out.warnings, []);
  assert.equal(out.executable.nodes.length, 2);
  assert.equal(out.executable.edges.length, 1);
  assert.equal(out.executable.nodes[0]?.sourceAmount, "50000000"); // entry: 0.05 SOL
  assert.equal(out.executable.nodes[1]?.sourceAmount, undefined); // downstream inherits
  assert.deepEqual(out.protocols, ["Jupiter", "Kamino"]);
  const xs = nodePositions(out.mutations).map((p) => p.x);
  assert.deepEqual(xs, [200, 560]); // depth 0 and depth 1
});

// 3. Asset mismatch is advisory: still valid, but warned.
test("asset mismatch warns without failing", () => {
  const out = buildComposeGraph({
    nodes: [
      { ref: "a", catalogItemId: "jito-sol-stake", widgets: { amount: 0.1 } },
      { ref: "b", catalogItemId: "kamino-usdc-supply" },
    ],
    edges: [{ from: "a", to: "b" }],
    summary: "x",
    rationale: "y",
    riskTier: "Shallows",
  });
  assert.equal(out.valid, true);
  assert.equal(out.warnings.length, 1);
  assert.match(out.warnings[0] ?? "", /outputs JitoSOL but/);
});

// 4. Cycle is fatal.
test("cycle is rejected", () => {
  const out = buildComposeGraph({
    nodes: [
      { ref: "n1", catalogItemId: "jito-sol-stake", widgets: { amount: 0.1 } },
      { ref: "n2", catalogItemId: "jito-sol-unstake", widgets: { amount: 0.1 } },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n1" },
    ],
    summary: "x",
    rationale: "y",
    riskTier: "Shallows",
  });
  assert.equal(out.valid, false);
  assert.equal(out.mutations.length, 0);
  assert.match(out.errors.join(" "), /cycle/);
});

// 5. Unknown catalogItemId is fatal.
test("unknown catalogItemId is rejected", () => {
  const out = buildComposeGraph({
    nodes: [{ ref: "n1", catalogItemId: "marinade-stake", widgets: { amount: 1 } }],
    summary: "x",
    rationale: "y",
    riskTier: "Shallows",
  });
  assert.equal(out.valid, false);
  assert.match(out.errors.join(" "), /unknown catalogItemId "marinade-stake"/);
});

// 6. Duplicate refs are fatal.
test("duplicate node ref is rejected", () => {
  const out = buildComposeGraph({
    nodes: [
      { ref: "n1", catalogItemId: "jito-sol-stake", widgets: { amount: 0.1 } },
      { ref: "n1", catalogItemId: "blaze-sol-stake", widgets: { amount: 0.1 } },
    ],
    summary: "x",
    rationale: "y",
    riskTier: "Shallows",
  });
  assert.equal(out.valid, false);
  assert.match(out.errors.join(" "), /duplicate node ref "n1"/);
});

// 7. Edge referencing an unknown ref is fatal.
test("edge to unknown ref is rejected", () => {
  const out = buildComposeGraph({
    nodes: [{ ref: "n1", catalogItemId: "jito-sol-stake", widgets: { amount: 0.1 } }],
    edges: [{ from: "n1", to: "ghost" }],
    summary: "x",
    rationale: "y",
    riskTier: "Shallows",
  });
  assert.equal(out.valid, false);
  assert.match(out.errors.join(" "), /unknown target ref "ghost"/);
});

// 8. Swap entry uses the input asset's decimals, not a fixed 9.
test("swap entry derives decimals from inputAsset (USDC = 6)", () => {
  const out = buildComposeGraph({
    nodes: [
      {
        ref: "n1",
        catalogItemId: "jupiter-swap-sol-usdc",
        widgets: { inputAsset: "USDC", outputAsset: "SOL", amount: 5 },
      },
    ],
    summary: "x",
    rationale: "y",
    riskTier: "Shallows",
  });
  assert.equal(out.valid, true);
  assert.equal(out.executable.nodes[0]?.sourceAmount, "5000000"); // 5 * 1e6, not 1e9
});

// 9. Empty graph is fatal.
test("empty node list is rejected", () => {
  const out = buildComposeGraph({
    nodes: [],
    summary: "x",
    rationale: "y",
    riskTier: "Shallows",
  });
  assert.equal(out.valid, false);
  assert.match(out.errors.join(" "), /no nodes/);
});

// 10. Manifest only exposes runnable adapters and reflects swap dynamics.
test("manifest is derived from the runnable adapter set", () => {
  const manifest = getAdapterManifest();
  assert.ok(manifest.length >= 10);
  const swap = manifest.find((m) => m.catalogItemId === "jupiter-swap-sol-usdc");
  assert.ok(swap, "swap adapter present in manifest");
  assert.equal(swap?.outputAsset, "(set via outputAsset widget)");
  assert.ok(swap?.inputAssets.includes("bSOL"));
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
