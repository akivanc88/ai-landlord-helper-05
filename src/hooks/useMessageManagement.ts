import { User } from "@supabase/supabase-js";
import { UserRole, Message, Citation } from "@/types/chat";
import { Json } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useMessageManagement = (user: User | null, role: UserRole | null, threadId: string | null) => {
  const { toast } = useToast();

  const convertJsonToCitation = (json: Json): Citation => {
    console.log('Converting JSON to Citation:', json);
    if (typeof json !== 'object' || !json || Array.isArray(json)) {
      throw new Error('Invalid citation data');
    }

    const jsonObj = json as { [key: string]: Json };
    
    if (!('id' in jsonObj) || !('sourceId' in jsonObj) || !('sourceType' in jsonObj) || !('sourceName' in jsonObj)) {
      throw new Error('Missing required citation properties');
    }

    const citation: Citation = {
      id: Number(jsonObj.id),
      sourceId: String(jsonObj.sourceId),
      sourceType: String(jsonObj.sourceType),
      sourceName: String(jsonObj.sourceName),
      content: jsonObj.content ? String(jsonObj.content) : undefined
    };
    console.log('Converted citation:', citation);
    return citation;
  };

  const fetchMessages = async () => {
    if (!user || !role || !threadId) return [];
    
    try {
      console.log('Fetching messages for thread:', threadId);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('role', role)
        .eq('thread_id', threadId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      console.log('Raw messages data:', data);
      const messages = data.map((msg) => ({
        text: msg.text,
        isAi: msg.is_ai,
        timestamp: new Date(msg.timestamp).toLocaleTimeString(),
        citations: msg.citations ? (msg.citations as Json[]).map(convertJsonToCitation) : undefined,
      }));
      console.log('Processed messages with citations:', messages);
      return messages;
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

    console.log('Saving user message:', message);
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

    console.log('Saving AI message with citations:', { response, citations });
    const citationsJson: Json[] = citations.map(citation => ({
      id: citation.id,
      sourceId: citation.sourceId,
      sourceType: citation.sourceType,
      sourceName: citation.sourceName,
      content: citation.content
    }));

    const { error } = await supabase
      .from('messages')
      .insert({
        text: response,
        user_id: user.id,
        is_ai: true,
        role: role,
        thread_id: threadId,
        citations: citationsJson,
      });

    if (error) throw error;
  };

  return {
    fetchMessages,
    saveUserMessage,
    saveAIMessage,
  };
};