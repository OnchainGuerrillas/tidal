"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";

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
      title="All templates"
      description="Starter graphs and teaching examples. Templates are placeholders in this prototype."
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
          <button
            key={template.id}
            type="button"
            className="tidal-template-card"
          >
            <div
              className="tidal-template-card-thumb"
              style={{ backgroundImage: template.accent }}
            />
            <div className="tidal-template-card-body">
              <div className="text-sm font-medium text-foreground">
                {template.title}
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
          </button>
        ))}
      </div>
    </PanelShell>
  );
}
