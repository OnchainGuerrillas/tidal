## Constraints

This is a prototype/experimentation repo only. There should be no external API calls, no blockchain connections, and no real wallet integrations. All data should be mocked.

## About

This repo is a prototype repo for a Solana DeFi project named Tidal. This repo is a frontend and design experimentation space only.

The prototype will look to experiment around three areas:

### Tidal Pool

An AI natural language interface which suggests DeFi investments within the Solana ecosystem that users can invest their funds into.

- There should be a manual mode where the user chats and builds up their pool, being presented with actions cards they need to confirm as they develop their strategy
- An autonomous mode where the chat informs the AI strategy, the AI will then go off and execute on that vision.

### Tidal Swap

An AI natural language interface which allows users to swap many-to-many tokens within Solana.

- The user may wish to select multiple assets they have in their wallet for a whole new set of tokens
- The user may wish to select a singular asset and swap it out for multiple others
- The key here is to make this one smooth process, batching transaction into one to improve the user experience and time it takes to swap

### Tidal Amplify

A node based editor that allows users to create looping and reinvestment nodes corresponding to opportunities in the Solana ecosystem.

- The user may invest in one platform and use assets to invest in anoter platform
- This maximises the returns that they can get by utilising different areas of the DeFi ecosystem
- Nodes are used to connect these strategies together, showing the connection and how they fit together

## Current Docs

Project docs live in the `docs/` folder of this repo.

- `docs/product-vision.md` contains the product vision
- `docs/product-strategy.md` contains the product strategy
- `docs/codex-plan.md` contains the frontend cleanup and refactor plan
- `docs/architecture.md` contains the high-level prototype architecture and integration-facing structure

When structural frontend changes are made, update `docs/architecture.md` so it continues to reflect how the prototype is organised.

When work progresses against the frontend refactor plan, keep `docs/codex-plan.md` updated as well.

## Runtime & Package Manager

This project uses Bun. Always use `bun` for running scripts, installing packages, and executing commands:

- `bun install` (not `npm install` or `yarn`)
- `bun run dev` (not `npm run dev`)
- `bun add <package>` (not `npm install <package>`)
- `bunx` (not `npx`)
