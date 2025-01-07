import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useState } from "react";

interface Citation {
  id: number;
  sourceId: string;
  sourceType: string;
  sourceName: string;
  content?: string;
}

interface ChatMessageProps {
  text: string;
  isAi: boolean;
  timestamp: string;
  citations?: Citation[];
}

export const ChatMessage = ({ text, isAi, timestamp, citations }: ChatMessageProps) => {
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  return (
    <>
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
                  <Button
                    key={citation.id}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setSelectedCitation(citation)}
                  >
                    [{citation.id}] {citation.sourceName}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <span className="mt-2 block text-sm text-[#606060]">{timestamp}</span>
        </div>
      </div>

      <Dialog open={!!selectedCitation} onOpenChange={() => setSelectedCitation(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Source: {selectedCitation?.sourceName}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            {selectedCitation?.content ? (
              <div className="prose">
                <ReactMarkdown>{selectedCitation.content}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-gray-600">Content not available for this citation.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};