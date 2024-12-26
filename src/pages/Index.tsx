import { useState, useEffect } from "react";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage } from "@/components/ChatMessage";
import { RoleSelection } from "@/components/RoleSelection";
import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();

  // Fetch messages for current role
  useEffect(() => {
    if (user && role) {
      fetchMessages();
    }
  }, [user, role]);

  const fetchMessages = async () => {
    try {
      // Set the role in the database session
      await supabase.rpc('set_app_role', { role_value: role });
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user?.id)
        .eq('role', role)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      setMessages(
        data.map((msg) => ({
          text: msg.text,
          isAi: msg.is_ai,
          timestamp: new Date(msg.timestamp).toLocaleTimeString(),
        }))
      );
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load messages",
      });
    }
  };

  const handleSend = async (message: string) => {
    setIsLoading(true);
    try {
      // Insert user message
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          text: message,
          user_id: user?.id,
          is_ai: false,
          role: role,
        });

      if (insertError) throw insertError;

      // Add message to UI
      const newMessage: Message = {
        text: message,
        isAi: false,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, newMessage]);

      // Simulate AI response (replace with actual AI integration later)
      setTimeout(async () => {
        const aiResponse = "This is a placeholder response. The AI integration will be implemented in the next phase.";
        
        const { error: aiInsertError } = await supabase
          .from('messages')
          .insert({
            text: aiResponse,
            user_id: user?.id,
            is_ai: true,
            role: role,
          });

        if (aiInsertError) throw aiInsertError;

        const aiMessage: Message = {
          text: aiResponse,
          isAi: true,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message",
      });
      setIsLoading(false);
    }
  };

  const handleRoleSwitch = () => {
    setRole(role === "landlord" ? "tenant" : "landlord");
    setMessages([]); // Clear messages before fetching new ones
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleRoleSwitch}
              className="text-sm"
            >
              Switch to {role === "landlord" ? "Tenant" : "Landlord"}
            </Button>
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