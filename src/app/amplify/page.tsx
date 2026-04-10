"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAmplifyWorkspace } from "@/features/amplify/providers/amplify-workspace-provider";
import { AmplifyWorkspace } from "@/features/amplify/screens/amplify-workspace";
import { getAmplifyWorkspaceHref } from "@/lib/amplify-routes";

export default function AmplifyPage() {
  const router = useRouter();
  const { workspace } = useAmplifyWorkspace();

  useEffect(() => {
    router.replace(getAmplifyWorkspaceHref(workspace.id));
  }, [router, workspace.id]);

  return <AmplifyWorkspace workspaceId={workspace.id} />;
}
