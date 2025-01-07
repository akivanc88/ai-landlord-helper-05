import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { ChevronRight } from "lucide-react";

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
  const [selectedCitation, setSelectedCitation] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleCitationClick = (citationId: number) => {
    setSelectedCitation(citationId);
    setIsOpen(true);
  };

  return (
    <div className="flex w-full">
      <div
        className={cn(
          "flex-1 animate-fadeIn gap-4 p-6 border-b",
          isAi ? "bg-[#f2f2f2]" : "bg-white"
        )}
      >
        <div className="flex gap-4">
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
                            onClick={() => handleCitationClick(citation.id)}
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
      </div>
      
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-[300px] border-l"
      >
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className={cn(
              "w-6 h-full rounded-none border-l",
              isOpen ? "rotate-180" : ""
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4">
          {selectedCitation && (
            <div>
              <h3 className="font-semibold mb-2">Citation Content</h3>
              <p className="text-sm text-gray-600">
                {/* Here you would display the actual citation content */}
                Content for citation [{selectedCitation}] would be displayed here.
              </p>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};