import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
}

interface DashboardMarketOverviewProps {
  userId: string;
}

const DashboardMarketOverview = ({ userId }: DashboardMarketOverviewProps) => {
  const [marketData, setMarketData] = useState<MarketData[]>([
    {
      symbol: "NIFTY",
      price: 0,
      change: 0,
      changePercent: 0,
      volume: 0
    },
    {
      symbol: "BANKNIFTY",
      price: 0,
      change: 0,
      changePercent: 0,
      volume: 0
    },
    {
      symbol: "FINNIFTY",
      price: 0,
      change: 0,
      changePercent: 0,
      volume: 0
    },
    {
      symbol: "VIX",
      price: 0,
      change: 0,
      changePercent: 0,
      volume: 0
    }
  ]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [hasBroker, setHasBroker] = useState(false);

  // Check if user has connected broker
  useEffect(() => {
    const checkBroker = async () => {
      const { data } = await supabase
        .from("broker_accounts")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .limit(1);

      setHasBroker((data?.length || 0) > 0);
    };

    checkBroker();
  }, [userId]);

  // Auto-fetch market data when broker is connected
  useEffect(() => {
    if (!hasBroker) {
      setLoading(false);
      return;
    }

    const fetchLiveData = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        const exchangeTokens = {
          NSE: ['99926000', '99926009', '99926037', '99926017'],
          BSE: ['99919000'],
        };

        if (backendUrl) {
          const res = await fetch(`${backendUrl}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'fetchMarketData', mode: 'FULL', exchangeTokens }),
          });

          const data = await res.json();
          const ok = data.success && data.data && (data.data.status ?? true);

          if (ok) {
            const fetched = data.data?.data?.fetched || [];
            const tokenToSymbol: Record<string, string> = {
              '99926000': 'NIFTY',
              '99926009': 'BANKNIFTY',
              '99926037': 'FINNIFTY',
              '99926017': 'VIX',
              '99919000': 'SENSEX'
            };

            const marketDataMap: Record<string, Partial<MarketData>> = {};
            for (const row of fetched) {
              if (row?.symbolToken && typeof row?.ltp === 'number') {
                const sym = tokenToSymbol[row.symbolToken];
                if (sym) {
                  marketDataMap[sym] = {
                    price: row.ltp,
                    change: typeof row.change === 'number' ? row.change : (row.ltp - (row.close || row.ltp)),
                    changePercent: typeof row.changePercent === 'number' ? row.changePercent :
                      (row.close && row.close > 0 ? ((row.ltp - row.close) / row.close) * 100 : 0),
                    volume: row.tradeVolume || row.volume || undefined
                  };
                }
              }
            }

            setMarketData(prev => prev.map(item => {
              const newData = marketDataMap[item.symbol];
              if (newData) {
                return {
                  ...item,
                  price: newData.price || item.price,
                  change: newData.change !== undefined ? newData.change : item.change,
                  changePercent: newData.changePercent !== undefined ? newData.changePercent : item.changePercent,
                  volume: newData.volume !== undefined ? newData.volume : item.volume
                };
              }
              return item;
            }));

            setLastUpdate(new Date());
          }
        }
      } catch (error) {
        console.error('Failed to fetch market data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchLiveData();

    // Auto-update every 5 seconds
    const interval = setInterval(fetchLiveData, 5000);

    return () => clearInterval(interval);
  }, [hasBroker]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change: number, changePercent: number) => {
    const isPositive = change >= 0;
    const changeText = `${isPositive ? '+' : ''}${change.toFixed(2)}`;
    const percentText = `${isPositive ? '+' : ''}${changePercent.toFixed(2)}%`;
    return { isPositive, changeText, percentText };
  };

  if (!hasBroker) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Market Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2">Connect a broker account to view live market data</p>
            <p className="text-sm">Market data will update automatically once connected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Market Overview
          </CardTitle>
          {lastUpdate && (
            <Badge variant="outline" className="text-xs">
              Updated: {lastUpdate.toLocaleTimeString()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {marketData.map((data) => {
              const { isPositive, changeText, percentText } = formatChange(data.change, data.changePercent);

              return (
                <div
                  key={data.symbol}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">{data.symbol}</h3>
                    {data.symbol === 'NIFTY' && (
                      <Badge variant="secondary" className="text-xs">Primary</Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">{formatPrice(data.price)}</div>
                    <div className="flex items-center space-x-2">
                      {isPositive ? (
                        <TrendingUp className="h-4 w-4 text-profit" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-loss" />
                      )}
                      <div className={`flex flex-col text-sm ${isPositive ? 'text-profit' : 'text-loss'}`}>
                        <span className="font-medium">{changeText}</span>
                        <span className="text-xs">{percentText}</span>
                      </div>
                    </div>
                    {data.volume && data.volume > 0 && (
                      <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                        Volume: {(data.volume / 1000).toFixed(1)}K
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardMarketOverview;

