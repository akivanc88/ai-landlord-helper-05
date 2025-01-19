import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useThreads } from "@/hooks/useThreads";
import { useAuth } from "@/contexts/AuthContext";

interface ChatInputProps {
  onSend: (message: string) => Promise<void>;
  isLoading: boolean;
  hasQuestions: boolean;
  threadId?: string | null;
}

export const ChatInput = ({ onSend, isLoading, hasQuestions, threadId }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const { generateThreadTitle } = useThreads(user, null);
  const [isFirstMessage, setIsFirstMessage] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const trimmedMessage = message.trim();
    setMessage("");
    await onSend(trimmedMessage);

    // Generate title only after the first message is sent
    if (threadId && isFirstMessage) {
      console.log("Generating title for thread:", threadId);
      await generateThreadTitle(threadId);
      setIsFirstMessage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          hasQuestions
            ? "Type your message here..."
            : "You have no more questions available. Please upgrade your plan to continue."
        }
        disabled={!hasQuestions || isLoading}
        className="min-h-[100px] resize-none pr-24"
      />
      <Button
        type="submit"
        size="icon"
        disabled={!message.trim() || isLoading || !hasQuestions}
        className="absolute bottom-4 right-4"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};