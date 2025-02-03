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
  const { fetchMessages, saveUserMessage } = useMessageManagement(user, role, threadId);
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

      // Add user message to state
      const newMessage: Message = {
        text: message,
        isAi: false,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, newMessage]);

      // Create a placeholder for the AI response
      const aiMessage: Message = {
        text: "",
        isAi: true,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      console.log('Sending message to AI chat function:', message);
      const response = await supabase.functions.invoke('ai-chat', {
        body: {
          userRole: role,
          message,
          userId: user.id,
        },
      });

      if (response.error) {
        console.error('AI chat error:', response.error);
        throw response.error;
      }

      // Create a Response object from the data
      const streamResponse = new Response(response.data);
      const reader = streamResponse.body?.getReader();
      
      if (!reader) {
        throw new Error('No reader available from response');
      }

      let accumulatedText = '';
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode the chunk and update the message
          const chunk = decoder.decode(value);
          accumulatedText += chunk;

          // Update the AI message with accumulated text
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.isAi) {
              lastMessage.text = accumulatedText;
            }
            return newMessages;
          });
        }
      } catch (error) {
        console.error('Error processing stream:', error);
        throw error;
      } finally {
        reader.releaseLock();
      }

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