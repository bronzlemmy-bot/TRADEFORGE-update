import { type User, type InsertUser } from "@shared/schema";
import "./config";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import {
  MongoClient,
  MongoNetworkError,
  MongoServerSelectionError,
  type Collection,
} from "mongodb";
import { createHash, randomInt } from "crypto";

export type Holding = {
  symbol: string;
  name: string;
  type: string;
  quantity: number;
};

export type Trade = {
  id: string;
  userId: string;
  symbol: string;
  action: string;
  price: number;
  quantity: number;
  pnl: number;
  timestamp: string;
};

export type Bot = {
  id: string;
  userId: string;
  name: string;
  status: "active" | "paused" | "stopped";
  strategy: string;
  capital: number;
  maxRisk: number;
  profitTarget: number;
  stopLoss: number;
  createdAt: string;
  performance: {
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    monthlyReturn: number;
  };
};

export type Wallet = {
  userId: string;
  btc: number;
  usd: number;
  address: string;
};

export type Deposit = {
  id: string;
  userId: string;
  amount: number;
  address: string;
  txHash?: string;
  status: "pending" | "confirmed" | "failed";
  confirmations: number;
  requiredConfirmations: number;
  network: string;
  createdAt: string;
};

export type Withdrawal = {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  address: string;
  fee: number;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  txHash?: string;
};

export type UserSettings = {
  twoFactorEnabled: boolean;
  lastLogin: string;
};

