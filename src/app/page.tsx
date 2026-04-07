import { ChatInput } from "@/components/chat-input";
import { homeScreenContent } from "@/features/home/mocks/home-screen";

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
      <ChatInput />

      {/* Suggestions */}
      <div className="flex w-[30%] flex-col gap-3">
        <span className="text-[11px]/[14px] text-tidal-muted">
          Suggestions
        </span>
        <div className="flex flex-col gap-2">
          {homeScreenContent.suggestions.map((suggestion) => (
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
