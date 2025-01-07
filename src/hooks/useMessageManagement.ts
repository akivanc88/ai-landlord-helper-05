import { User } from "@supabase/supabase-js";
import { UserRole, Message, Citation } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useMessageManagement = (user: User | null, role: UserRole | null, threadId: string | null) => {
  const { toast } = useToast();

  const fetchMessages = async () => {
    if (!user || !role || !threadId) return [];
    
    try {
      await supabase.rpc('set_app_role', { role_value: role });
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('role', role)
        .eq('thread_id', threadId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return data.map((msg) => ({
        text: msg.text,
        isAi: msg.is_ai,
        timestamp: new Date(msg.timestamp).toLocaleTimeString(),
        citations: msg.citations as Citation[] || undefined,
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load messages",
      });
      return [];
    }
  };

  const saveUserMessage = async (message: string) => {
    if (!user || !role || !threadId) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        text: message,
        user_id: user.id,
        is_ai: false,
        role: role,
        thread_id: threadId,
      });

    if (error) throw error;
  };

  const saveAIMessage = async (response: string, citations: Citation[]) => {
    if (!user || !role || !threadId) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        text: response,
        user_id: user.id,
        is_ai: true,
        role: role,
        thread_id: threadId,
        citations: citations,
      });

    if (error) throw error;
  };

  return {
    fetchMessages,
    saveUserMessage,
    saveAIMessage,
  };
};