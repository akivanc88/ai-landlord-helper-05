import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type QuestionCredit = {
  remaining_questions: number;
  expiry_date: string | null;
  is_purchased: boolean;
};

export const ProfileSection = ({ userId }: { userId: string }) => {
  const [credits, setCredits] = useState<QuestionCredit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const { data, error } = await supabase
          .from("question_credits")
          .select("*")
          .eq("user_id", userId);

        if (error) throw error;
        setCredits(data || []);
      } catch (error) {
        console.error("Error fetching credits:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load question credits",
        });
      }
    };

    // Initial fetch
    fetchCredits();

    // Set up real-time subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'question_credits',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Question credits changed:', payload);
          fetchCredits(); // Refresh the data when changes occur
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const getTotalQuestions = () => {
    return credits.reduce((total, credit) => total + credit.remaining_questions, 0);
  };

  const getExpiringQuestions = () => {
    return credits.find((credit) => !credit.is_purchased)?.remaining_questions || 0;
  };

  const getExpiryDate = () => {
    const freeCredit = credits.find((credit) => !credit.is_purchased);
    return freeCredit?.expiry_date
      ? new Date(freeCredit.expiry_date).toLocaleDateString()
      : "N/A";
  };

  const getPurchasedQuestions = () => {
    return credits
      .filter((credit) => credit.is_purchased)
      .reduce((total, credit) => total + credit.remaining_questions, 0);
  };

  const handleBuyCredits = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please log in to purchase credits",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initiate payment process",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check URL parameters for payment status
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const paymentStatus = queryParams.get('payment');
    
    if (paymentStatus === 'success') {
      toast({
        title: "Payment Successful",
        description: "Your question credits have been added to your account.",
      });
      navigate('/', { replace: true }); // Remove query parameters
    } else if (paymentStatus === 'cancelled') {
      toast({
        variant: "destructive",
        title: "Payment Cancelled",
        description: "Your payment was cancelled. No credits were added.",
      });
      navigate('/', { replace: true }); // Remove query parameters
    }
  }, []);

  return (
    <Card className="p-6 bg-white shadow-sm border-[#e3e3e3]">
      <h2 className="text-xl font-semibold text-primary mb-4">Question Credits</h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center py-2 border-b border-[#e3e3e3]">
          <span className="text-[#313132]">Total Available Questions</span>
          <span className="font-semibold text-primary">{getTotalQuestions()}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-[#e3e3e3]">
          <span className="text-[#313132]">Free Questions Remaining</span>
          <span className="font-semibold text-primary">
            {getExpiringQuestions()}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-[#e3e3e3]">
          <span className="text-[#313132]">Free Questions Expiry Date</span>
          <span className="font-semibold text-primary">{getExpiryDate()}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-[#e3e3e3]">
          <span className="text-[#313132]">Purchased Questions</span>
          <span className="font-semibold text-primary">
            {getPurchasedQuestions()}
          </span>
        </div>
        <Button
          onClick={handleBuyCredits}
          disabled={isLoading}
          className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
        >
          {isLoading ? "Processing..." : "Buy More Credits"}
        </Button>
      </div>
    </Card>
  );
};