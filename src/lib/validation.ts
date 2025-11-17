import { z } from "zod";

// Authentication validation schemas
export const loginSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255, { message: "Email must be less than 255 characters" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).max(100, { message: "Password must be less than 100 characters" }),
});

export const signupSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255, { message: "Email must be less than 255 characters" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(100, { message: "Password must be less than 100 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string(),
  fullName: z.string().trim().min(2, { message: "Full name must be at least 2 characters" }).max(100, { message: "Full name must be less than 100 characters" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Broker credentials validation schema
export const brokerCredentialsSchema = z.object({
  apiKey: z.string().trim().min(10, { message: "API Key must be at least 10 characters" }).max(200, { message: "API Key must be less than 200 characters" }),
  apiSecret: z.string().trim().min(10, { message: "API Secret must be at least 10 characters" }).max(200, { message: "API Secret must be less than 200 characters" }),
  brokerType: z.enum(["zerodha", "angel_one"], { errorMap: () => ({ message: "Invalid broker type" }) }),
});

// Strategy configuration validation schema
export const strategyConfigSchema = z.object({
  strategy_name: z.string().trim().min(1, { message: "Strategy name is required" }).max(100, { message: "Strategy name must be less than 100 characters" }),
  entry_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, { message: "Entry time must be in HH:MM:SS format" }),
  exit_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, { message: "Exit time must be in HH:MM:SS format" }),
  strike_gap_points: z.number().positive({ message: "Strike gap must be positive" }).max(10000, { message: "Strike gap must be less than 10000" }),
  minimum_premium_threshold: z.number().positive({ message: "Minimum premium must be positive" }).max(10000, { message: "Minimum premium must be less than 10000" }),
  profit_booking_percentage: z.number().min(0, { message: "Profit booking percentage must be at least 0" }).max(100, { message: "Profit booking percentage must be at most 100" }),
  max_loss_per_trade: z.number().positive({ message: "Max loss must be positive" }).max(1000000, { message: "Max loss must be less than 1000000" }),
  volatility_threshold: z.number().min(0, { message: "Volatility threshold must be at least 0" }).max(100, { message: "Volatility threshold must be at most 100" }),
  high_volatility_gap: z.number().positive({ message: "High volatility gap must be positive" }).max(10000, { message: "High volatility gap must be less than 10000" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type BrokerCredentialsInput = z.infer<typeof brokerCredentialsSchema>;
export type StrategyConfigInput = z.infer<typeof strategyConfigSchema>;
