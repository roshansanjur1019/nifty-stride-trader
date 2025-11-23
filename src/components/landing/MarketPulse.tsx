import { motion } from "framer-motion";

const tickers = [
    { symbol: "NIFTY", price: "24,750.00", change: "+0.45%", up: true },
    { symbol: "BANKNIFTY", price: "52,100.00", change: "+0.60%", up: true },
    { symbol: "VIX", price: "13.50", change: "-2.10%", up: false },
    { symbol: "RELIANCE", price: "2,950.00", change: "+1.20%", up: true },
    { symbol: "HDFCBANK", price: "1,650.00", change: "-0.30%", up: false },
    { symbol: "INFY", price: "1,850.00", change: "+0.80%", up: true },
    { symbol: "TCS", price: "4,100.00", change: "+0.15%", up: true },
    { symbol: "SBIN", price: "780.00", change: "+1.50%", up: true },
];

export const MarketPulse = () => {
    return (
        <div className="w-full bg-background/50 border-y border-white/5 backdrop-blur-sm overflow-hidden py-3">
            <div className="flex relative">
                <motion.div
                    className="flex gap-12 whitespace-nowrap"
                    animate={{ x: [0, -1000] }}
                    transition={{
                        repeat: Infinity,
                        duration: 20,
                        ease: "linear",
                    }}
                >
                    {[...tickers, ...tickers, ...tickers].map((ticker, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <span className="font-bold text-sm text-foreground">{ticker.symbol}</span>
                            <span className="text-sm text-muted-foreground">{ticker.price}</span>
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${ticker.up ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {ticker.change}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};
