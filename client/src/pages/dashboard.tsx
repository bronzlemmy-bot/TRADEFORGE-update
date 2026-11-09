import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartWidget } from "@/components/chart-widget";
import { TradeDialog } from "@/components/trade-dialog";
import { authService } from "@/lib/auth";
import { apiRequest, ApiError, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel
} from "@/components/ui/sidebar";
import { 
  Wallet, 
  TrendingUp, 
  Layers, 
  DollarSign, 
  Bell, 
  Plus,
  BarChart3,
  Download,
  PiggyBank,
  CreditCard,
  User,
  Bot,
  Zap,
  Users,
  Bitcoin,
  ArrowDownToLine,
  Home
} from "lucide-react";

interface DashboardData {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  portfolio: {
    totalValue: number;
    dailyPnL: number;
    dailyPnLPercent: number;
    openPositions: number;
    buyingPower: number;
  };
  recentTrades: Array<{
    id: number;
    symbol: string;
    action: string;
    price: number;
    pnl: number;
    timestamp: string;
  }>;
  watchlist: Array<{
    symbol: string;
    name: string;
    price: number;
    change: number;
  }>;
  marketOverview: {
    sp500: { value: number; change: number };
    nasdaq: { value: number; change: number };
    dow: { value: number; change: number };
  };
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Navigation data for sidebar
const sidebarNavigation = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        icon: Home,
        url: "/dashboard",
        isActive: true,
      },
      {
        title: "Assets",
        icon: Wallet,
        url: "/dashboard/assets",
      },
    ],
  },
  {
    title: "Trading",
    items: [
      {
        title: "Buy Bitcoin",
        icon: Bitcoin,
        url: "/dashboard/buy-bitcoin",
      },
      {
        title: "Deposit Bitcoin",
        icon: ArrowDownToLine,
        url: "/dashboard/deposit-bitcoin",
      },
      {
        title: "Bot",
        icon: Bot,
        url: "/dashboard/bot",
      },
      {
        title: "Signal",
        icon: Zap,
        url: "/dashboard/signal",
      },
      {
        title: "Copy Expert",
        icon: Users,
        url: "/dashboard/copyexpert",
      },
    ],
  },
  {
    title: "Wallet",
    items: [
      {
        title: "Deposits",
        icon: PiggyBank,
        url: "/dashboard/deposit-bitcoin",
      },
      {
        title: "Withdraw",
        icon: CreditCard,
        url: "/dashboard/withdraw",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        title: "Profile",
        icon: User,
        url: "/dashboard/profile",
      },
    ],
  },
];