type StoreShape = {
  users: User[];
  wallets: Wallet[];
  holdings: Record<string, Holding[]>;
  trades: Trade[];
  bots: Bot[];
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  follows: { userId: string; expertId: string }[];
  copies: { userId: string; expertId: string; amount: number }[];
  executedSignals: { userId: string; signalId: string; pnl: number }[];
  settings: Record<string, UserSettings>;
  watchlists: Record<string, string[]>;
  verificationCodes: Record<string, { codeHash: string; expiresAt: string; attempts: number }>;
  passwordResetCodes: Record<string, { codeHash: string; expiresAt: string; attempts: number }>;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase();
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "tradeforge";
let mongoCollection: Collection<StoreShape> | undefined;
let mongoWriteQueue = Promise.resolve();

function emptyStore(): StoreShape {
  return {
    users: [],
    wallets: [],
    holdings: {},
    trades: [],
    bots: [],
    deposits: [],
    withdrawals: [],
    follows: [],
    copies: [],
    executedSignals: [],
    settings: {},
    watchlists: {},
    verificationCodes: {},
    passwordResetCodes: {},
  };
}

function loadStore(): StoreShape {
  try {
    if (!fs.existsSync(DATA_FILE)) return emptyStore();
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return { ...emptyStore(), ...parsed };
  } catch {
    return emptyStore();
  }
}

function persist(store: StoreShape) {
  if (MONGODB_URI && mongoCollection) {
    const snapshot = JSON.parse(JSON.stringify(store)) as StoreShape;
    mongoWriteQueue = mongoWriteQueue
      .then(() => mongoCollection!.replaceOne(
        { _id: "state" } as any,
        { ...snapshot, _id: "state" } as any,
        { upsert: true },
      ))
      .then(() => undefined);
    return;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

async function connectMongoStore(): Promise<StoreShape> {
  if (!MONGODB_URI) return loadStore();

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
    });

    try {
      await client.connect();
      const database = client.db(MONGODB_DB_NAME);
      await database.command({ ping: 1 });
      const collection = database.collection<StoreShape>("application_state");
      const existing = await collection.findOne({ _id: "state" } as any);
      let store: StoreShape;

      if (existing) {
        const { _id: ignoredId, ...stored } =
          existing as unknown as StoreShape & { _id: string };
        store = { ...emptyStore(), ...stored };
      } else {
        store = loadStore();
        await collection.insertOne({ ...store, _id: "state" } as any);
      }

      mongoCollection = collection;
      console.log(`[mongodb] Connected successfully to database "${MONGODB_DB_NAME}"`);
      return store;
    } catch (error) {
      try {
        await client.close();
      } catch (closeError) {
        console.error("[mongodb] Failed to close client after connection error:", closeError);
      }

      const isRetryable =
        error instanceof MongoNetworkError ||
        error instanceof MongoServerSelectionError;
      if (!isRetryable || attempt === maxAttempts) throw error;

      const delayMs = attempt * 1_000;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `[mongodb] Connection attempt ${attempt}/${maxAttempts} failed: ${message}. Retrying in ${delayMs / 1_000}s.`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error("MongoDB connection failed after all retry attempts");
}

function paperAddress(userId: string): string {
  const hash = createHash("sha256").update(userId).digest("hex");
  return `bc1q${hash.slice(0, 32)}`;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  deleteUser(userId: string): Promise<boolean>;
  createUser(user: InsertUser): Promise<User>;
  markEmailVerified(email: string): Promise<User | undefined>;
  validateUser(email: string, password: string): Promise<User | null>;
  createVerificationCode(email: string): Promise<string>;
  verifyEmailCode(email: string, code: string): Promise<boolean>;
  touchLogin(userId: string): Promise<void>;
  getWallet(userId: string): Promise<Wallet>;
  updateWallet(userId: string, patch: Partial<Wallet>): Promise<Wallet>;
  getHoldings(userId: string): Promise<Holding[]>;
  upsertHolding(userId: string, holding: Holding): Promise<void>;
  getTrades(userId: string): Promise<Trade[]>;
  getAllTrades(): Promise<Trade[]>;
  getAllBots(): Promise<Bot[]>;
  getAllDeposits(): Promise<Deposit[]>;
  getAllWithdrawals(): Promise<Withdrawal[]>;
  addTrade(trade: Omit<Trade, "id">): Promise<Trade>;
  getBots(userId: string): Promise<Bot[]>;
  createBot(bot: Omit<Bot, "id" | "createdAt" | "performance"> & { performance?: Bot["performance"] }): Promise<Bot>;
  setBotStatus(userId: string, botId: string, status: Bot["status"]): Promise<Bot | undefined>;
  getDeposits(userId: string): Promise<Deposit[]>;
  addDeposit(deposit: Omit<Deposit, "id">): Promise<Deposit>;
  getWithdrawals(userId: string): Promise<Withdrawal[]>;
  addWithdrawal(w: Omit<Withdrawal, "id">): Promise<Withdrawal>;
  toggleFollow(userId: string, expertId: string): Promise<boolean>;
  isFollowing(userId: string, expertId: string): Promise<boolean>;
  addCopy(userId: string, expertId: string, amount: number): Promise<void>;
  executeSignal(userId: string, signalId: string, pnl: number): Promise<void>;
  getExecutedSignals(userId: string): Promise<{ signalId: string; pnl: number }[]>;
  getSettings(userId: string): Promise<UserSettings>;
  updateProfile(userId: string, patch: { fullName?: string; email?: string }): Promise<User>;
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
  setTwoFactor(userId: string, enabled: boolean): Promise<UserSettings>;
  getWatchlist(userId: string): Promise<string[]>;
  toggleWatchlist(userId: string, symbol: string): Promise<string[]>;
}

export class FileStorage implements IStorage {
  private store: StoreShape;
  readonly ready: Promise<void>;

  constructor() {
    this.store = loadStore();
    this.ready = connectMongoStore().then((store) => {
      this.store = {
        ...emptyStore(),
        ...store,
        users: store.users.map((u) => ({
          ...u,
          emailVerified: u.emailVerified ?? "true",
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
        })),
      };
    });
  }

  private save() {
    persist(this.store);
  }

  private ensureWallet(userId: string): Wallet {
    let wallet = this.store.wallets.find((w) => w.userId === userId);
    if (!wallet) {
      wallet = { userId, btc: 0, usd: 10000, address: paperAddress(userId) };
      this.store.wallets.push(wallet);
      this.save();
    }
    return wallet;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.store.users.find((u) => u.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  async getUsers(): Promise<User[]> {
    return [...this.store.users].sort((a, b) => {
      const aDate = a.createdAt ? +new Date(a.createdAt) : 0;
      const bDate = b.createdAt ? +new Date(b.createdAt) : 0;
      return bDate - aDate;
    });
  }

  async deleteUser(userId: string): Promise<boolean> {
    const before = this.store.users.length;
    this.store.users = this.store.users.filter((user) => user.id !== userId);
    if (this.store.users.length === before) return false;
    this.store.wallets = this.store.wallets.filter((wallet) => wallet.userId !== userId);
    delete this.store.holdings[userId];
    this.store.trades = this.store.trades.filter((trade) => trade.userId !== userId);
    this.store.bots = this.store.bots.filter((bot) => bot.userId !== userId);
    this.store.deposits = this.store.deposits.filter((deposit) => deposit.userId !== userId);
    this.store.withdrawals = this.store.withdrawals.filter((withdrawal) => withdrawal.userId !== userId);
    this.store.follows = this.store.follows.filter((follow) => follow.userId !== userId);
    this.store.copies = this.store.copies.filter((copy) => copy.userId !== userId);
    this.store.executedSignals = this.store.executedSignals.filter((signal) => signal.userId !== userId);
    delete this.store.settings[userId];
    delete this.store.watchlists[userId];
    this.save();
    return true;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const existingUser = await this.getUserByEmail(insertUser.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      password: hashedPassword,
      role: ADMIN_EMAIL && insertUser.email.toLowerCase() === ADMIN_EMAIL ? "admin" : "user",
      emailVerified: "false",
      createdAt: new Date(),
    };
    this.store.users.push(user);
    this.ensureWallet(id);
    this.save();
    return user;
  }

  async markEmailVerified(email: string): Promise<User | undefined> {
    const user = await this.getUserByEmail(email);
    if (!user) return undefined;
    user.emailVerified = "true";
    this.save();
    return user;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.password);
    return isValid && user.emailVerified === "true" ? user : null;
  }

  async createVerificationCode(email: string): Promise<string> {
    const normalizedEmail = email.toLowerCase();
    const code = String(randomInt(100000, 1000000));
    this.store.verificationCodes[normalizedEmail] = {
      codeHash: createHash("sha256").update(code).digest("hex"),
      expiresAt: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
      attempts: 0,
    };
    this.save();
    return code;
  }

  async createPasswordResetCode(email: string): Promise<string> {
    const normalizedEmail = email.toLowerCase();
    const code = String(randomInt(100000, 1000000));
    this.store.passwordResetCodes[normalizedEmail] = {
      codeHash: createHash("sha256").update(code).digest("hex"),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      attempts: 0,
    };
    this.save();
    return code;
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase();
    const pending = this.store.passwordResetCodes[normalizedEmail];
    if (!pending || new Date(pending.expiresAt).getTime() <= Date.now() || pending.attempts >= 5) {
      return false;
    }
    pending.attempts += 1;
    const valid = pending.codeHash === createHash("sha256").update(code).digest("hex");
    const user = this.store.users.find((candidate) => candidate.email.toLowerCase() === normalizedEmail);
    if (!valid || !user) {
      this.save();
      return false;
    }
    user.password = await bcrypt.hash(newPassword, 10);
    delete this.store.passwordResetCodes[normalizedEmail];
    this.save();
    return true;
  }

  async verifyEmailCode(email: string, code: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase();
    const pending = this.store.verificationCodes[normalizedEmail];
    if (!pending || new Date(pending.expiresAt).getTime() <= Date.now() || pending.attempts >= 5) {
      return false;
    }
    pending.attempts += 1;
    const valid = pending.codeHash === createHash("sha256").update(code).digest("hex");
    if (!valid) {
      this.save();
      return false;
    }
    const user = this.store.users.find((candidate) => candidate.email.toLowerCase() === normalizedEmail);
    if (!user) return false;
    user.emailVerified = "true";
    delete this.store.verificationCodes[normalizedEmail];
    this.save();
    return true;
  }

  async touchLogin(userId: string): Promise<void> {
    const settings = await this.getSettings(userId);
    this.store.settings[userId] = {
      ...settings,
      lastLogin: new Date().toISOString(),
    };
    this.save();
  }

  async getSettings(userId: string): Promise<UserSettings> {
    if (!this.store.settings[userId]) {
      this.store.settings[userId] = {
        twoFactorEnabled: false,
        lastLogin: new Date().toISOString(),
      };
      this.save();
    }
    return this.store.settings[userId];
  }

  async updateProfile(userId: string, patch: { fullName?: string; email?: string }): Promise<User> {
    const user = this.store.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");
    if (patch.email && patch.email !== user.email) {
      const taken = await this.getUserByEmail(patch.email);
      if (taken) throw new Error("Email already in use");
      user.email = patch.email;
    }
    if (patch.fullName) user.fullName = patch.fullName;
    this.save();
    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = this.store.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) throw new Error("Current password is incorrect");
    user.password = await bcrypt.hash(newPassword, 10);
    this.save();
  }

  async setTwoFactor(userId: string, enabled: boolean): Promise<UserSettings> {
    const settings = await this.getSettings(userId);
    this.store.settings[userId] = { ...settings, twoFactorEnabled: enabled };
    this.save();
    return this.store.settings[userId];
  }

  async getWatchlist(userId: string): Promise<string[]> {
    return this.store.watchlists[userId] || ["AAPL", "MSFT", "BTC"];
  }

  async toggleWatchlist(userId: string, symbol: string): Promise<string[]> {
    const current = this.store.watchlists[userId] || ["AAPL", "MSFT", "BTC"];
    const idx = current.indexOf(symbol);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(symbol);
    this.store.watchlists[userId] = current;
    this.save();
    return current;
  }

  async getWallet(userId: string): Promise<Wallet> {
    return this.ensureWallet(userId);
  }

  async updateWallet(userId: string, patch: Partial<Wallet>): Promise<Wallet> {
    const wallet = this.ensureWallet(userId);
    Object.assign(wallet, patch);
    this.save();
    return wallet;
  }

  async getHoldings(userId: string): Promise<Holding[]> {
    return this.store.holdings[userId] || [];
  }

  async upsertHolding(userId: string, holding: Holding): Promise<void> {
    const list = this.store.holdings[userId] || [];
    const idx = list.findIndex((h) => h.symbol === holding.symbol);
    if (idx >= 0) {
      list[idx].quantity += holding.quantity;
      if (list[idx].quantity <= 0) list.splice(idx, 1);
    } else if (holding.quantity > 0) {
      list.push(holding);
    }
    this.store.holdings[userId] = list;
    this.save();
  }

  async getTrades(userId: string): Promise<Trade[]> {
    return this.store.trades
      .filter((t) => t.userId === userId)
      .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  }

  async getAllTrades(): Promise<Trade[]> {
    return [...this.store.trades].sort(
      (a, b) => +new Date(b.timestamp) - +new Date(a.timestamp),
    );
  }

  async getAllBots(): Promise<Bot[]> {
    return [...this.store.bots].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  async getAllDeposits(): Promise<Deposit[]> {
    return [...this.store.deposits].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  async getAllWithdrawals(): Promise<Withdrawal[]> {
    return [...this.store.withdrawals].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  async addTrade(trade: Omit<Trade, "id">): Promise<Trade> {
    const row: Trade = { ...trade, id: randomUUID() };
    this.store.trades.unshift(row);
    this.save();
    return row;
  }

  async getBots(userId: string): Promise<Bot[]> {
    return this.store.bots.filter((b) => b.userId === userId);
  }

  async createBot(
    bot: Omit<Bot, "id" | "createdAt" | "performance"> & { performance?: Bot["performance"] },
  ): Promise<Bot> {
    const created: Bot = {
      ...bot,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      performance: bot.performance || {
        totalTrades: 0,
        winRate: 0,
        totalPnL: 0,
        monthlyReturn: 0,
      },
    };
    this.store.bots.push(created);
    this.save();
    return created;
  }

  async setBotStatus(userId: string, botId: string, status: Bot["status"]): Promise<Bot | undefined> {
    const bot = this.store.bots.find((b) => b.id === botId && b.userId === userId);
    if (!bot) return undefined;
    bot.status = status;
    this.save();
    return bot;
  }

  async getDeposits(userId: string): Promise<Deposit[]> {
    return this.store.deposits
      .filter((d) => d.userId === userId)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  async addDeposit(deposit: Omit<Deposit, "id">): Promise<Deposit> {
    const row: Deposit = { ...deposit, id: randomUUID() };
    this.store.deposits.unshift(row);
    this.save();
    return row;
  }

  async getWithdrawals(userId: string): Promise<Withdrawal[]> {
    return this.store.withdrawals
      .filter((w) => w.userId === userId)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  async addWithdrawal(w: Omit<Withdrawal, "id">): Promise<Withdrawal> {
    const row: Withdrawal = { ...w, id: randomUUID() };
    this.store.withdrawals.unshift(row);
    this.save();
    return row;
  }

  async toggleFollow(userId: string, expertId: string): Promise<boolean> {
    const idx = this.store.follows.findIndex((f) => f.userId === userId && f.expertId === expertId);
    if (idx >= 0) {
      this.store.follows.splice(idx, 1);
      this.save();
      return false;
    }
    this.store.follows.push({ userId, expertId });
    this.save();
    return true;
  }

  async isFollowing(userId: string, expertId: string): Promise<boolean> {
    return this.store.follows.some((f) => f.userId === userId && f.expertId === expertId);
  }

  async addCopy(userId: string, expertId: string, amount: number): Promise<void> {
    this.store.copies.push({ userId, expertId, amount });
    this.save();
  }

  async executeSignal(userId: string, signalId: string, pnl: number): Promise<void> {
    this.store.executedSignals.push({ userId, signalId, pnl });
    this.save();
  }

  async getExecutedSignals(userId: string): Promise<{ signalId: string; pnl: number }[]> {
    return this.store.executedSignals.filter((s) => s.userId === userId);
  }
}

const fileStorage = new FileStorage();
export const storage = new Proxy(fileStorage, {
  get(target, property, receiver) {
    const value = Reflect.get(target, property, receiver);
    if (typeof value !== "function" || property === "constructor") return value;
    return async (...args: unknown[]) => {
      await target.ready;
      return value.apply(target, args);
    };
  },
}) as FileStorage;
