import { useState } from "react";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage } from "@/components/ChatMessage";
import { RoleSelection } from "@/components/RoleSelection";
import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface Message {
  text: string;
  isAi: boolean;
  timestamp: string;
}

const Index = () => {
  const { user, signOut } = useAuth();
  const [role, setRole] = useState<"landlord" | "tenant" | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (message: string) => {
    setIsLoading(true);
    const newMessage: Message = {
      text: message,
      isAi: false,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, newMessage]);

    // Simulate AI response (replace with actual AI integration)
    setTimeout(() => {
      const aiResponse: Message = {
        text: "This is a placeholder response. The AI integration will be implemented in the next phase.",
        isAi: true,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold text-slate-900">
              BC Housing Legal Assistant
            </h1>
            <p className="text-lg text-slate-600">
              Get instant answers to your housing-related legal questions
            </p>
          </div>
          <div className="flex justify-center">
            <AuthForm />
          </div>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-slate-900">
            BC Housing Legal Assistant
          </h1>
          <p className="text-lg text-slate-600">
            Get instant answers to your housing-related legal questions
          </p>
        </div>
        <RoleSelection onSelect={setRole} />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <header className="border-b bg-white p-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">
            BC Housing Legal Assistant
          </h1>
          <div className="flex items-center gap-4">
            <span className="rounded-full bg-primary px-4 py-1 text-sm text-white">
              {role === "landlord" ? "Landlord" : "Tenant"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="text-sm"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-center text-slate-500">
                Start by asking a question about BC housing laws and regulations
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {messages.map((msg, index) => (
                <ChatMessage key={index} {...msg} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto max-w-4xl">
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default Index;