"use client";
import React from "react";
import { motion } from "framer-motion";
import { LampContainer } from "@/components/ui/lamp";
import { Button } from "@/components/ui/button";
import { TrendingUp, Shield, Zap, ArrowRight, Globe } from "lucide-react";

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  return (
    <>
      <LampContainer>
        <motion.div
          initial={{ opacity: 0.5, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="mt-8 flex flex-col items-center gap-6"
        >
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
            <span className="text-sm">🚀</span>
            <span className="text-sm">📈</span>
            <span className="text-sm font-medium text-primary">AI-Powered Trading Platform</span>
          </div>

          {/* Main Headline */}
          <h1 className="bg-gradient-to-br from-foreground to-muted-foreground py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl">
            Power and Simplicity
            <br />
            <span className="bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              In One Trading Platform
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto text-center leading-relaxed">
            A powerful dashboard to manage, track, and optimize your options trading in real-time. 
            Combining security, speed, and elegant simplicity with automated execution.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="group bg-primary hover:bg-primary-glow text-primary-foreground shadow-[0_0_30px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_50px_hsl(var(--primary)/0.5)] transition-all duration-300 text-base px-8 py-6"
            >
              Get Started for Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 text-foreground backdrop-blur-sm text-base px-8 py-6"
            >
              <Globe className="mr-2 w-5 h-5" />
              View Demo
            </Button>
          </div>
        </motion.div>
      </LampContainer>

      {/* Feature highlights below hero */}
      <div className="relative py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: TrendingUp, title: "Daily Profits", desc: "Consistent returns with proven strategies" },
              { icon: Shield, title: "Risk Management", desc: "Advanced protection with automated stops" },
              { icon: Zap, title: "Real-time Execution", desc: "Lightning-fast order placement" }
            ].map((feature, idx) => (
              <div 
                key={idx}
                className="group relative p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <feature.icon className="w-8 h-8 text-primary mb-3 mx-auto group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-foreground mb-2 text-center">{feature.title}</h3>
                <p className="text-sm text-muted-foreground text-center">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default HeroSection;
