export { amplifySuggestions, amplifySupportedAssets, amplifyNodeCatalog, isCatalogItemCompatible } from "./catalog";
export { createAmplifyWalletNode, createAmplifyNodeFromCatalog } from "./node-factories";
export {
  amplifyBuilderNodes,
  amplifyBuilderEdges,
  amplifyBuilderWorkspace,
  createAmplifyBuilderWorkspace,
} from "./builder-workspace";
export {
  amplifyExampleNodes,
  amplifyExampleEdges,
  amplifyExampleWorkspace,
} from "./example-workspace";

import { amplifyBuilderWorkspace } from "./builder-workspace";
import {
  amplifyExampleEdges,
  amplifyExampleNodes,
  amplifyExampleWorkspace,
} from "./example-workspace";

export const amplifyInitialWorkspaces = [
  amplifyBuilderWorkspace,
  amplifyExampleWorkspace,
];

export const amplifyInitialNodes = amplifyExampleNodes;
export const amplifyInitialEdges = amplifyExampleEdges;
