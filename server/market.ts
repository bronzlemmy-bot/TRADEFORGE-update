type Quote = {
  symbol: string;
  name: string;
  marketId?: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  type: "stock" | "crypto" | "bond" | "commodity" | "fund";
};

type ChartPoint = { time: string; value: number };

type NewsItem = {
  title: string;
  summary: string;
  impact: "positive" | "negative" | "neutral";
  timestamp: string;
};

const YAHOO_QUOTE =
  "https://query1.finance.yahoo.com/v7/finance/quote?symbols=";
const YAHOO_CHART = "https://query1.finance.yahoo.com/v8/finance/chart/";
const YAHOO_SEARCH = "https://query1.finance.yahoo.com/v1/finance/search?q=";
const COINGECKO =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h";
const COINGECKO_CHART = "https://api.coingecko.com/api/v3/coins/";

const STOCK_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META"];
const ETF_SYMBOLS = ["GLD", "TLT", "USO", "SPY"];
const INDEX_SYMBOLS = ["^GSPC", "^IXIC", "^DJI", "^VIX"];

const CRYPTO_META: Record<
  string,
  { symbol: string; type: Quote["type"] }
> = {
  bitcoin: { symbol: "BTC", type: "crypto" },
  ethereum: { symbol: "ETH", type: "crypto" },
  solana: { symbol: "SOL", type: "crypto" },
  cardano: { symbol: "ADA", type: "crypto" },
};

const ETF_TYPES: Record<string, Quote["type"]> = {
  GLD: "commodity",
  TLT: "bond",
  USO: "commodity",
  SPY: "fund",
};

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "application/json",
};

type CacheEntry<T> = { data: T; expires: number };
const cache = new Map<string, CacheEntry<unknown>>();

async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) {
    return hit.data as T;
  }
  const data = await fn();
  cache.set(key, { data, expires: Date.now() + ttlMs });
  return data;
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    throw new Error(`Market API ${res.status} for ${url}`);
  }
  return res.json();
}

function mapYahooQuote(q: any): Quote | null {
  const price = Number(q.regularMarketPrice);
  if (!Number.isFinite(price)) return null;
  const symbol = String(q.symbol || "").replace(/^\^/, "");
  const type = ETF_TYPES[q.symbol] || "stock";
  return {
    symbol: q.symbol,
    name: q.shortName || q.longName || symbol,
    price,
    change: Number(q.regularMarketChange || 0),
    changePercent: Number(q.regularMarketChangePercent || 0),
    volume: Number(q.regularMarketVolume || 0),
    marketCap: Number(q.marketCap || 0),
    type,
  };
}

async function fetchYahooChartQuote(symbol: string): Promise<Quote> {
  const json = await fetchJson(
    `${YAHOO_CHART}${encodeURIComponent(symbol)}?interval=1d&range=5d`,
  );
  const meta = json?.chart?.result?.[0]?.meta;
  const price = Number(meta?.regularMarketPrice);
  const previousClose = Number(meta?.chartPreviousClose || meta?.previousClose || price);
  if (!Number.isFinite(price)) {
    throw new Error(`No market price returned for ${symbol}`);
  }
  const change = price - previousClose;
  const symbolName = String(meta?.symbol || symbol);
  return {
    symbol: symbolName,
    name: meta?.longName || meta?.shortName || symbolName.replace(/^\^/, ""),
    price,
    change,
    changePercent: previousClose ? (change / previousClose) * 100 : 0,
    volume: Number(meta?.regularMarketVolume || 0),
    marketCap: 0,
    type: ETF_TYPES[symbol] || "stock",
  };
}

async function fetchYahooQuotes(symbols: string[]): Promise<Quote[]> {
  return cached(`yahoo:${symbols.join(",")}`, 30_000, async () => {
    const results = await Promise.allSettled(symbols.map(fetchYahooChartQuote));
    return results
      .filter((result): result is PromiseFulfilledResult<Quote> => result.status === "fulfilled")
      .map((result) => result.value);
  });
}

