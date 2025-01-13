import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const PricingSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePlanSelect = async (plan: "monthly" | "annual") => {
    try {
      if (!user) {
        // Store the selected plan in URL parameters and redirect to auth
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('showAuth', 'true');
        searchParams.set('selectedPlan', plan);
        navigate(`/?${searchParams.toString()}`);
        return;
      }

      // Get fresh session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      if (!session) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please log in to purchase a plan",
        });
        return;
      }

      // Create checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error initiating checkout:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initiate payment process",
      });
    }
  };

  return (
    <section className="py-16 bg-background" id="pricing">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Transparent Pricing</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that best fits your needs. All plans include access to our comprehensive BC housing law database.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Monthly Plan */}
          <Card className="p-8 hover:shadow-lg transition-shadow">
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2">Monthly</h3>
              <div className="flex items-baseline mb-4">
                <span className="text-4xl font-bold">$10</span>
                <span className="text-muted-foreground ml-2">/month</span>
              </div>
              <Button 
                onClick={() => handlePlanSelect("monthly")} 
                className="w-full mb-6"
              >
                Get Started
              </Button>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>100 questions per month</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Unlimited access to legal resources</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Chat history persistence</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>24/7 support</span>
                </li>
              </ul>
            </div>
          </Card>

          {/* Annual Plan */}
          <Card className="p-8 border-primary hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-sm rounded-bl-lg">
              Best Value
            </div>
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2">Annual</h3>
              <div className="flex items-baseline mb-4">
                <span className="text-4xl font-bold">$90</span>
                <span className="text-muted-foreground ml-2">/year</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Save 25% annually</p>
              <Button 
                onClick={() => handlePlanSelect("annual")} 
                className="w-full mb-6 bg-primary"
                variant="default"
              >
                Get Started
              </Button>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>200 questions per month</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Everything in Monthly plan</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>25% annual discount</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};