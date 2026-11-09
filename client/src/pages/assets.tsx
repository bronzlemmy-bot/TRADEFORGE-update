import { useState } from "react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Search,
  Bitcoin,
  Building,
  Landmark,
  Gem,
  Zap,
  DollarSign,
  Plus,
  Eye,
  MoreHorizontal
} from "lucide-react";
import { authService } from "@/lib/auth";
import { TradeDialog } from "@/components/trade-dialog";

interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'crypto' | 'bond' | 'commodity' | 'fund';
  price: number;
  change: number;
  changePercent: number;
  marketCap?: string;
  volume: string;
  holdings?: number;
  value?: number;
  icon?: string;
}

const getAssetIcon = (type: string) => {
  switch (type) {
    case 'stock': return <Building className="w-4 h-4" />;
    case 'crypto': return <Bitcoin className="w-4 h-4" />;
    case 'bond': return <Landmark className="w-4 h-4" />;
    case 'commodity': return <Gem className="w-4 h-4" />;
    case 'fund': return <Zap className="w-4 h-4" />;
    default: return <DollarSign className="w-4 h-4" />;
  }
};

const getAssetTypeColor = (type: string) => {
  switch (type) {
    case 'stock': return 'bg-blue-500/20 text-blue-400';
    case 'crypto': return 'bg-orange-500/20 text-orange-400';
    case 'bond': return 'bg-green-500/20 text-green-400';
    case 'commodity': return 'bg-yellow-500/20 text-yellow-400';
    case 'fund': return 'bg-purple-500/20 text-purple-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function Assets() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssetType, setSelectedAssetType] = useState<string>("all");
  const [tradeSymbol, setTradeSymbol] = useState<string | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) navigate("/signin");
  }, [navigate]);

  const { data: assetsData, isLoading } = useQuery<{ portfolio: Asset[]; market: Asset[] }>({
    queryKey: ["/api/assets"],
    enabled: authService.isAuthenticated(),
    refetchInterval: 30_000,
  });

  const portfolioAssets = assetsData?.portfolio || [];
  const marketAssets = assetsData?.market || [];

  const totalPortfolioValue = portfolioAssets.reduce((sum, asset) => sum + (asset.value || 0), 0);
  const totalChange = portfolioAssets.reduce((sum, asset) => sum + (asset.change * (asset.holdings || 0)), 0);
  const previousPortfolioValue = totalPortfolioValue - totalChange;
  const totalChangePercent = previousPortfolioValue > 0
    ? (totalChange / previousPortfolioValue) * 100
    : 0;

  const filteredUserAssets = portfolioAssets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedAssetType === "all" || asset.type === selectedAssetType;
    return matchesSearch && matchesType;
  });

  const filteredAvailableAssets = marketAssets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedAssetType === "all" || asset.type === selectedAssetType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div className="mb-8" {...fadeInUp}>
        <div className="flex items-center mb-4">
          <Wallet className="w-8 h-8 mr-3 text-primary" />
          <h1 className="text-3xl font-bold">My Assets</h1>
        </div>
        <p className="text-muted-foreground">
          Manage and track your investment portfolio across different asset classes.
        </p>
      </motion.div>

      {/* Portfolio Summary */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Portfolio Value</h3>
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold" data-testid="total-portfolio-value">
              ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`flex items-center mt-2 ${totalChangePercent >= 0 ? 'text-accent' : 'text-destructive'}`}>
              {totalChangePercent >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              <span className="text-sm font-medium">
                {totalChangePercent >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}% (${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(2)})
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Asset Types</h3>
              <Building className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold" data-testid="asset-types-count">
              {new Set(portfolioAssets.map(a => a.type)).size}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Diversified across different markets
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Holdings</h3>
              <Gem className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold" data-testid="total-holdings">
              {portfolioAssets.length}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Individual positions
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="asset-search"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedAssetType === "all" ? "default" : "outline"}
            onClick={() => setSelectedAssetType("all")}
            className="glass-card"
            data-testid="filter-all"
          >
            All
          </Button>
          <Button
            variant={selectedAssetType === "stock" ? "default" : "outline"}
            onClick={() => setSelectedAssetType("stock")}
            className="glass-card"
            data-testid="filter-stocks"
          >
            Stocks
          </Button>
          <Button
            variant={selectedAssetType === "crypto" ? "default" : "outline"}
            onClick={() => setSelectedAssetType("crypto")}
            className="glass-card"
            data-testid="filter-crypto"
          >
            Crypto
          </Button>
          <Button
            variant={selectedAssetType === "bond" ? "default" : "outline"}
            onClick={() => setSelectedAssetType("bond")}
            className="glass-card"
            data-testid="filter-bonds"
          >
            Bonds
          </Button>
          <Button
            variant={selectedAssetType === "commodity" ? "default" : "outline"}
            onClick={() => setSelectedAssetType("commodity")}
            className="glass-card"
            data-testid="filter-commodities"
          >
            Commodities
          </Button>
        </div>
      </motion.div>

      <Tabs defaultValue="portfolio" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="portfolio" data-testid="tab-portfolio">My Portfolio</TabsTrigger>
          <TabsTrigger value="market" data-testid="tab-market">Market</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio">
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {isLoading ? <p className="text-muted-foreground">Loading live portfolio...</p> : filteredUserAssets.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
              >
                <Card className="glass-card hover:shadow-lg transition-all" data-testid={`portfolio-asset-${asset.symbol}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold">
                          {asset.icon || asset.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{asset.symbol}</h3>
                            <Badge className={`text-xs ${getAssetTypeColor(asset.type)}`}>
                              {asset.type.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{asset.name}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-muted-foreground">
                              Holdings: {asset.holdings}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Volume: {asset.volume}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className={`flex items-center justify-end ${asset.changePercent >= 0 ? 'text-accent' : 'text-destructive'}`}>
                          {asset.changePercent >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                          <span className="text-sm font-medium">
                            {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Value: ${asset.value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" className="glass-card" data-testid={`view-${asset.symbol}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="glass-card" data-testid={`more-${asset.symbol}`}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="market">
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {isLoading ? <p className="text-muted-foreground">Loading live market data...</p> : filteredAvailableAssets.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
              >
                <Card className="glass-card hover:shadow-lg transition-all" data-testid={`market-asset-${asset.symbol}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold">
                          {asset.icon || asset.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{asset.symbol}</h3>
                            <Badge className={`text-xs ${getAssetTypeColor(asset.type)}`}>
                              {asset.type.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{asset.name}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-muted-foreground">
                              Market Cap: {asset.marketCap}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Volume: {asset.volume}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className={`flex items-center justify-end ${asset.changePercent >= 0 ? 'text-accent' : 'text-destructive'}`}>
                          {asset.changePercent >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                          <span className="text-sm font-medium">
                            {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                          </span>
                        </div>
                        <div className={`text-sm ${asset.change >= 0 ? 'text-accent' : 'text-destructive'}`}>
                          {asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button size="sm" data-testid={`buy-${asset.symbol}`} onClick={() => setTradeSymbol(asset.symbol)}>
                          <Plus className="w-4 h-4 mr-1" />
                          Buy
                        </Button>
                        <Button size="sm" variant="outline" className="glass-card" data-testid={`watch-${asset.symbol}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>
      </Tabs>
      <TradeDialog
        open={tradeSymbol !== null}
        onOpenChange={(open) => { if (!open) setTradeSymbol(null); }}
        defaultSymbol={tradeSymbol || "AAPL"}
      />
    </div>
  );
}