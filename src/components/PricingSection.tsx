import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown } from "lucide-react";

interface PricingSectionProps {
  onGetStarted: () => void;
}

const PricingSection = ({ onGetStarted }: PricingSectionProps) => {
  const plans = [
    {
      name: "Trial",
      price: "Free",
      period: "7 days",
      description: "Perfect for testing the waters",
      icon: <Zap className="h-6 w-6" />,
      features: [
        "7-day free trial",
        "Paper trading only",
        "Basic strategy execution",
        "Limited market data",
        "Email support",
        "Strategy backtesting"
      ],
      buttonText: "Start Free Trial",
      popular: false,
      gradient: "from-muted to-muted/50"
    },
    {
      name: "Basic",
      price: "₹2,999",
      period: "per month",
      description: "For individual traders",
      icon: <Star className="h-6 w-6" />,
      features: [
        "Live trading with 1 broker",
        "NIFTY short strangle strategy",
        "Real-time market data",
        "Basic risk management",
        "Email & chat support",
        "Performance analytics",
        "Mobile app access"
      ],
      buttonText: "Get Started",
      popular: true,
      gradient: "from-primary to-primary-glow"
    },
    {
      name: "Premium",
      price: "₹4,999",
      period: "per month",
      description: "For serious algo traders",
      icon: <Crown className="h-6 w-6" />,
      features: [
        "Live trading with multiple brokers",
        "All strategy variations",
        "Advanced market data & analytics",
        "Custom risk parameters",
        "Priority support",
        "Advanced performance metrics",
        "API access for custom strategies",
        "Hedge option strategies"
      ],
      buttonText: "Go Premium",
      popular: false,
      gradient: "from-chart-3 to-profit"
    }
  ];

  return (
    <section id="pricing" className="py-16 bg-gradient-to-br from-background to-muted/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Choose Your Trading Plan</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Start with our free trial or choose a plan that fits your trading goals. 
            All plans include our proven short strangle strategy execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative shadow-card hover:shadow-primary/20 transition-all duration-300 ${
                plan.popular ? 'ring-2 ring-primary scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <div className={`mx-auto p-3 rounded-full bg-gradient-to-r ${plan.gradient} w-fit mb-4`}>
                  <div className="text-white">
                    {plan.icon}
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="mt-4">
                  <div className="text-4xl font-bold">
                    {plan.price}
                  </div>
                  <div className="text-muted-foreground">
                    {plan.period}
                  </div>
                </div>
                <p className="text-muted-foreground mt-2">
                  {plan.description}
                </p>
              </CardHeader>
              
              <CardContent>
                {plan.popular ? (
                  <GradientButton 
                    className="w-full mb-6" 
                    onClick={onGetStarted}
                  >
                    {plan.buttonText}
                  </GradientButton>
                ) : (
                  <Button 
                    className="w-full mb-6" 
                    variant="outline"
                    onClick={onGetStarted}
                  >
                    {plan.buttonText}
                  </Button>
                )}
                
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-profit mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-card p-6 rounded-lg shadow-card max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold mb-4">Performance Fee Structure</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <span>Monthly Subscription</span>
                <span className="font-semibold">Fixed Rate</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-profit/10 rounded-lg border border-profit/20">
                <span>Performance Fee</span>
                <span className="font-semibold text-profit">10% of Profits</span>
              </div>
            </div>
            <p className="text-muted-foreground mt-4 text-sm">
              Performance fees are only charged on actual profits generated. 
              No hidden costs, transparent pricing structure.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            All plans include 24/7 customer support and regular strategy updates
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;