async function fetchCryptoQuotes(): Promise<Quote[]> {
  return cached("coingecko:markets", 30_000, async () => {
    const rows = await fetchJson(COINGECKO);
    return (rows || []).map((c: any) => {
      const meta = CRYPTO_META[c.id] || { symbol: String(c.symbol || "").toUpperCase(), type: "crypto" as const };
      return {
        symbol: meta.symbol,
        name: c.name,
        marketId: String(c.id),
        price: Number(c.current_price || 0),
        change: Number(c.price_change_24h || 0),
        changePercent: Number(c.price_change_percentage_24h || 0),
        volume: Number(c.total_volume || 0),
        marketCap: Number(c.market_cap || 0),
        type: meta.type,
      } satisfies Quote;
    });
  });
}

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  const upper = symbols.map((s) => s.toUpperCase());
  const crypto = await fetchCryptoQuotes();
  const cryptoSymbols = new Set(crypto.map((quote) => quote.symbol.toUpperCase()));
  const yahooWanted = upper.filter((s) => !cryptoSymbols.has(s));
  const [yahoo] = await Promise.all([
    yahooWanted.length ? fetchYahooQuotes(yahooWanted) : Promise.resolve([]),
  ]);

  const cryptoFiltered = crypto.filter((c) => upper.includes(c.symbol.toUpperCase()));
  const bySymbol = new Map<string, Quote>();
  for (const q of [...yahoo, ...cryptoFiltered]) {
    bySymbol.set(q.symbol.toUpperCase(), q);
  }
  return upper.map((s) => bySymbol.get(s)).filter(Boolean) as Quote[];
}

export async function getWatchlistQuotes(): Promise<Quote[]> {
  const [stocks, crypto] = await Promise.all([
    fetchYahooQuotes(STOCK_SYMBOLS),
    fetchCryptoQuotes(),
  ]);
  return [...stocks, ...crypto];
}

export async function getMarketUniverse(): Promise<Quote[]> {
  const [stocks, etfs, crypto] = await Promise.all([
    fetchYahooQuotes([...STOCK_SYMBOLS, ...ETF_SYMBOLS]),
    fetchYahooQuotes(ETF_SYMBOLS).catch(() => []),
    fetchCryptoQuotes(),
  ]);
  const map = new Map<string, Quote>();
  for (const q of [...stocks, ...etfs, ...crypto]) {
    map.set(q.symbol.toUpperCase(), q);
  }
  return Array.from(map.values());
}

export async function getIndices() {
  const quotes = await fetchYahooQuotes(INDEX_SYMBOLS);
  const find = (sym: string) => quotes.find((q) => q.symbol === sym);
  const sp = find("^GSPC");
  const nasdaq = find("^IXIC");
  const dow = find("^DJI");
  const vix = find("^VIX");
  return {
    sp500: { value: sp?.price || 0, change: Number((sp?.changePercent || 0).toFixed(2)) },
    nasdaq: { value: nasdaq?.price || 0, change: Number((nasdaq?.changePercent || 0).toFixed(2)) },
    dow: { value: dow?.price || 0, change: Number((dow?.changePercent || 0).toFixed(2)) },
    vix: { value: vix?.price || 0, change: Number((vix?.changePercent || 0).toFixed(2)) },
  };
}

export async function getBitcoinQuote(): Promise<Quote> {
  const crypto = await fetchCryptoQuotes();
  const btc = crypto.find((c) => c.symbol === "BTC");
  if (!btc) throw new Error("Bitcoin price unavailable");
  return btc;
}

export async function getChart(symbol: string, range = "1mo"): Promise<ChartPoint[]> {
  const normalizedSymbol = symbol.toUpperCase().replace(/-USD$/, "");
  const cryptoQuote = (await fetchCryptoQuotes()).find(
    (quote) => quote.symbol.toUpperCase() === normalizedSymbol,
  );

  if (cryptoQuote?.marketId) {
    const days = range === "1d" ? "1" : range === "1w" ? "7" : range === "1y" ? "365" : "30";
    return cached(`crypto-chart:${cryptoQuote.marketId}:${days}`, 60_000, async () => {
      const json = await fetchJson(
        `${COINGECKO_CHART}${encodeURIComponent(cryptoQuote.marketId!)}/market_chart?vs_currency=usd&days=${days}`,
      );
      return (json?.prices || []).map(([timestamp, value]: [number, number]) => ({
        time: range === "1d"
          ? new Date(timestamp).toLocaleTimeString()
          : new Date(timestamp).toLocaleDateString(),
        value: Number(Number(value).toFixed(2)),
      }));
    });
  }

  const yahooSymbol =
    normalizedSymbol === "BTC"
      ? "BTC-USD"
      : normalizedSymbol === "ETH"
        ? "ETH-USD"
        : ["BTC", "ETH", "SOL", "ADA", "DOGE", "XRP", "BNB", "AVAX", "DOT", "MATIC"].includes(normalizedSymbol)
          ? `${normalizedSymbol}-USD`
          : symbol;
  return cached(`chart:${yahooSymbol}:${range}`, 60_000, async () => {
    const interval = range === "1d" ? "5m" : range === "1w" ? "30m" : "1d";
    const json = await fetchJson(
      `${YAHOO_CHART}${encodeURIComponent(yahooSymbol)}?interval=${interval}&range=${range}`,
    );
    const result = json?.chart?.result?.[0];
    const timestamps: number[] = result?.timestamp || [];
    const closes: Array<number | null> = result?.indicators?.quote?.[0]?.close || [];
    return timestamps
      .map((t, i) => {
        const value = closes[i];
        if (value == null) return null;
        const date = new Date(t * 1000);
        return {
          time: range === "1d" ? date.toLocaleTimeString() : date.toLocaleDateString(),
          value: Number(value.toFixed(2)),
        };
      })
      .filter(Boolean) as ChartPoint[];
  });
}

