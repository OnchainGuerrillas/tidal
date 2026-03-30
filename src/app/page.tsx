import { Input } from "@/components/ui/input";

const suggestions = [
  "What protocol has the highest APYs on Solana?",
  "Where is the best place to invest my stablecoins?",
  "Help me develop a new investment strategy on Solana?",
];

export default function Home() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-[39px] px-[43px] py-5">
      {/* Create workspace button */}
      <div className="absolute right-6 top-6 flex items-center rounded-full border border-tidal-border bg-tidal-card px-[17px] py-[9px]">
        <span className="text-[11px]/[14px] font-medium text-tidal-accent">
          Create investment workspace
        </span>
      </div>

      {/* Heading */}
      <h1 className="text-center text-[42px]/[52px] font-medium text-tidal-accent">
        How can I help today?
      </h1>

      {/* Prompt input */}
      <div className="flex w-1/2 items-center justify-between rounded-lg border border-tidal-border bg-tidal-card px-[10px] py-[9px] pl-3">
        <Input
          placeholder="Message Tidal"
          className="h-auto border-0 bg-transparent p-0 text-[13px]/[16px] font-medium text-foreground placeholder:text-tidal-placeholder focus-visible:ring-0"
        />
        <div className="flex shrink-0 items-center gap-3">
          {/* Model dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]/[14px] font-medium text-tidal-accent">
              Claude Sonnet 4.5
            </span>
            <svg
              width="8"
              height="5"
              viewBox="0 0 8 5"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1L4 4L7 1"
                stroke="#61B3CF"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Send button */}
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-md bg-tidal-accent">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0F151F"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 19V5" />
              <path d="M5 12l7-7 7 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div className="flex w-[30%] flex-col gap-3">
        <span className="text-[11px]/[14px] text-tidal-muted">
          Suggestions
        </span>
        <div className="flex flex-col gap-2">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion}
              className="flex w-full items-center justify-between overflow-hidden rounded-full border border-tidal-border bg-tidal-card py-2 pl-3 pr-2"
            >
              <span className="text-[11px]/[14px] text-tidal-accent">
                {suggestion}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#61B3CF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
