import { useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import MarketOverview from "@/components/MarketOverview";
import StrategyExplanation from "@/components/StrategyExplanation";
import PricingSection from "@/components/PricingSection";
import AuthForm from "@/components/AuthForm";

const Index = () => {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  const handleLogin = () => {
    setShowAuth(true);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleAuthSuccess = () => {
    setUser({ email: "trader@example.com" }); // Mock user
    setShowAuth(false);
  };

  const handleGetStarted = () => {
    if (user) {
      // Redirect to dashboard
      console.log("Redirect to dashboard");
    } else {
      setShowAuth(true);
    }
  };

  if (showAuth && !user) {
    return <AuthForm onSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header 
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      
      <main>
        <HeroSection onGetStarted={handleGetStarted} />
        <MarketOverview />
        <StrategyExplanation />
        <PricingSection onGetStarted={handleGetStarted} />
      </main>

      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                NIFTY Algo Trader
              </h3>
              <p className="text-muted-foreground mb-4">
                Professional automated options trading platform for consistent profits 
                with advanced risk management and real-time execution.
              </p>
              <div className="text-sm text-muted-foreground">
                <p>⚠️ Trading involves risk. Past performance doesn't guarantee future results.</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 NIFTY Algo Trader. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
