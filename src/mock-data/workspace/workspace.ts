export { workspaceSuggestions, workspaceSupportedAssets, nodeCatalog, isCatalogItemCompatible } from "./catalog";
export { createWalletNode, createNodeFromCatalog } from "./node-factories";
export {
  builderNodes,
  builderEdges,
  builderWorkspace,
  createBuilderWorkspace,
} from "./builder-workspace";

import { builderWorkspace } from "./builder-workspace";

/**
 * Seed workspaces for design mode only. Design mode has no Privy and no DB,
 * so it needs an in-memory scratch workspace to render a canvas. Live mode
 * seeds none — the app is login-gated and authed users load their own
 * DB-backed workspaces (see WorkspaceProvider + AppShell).
 */
export const designModeSeedWorkspaces = [builderWorkspace];
