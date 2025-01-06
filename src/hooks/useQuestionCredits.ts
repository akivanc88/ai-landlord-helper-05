import { User } from "@supabase/supabase-js";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useQuestionCredits = (user: User | null) => {
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

  return {
    hasQuestions,
    checkQuestionCredits,
    setHasQuestions
  };
};