import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { MessageSquare, FileText, Share2 } from "lucide-react";

interface Citation {
  id: number;
  sourceId: string;
  sourceType: string;
  sourceName: string;
  content?: string;
  pageNumber?: number;
  highlightedText?: string;
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
        {isAi ? (
          <Tabs defaultValue="response" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="response" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Response
              </TabsTrigger>
              {citations && citations.length > 0 && (
                <TabsTrigger value="citations" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Citations ({citations.length})
                </TabsTrigger>
              )}
              <TabsTrigger value="community" className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Community References
              </TabsTrigger>
            </TabsList>

            <TabsContent value="response" className="mt-0">
              <div className="prose max-w-none">
                <ReactMarkdown>{text || "..."}</ReactMarkdown>
              </div>
            </TabsContent>

            <TabsContent value="citations" className="mt-0">
              {citations && citations.length > 0 ? (
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <div className="space-y-6">
                    {citations.map((citation) => (
                      <div key={citation.id} className="rounded-lg bg-white p-4 shadow-sm">
                        <h4 className="text-sm font-semibold text-primary mb-2">
                          Source: {citation.sourceName}
                        </h4>
                        {citation.content && (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{citation.content}</ReactMarkdown>
                          </div>
                        )}
                        {citation.highlightedText && (
                          <div className="mt-2 rounded-md bg-yellow-50 p-2 text-sm">
                            <p className="font-medium text-yellow-800">Highlighted Text:</p>
                            <p className="mt-1 text-yellow-900">{citation.highlightedText}</p>
                          </div>
                        )}
                        {citation.pageNumber && (
                          <p className="mt-2 text-sm text-gray-500">
                            Page: {citation.pageNumber}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-muted-foreground text-sm">No citations available for this response.</p>
              )}
            </TabsContent>

            <TabsContent value="community" className="mt-0">
              <div className="rounded-md border p-4">
                <p className="text-muted-foreground text-sm">
                  Community references from social media platforms will be displayed here when available.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="prose max-w-none">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        )}
        <span className="mt-2 block text-sm text-[#606060]">{timestamp}</span>
      </div>
    </div>
  );
};