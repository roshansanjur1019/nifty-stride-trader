import { motion } from "framer-motion";
import {
    Brain,
    Zap,
    Shield,
    BarChart3,
    Globe,
    Lock,
    ArrowUpRight
} from "lucide-react";

const features = [
    {
        title: "AI-Driven NIFTY Insights",
        description: "Our neural networks analyze NSE data points to predict NIFTY & BANKNIFTY movements with high accuracy.",
        icon: Brain,
        className: "md:col-span-2",
        gradient: "from-primary/20 to-primary/5"
    },
    {
        title: "Lightning Execution",
        description: "Direct API integration with Angel One & Zerodha for sub-millisecond order placement.",
        icon: Zap,
        className: "md:col-span-1",
        gradient: "from-accent/20 to-accent/5"
    },
    {
        title: "Capital Guard™",
        description: "Automated stop-loss and position sizing to protect your Rupee capital 24/7.",
        icon: Shield,
        className: "md:col-span-1",
        gradient: "from-orange-500/20 to-orange-500/5"
    },
    {
        title: "Indian Markets First",
        description: "Optimized specifically for Indian F&O market conditions, volatility, and regulations.",
        icon: Globe,
        className: "md:col-span-2",
        gradient: "from-blue-500/20 to-blue-500/5"
    },
];

export const Features = () => {
    return (
        <section className="py-24 relative overflow-hidden bg-background">
            <div className="container px-4 md:px-6 relative z-10">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold mb-4"
                    >
                        Unfair Advantage
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground max-w-2xl mx-auto text-lg"
                    >
                        Built for Indian traders who demand excellence. Our platform combines raw power with intelligent automation.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className={`relative group overflow-hidden rounded-3xl border border-white/10 bg-card/30 backdrop-blur-sm p-8 hover:border-primary/30 transition-colors ${feature.className}`}
                        >
                            {/* Gradient Background */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                                        <feature.icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>

                                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
