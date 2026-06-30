"use client";

import { Clock } from "@phosphor-icons/react";

import { workspaceTemplates } from "@/mock-data/workspace/templates";

export function TemplatesGrid() {
  return (
    <div className="tidal-template-grid">
      {workspaceTemplates.map((template) => (
        <div
          key={template.id}
          role="group"
          aria-disabled="true"
          aria-label={`${template.title} — coming soon`}
          title="Coming soon — for now, ask the AI in chat to compose this strategy"
          className="tidal-template-card relative cursor-not-allowed opacity-70"
        >
          <div
            className="tidal-template-card-thumb"
            style={{ backgroundImage: template.accent }}
          />
          <div className="tidal-template-card-body">
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-medium text-foreground">
                {template.title}
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-md border border-tidal-border bg-tidal-card/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-tidal-muted">
                <Clock weight="bold" className="h-2.5 w-2.5" />
                Soon
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-tight text-tidal-muted">
              {template.subtitle}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {template.tags.map((tag) => (
                <span key={tag} className="tidal-template-card-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
