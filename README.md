# Tidal Prototype

Frontend and design experimentation repo for Tidal, a Solana DeFi product concept.

This repo is intentionally prototype-only. It is used to explore interface patterns, screen flows, and visual structure before another developer connects the work into the real application.

## Constraints

- No external API calls
- No blockchain connections
- No real wallet integrations
- All data must be mocked

## Product Surfaces

- Tidal Pool: conversational investing and pool-building flows
- Tidal Swap: natural-language many-to-many swap flows
- Tidal Amplify: node-based strategy composition flows

## Runtime

This repo uses Bun.

Common commands:

```bash
bun install
bun run dev
bun run lint
bun run build
```

## Docs

- `docs/product-vision.md`
- `docs/product-strategy.md`
- `docs/codex-plan.md`
- `docs/architecture.md`

## Frontend Direction

The frontend is being cleaned up so that:

- business logic and mock data stay separate from visual components
- shared UI primitives remain generic
- Tidal-specific design patterns become reusable
- feature modules are easier to hand off for later integration
