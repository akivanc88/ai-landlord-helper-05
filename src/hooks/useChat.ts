import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Message, UserRole, Citation } from "@/types/chat";
import { User } from "@supabase/supabase-js";
import { useQuestionCredits } from "./useQuestionCredits";
import { useMessageManagement } from "./useMessageManagement";

export const useChat = (user: User | null, role: UserRole | null, threadId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { hasQuestions, checkQuestionCredits, setHasQuestions } = useQuestionCredits(user);
  const { fetchMessages, saveUserMessage, saveAIMessage } = useMessageManagement(user, role, threadId);
  const { toast } = useToast();

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
      await saveUserMessage(message);

      const newMessage: Message = {
        text: message,
        isAi: false,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, newMessage]);

      console.log('Sending message to AI chat function:', message);
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

      console.log('Received AI response:', aiData);
      console.log('Citations received:', aiData.citations);

      await saveAIMessage(aiData.response, aiData.citations);

      const aiMessage: Message = {
        text: aiData.response,
        isAi: true,
        timestamp: new Date().toLocaleTimeString(),
        citations: aiData.citations,
      };
      console.log('Creating AI message with citations:', aiMessage);
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
      fetchMessages().then(messages => {
        console.log('Fetched messages with citations:', messages);
        setMessages(messages);
      });
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