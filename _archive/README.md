# Archived Reference Code

This folder holds frozen UI, providers, mock data, and routes from earlier versions of the Tidal prototype. The product has consolidated around the unified workspace experience, and these surfaces are no longer part of the live app — but their patterns may still be useful to copy back out.

It is intentionally excluded from the TypeScript build, ESLint, and Next.js compilation via [tsconfig.json](../tsconfig.json), [eslint.config.mjs](../eslint.config.mjs), and [next.config.ts](../next.config.ts). Nothing under `_archive/` is imported from live code.

Do not edit in place — treat as read-only reference material.

## Contents

- `home/` — the original Home / Global Chat landing surface (components and mocked suggestions).
- `global-chat/` — the hybrid-chat provider, its mocked chats/mentions/links, the route-backed `/chat/[chatId]` pages, and the former global-chat URL helpers.
- `pool/` — the full Pool workspace: route, screen, panel shell, position/recommendation/discovery/activity cards, performance chart, provider, and mocked Pool state. Many of the investment-style card patterns were ported forward under new names into `src/components/workspace/investments` and `src/components/workspace/discover`.
- `swap/` — the stub Swap screen that existed before the rework.
- `tidal-promotion-components/` — branded components that only existed to promote a general chat into a dedicated workspace thread (`PromotionSummaryPanel`, `WorkspacePromotionCard`, `ThreadOwnershipBanner`, `CreateWorkspaceActionCard`, `WorkspaceRecommendationCard`, `WorkspaceButton`), plus the unused shell `WalletSummary` component.
