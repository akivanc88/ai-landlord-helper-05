import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Message, UserRole } from "@/types/chat";
import { User } from "@supabase/supabase-js";

export const useChat = (user: User | null, role: UserRole | null, threadId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasQuestions, setHasQuestions] = useState(true);
  const { toast } = useToast();

  const checkQuestionCredits = async () => {
    if (!user) return true;

    try {
      const { data, error } = await supabase
        .from('question_credits')
        .select('remaining_questions')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      const hasAvailableQuestions = (data?.remaining_questions || 0) > 0;
      setHasQuestions(hasAvailableQuestions);
      return hasAvailableQuestions;
    } catch (error) {
      console.error('Error checking question credits:', error);
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
    
    // Check if user has available questions
    const canAskQuestion = await checkQuestionCredits();
    if (!canAskQuestion) {
      toast({
        variant: "destructive",
        title: "No Questions Available",
        description: "You've used all your questions. Please purchase more to continue.",
      });
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

      const newMessage: Message = {
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

      if (aiError) throw aiError;

      // Save AI response
      const { error: aiInsertError } = await supabase
        .from('messages')
        .insert({
          text: aiData.response,
          user_id: user.id,
          is_ai: true,
          role: role,
          thread_id: threadId,
        });

      if (aiInsertError) throw aiInsertError;

      const aiMessage: Message = {
        text: aiData.response,
        isAi: true,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, aiMessage]);

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