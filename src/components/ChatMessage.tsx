import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface Citation {
  id: number;
  sourceId: string;
  sourceType: string;
  sourceName: string;
}

interface ChatMessageProps {
  text: string;
  isAi: boolean;
  timestamp: string;
  citations?: Citation[];
}

export const ChatMessage = ({ text, isAi, timestamp, citations }: ChatMessageProps) => {
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
        <div className="prose max-w-none">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
        {citations && citations.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-600 mb-2">Sources:</h4>
            <div className="flex flex-wrap gap-2">
              {citations.map((citation) => (
                <TooltipProvider key={citation.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        [{citation.id}] {citation.sourceName}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Source Type: {citation.sourceType}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}
        <span className="mt-2 block text-sm text-[#606060]">{timestamp}</span>
      </div>
    </div>
  );
};