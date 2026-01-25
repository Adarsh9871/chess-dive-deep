import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, Crown, Star, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  features: string[];
  is_popular: boolean;
}

interface UserSubscription {
  id: string;
  plan_id: string;
  status: string;
  billing_interval: string;
  current_period_end: string | null;
}

const Upgrade = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isYearly, setIsYearly] = useState(false);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
    if (user) {
      fetchUserSubscription();
    }
  }, [user]);

  const fetchPlans = async () => {
    const { data } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price_monthly");

    setPlans(data?.map(p => ({
      ...p,
      features: Array.isArray(p.features) ? (p.features as string[]) : []
    })) || []);
    setLoading(false);
  };

  const fetchUserSubscription = async () => {
    const { data } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user?.id)
      .eq("status", "active")
      .maybeSingle();

    setUserSubscription(data);
  };

  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      toast.error("Please sign in to subscribe");
      navigate("/");
      return;
    }

    if (plan.price_monthly === 0) {
      toast.info("You're already on the Free plan!");
      return;
    }

    setSubscribing(plan.id);

    // For now, create a subscription record (in production, integrate with Stripe)
    try {
      // Check if user already has a subscription
      if (userSubscription) {
        // Update existing subscription
        const { error } = await supabase
          .from("user_subscriptions")
          .update({
            plan_id: plan.id,
            billing_interval: isYearly ? "yearly" : "monthly",
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + (isYearly ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq("id", userSubscription.id);

        if (error) throw error;
      } else {
        // Create new subscription
        const { error } = await supabase
          .from("user_subscriptions")
          .insert({
            user_id: user.id,
            plan_id: plan.id,
            billing_interval: isYearly ? "yearly" : "monthly",
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + (isYearly ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
          });

        if (error) throw error;
      }

      // Record payment
      await supabase.from("payment_history").insert({
        user_id: user.id,
        amount: isYearly && plan.price_yearly ? plan.price_yearly : plan.price_monthly,
        currency: "USD",
        status: "completed",
        payment_type: "subscription",
        description: `${plan.name} - ${isYearly ? "Yearly" : "Monthly"} subscription`,
      });

      toast.success(`Successfully subscribed to ${plan.name}!`);
      fetchUserSubscription();
    } catch {
      toast.error("Failed to process subscription");
    } finally {
      setSubscribing(null);
    }
  };

  const getPlanIcon = (name: string) => {
    if (name.toLowerCase().includes("premium")) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (name.toLowerCase().includes("pro")) return <Zap className="w-6 h-6 text-blue-500" />;
    return <Star className="w-6 h-6 text-muted-foreground" />;
  };

  const isCurrentPlan = (planId: string) => userSubscription?.plan_id === planId;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <Header />

      <main className="container px-4 mx-auto py-24">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-4">
            <Crown className="w-3 h-3 mr-1" />
            Upgrade Your Experience
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Unlock unlimited lessons, 1-on-1 coaching, and exclusive features to accelerate your chess journey.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className={`text-sm ${!isYearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>Monthly</span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span className={`text-sm ${isYearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              Yearly <Badge variant="default" className="ml-1">Save 20%</Badge>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const price = isYearly && plan.price_yearly ? plan.price_yearly : plan.price_monthly;
            const isCurrent = isCurrentPlan(plan.id);
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${plan.is_popular ? "border-primary shadow-lg scale-105" : ""} ${isCurrent ? "bg-primary/5 border-primary" : ""}`}
              >
                {plan.is_popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                {isCurrent && (
                  <Badge variant="secondary" className="absolute -top-3 right-4">
                    Current Plan
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-2">{getPlanIcon(plan.name)}</div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">${price}</span>
                    <span className="text-muted-foreground">/{isYearly ? "year" : "month"}</span>
                  </div>
                  <ul className="space-y-3 text-left">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={plan.is_popular ? "default" : "outline"}
                    disabled={isCurrent || subscribing === plan.id}
                    onClick={() => handleSubscribe(plan)}
                  >
                    {subscribing === plan.id ? "Processing..." : isCurrent ? "Current Plan" : price === 0 ? "Get Started" : "Subscribe"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-display font-bold mb-4">All Plans Include</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {["Community Access", "Basic Puzzles", "Game History", "Progress Tracking"].map(feature => (
              <Badge key={feature} variant="outline" className="text-sm py-1 px-3">
                <Check className="w-3 h-3 mr-1" />
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        {/* FAQ or Contact */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Have questions? <Button variant="link" className="p-0" onClick={() => navigate("/contact")}>Contact us</Button>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Upgrade;
