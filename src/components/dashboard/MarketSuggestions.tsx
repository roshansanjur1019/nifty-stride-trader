import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, AlertCircle } from "lucide-react";

interface MarketSuggestionsProps {
  userId: string;
}

const MarketSuggestions = ({ userId }: MarketSuggestionsProps) => {
  const [marketCondition, setMarketCondition] = useState<string>("Neutral");
  const [vix, setVix] = useState<number>(15.2);
  const [trend, setTrend] = useState<string>("Sideways");
  
  // Simulated market analysis - in production, this would fetch real data
  useEffect(() => {
    // Simulate real-time market data updates
    const interval = setInterval(() => {
      const randomVix = (Math.random() * 10 + 12).toFixed(1);
      setVix(parseFloat(randomVix));
      
      if (parseFloat(randomVix) < 15) {
        setMarketCondition("Low Volatility");
        setTrend("Sideways");
      } else if (parseFloat(randomVix) < 20) {
        setMarketCondition("Moderate");
        setTrend("Choppy");
      } else {
        setMarketCondition("High Volatility");
        setTrend("Trending");
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const getSuggestedStrategy = () => {
    if (vix < 15) {
      return {
        name: "Short Strangle",
        reason: "Low volatility ideal for premium collection",
        confidence: "High",
        icon: <TrendingDown className="h-4 w-4" />,
      };
    } else if (vix < 20) {
      return {
        name: "Iron Condor",
        reason: "Moderate volatility suits limited risk strategies",
        confidence: "Medium",
        icon: <Activity className="h-4 w-4" />,
      };
    } else {
      return {
        name: "Long Straddle",
        reason: "High volatility favors directional option buying",
        confidence: "High",
        icon: <TrendingUp className="h-4 w-4" />,
      };
    }
  };

  const suggestion = getSuggestedStrategy();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Market Intelligence
        </CardTitle>
        <CardDescription>Real-time analysis and strategy recommendations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Market Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">VIX</div>
            <div className="text-lg font-bold">{vix}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">Condition</div>
            <div className="text-sm font-semibold">{marketCondition}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">Trend</div>
            <div className="text-sm font-semibold">{trend}</div>
          </div>
        </div>

        {/* AI Suggestion */}
        <div className="p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20 mt-1">
              {suggestion.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">Recommended: {suggestion.name}</span>
                <Badge variant="outline" className="text-xs">
                  {suggestion.confidence} Confidence
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
            </div>
          </div>
        </div>

        {/* Capital Check Notice */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
          <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Strategy deployment considers your available broker capital and margin requirements
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketSuggestions;
