import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Thread } from "@/types/thread";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";

export const useThreads = (user: User | null, role: string | null) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchThreads = async () => {
    if (!user || !role) return;
    
    try {
      const { data, error } = await supabase
        .from('conversation_threads')
        .select('*')
        .eq('user_id', user.id)
        .eq('role', role)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setThreads(data);
    } catch (error) {
      console.error('Error fetching threads:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load conversation threads",
      });
    }
  };

  const createThread = async (title: string) => {
    if (!user || !role) return null;
    
    try {
      const { data, error } = await supabase
        .from('conversation_threads')
        .insert({
          title,
          user_id: user.id,
          role,
        })
        .select()
        .single();

      if (error) throw error;
      
      setThreads(prev => [data, ...prev]);
      return data.id;
    } catch (error) {
      console.error('Error creating thread:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create new conversation",
      });
      return null;
    }
  };

  const updateThreadTitle = async (threadId: string, newTitle: string) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('conversation_threads')
        .update({ title: newTitle })
        .eq('id', threadId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setThreads(prev => 
        prev.map(thread => 
          thread.id === threadId 
            ? { ...thread, title: newTitle }
            : thread
        )
      );
      return true;
    } catch (error) {
      console.error('Error updating thread title:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update conversation title",
      });
      return false;
    }
  };

  const generateThreadTitle = async (threadId: string) => {
    try {
      // Fetch the first user message from the thread
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('text')
        .eq('thread_id', threadId)
        .eq('is_ai', false)
        .order('created_at', { ascending: true })
        .limit(1);

      if (messagesError) throw messagesError;

      if (messages && messages.length > 0) {
        const firstMessage = messages[0].text;
        // Create a title from the first message (truncate if too long)
        const newTitle = firstMessage.length > 50 
          ? `${firstMessage.substring(0, 47)}...`
          : firstMessage;
        
        await updateThreadTitle(threadId, newTitle);
      }
    } catch (error) {
      console.error('Error generating thread title:', error);
    }
  };

  useEffect(() => {
    if (user && role) {
      fetchThreads();
    }
  }, [user, role]);

  return {
    threads,
    createThread,
    updateThreadTitle,
    generateThreadTitle,
    isLoading,
  };
};