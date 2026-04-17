export { workspaceSuggestions, workspaceSupportedAssets, nodeCatalog, isCatalogItemCompatible } from "./catalog";
export { createWalletNode, createNodeFromCatalog } from "./node-factories";
export {
  builderNodes,
  builderEdges,
  builderWorkspace,
  createBuilderWorkspace,
} from "./builder-workspace";
export {
  exampleNodes,
  exampleEdges,
  exampleWorkspace,
} from "./example-workspace";

import { builderWorkspace } from "./builder-workspace";
import {
  exampleEdges,
  exampleNodes,
  exampleWorkspace,
} from "./example-workspace";

export const initialWorkspaces = [
  builderWorkspace,
  exampleWorkspace,
];

export const initialNodes = exampleNodes;
export const initialEdges = exampleEdges;