export async function getNews(symbol: string): Promise<NewsItem[]> {
  return cached(`news:${symbol}`, 120_000, async () => {
    try {
      const json = await fetchJson(YAHOO_SEARCH + encodeURIComponent(symbol));
      const news = json?.news || [];
      return news.slice(0, 3).map((n: any) => {
        const title = String(n.title || "Market update");
        const summary = String(n.publisher || n.summary || title);
        const lower = `${title} ${summary}`.toLowerCase();
        let impact: NewsItem["impact"] = "neutral";
        if (/(beat|surge|rally|record|growth|gain)/.test(lower)) impact = "positive";
        if (/(miss|drop|fall|lawsuit|cut|warning)/.test(lower)) impact = "negative";
        return {
          title,
          summary,
          impact,
          timestamp: n.providerPublishTime
            ? new Date(n.providerPublishTime * 1000).toISOString()
            : new Date().toISOString(),
        };
      });
    } catch {
      return [];
    }
  });
}

function rsiFromCloses(closes: number[]): number {
  if (closes.length < 15) return 50;
  const slice = closes.slice(-15);
  let gains = 0;
  let losses = 0;
  for (let i = 1; i < slice.length; i++) {
    const diff = slice[i] - slice[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / 14;
  const avgLoss = losses / 14;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Number((100 - 100 / (1 + rs)).toFixed(1));
}

export async function getAnalysis(symbols: string[]) {
  const quotes = await getQuotes(symbols);
  const analyses = await Promise.all(
    quotes.map(async (q) => {
      const chart = await getChart(q.symbol, "1mo").catch(() => []);
      const closes = chart.map((p) => p.value);
      const rsi = rsiFromCloses(closes);
      const recent = closes.slice(-10);
      const macd =
        recent.length >= 2 && recent[recent.length - 1] > recent[0] ? "Bullish" : "Bearish";
      const high = Math.max(...closes, q.price);
      const low = Math.min(...closes, q.price);
      const recommendation = rsi < 35 ? "SELL" : rsi > 65 ? "BUY" : rsi >= 45 ? "BUY" : "HOLD";
      const sentiment =
        q.changePercent > 1 ? "Bullish" : q.changePercent < -1 ? "Bearish" : "Neutral";
      const news = await getNews(q.symbol).catch(() => []);
      return {
        symbol: q.symbol.replace("-USD", ""),
        name: q.name,
        price: q.price,
        change: q.change,
        changePercent: Number(q.changePercent.toFixed(2)),
        volume: q.volume,
        marketCap: q.marketCap,
        analysis: {
          recommendation,
          confidence: Math.min(95, Math.max(55, Math.round(Math.abs(q.changePercent) * 8 + rsi / 2))),
          supportLevel: Number((low * 0.98).toFixed(2)),
          resistanceLevel: Number((high * 1.02).toFixed(2)),
          rsi,
          macd,
          sentiment,
        },
        news,
      };
    }),
  );
  return analyses;
}

export async function generateSignals() {
  const quotes = await getWatchlistQuotes();
  const day = new Date().toISOString().slice(0, 10);
  return Promise.all(
    quotes.slice(0, 8).map(async (q) => {
      const chart = await getChart(q.symbol, "1mo").catch(() => []);
      const rsi = rsiFromCloses(chart.map((p) => p.value));
      const action = rsi < 40 ? "BUY" : rsi > 70 ? "SELL" : q.changePercent >= 0 ? "BUY" : "SELL";
      const target =
        action === "BUY" ? q.price * 1.05 : q.price * 0.95;
      const stop = action === "BUY" ? q.price * 0.97 : q.price * 1.03;
      return {
        id: `${q.symbol}-${day}`,
        symbol: q.symbol,
        action,
        price: Number(q.price.toFixed(2)),
        targetPrice: Number(target.toFixed(2)),
        stopLoss: Number(stop.toFixed(2)),
        confidence: Math.min(95, Math.max(55, Math.round(50 + Math.abs(q.changePercent) * 5))),
        timeframe: "1D",
        strategy: rsi < 40 ? "Oversold Bounce" : rsi > 70 ? "RSI Overbought" : "Momentum",
        status: "active" as const,
        createdAt: new Date().toISOString(),
      };
    }),
  );
}

export function formatMarketCap(value: number): string {
  if (!value) return "—";
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  return value.toLocaleString();
}

export function formatVolume(value: number): string {
  if (!value) return "—";
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return String(value);
}
