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

  const deductQuestion = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('deduct_question', { user_id_param: user.id });
      
      if (error) throw error;

      await checkQuestionCredits();
    } catch (error) {
      console.error('Error deducting question:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to deduct question credit",
      });
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

      // Deduct a question after successfully sending the message
      await deductQuestion();

      const newMessage: Message = {
        text: message,
        isAi: false,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, newMessage]);

      // Simulate AI response
      setTimeout(async () => {
        const aiResponse = "This is a placeholder response. The AI integration will be implemented in the next phase.";
        
        const { error: aiInsertError } = await supabase
          .from('messages')
          .insert({
            text: aiResponse,
            user_id: user.id,
            is_ai: true,
            role: role,
            thread_id: threadId,
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