import { cn } from "@/lib/utils";

interface ChatMessageProps {
  text: string;
  isAi: boolean;
  timestamp: string;
}

export const ChatMessage = ({ text, isAi, timestamp }: ChatMessageProps) => {
  return (
    <div
      className={cn(
        "flex w-full animate-fadeIn gap-4 p-6 border-b",
        isAi ? "bg-[#f2f2f2]" : "bg-white"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded",
          isAi ? "bg-primary text-white" : "bg-secondary text-black"
        )}
      >
        {isAi ? "AI" : "You"}
      </div>
      <div className="flex-1">
        <p className="text-[#313132] text-base leading-relaxed">{text}</p>
        <span className="mt-2 text-sm text-[#606060]">{timestamp}</span>
      </div>
    </div>
  );
};