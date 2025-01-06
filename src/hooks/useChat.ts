import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Message, UserRole } from "@/types/chat";
import { User } from "@supabase/supabase-js";

interface Citation {
  id: number;
  sourceId: string;
  sourceType: string;
  sourceName: string;
}

export const useChat = (user: User | null, role: UserRole | null, threadId: string | null) => {
  const [messages, setMessages] = useState<(Message & { citations?: Citation[] })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasQuestions, setHasQuestions] = useState(true);
  const { toast } = useToast();

  const checkQuestionCredits = async () => {
    if (!user) return true;

    try {
      console.log('Checking credits for user:', user.id);
      
      const { data, error } = await supabase
        .from('question_credits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking credits:', error);
        throw error;
      }
      
      console.log('Credit check result:', data);
      
      if (!data) {
        console.log('No credit record found for user');
        setHasQuestions(false);
        return false;
      }

      const hasAvailableQuestions = (data.remaining_questions || 0) > 0;
      const isExpired = data.expiry_date ? new Date(data.expiry_date) < new Date() : false;
      
      console.log('Credit status:', {
        remaining: data.remaining_questions,
        expired: isExpired,
        hasAvailable: hasAvailableQuestions
      });

      const canAskQuestions = hasAvailableQuestions && !isExpired;
      setHasQuestions(canAskQuestions);
      return canAskQuestions;
    } catch (error) {
      console.error('Error checking question credits:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to check question credits",
      });
      return false;
    }
  };

  const fetchMessages = async () => {
    if (!user || !role || !threadId) return;
    
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

      setMessages(
        data.map((msg) => ({
          text: msg.text,
          isAi: msg.is_ai,
          timestamp: new Date(msg.timestamp).toLocaleTimeString(),
          citations: msg.citations,
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

  const sendMessage = async (message: string) => {
    if (!user || !role || !threadId) return;
    
    const canAskQuestion = await checkQuestionCredits();
    if (!canAskQuestion) {
      toast({
        variant: "destructive",
        title: "No Questions Available",
        description: "You've used all your questions or they have expired. Please purchase more credits to continue.",
      });
      setHasQuestions(false);
      return;
    }

    setIsLoading(true);
    try {
      // Save user message
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          text: message,
          user_id: user.id,
          is_ai: false,
          role: role,
          thread_id: threadId,
        });

      if (insertError) throw insertError;

      const newMessage = {
        text: message,
        isAi: false,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, newMessage]);

      // Get AI response
      const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-chat', {
        body: {
          userRole: role,
          message,
          userId: user.id,
        },
      });

      if (aiError) {
        console.error('AI chat error:', aiError);
        if (aiError.status === 403 && aiError.message?.includes('No questions available')) {
          setHasQuestions(false);
          toast({
            variant: "destructive",
            title: "No Questions Available",
            description: "You've used all your questions. Please purchase more credits to continue.",
          });
          return;
        }
        throw aiError;
      }

      // Save AI response with citations
      const { error: aiInsertError } = await supabase
        .from('messages')
        .insert({
          text: aiData.response,
          user_id: user.id,
          is_ai: true,
          role: role,
          thread_id: threadId,
          citations: aiData.citations,
        });

      if (aiInsertError) throw aiInsertError;

      const aiMessage = {
        text: aiData.response,
        isAi: true,
        timestamp: new Date().toLocaleTimeString(),
        citations: aiData.citations,
      };
      setMessages((prev) => [...prev, aiMessage]);

      await checkQuestionCredits();

    } catch (error) {
      console.error('Error in chat interaction:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process message",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && role && threadId) {
      fetchMessages();
      checkQuestionCredits();
    } else {
      setMessages([]);
    }
  }, [user, role, threadId]);

  return {
    messages,
    isLoading,
    sendMessage,
    hasQuestions,
  };
};