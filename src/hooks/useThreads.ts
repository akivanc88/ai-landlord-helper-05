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

  useEffect(() => {
    if (user && role) {
      fetchThreads();
    }
  }, [user, role]);

  return {
    threads,
    createThread,
    isLoading,
  };
};