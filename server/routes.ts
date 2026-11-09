import type { Express } from "express";
import "./config";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import { insertUserSchema, signinSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { sendPasswordResetCode, sendVerificationCode } from "./email";
import {
  getAnalysis,
  getBitcoinQuote,
  getChart,
  getIndices,
  getMarketUniverse,
  getQuotes,
  getWatchlistQuotes,
  generateSignals,
  formatMarketCap,
  formatVolume,
} from "./market";

const JWT_SECRET = process.env.JWT_SECRET || "development-only-change-me";
const EMAIL_VERIFICATION_ENABLED = process.env.EMAIL_VERIFICATION_ENABLED === "true";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = async (req: any, res: any, next: any) => {
  const user = await storage.getUser(req.user.userId);
  const isAdmin =
    req.user.admin === true ||
    user?.role === "admin" ||
    Boolean(ADMIN_EMAIL && user?.email.toLowerCase() === ADMIN_EMAIL);
  if (!isAdmin) return res.status(403).json({ message: "Administrator access required" });
  req.admin = user;
  next();
};

const STRATEGY_LABELS: Record<string, string> = {
  momentum: "Momentum Trading",
  meanreversion: "Mean Reversion",
  arbitrage: "Arbitrage",
  scalping: "Scalping",
  grid: "Grid Trading",
};

export async function registerRoutes(app: Express): Promise<Server> {
  await storage.ready;

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        if (existingUser.emailVerified === "true") {
          throw new Error("User with this email already exists");
        }

        if (!EMAIL_VERIFICATION_ENABLED) {
          const verifiedUser = await storage.markEmailVerified(existingUser.email);
          if (!verifiedUser) throw new Error("User could not be activated");
          const token = jwt.sign({ userId: verifiedUser.id, email: verifiedUser.email }, JWT_SECRET, { expiresIn: "24h" });
          const { password, ...userWithoutPassword } = verifiedUser;
          return res.status(201).json({
            message: "Account created",
            requiresVerification: false,
            user: userWithoutPassword,
            token,
          });
        }

        const code = await storage.createVerificationCode(existingUser.email);
        await sendVerificationCode(existingUser.email, code);
        return res.status(201).json({
          message: "Verification code sent",
          requiresVerification: true,
          email: existingUser.email,
        });
      }

      const user = await storage.createUser(validatedData);
      if (!EMAIL_VERIFICATION_ENABLED) {
        const verifiedUser = await storage.markEmailVerified(user.email);
        if (!verifiedUser) throw new Error("User could not be activated");
        const token = jwt.sign({ userId: verifiedUser.id, email: verifiedUser.email }, JWT_SECRET, { expiresIn: "24h" });
        const { password, ...userWithoutPassword } = verifiedUser;
        return res.status(201).json({
          message: "Account created",
          requiresVerification: false,
          user: userWithoutPassword,
          token,
        });
      }

      const code = await storage.createVerificationCode(user.email);
      await sendVerificationCode(user.email, code);
      res.status(201).json({
        message: "Verification code sent",
        requiresVerification: true,
        email: user.email,
      });

    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(400).json({ message: error.message || "Failed to create user" });
    }
  });

  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const email = String(req.body.email || "").trim().toLowerCase();
      const code = String(req.body.code || "").trim();
      if (!email || !/^\d{6}$/.test(code)) {
        return res.status(400).json({ message: "Enter the six-digit verification code" });
      }
      const verified = await storage.verifyEmailCode(email, code);
      if (!verified) return res.status(400).json({ message: "Invalid or expired verification code" });
      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(404).json({ message: "User not found" });
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });
      const { password, ...userWithoutPassword } = user;
      res.status(200).json({ message: "Email verified", user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Email verification failed" });
    }
  });

  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const email = String(req.body.email || "").trim().toLowerCase();
      const user = await storage.getUserByEmail(email);
      if (!user || user.emailVerified === "true") {
        return res.status(400).json({ message: "Verification is not required for this account" });
      }
      const code = await storage.createVerificationCode(email);
      await sendVerificationCode(email, code);
      res.json({ message: "Verification code sent" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Could not resend verification code" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const email = String(req.body.email || "").trim().toLowerCase();
      if (!email) return res.status(400).json({ message: "Email address is required" });
      const user = await storage.getUserByEmail(email);
      if (user) {
        const code = await storage.createPasswordResetCode(email);
        await sendPasswordResetCode(email, code);
      }
      res.json({ message: "If an account exists, a password reset code has been sent" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Could not start password reset" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const email = String(req.body.email || "").trim().toLowerCase();
      const code = String(req.body.code || "").trim();
      const password = String(req.body.password || "");
      if (!email || !/^\d{6}$/.test(code) || password.length < 8) {
        return res.status(400).json({ message: "Enter a valid code and a password of at least 8 characters" });
      }
      const reset = await storage.resetPassword(email, code, password);
      if (!reset) return res.status(400).json({ message: "Invalid or expired password reset code" });
      res.json({ message: "Password reset successful" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Could not reset password" });
    }
  });

  app.get("/api/admin/overview", authenticateToken, requireAdmin, async (_req, res) => {
    try {
      const [users, trades, bots, deposits, withdrawals, market] = await Promise.all([
        storage.getUsers(),
        storage.getAllTrades(),
        storage.getAllBots(),
        storage.getAllDeposits(),
        storage.getAllWithdrawals(),
        getMarketUniverse(),
      ]);
      const safeUsers = users.map(({ password, ...user }) => user);
      const userMap = new Map(users.map((user) => [user.id, user]));
      res.json({
        users: await Promise.all(safeUsers.map(async (user) => ({
          ...user,
          lastLogin: (await storage.getSettings(user.id)).lastLogin,
        }))),
        trades: trades.map((trade) => ({
          ...trade,
          userEmail: userMap.get(trade.userId)?.email || "Unknown",
        })),
        bots: bots.map((bot) => ({
          ...bot,
          userEmail: userMap.get(bot.userId)?.email || "Unknown",
        })),
        deposits: deposits.map((deposit) => ({
          ...deposit,
          userEmail: userMap.get(deposit.userId)?.email || "Unknown",
        })),
        withdrawals: withdrawals.map((withdrawal) => ({
          ...withdrawal,
          userEmail: userMap.get(withdrawal.userId)?.email || "Unknown",
        })),
        market: market.filter((quote) => quote.type === "crypto"),
        stats: {
          users: users.length,
          trades: trades.length,
          bots: bots.filter((bot) => bot.status === "active").length,
          deposits: deposits.length,
          withdrawals: withdrawals.length,
          activeUsers: new Set(trades.map((trade) => trade.userId)).size,
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to load administrator overview" });
    }
  });

  app.delete("/api/admin/users/:userId", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userId = String(req.params.userId);
      const target = await storage.getUser(userId);
      if (!target) return res.status(404).json({ message: "User not found" });
      if (target.role === "admin" || target.email.toLowerCase() === ADMIN_EMAIL) {
        return res.status(400).json({ message: "Administrator accounts cannot be deleted" });
      }
      const deleted = await storage.deleteUser(userId);
      if (!deleted) return res.status(404).json({ message: "User not found" });
      res.json({ message: "User and associated account data deleted" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to delete user" });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    try {
      const validatedData = signinSchema.parse(req.body);

      if (
        ADMIN_EMAIL &&
        ADMIN_PASSWORD &&
        validatedData.email.toLowerCase() === ADMIN_EMAIL &&
        validatedData.password === ADMIN_PASSWORD
      ) {
        const adminUser = await storage.getUserByEmail(ADMIN_EMAIL);
        const token = jwt.sign(
          {
            userId: adminUser?.id || `admin:${ADMIN_EMAIL}`,
            email: ADMIN_EMAIL,
            admin: true,
          },
          JWT_SECRET,
          { expiresIn: "24h" },
        );
        return res.json({
          message: "Sign in successful",
          user: adminUser
            ? (({ password, ...userWithoutPassword }) => userWithoutPassword)(adminUser)
            : {
                id: `admin:${ADMIN_EMAIL}`,
                email: ADMIN_EMAIL,
                fullName: "Administrator",
                role: "admin",
              },
          token,
        });
      }

      const user = await storage.validateUser(validatedData.email, validatedData.password);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      await storage.touchLogin(user.id);
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "24h" },
      );
      const { password, ...userWithoutPassword } = user;
      res.json({
        message: "Sign in successful",
        user: userWithoutPassword,
        token,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(400).json({ message: error.message || "Failed to sign in" });
    }
  });

  app.get("/api/user/dashboard", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(401).json({ message: "Account not found. Please sign in again." });
      }

      const [wallet, holdings, trades, indices, watchlist] = await Promise.all([
        storage.getWallet(user.id),
        storage.getHoldings(user.id),
        storage.getTrades(user.id),
        getIndices(),
        getWatchlistQuotes(),
      ]);

      const holdingSymbols = holdings.map((h) => h.symbol);
      const holdingQuotes =
        holdingSymbols.length > 0 ? await getQuotes(holdingSymbols) : [];
      const quoteMap = new Map(holdingQuotes.map((q) => [q.symbol.toUpperCase(), q]));

      let holdingsValue = 0;
      let dailyPnL = 0;
      for (const h of holdings) {
        const q = quoteMap.get(h.symbol.toUpperCase());
        const price = q?.price || 0;
        holdingsValue += price * h.quantity;
        dailyPnL += (q?.change || 0) * h.quantity;
      }

      const btcQuote = watchlist.find((q) => q.symbol === "BTC");
      const btcUsd = (btcQuote?.price || 0) * wallet.btc;
      const totalValue = holdingsValue + wallet.usd + btcUsd;
      const dailyPnLPercent = totalValue > 0 ? (dailyPnL / totalValue) * 100 : 0;

      res.json({
        user: { id: user.id, email: user.email, fullName: user.fullName },
        portfolio: {
          totalValue: Number(totalValue.toFixed(2)),
          dailyPnL: Number(dailyPnL.toFixed(2)),
          dailyPnLPercent: Number(dailyPnLPercent.toFixed(2)),
          openPositions: holdings.length,
          buyingPower: Number(wallet.usd.toFixed(2)),
        },
        recentTrades: trades.slice(0, 8).map((t) => ({
          id: t.id,
          symbol: t.symbol,
          action: t.action,
          price: t.price,
          pnl: t.pnl,
          timestamp: t.timestamp,
        })),
        watchlist: (
          await (async () => {
            const symbols = await storage.getWatchlist(user.id);
            const quotes = await getQuotes(symbols);
            return quotes.map((q) => ({
              symbol: q.symbol,
              name: q.name,
              price: Number(q.price.toFixed(2)),
              change: Number(q.changePercent.toFixed(2)),
            }));
          })()
        ),
        marketOverview: {
          sp500: indices.sp500,
          nasdaq: indices.nasdaq,
          dow: indices.dow,
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch dashboard data" });
    }
  });

  app.get("/api/user/profile", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const [trades, settings] = await Promise.all([
        storage.getTrades(user.id),
        storage.getSettings(user.id),
      ]);
      const wins = trades.filter((t) => t.pnl > 0).length;
      const memberSince = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })
        : "—";
      res.json({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        accountType: "Standard",
        memberSince,
        totalTrades: trades.length,
        successRate: trades.length ? Number(((wins / trades.length) * 100).toFixed(1)) : 0,
        verificationStatus: "Unverified",
        twoFactorEnabled: settings.twoFactorEnabled,
        lastLogin: settings.lastLogin
          ? new Date(settings.lastLogin).toLocaleString()
          : "Today",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch profile data" });
    }
  });

  app.patch("/api/user/profile", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.updateProfile(req.user.userId, {
        fullName: req.body.fullName,
        email: req.body.email,
      });
      const { password, ...safe } = user;
      res.json({ message: "Profile updated", user: safe });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update profile" });
    }
  });

  app.post("/api/user/password", authenticateToken, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword || String(newPassword).length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }
      await storage.changePassword(req.user.userId, currentPassword, newPassword);
      res.json({ message: "Password updated" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to change password" });
    }
  });

  app.post("/api/user/two-factor", authenticateToken, async (req: any, res) => {
    try {
      const settings = await storage.setTwoFactor(req.user.userId, Boolean(req.body.enabled));
      res.json({ message: settings.twoFactorEnabled ? "2FA enabled" : "2FA disabled", ...settings });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update 2FA" });
    }
  });

  app.get("/api/user/export", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password, ...safeUser } = user;
      const payload = {
        user: safeUser,
        wallet: await storage.getWallet(userId),
        holdings: await storage.getHoldings(userId),
        trades: await storage.getTrades(userId),
        bots: await storage.getBots(userId),
        deposits: await storage.getDeposits(userId),
        withdrawals: await storage.getWithdrawals(userId),
        exportedAt: new Date().toISOString(),
      };
      res.json(payload);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to export data" });
    }
  });

  app.post("/api/watchlist/:symbol", authenticateToken, async (req: any, res) => {
    try {
      const list = await storage.toggleWatchlist(req.user.userId, String(req.params.symbol).toUpperCase());
      res.json({ watchlist: list });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update watchlist" });
    }
  });

  app.get("/api/bots", authenticateToken, async (req: any, res) => {
    try {
      res.json(await storage.getBots(req.user.userId));
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch bots" });
    }
  });

  app.post("/api/bots", authenticateToken, async (req: any, res) => {
    try {
      const { name, strategy, capital, maxRisk, profitTarget, stopLoss } = req.body;
      if (!name || !strategy) {
        return res.status(400).json({ message: "Bot name and strategy are required" });
      }
      const bot = await storage.createBot({
        userId: req.user.userId,
        name,
        strategy: STRATEGY_LABELS[strategy] || strategy,
        capital: Number(capital) || 10000,
        maxRisk: Number(maxRisk) || 2,
        profitTarget: Number(profitTarget) || 10,
        stopLoss: Number(stopLoss) || 5,
        status: "stopped",
      });
      res.status(201).json({ message: "Bot created successfully", bot });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create bot" });
    }
  });

  app.post("/api/bots/:id/start", authenticateToken, async (req: any, res) => {
    const bot = await storage.setBotStatus(req.user.userId, req.params.id, "active");
    if (!bot) return res.status(404).json({ message: "Bot not found" });
    res.json({ message: "Bot started successfully", botId: bot.id, bot });
  });

  app.post("/api/bots/:id/pause", authenticateToken, async (req: any, res) => {
    const bot = await storage.setBotStatus(req.user.userId, req.params.id, "paused");
    if (!bot) return res.status(404).json({ message: "Bot not found" });
    res.json({ message: "Bot paused successfully", botId: bot.id, bot });
  });

  app.get("/api/signals", authenticateToken, async (req: any, res) => {
    try {
      const [signals, executed] = await Promise.all([
        generateSignals(),
        storage.getExecutedSignals(req.user.userId),
      ]);
      const execMap = new Map(executed.map((e) => [e.signalId, e.pnl]));
      res.json(
        signals.map((s) =>
          execMap.has(s.id)
            ? { ...s, status: "executed", pnl: execMap.get(s.id) }
            : s,
        ),
      );
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch signals" });
    }
  });

  app.post("/api/signals/:id/execute", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const signals = await generateSignals();
      const signal = signals.find((s) => s.id === req.params.id);
      if (!signal) return res.status(404).json({ message: "Signal not found" });

      const qty = signal.symbol === "BTC" || signal.symbol === "ETH" ? 0.01 : 1;
      const wallet = await storage.getWallet(userId);
      const cost = signal.price * qty;
      if (signal.action === "BUY" && wallet.usd < cost) {
        return res.status(400).json({ message: "Insufficient USD buying power" });
      }

      const pnl = Number((((signal.targetPrice - signal.price) / signal.price) * cost * 0.2).toFixed(2));
      if (signal.action === "BUY") {
        await storage.updateWallet(userId, { usd: wallet.usd - cost });
        await storage.upsertHolding(userId, {
          symbol: signal.symbol,
          name: signal.symbol,
          type: ["BTC", "ETH", "SOL", "ADA"].includes(signal.symbol) ? "crypto" : "stock",
          quantity: qty,
        });
      }
      await storage.addTrade({
        userId,
        symbol: signal.symbol,
        action: `${signal.action} ${qty} ${signal.symbol}`,
        price: signal.price,
        quantity: qty,
        pnl,
        timestamp: new Date().toISOString(),
      });
      await storage.executeSignal(userId, signal.id, pnl);
      res.json({ message: "Signal executed successfully", signalId: signal.id });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to execute signal" });
    }
  });

  app.get("/api/copy-experts", authenticateToken, async (req: any, res) => {
    try {
      const [btc, spy, gld, nvda] = await getQuotes(["BTC", "SPY", "GLD", "NVDA"]);
      const experts = [
        {
          id: "btc-momentum",
          name: "BTC Momentum",
          username: "btc-momentum",
          rating: 4.6,
          followers: 0,
          strategies: ["Crypto", "Momentum"],
          description: "Tracks live Bitcoin 24h performance from CoinGecko.",
          copyFee: 10,
          minCopyAmount: 100,
          performance: {
            totalReturn: Number((btc?.changePercent || 0).toFixed(2)),
            monthlyReturn: Number((btc?.changePercent || 0).toFixed(2)),
            winRate: 0,
            totalTrades: 0,
            riskScore: 4.1,
          },
        },
        {
          id: "spy-index",
          name: "S&P 500 Tracker",
          username: "spy-index",
          rating: 4.4,
          followers: 0,
          strategies: ["Index", "Passive"],
          description: "Mirrors live SPY quotes from Yahoo Finance.",
          copyFee: 5,
          minCopyAmount: 250,
          performance: {
            totalReturn: Number((spy?.changePercent || 0).toFixed(2)),
            monthlyReturn: Number((spy?.changePercent || 0).toFixed(2)),
            winRate: 0,
            totalTrades: 0,
            riskScore: 2.1,
          },
        },
        {
          id: "gold-hedge",
          name: "Gold Hedge",
          username: "gold-hedge",
          rating: 4.2,
          followers: 0,
          strategies: ["Commodities", "Hedge"],
          description: "Follows live GLD (gold ETF) market data.",
          copyFee: 8,
          minCopyAmount: 200,
          performance: {
            totalReturn: Number((gld?.changePercent || 0).toFixed(2)),
            monthlyReturn: Number((gld?.changePercent || 0).toFixed(2)),
            winRate: 0,
            totalTrades: 0,
            riskScore: 2.5,
          },
        },
        {
          id: "nvda-growth",
          name: "Tech Growth",
          username: "nvda-growth",
          rating: 4.5,
          followers: 0,
          strategies: ["Equities", "Growth"],
          description: "Follows live NVIDIA quotes from Yahoo Finance.",
          copyFee: 12,
          minCopyAmount: 500,
          performance: {
            totalReturn: Number((nvda?.changePercent || 0).toFixed(2)),
            monthlyReturn: Number((nvda?.changePercent || 0).toFixed(2)),
            winRate: 0,
            totalTrades: 0,
            riskScore: 3.8,
          },
        },
      ];

      const withFollow = await Promise.all(
        experts.map(async (e) => ({
          ...e,
          following: await storage.isFollowing(req.user.userId, e.id),
        })),
      );
      res.json(withFollow);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch experts" });
    }
  });

  app.post("/api/copy-experts/:id/follow", authenticateToken, async (req: any, res) => {
    const following = await storage.toggleFollow(req.user.userId, req.params.id);
    res.json({ message: following ? "Expert followed" : "Unfollowed", expertId: req.params.id, following });
  });

  app.post("/api/copy-experts/:id/copy", authenticateToken, async (req: any, res) => {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Copy amount is required" });
    }
    const wallet = await storage.getWallet(req.user.userId);
    if (wallet.usd < amount) {
      return res.status(400).json({ message: "Insufficient USD balance" });
    }
    await storage.updateWallet(req.user.userId, { usd: wallet.usd - amount });
    await storage.addCopy(req.user.userId, req.params.id, amount);
    res.json({ message: "Copy trading started successfully", expertId: req.params.id, amount });
  });

  app.get("/api/wallet/bitcoin", authenticateToken, async (req: any, res) => {
    try {
      const [wallet, deposits, btc] = await Promise.all([
        storage.getWallet(req.user.userId),
        storage.getDeposits(req.user.userId),
        getBitcoinQuote(),
      ]);
      const pending = deposits
        .filter((d) => d.status === "pending")
        .reduce((s, d) => s + d.amount, 0);
      const confirmed = deposits.filter((d) => d.status === "confirmed");
      res.json({
        address: wallet.address,
        balance: wallet.btc,
        pendingDeposits: pending,
        totalDeposited: confirmed.reduce((s, d) => s + d.amount, 0),
        successfulDeposits: confirmed.length,
        averageProcessingTime: 45,
        networkFee: 0.00001,
        minDeposit: 0.0001,
        maxDeposit: 10.0,
        exchangeRate: btc.price,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch wallet data" });
    }
  });

  app.get("/api/wallet/bitcoin/deposits", authenticateToken, async (req: any, res) => {
    try {
      const [deposits, btc] = await Promise.all([
        storage.getDeposits(req.user.userId),
        getBitcoinQuote(),
      ]);
      res.json(
        deposits.map((d) => ({
          ...d,
          usdValue: Number((d.amount * btc.price).toFixed(2)),
        })),
      );
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch deposit history" });
    }
  });

  app.post("/api/wallet/bitcoin/deposits", authenticateToken, async (req: any, res) => {
    try {
      const amount = Number(req.body.amount);
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Enter a valid BTC amount" });
      }
      const wallet = await storage.getWallet(req.user.userId);
      const deposit = await storage.addDeposit({
        userId: req.user.userId,
        amount,
        address: wallet.address,
        status: "confirmed",
        confirmations: 3,
        requiredConfirmations: 3,
        network: "Bitcoin",
        createdAt: new Date().toISOString(),
        txHash: `paper-${Date.now()}`,
      });
      await storage.updateWallet(req.user.userId, { btc: wallet.btc + amount });
      res.status(201).json({ message: "Deposit recorded", deposit });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to record deposit" });
    }
  });

  app.get("/api/wallet/balance", authenticateToken, async (req: any, res) => {
    try {
      const wallet = await storage.getWallet(req.user.userId);
      res.json({ btc: wallet.btc, usd: wallet.usd });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch balance" });
    }
  });

  app.get("/api/wallet/withdrawals", authenticateToken, async (req: any, res) => {
    try {
      res.json(await storage.getWithdrawals(req.user.userId));
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch withdrawal history" });
    }
  });

  app.post("/api/wallet/withdraw", authenticateToken, async (req: any, res) => {
    try {
      const { amount, currency, address } = req.body;
      if (!amount || amount <= 0 || isNaN(amount)) {
        return res.status(400).json({ message: "Please enter a valid amount greater than 0" });
      }
      if (!address || !String(address).trim()) {
        return res.status(400).json({ message: "Withdrawal address is required" });
      }
      if (!currency || !["btc", "usd"].includes(String(currency).toLowerCase())) {
        return res.status(400).json({ message: "Invalid currency selected" });
      }

      const wallet = await storage.getWallet(req.user.userId);
      const cur = String(currency).toLowerCase();
      const availableBalance = cur === "btc" ? wallet.btc : wallet.usd;
      const minimumWithdraw = cur === "btc" ? 0.001 : 10;
      const fee = cur === "btc" ? 0.0005 : 5;

      if (amount < minimumWithdraw) {
        return res.status(400).json({
          message: `Minimum withdrawal amount is ${cur === "btc" ? "0.001 BTC" : "$10"}`,
        });
      }
      if (amount > availableBalance) {
        return res.status(400).json({
          message: `Insufficient balance. Available: ${availableBalance} ${cur.toUpperCase()}`,
        });
      }
      if (amount <= fee) {
        return res.status(400).json({
          message: `Amount must be greater than network fee of ${cur === "btc" ? "0.0005 BTC" : "$5"}`,
        });
      }
      if (cur === "btc" && !String(address).match(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/)) {
        return res.status(400).json({ message: "Invalid Bitcoin address format" });
      }

      if (cur === "btc") {
        await storage.updateWallet(req.user.userId, { btc: wallet.btc - amount });
      } else {
        await storage.updateWallet(req.user.userId, { usd: wallet.usd - amount });
      }

      const withdrawal = await storage.addWithdrawal({
        userId: req.user.userId,
        amount: parseFloat(Number(amount).toFixed(cur === "btc" ? 8 : 2)),
        currency: cur,
        address: String(address).trim(),
        fee,
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      res.status(201).json({
        message: "Withdrawal request submitted successfully",
        withdrawal: { ...withdrawal, netAmount: amount - fee },
        estimatedArrival: cur === "btc" ? "30-60 minutes" : "1-3 business days",
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to process withdrawal" });
    }
  });

  app.get("/api/market/analysis", authenticateToken, async (_req, res) => {
    try {
      const data = await getAnalysis(["AAPL", "TSLA", "GOOGL", "MSFT", "NVDA", "BTC"]);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch market analysis" });
    }
  });

  app.get("/api/market/indices", authenticateToken, async (_req, res) => {
    try {
      res.json(await getIndices());
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch market indices" });
    }
  });

  app.get("/api/market/chart/:symbol", authenticateToken, async (req, res) => {
    try {
      const range = String(req.query.range || "1mo");
      res.json(await getChart(req.params.symbol, range));
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch chart" });
    }
  });

  app.get("/api/market/bitcoin", async (_req, res) => {
    try {
      res.json(await getBitcoinQuote());
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch Bitcoin price" });
    }
  });

  app.get("/api/assets", authenticateToken, async (req: any, res) => {
    try {
      const [holdings, universe] = await Promise.all([
        storage.getHoldings(req.user.userId),
        getMarketUniverse(),
      ]);
      const quoteMap = new Map(universe.map((q) => [q.symbol.toUpperCase(), q]));
      const missing = holdings
        .map((h) => h.symbol)
        .filter((s) => !quoteMap.has(s.toUpperCase()));
      if (missing.length) {
        const extra = await getQuotes(missing);
        extra.forEach((q) => quoteMap.set(q.symbol.toUpperCase(), q));
      }

      const portfolio = holdings.map((h) => {
        const q = quoteMap.get(h.symbol.toUpperCase());
        const price = q?.price || 0;
        return {
          id: h.symbol,
          symbol: h.symbol,
          name: q?.name || h.name,
          type: (q?.type || h.type) as string,
          price,
          change: q?.change || 0,
          changePercent: Number((q?.changePercent || 0).toFixed(2)),
          marketCap: formatMarketCap(q?.marketCap || 0),
          volume: formatVolume(q?.volume || 0),
          holdings: h.quantity,
          value: Number((price * h.quantity).toFixed(2)),
        };
      });

      const market = universe.map((q) => ({
        id: q.symbol,
        symbol: q.symbol,
        name: q.name,
        type: q.type,
        price: q.price,
        change: q.change,
        changePercent: Number(q.changePercent.toFixed(2)),
        marketCap: formatMarketCap(q.marketCap),
        volume: formatVolume(q.volume),
      }));

      res.json({ portfolio, market });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch assets" });
    }
  });

  app.post("/api/assets/buy", authenticateToken, async (req: any, res) => {
    try {
      const symbol = String(req.body.symbol || "").toUpperCase();
      const quantity = Number(req.body.quantity);
      if (!symbol || !quantity || quantity <= 0) {
        return res.status(400).json({ message: "Symbol and quantity are required" });
      }
      const [quote] = await getQuotes([symbol]);
      if (!quote) return res.status(404).json({ message: "Unknown symbol" });
      const cost = quote.price * quantity;
      const wallet = await storage.getWallet(req.user.userId);
      if (wallet.usd < cost) {
        return res.status(400).json({ message: "Insufficient USD buying power" });
      }
      await storage.updateWallet(req.user.userId, { usd: wallet.usd - cost });
      await storage.upsertHolding(req.user.userId, {
        symbol: quote.symbol,
        name: quote.name,
        type: quote.type,
        quantity,
      });
      await storage.addTrade({
        userId: req.user.userId,
        symbol: quote.symbol,
        action: `Buy ${quantity} ${quote.symbol}`,
        price: quote.price,
        quantity,
        pnl: 0,
        timestamp: new Date().toISOString(),
      });
      res.status(201).json({ message: "Order filled at live market price", quote, quantity, cost });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to buy asset" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
