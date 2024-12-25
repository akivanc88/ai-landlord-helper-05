import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
}

export const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage("");
    }
  };

  return (
    <div className="flex animate-slideUp flex-col gap-4 border-t bg-white p-4">
      <Textarea
        placeholder="Type your question here..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="min-h-[100px] resize-none rounded-lg border-slate-200"
      />
      <Button
        onClick={handleSend}
        disabled={isLoading || !message.trim()}
        className="ml-auto w-24"
      >
        {isLoading ? "Sending..." : "Send"}
      </Button>
    </div>
  );
};