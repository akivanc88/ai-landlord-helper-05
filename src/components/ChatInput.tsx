import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  hasQuestions?: boolean;
}

export const ChatInput = ({ onSend, isLoading, hasQuestions = true }: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage("");
    }
  };

  if (!hasQuestions) {
    return (
      <div className="flex animate-slideUp flex-col gap-4 border-t bg-white p-6">
        <div className="text-center">
          <p className="text-red-600 mb-2">You've used all your available questions.</p>
          <Button
            onClick={() => alert("Purchase functionality coming soon!")}
            className="bg-primary hover:bg-accent text-white font-semibold"
          >
            Purchase More Questions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex animate-slideUp flex-col gap-4 border-t bg-white p-6">
      <Textarea
        placeholder="Type your question here..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="min-h-[100px] resize-none rounded border-[#606060] focus:border-primary focus:ring-primary"
      />
      <Button
        onClick={handleSend}
        disabled={isLoading || !message.trim()}
        className="ml-auto w-32 bg-primary hover:bg-accent text-white font-semibold"
      >
        {isLoading ? "Sending..." : "Send"}
      </Button>
    </div>
  );
};