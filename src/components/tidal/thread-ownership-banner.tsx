import { Badge } from "@/components/tidal/badge";

type ThreadOwnershipBannerProps = {
  title: string;
  description: string;
  ownershipLabel: string;
  linkedLabels?: string[];
};

export function ThreadOwnershipBanner({
  title,
  description,
  ownershipLabel,
  linkedLabels = [],
}: ThreadOwnershipBannerProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{ownershipLabel}</Badge>
            {linkedLabels.length > 0 ? (
              <Badge variant="token">Linked context</Badge>
            ) : null}
          </div>
          <h1 className="tidal-text-thread-title">{title}</h1>
          <p className="max-w-3xl tidal-text-message">{description}</p>
        </div>
      </div>

      {linkedLabels.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {linkedLabels.map((label) => (
            <span key={label} className="tidal-meta-pill">
              {label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
