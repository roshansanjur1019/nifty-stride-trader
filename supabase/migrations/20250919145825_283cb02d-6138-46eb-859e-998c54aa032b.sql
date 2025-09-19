-- Create enum types for better data integrity
CREATE TYPE subscription_plan AS ENUM ('trial', 'basic', 'premium');
CREATE TYPE broker_type AS ENUM ('zerodha', 'angel_one');
CREATE TYPE trade_status AS ENUM ('pending', 'executed', 'cancelled', 'expired');
CREATE TYPE option_type AS ENUM ('CE', 'PE');

-- User profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  subscription_plan subscription_plan DEFAULT 'trial',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Broker accounts for API integration
CREATE TABLE public.broker_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_type broker_type NOT NULL,
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  access_token_encrypted TEXT,
  is_active BOOLEAN DEFAULT false,
  last_connected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Strategy configurations
CREATE TABLE public.strategy_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_name TEXT NOT NULL DEFAULT 'Short Strangle',
  entry_time TIME DEFAULT '15:10:00',
  exit_time TIME DEFAULT '15:00:00',
  strike_gap_points INTEGER DEFAULT 150,
  minimum_premium_threshold DECIMAL(10,2) DEFAULT 80.00,
  profit_booking_percentage DECIMAL(5,2) DEFAULT 1.00,
  max_loss_per_trade DECIMAL(10,2) DEFAULT 5000.00,
  volatility_threshold DECIMAL(5,2) DEFAULT 20.00,
  high_volatility_gap INTEGER DEFAULT 300,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trade execution records
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_config_id UUID NOT NULL REFERENCES strategy_configs(id),
  nifty_price_at_entry DECIMAL(10,2),
  entry_time TIMESTAMP WITH TIME ZONE,
  exit_time TIMESTAMP WITH TIME ZONE,
  total_premium_received DECIMAL(10,2),
  total_pnl DECIMAL(10,2),
  trade_status trade_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Individual option positions (legs of the trade)
CREATE TABLE public.trade_legs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  option_type option_type NOT NULL,
  strike_price DECIMAL(10,2) NOT NULL,
  premium DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  entry_price DECIMAL(10,2),
  exit_price DECIMAL(10,2),
  pnl DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Market data cache
CREATE TABLE public.market_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  change_percent DECIMAL(5,2),
  volume BIGINT,
  vix DECIMAL(5,2),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(symbol, timestamp)
);

-- Performance metrics
CREATE TABLE public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  total_pnl DECIMAL(12,2) DEFAULT 0,
  max_drawdown DECIMAL(10,2) DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user data
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their broker accounts" 
  ON public.broker_accounts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their strategy configs" 
  ON public.strategy_configs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their trades" 
  ON public.trades FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their trade legs" 
  ON public.trade_legs FOR SELECT USING (
    EXISTS (SELECT 1 FROM trades WHERE id = trade_legs.trade_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can view their performance metrics" 
  ON public.performance_metrics FOR ALL USING (auth.uid() = user_id);

-- Market data is public
ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Market data is viewable by everyone" 
  ON public.market_data FOR SELECT USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_broker_accounts_updated_at
  BEFORE UPDATE ON public.broker_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_strategy_configs_updated_at
  BEFORE UPDATE ON public.strategy_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trades_updated_at
  BEFORE UPDATE ON public.trades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();