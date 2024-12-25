import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  isAi: boolean;
  timestamp: string;
}

export const ChatMessage = ({ message, isAi, timestamp }: ChatMessageProps) => {
  return (
    <div
      className={cn(
        "flex w-full animate-fadeIn gap-4 p-4",
        isAi ? "bg-slate-50" : "bg-white"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isAi ? "bg-primary text-white" : "bg-secondary text-white"
        )}
      >
        {isAi ? "AI" : "You"}
      </div>
      <div className="flex-1">
        <p className="text-sm text-slate-600">{message}</p>
        <span className="mt-2 text-xs text-slate-400">{timestamp}</span>
      </div>
    </div>
  );
};