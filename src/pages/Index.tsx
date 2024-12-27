import { useState } from "react";
import { RoleSelection } from "@/components/RoleSelection";
import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/hooks/useChat";
import { useThreads } from "@/hooks/useThreads";
import { UserRole } from "@/types/chat";
import { ProfileSection } from "@/components/ProfileSection";
import { ThreadsSidebar } from "@/components/ThreadsSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/components/ui/use-toast";
import { AppHeader } from "@/components/header/AppHeader";
import { ChatContainer } from "@/components/chat/ChatContainer";

const Index = () => {
  const { user, signOut } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const { threads, createThread } = useThreads(user, role);
  const { messages, isLoading, sendMessage } = useChat(user, role, activeThreadId);
  const { toast } = useToast();

  const handleRoleSwitch = () => {
    setRole(role === "landlord" ? "tenant" : "landlord");
    setActiveThreadId(null);
  };

  const handleNewThread = async () => {
    const title = `New conversation ${new Date().toLocaleString()}`;
    const threadId = await createThread(title);
    if (threadId) {
      setActiveThreadId(threadId);
      toast({
        title: "New conversation started",
        description: "You can now start chatting!",
      });
    }
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
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <ThreadsSidebar
          threads={threads}
          activeThreadId={activeThreadId}
          onThreadSelect={setActiveThreadId}
          onNewThread={handleNewThread}
        />
        <div className="flex-1 flex flex-col bg-[#f2f2f2]">
          <AppHeader
            role={role}
            onRoleSwitch={handleRoleSwitch}
            onSignOut={signOut}
          />

          <div className="container mx-auto max-w-4xl py-6 px-4 flex-1 flex flex-col">
            <div className="mb-6">
              <ProfileSection userId={user.id} />
            </div>

            {!activeThreadId ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-[#606060] mb-4">
                    Select a conversation or start a new one
                  </p>
                  <Button onClick={handleNewThread}>Start New Conversation</Button>
                </div>
              </div>
            ) : (
              <ChatContainer
                messages={messages}
                isLoading={isLoading}
                onSendMessage={sendMessage}
                onNewThread={handleNewThread}
              />
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;