import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Target, Shield, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

const StrategyExplanation = () => {
  const strategySteps = [
    {
      title: "Market Analysis",
      time: "3:00 PM",
      icon: <TrendingUp className="h-5 w-5" />,
      description: "Check NIFTY current price and VIX levels for volatility assessment",
      color: "text-primary"
    },
    {
      title: "Strike Selection", 
      time: "3:05 PM",
      icon: <Target className="h-5 w-5" />,
      description: "AI-powered strike selection based on market volatility and premium requirements",
      color: "text-chart-3"
    },
    {
      title: "Trade Execution",
      time: "3:10 PM", 
      icon: <CheckCircle className="h-5 w-5" />,
      description: "Sell both options simultaneously through connected broker API",
      color: "text-profit"
    },
    {
      title: "Risk Monitoring",
      time: "Continuous",
      icon: <Shield className="h-5 w-5" />,
      description: "Advanced trailing stop-loss system protects profits and limits losses automatically",
      color: "text-chart-4"
    },
    {
      title: "Profit Booking",
      time: "Next Day",
      icon: <Clock className="h-5 w-5" />,
      description: "Automated exit with intelligent profit protection and risk management",
      color: "text-profit"
    }
  ];

  const keyFeatures = [
    {
      title: "Intelligent Strike Selection",
      description: "AI analyzes market conditions and selects optimal strikes with premium validation",
      icon: <Target className="h-4 w-4" />
    },
    {
      title: "Dynamic Volatility Adjustment",
      description: "Automatically adjusts strategy parameters based on real-time VIX levels",
      icon: <AlertTriangle className="h-4 w-4" />
    },
    {
      title: "Capital Management",
      description: "Smart lot sizing and capital allocation based on available funds and risk limits",
      icon: <Shield className="h-4 w-4" />
    },
    {
      title: "Fully Automated",
      description: "No manual intervention required - complete hands-off trading experience",
      icon: <CheckCircle className="h-4 w-4" />
    }
  ];

  return (
    <section id="strategy" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">How Our Platform Works</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Automated trading strategies that execute trades based on proven algorithms and real-time market data.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Strategy Flow */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" />
                Daily Execution Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {strategySteps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-background/50 rounded-lg border border-border/50">
                    <div className={`${step.color} bg-background p-2 rounded-full border border-border`}>
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{step.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {step.time}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Features */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-profit" />
                Advanced Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {keyFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-gradient-to-r from-profit/10 to-primary/10 rounded-lg border border-profit/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-profit" />
                  <h4 className="font-semibold text-profit">Historical Performance</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Backtested strategy shows consistent monthly returns with managed drawdowns 
                  during volatile market conditions.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Example Trade - Simplified */}
        <Card className="max-w-4xl mx-auto shadow-card">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Our platform handles all the complexity - you just enable auto-execute and let the system work
            </p>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-background to-muted/20 p-6 rounded-lg border border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">3:10 PM</div>
                  <div className="text-sm text-muted-foreground mb-1">Daily Entry</div>
                  <div className="text-xs text-muted-foreground">
                    System analyzes market and executes automatically
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-profit mb-2">24/7</div>
                  <div className="text-sm text-muted-foreground mb-1">Risk Monitoring</div>
                  <div className="text-xs text-muted-foreground">
                    Advanced trailing stop-loss protects your profits
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-chart-3 mb-2">Next Day</div>
                  <div className="text-sm text-muted-foreground mb-1">Automated Exit</div>
                  <div className="text-xs text-muted-foreground">
                    Intelligent exit with profit protection
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-semibold mb-1">Why Use Our Platform?</div>
                    <p className="text-sm text-muted-foreground">
                      Our proprietary algorithm combines market intelligence, volatility analysis, and risk management 
                      to execute trades at optimal times. The system handles strike selection, premium validation, 
                      lot sizing, and exit timing - all automatically. You get professional-grade trading without 
                      the complexity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default StrategyExplanation;