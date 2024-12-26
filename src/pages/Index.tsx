import { useState } from "react";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage } from "@/components/ChatMessage";
import { RoleSelection } from "@/components/RoleSelection";
import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/useChat";
import { UserRole } from "@/types/chat";

const Index = () => {
  const { user, signOut } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const { messages, isLoading, sendMessage } = useChat(user, role);

  const handleRoleSwitch = () => {
    setRole(role === "landlord" ? "tenant" : "landlord");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f2f2f2] py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold text-primary">
              BC Housing Legal Assistant
            </h1>
            <p className="text-lg text-[#313132]">
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
          <h1 className="mb-4 text-4xl font-bold text-primary">
            BC Housing Legal Assistant
          </h1>
          <p className="text-lg text-[#313132]">
            Get instant answers to your housing-related legal questions
          </p>
        </div>
        <RoleSelection onSelect={setRole} />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#f2f2f2]">
      <header className="border-b bg-primary py-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">
            BC Housing Legal Assistant
          </h1>
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRoleSwitch}
              className="text-sm font-semibold bg-secondary text-black hover:bg-secondary/90"
            >
              Switch to {role === "landlord" ? "Tenant" : "Landlord"}
            </Button>
            <span className="rounded bg-accent px-4 py-1 text-sm text-white">
              {role === "landlord" ? "Landlord" : "Tenant"}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => signOut()}
              className="text-sm font-semibold bg-secondary text-black hover:bg-secondary/90"
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
              <p className="text-center text-[#606060]">
                Start by asking a question about BC housing laws and regulations
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#e3e3e3]">
              {messages.map((msg, index) => (
                <ChatMessage key={index} {...msg} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto max-w-4xl">
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default Index;