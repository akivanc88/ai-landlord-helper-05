import { ChatInput } from "@/components/ChatInput";
import { ChatMessage } from "@/components/ChatMessage";
import { Button } from "@/components/ui/button";

interface ChatContainerProps {
  messages: any[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onNewThread: () => void;
}

export const ChatContainer = ({
  messages,
  isLoading,
  onSendMessage,
  onNewThread,
}: ChatContainerProps) => {
  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-[#606060] mb-4">
            Start by asking a question about BC housing laws and regulations
          </p>
          <Button onClick={onNewThread}>Start New Conversation</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-[#e3e3e3]">
          {messages.map((msg, index) => (
            <ChatMessage key={index} {...msg} />
          ))}
        </div>
      </div>
      <div className="mt-6">
        <ChatInput onSend={onSendMessage} isLoading={isLoading} />
      </div>
    </>
  );
};