export default function Dashboard() {
  const [location, navigate] = useLocation();
  const [tradeOpen, setTradeOpen] = useState(false);
  const [chartRange, setChartRange] = useState("1mo");
  const { toast } = useToast();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate("/signin");
    }
  }, [navigate]);

  const exportData = async () => {
    try {
      const res = await apiRequest("GET", "/api/user/export");
      const payload = await res.json();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sog-tradepro-export.json";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export ready", description: "Your account data was downloaded." });
    } catch (error: any) {
      toast({ title: "Export failed", description: error.message, variant: "destructive" });
    }
  };

  const watchlistMutation = useMutation({
    mutationFn: async (symbol: string) => {
      const response = await apiRequest("POST", `/api/watchlist/${encodeURIComponent(symbol)}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/dashboard"] });
      toast({ title: "Watchlist updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Watchlist update failed", description: error.message, variant: "destructive" });
    },
  });

  const { data: dashboardData, isLoading, isError, error } = useQuery<DashboardData>({
    queryKey: ["/api/user/dashboard"],
    enabled: authService.isAuthenticated(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) {
      authService.removeToken();
      queryClient.clear();
      navigate("/signin");
    }
  }, [error, navigate]);

  const DashboardContent = () => {
    if (isLoading) {
      return (
        <div className="p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-20 mb-4" />
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    if (isError || !dashboardData) {
      return (
        <div className="p-6">
          <Card className="glass-card p-8 text-center">
            <CardContent>
              <p className="text-destructive">Unable to load dashboard data</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {error instanceof Error ? error.message : "Please refresh and try again."}
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    const { user, portfolio, recentTrades, watchlist, marketOverview } = dashboardData;

    return (
      <div className="p-6">
        {/* Dashboard Header */}
        <motion.div 
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8"
          {...fadeInUp}
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">Trading Dashboard</h1>
            <p className="text-muted-foreground" data-testid="user-welcome">
              Welcome back, {user.fullName}
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <Button variant="outline" className="glass-card" data-testid="button-alerts" onClick={() => navigate("/dashboard/signal")}>
              <Bell className="w-4 h-4 mr-2" />
              Alerts
            </Button>
            <Button data-testid="button-new-trade" onClick={() => setTradeOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Trade
            </Button>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={fadeInUp}>
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Portfolio Value</h3>
                  <Wallet className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl font-bold" data-testid="portfolio-value">
                  ${portfolio.totalValue.toLocaleString()}
                </div>
                <div className="flex items-center mt-2">
                  <TrendingUp className={`w-4 h-4 mr-1 ${portfolio.dailyPnL >= 0 ? "text-accent" : "text-destructive"}`} />
                  <span className={`text-sm font-medium ${portfolio.dailyPnL >= 0 ? "text-accent" : "text-destructive"}`} data-testid="portfolio-change">
                    {portfolio.dailyPnLPercent >= 0 ? "+" : ""}{portfolio.dailyPnLPercent}% (${portfolio.dailyPnL.toLocaleString()})
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Daily P&L</h3>
                  <TrendingUp className="w-4 h-4 text-accent" />
                </div>
                <div className={`text-2xl font-bold ${portfolio.dailyPnL >= 0 ? "" : "text-destructive"}`} data-testid="daily-pnl">
                  {portfolio.dailyPnL >= 0 ? "+" : ""}${portfolio.dailyPnL.toLocaleString()}
                </div>
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${portfolio.dailyPnLPercent >= 0 ? "text-accent" : "text-destructive"}`}>
                    {portfolio.dailyPnLPercent >= 0 ? "+" : ""}{portfolio.dailyPnLPercent}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Open Positions</h3>
                  <Layers className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl font-bold" data-testid="open-positions">
                  {portfolio.openPositions}
                </div>
                <div className="flex items-center mt-2">
                  <span className="text-muted-foreground text-sm">Live holdings</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Buying Power</h3>
                  <DollarSign className="w-4 h-4 text-accent" />
                </div>
                <div className="text-2xl font-bold" data-testid="buying-power">
                  ${portfolio.buyingPower.toLocaleString()}
                </div>
                <div className="flex items-center mt-2">
                  <span className="text-muted-foreground text-sm">Available for trading</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Chart */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Portfolio Performance</CardTitle>
                    <div className="flex items-center space-x-2">
                      {(["1d", "5d", "1mo", "1y"] as const).map((period) => (
                        <Button
                          key={period}
                          size="sm"
                          variant={chartRange === period ? "default" : "ghost"}
                          data-testid={`chart-period-${period}`}
                          onClick={() => setChartRange(period)}
                        >
                          {period.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ChartWidget height={320} symbol="SPY" range={chartRange} title="S&P 500 (SPY)" />
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Trades */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Recent Trades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentTrades.length === 0 && (
                      <p className="text-sm text-muted-foreground">No trades yet. Place an order to get started.</p>
                    )}
                    {recentTrades.map((trade: any, index: number) => (
                      <div 
                        key={trade.id} 
                        className="flex items-center justify-between p-4 bg-muted/20 rounded-lg"
                        data-testid={`trade-${index}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{trade.symbol}</div>
                            <div className="text-sm text-muted-foreground">{trade.action}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${trade.price}</div>
                          <div className={`text-sm ${trade.pnl > 0 ? 'text-accent' : 'text-destructive'}`}>
                            {trade.pnl > 0 ? '+' : ''}${trade.pnl}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar Widgets */}
          <div className="space-y-6">
            {/* Market Overview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Market Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">S&P 500</div>
                        <div className="text-sm text-muted-foreground">SPX</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{marketOverview.sp500.value.toLocaleString()}</div>
                        <div className={`text-sm ${marketOverview.sp500.change >= 0 ? "text-accent" : "text-destructive"}`}>
                          {marketOverview.sp500.change >= 0 ? "+" : ""}{marketOverview.sp500.change}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">NASDAQ</div>
                        <div className="text-sm text-muted-foreground">IXIC</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{marketOverview.nasdaq.value}</div>
                        <div className="text-sm text-destructive">{marketOverview.nasdaq.change}%</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">DOW</div>
                        <div className="text-sm text-muted-foreground">DJI</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{marketOverview.dow.value}</div>
                        <div className={`text-sm ${marketOverview.dow.change >= 0 ? "text-accent" : "text-destructive"}`}>
                          {marketOverview.dow.change >= 0 ? "+" : ""}{marketOverview.dow.change}%
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Watchlist */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Watchlist</CardTitle>
                    <Button
                      size="icon"
                      variant="ghost"
                      data-testid="button-add-to-watchlist"
                      aria-label="Add symbol to watchlist"
                      onClick={() => {
                        const symbol = window.prompt("Enter a symbol to add or remove (for example, ETH)");
                        if (symbol?.trim()) watchlistMutation.mutate(symbol.trim().toUpperCase());
                      }}
                      disabled={watchlistMutation.isPending}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {watchlist.map((stock: any, index: number) => (
                      <div 
                        key={stock.symbol} 
                        className="flex items-center justify-between"
                        data-testid={`watchlist-${index}`}
                      >
                        <div>
                          <div className="font-medium">{stock.symbol}</div>
                          <div className="text-sm text-muted-foreground">{stock.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${stock.price}</div>
                          <div className={`text-sm ${stock.change > 0 ? 'text-accent' : 'text-destructive'}`}>
                            {stock.change > 0 ? '+' : ''}{stock.change}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button className="w-full justify-start" data-testid="quick-action-place-order" onClick={() => setTradeOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Place Order
                    </Button>
                    <Button variant="outline" className="w-full justify-start glass-card" data-testid="quick-action-market-analysis" onClick={() => navigate("/market-analysis")}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Market Analysis
                    </Button>
                    <Button variant="outline" className="w-full justify-start glass-card" data-testid="quick-action-export-data" onClick={exportData}>
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pt-16">
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                <TrendingUp className="text-white text-sm" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                SOG TradePro
              </span>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            {sidebarNavigation.map((group) => (
              <SidebarGroup key={group.title}>
                <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          isActive={location === item.url}
                          onClick={() => navigate(item.url)}
                          data-testid={`sidebar-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
        </Sidebar>
        
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
            </div>
          </header>
          <DashboardContent />
        </SidebarInset>
      </SidebarProvider>
      <TradeDialog open={tradeOpen} onOpenChange={setTradeOpen} />
    </div>
  );
}