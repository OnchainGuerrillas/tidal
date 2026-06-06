"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlass, Clock } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { PanelShell } from "@/components/workspace/panels/panel-shell";
import {
  templateCategories,
  workspaceTemplates,
  type TemplateCategory,
} from "@/mock-data/workspace/templates";

type TemplatesPanelProps = {
  onClose: () => void;
};

export function TemplatesPanel({ onClose }: TemplatesPanelProps) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return workspaceTemplates.filter((template) => {
      if (activeCategory !== "All" && template.category !== activeCategory) {
        return false;
      }
      if (query.length === 0) return true;
      if (template.title.toLowerCase().includes(query)) return true;
      if (template.subtitle.toLowerCase().includes(query)) return true;
      if (template.tags.some((tag) => tag.toLowerCase().includes(query))) return true;
      return false;
    });
  }, [activeCategory, searchQuery]);

  return (
    <PanelShell
      eyebrow="Templates"
      title="Starter strategies (coming soon)"
      description="Previews of canonical strategies you'll be able to fork into a fresh workspace. Not yet clickable — for now, ask the AI in chat to compose any of these, or drop nodes from the Nodes panel."
      onClose={onClose}
    >
      <div className="mb-4 flex flex-col gap-3">
        <label className="flex items-center gap-2 rounded-lg border border-tidal-border bg-background/30 px-3 py-2">
          <MagnifyingGlass className="h-3.5 w-3.5 text-tidal-muted" weight="bold" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search templates"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-tidal-muted"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {templateCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                "tidal-meta-pill cursor-pointer transition-colors",
                activeCategory === category
                  ? "border-tidal-accent bg-tidal-sidebar-active text-tidal-accent"
                  : "bg-tidal-card hover:border-tidal-accent/30 hover:text-tidal-accent"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="tidal-template-grid">
        {filteredTemplates.map((template) => (
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
    </PanelShell>
  );
}
