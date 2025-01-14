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
import { ArrowRight, Building2, Home, Scale, Shield, Calendar, Phone } from "lucide-react";
import { PricingSection } from "@/components/PricingSection";
import { useSearchParams } from "react-router-dom";
import { NavigationBar } from "@/components/NavigationBar";

const Index = () => {
  const { user, signOut } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { threads, createThread } = useThreads(user, role);
  const { messages, isLoading, sendMessage, hasQuestions } = useChat(user, role, activeThreadId);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Handle auth flow and plan selection from URL parameters
  useEffect(() => {
    const showAuth = searchParams.get('showAuth');
    const selectedPlan = searchParams.get('selectedPlan');

    if (user && selectedPlan) {
      // If user is logged in and has a selected plan, initiate checkout
      handlePlanSelect(selectedPlan as "monthly" | "annual");
    }
  }, [user, searchParams]);

  const handlePlanSelect = async (plan: "monthly" | "annual") => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      if (!session) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please log in to purchase a plan",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error initiating checkout:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initiate payment process",
      });
    }
  };

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
    const showAuth = searchParams.get('showAuth') === 'true';
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <NavigationBar />
        <div className="container mx-auto px-4 py-12">
          {showAuth ? (
            <div className="max-w-md mx-auto">
              <AuthForm />
            </div>
          ) : (
            <>
              {/* Hero Section */}
              <div className="mb-16 text-center">
                <h1 className="mb-6 text-5xl font-bold tracking-tight text-primary animate-fadeIn">
                  BC Housing Legal Assistant
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground animate-fadeIn animation-delay-100">
                  Get instant, accurate answers to your BC housing law questions powered by AI and backed by official documentation.
                </p>
              </div>

              {/* Features Grid */}
              <div id="features" className="grid gap-8 md:grid-cols-3 animate-fadeIn animation-delay-300">
                <div className="rounded-lg bg-card p-6 shadow-lg transition-transform hover:scale-105">
                  <div className="mb-4 inline-block rounded-full bg-primary/10 p-3">
                    <Scale className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Legal Expertise</h3>
                  <p className="text-muted-foreground">
                    Access accurate information about BC housing laws and regulations, tailored to your specific situation.
                  </p>
                </div>

                <div className="rounded-lg bg-card p-6 shadow-lg transition-transform hover:scale-105">
                  <div className="mb-4 inline-block rounded-full bg-primary/10 p-3">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Landlord Support</h3>
                  <p className="text-muted-foreground">
                    Get guidance on property management, tenant relations, and legal compliance in British Columbia.
                  </p>
                </div>

                <div className="rounded-lg bg-card p-6 shadow-lg transition-transform hover:scale-105">
                  <div className="mb-4 inline-block rounded-full bg-primary/10 p-3">
                    <Home className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Tenant Resources</h3>
                  <p className="text-muted-foreground">
                    Understand your rights, responsibilities, and options as a tenant under BC housing law.
                  </p>
                </div>
              </div>

              {/* Pricing Section */}
              <div id="pricing">
                <PricingSection />
              </div>

              {/* Contact Section */}
              <div id="contact" className="py-16 bg-[#0A0F1C] text-white">
                <div className="container mx-auto px-4">
                  <h2 className="text-5xl font-bold text-[#6366F1] text-center mb-4">
                    Need help getting started?
                  </h2>
                  <p className="text-xl text-gray-400 text-center mb-16 max-w-3xl mx-auto">
                    Book a personalized demo with our team to get the most out of our platform
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-12">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-[#6366F1]/10 rounded-lg">
                          <Scale className="h-6 w-6 text-[#6366F1]" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Personalized Support</h3>
                          <p className="text-gray-400">Get a one-on-one walkthrough tailored to your specific needs</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-[#6366F1]/10 rounded-lg">
                          <Calendar className="h-6 w-6 text-[#6366F1]" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Flexible Scheduling</h3>
                          <p className="text-gray-400">Choose a time that works best for you</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-[#6366F1]/10 rounded-lg">
                          <Phone className="h-6 w-6 text-[#6366F1]" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Direct Access</h3>
                          <p className="text-gray-400">Speak directly with our team who will guide you through setting up your workspace and implementing best practices for your needs.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-[#18191B] rounded-lg p-8">
                      <div className="text-center mb-8">
                        <h3 className="text-3xl font-bold mb-4">Book a Meeting</h3>
                        <p className="text-gray-400">Select the duration that works best for you</p>
                      </div>
                      
                      <div className="space-y-4">
                        <Button
                          className="w-full py-6 text-lg bg-[#27282B] hover:bg-[#2F3033]"
                          variant="secondary"
                        >
                          <Calendar className="mr-2 h-5 w-5" />
                          15 Min Meeting
                        </Button>
                        
                        <Button
                          className="w-full py-6 text-lg bg-[#27282B] hover:bg-[#2F3033]"
                          variant="secondary"
                        >
                          <Calendar className="mr-2 h-5 w-5" />
                          30 Min Meeting
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Section */}
              <div className="mt-16 text-center animate-fadeIn animation-delay-400">
                <div className="mb-8 inline-block rounded-full bg-secondary/20 p-3">
                  <Shield className="h-6 w-6 text-secondary" />
                </div>
                <h2 className="mb-4 text-3xl font-bold">Trusted Legal Information</h2>
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                  Our AI assistant is trained on official BC housing documentation and legal resources, ensuring you receive accurate and up-to-date information.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <>
        <NavigationBar />
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
      </>
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
