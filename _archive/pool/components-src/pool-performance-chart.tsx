import { cn } from "@/lib/utils";
import type { PoolPerformance } from "@/mock-data/pool/types";

function buildChartPath(values: number[], width: number, height: number) {
  if (values.length === 0) {
    return "";
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const xStep = values.length > 1 ? width / (values.length - 1) : width;

  return values
    .map((value, index) => {
      const x = index * xStep;
      const normalized = (value - min) / range;
      const y = height - normalized * height;

      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildAreaPath(linePath: string, width: number, height: number) {
  if (!linePath) {
    return "";
  }

  return `${linePath} L ${width} ${height} L 0 ${height} Z`;
}

type PoolPerformanceChartProps = {
  className?: string;
  performance: PoolPerformance;
};

export function PoolPerformanceChart({
  className,
  performance,
}: PoolPerformanceChartProps) {
  const width = 520;
  const height = 200;
  const values = performance.points.map((point) => point.valueUsd);
  const linePath = buildChartPath(values, width, height);
  const areaPath = buildAreaPath(linePath, width, height);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <p className="tidal-text-body">Tidalpool performance</p>
        <div className="flex flex-wrap items-center gap-2">
          {performance.availableRanges.map((range) => {
            const isActive = range === performance.activeRange;

            return (
              <button
                key={range}
                type="button"
                className={cn(
                  "tidal-meta-pill cursor-pointer transition-colors",
                  isActive
                    ? "border-tidal-accent bg-tidal-sidebar-active text-tidal-accent"
                    : "bg-tidal-card hover:border-tidal-accent/30 hover:text-tidal-accent"
                )}
              >
                {range}
              </button>
            );
          })}
        </div>
      </div>

      <div className="tidal-chart-frame">
        <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3">
          <div className="flex h-[200px] flex-col justify-between">
            {["$12k", "$10k", "$8k", "$6k", "$4k"].map((label) => (
              <span key={label} className="tidal-text-caption">
                {label}
              </span>
            ))}
          </div>

          <div className="space-y-3">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="h-[200px] w-full"
              role="img"
              aria-label="Pool performance chart"
            >
              <defs>
                <linearGradient id="poolChartArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#61B3CF" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#61B3CF" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {[0, 1, 2, 3, 4].map((index) => (
                <line
                  key={`grid-${index}`}
                  x1="0"
                  x2={width}
                  y1={index * 50}
                  y2={index * 50}
                  stroke="#22292E"
                  strokeWidth="1"
                />
              ))}

              {areaPath ? (
                <path d={areaPath} fill="url(#poolChartArea)" />
              ) : null}
              {linePath ? (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#61B3CF"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
            </svg>

            <div className="grid grid-cols-6 gap-2">
              {performance.points.map((point) => (
                <span key={point.label} className="tidal-text-caption">
                  {point.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 border-t border-tidal-border pt-4 sm:grid-cols-2 xl:grid-cols-4">
          {performance.metrics.map((metric) => (
            <div key={metric.label}>
              <p className="tidal-text-caption">{metric.label}</p>
              <p
                className={cn(
                  "mt-1 text-base font-medium text-foreground",
                  metric.accent && "text-tidal-accent"
                )}
              >
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
