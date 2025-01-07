import { useState, useEffect } from "react";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage } from "@/components/ChatMessage";
import { RoleSelection } from "@/components/RoleSelection";
import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/useChat";
import { useThreads } from "@/hooks/useThreads";
import { UserRole } from "@/types/chat";
import { ProfileSection } from "@/components/ProfileSection";
import { ThreadsSidebar } from "@/components/ThreadsSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/components/ui/use-toast";
import { AdminKnowledgeBase } from "@/components/AdminKnowledgeBase";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user, signOut } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { threads, createThread } = useThreads(user, role);
  const { messages, isLoading, sendMessage, hasQuestions } = useChat(user, role, activeThreadId);
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('admin_users')
            .select('user_id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (error) {
            console.error('Error checking admin status:', error);
            return;
          }
          
          setIsAdmin(!!data);
        } catch (error) {
          console.error('Error checking admin status:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to check admin status",
          });
        }
      }
    };

    checkAdminStatus();
  }, [user, toast]);

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
        <div className="flex-1 flex flex-col bg-[#f2f2f2] overflow-hidden">
          <header className="border-b bg-primary py-4">
            <div className="container mx-auto flex items-center justify-between">
              <h1 className="text-xl font-semibold text-white">
                BC Housing Legal Assistant
              </h1>
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <AdminKnowledgeBase />
                )}
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

          <div className="container mx-auto max-w-6xl py-6 px-4 flex-1 flex flex-col">
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
              <>
                <div className="flex-1 overflow-y-auto">
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

                <div className="mt-6">
                  <ChatInput 
                    onSend={sendMessage} 
                    isLoading={isLoading} 
                    hasQuestions={hasQuestions}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
