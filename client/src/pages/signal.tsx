import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Zap, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Target,
  ArrowLeft,
  Search,
  Filter
} from "lucide-react";

interface TradingSignal {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  price: number;
  targetPrice: number;
  stopLoss: number;
  confidence: number;
  timeframe: string;
  strategy: string;
  createdAt: string;
  status: 'active' | 'executed' | 'expired';
  pnl?: number;
}

export default function SignalPage() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate("/signin");
    }
  }, [navigate]);

  const { data: signals, isLoading } = useQuery<TradingSignal[]>({
    queryKey: ["/api/signals"],
    enabled: authService.isAuthenticated(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const filteredSignals = signals?.filter(signal =>
    signal.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    signal.strategy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const executeSignal = async (signalId: string) => {
    try {
      await apiRequest("POST", `/api/signals/${signalId}/execute`);
      window.location.reload();
    } catch (error) {
      console.error("Failed to execute signal:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center space-x-3">
            <Zap className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Trading Signals</h1>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="glass-card mb-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search symbols or strategies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Signals List */}
      <div className="space-y-4">
        {filteredSignals?.map((signal) => (
          <motion.div
            key={signal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        {signal.action === 'BUY' ? (
                          <TrendingUp className="w-6 h-6 text-green-500" />
                        ) : signal.action === 'SELL' ? (
                          <TrendingDown className="w-6 h-6 text-red-500" />
                        ) : (
                          <Clock className="w-6 h-6 text-yellow-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{signal.symbol}</h3>
                        <p className="text-sm text-muted-foreground">{signal.strategy}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <Badge 
                        variant={
                          signal.action === 'BUY' ? 'default' : 
                          signal.action === 'SELL' ? 'destructive' : 
                          'secondary'
                        }
                        className="mb-2"
                      >
                        {signal.action}
                      </Badge>
                      <p className="text-sm text-muted-foreground">Action</p>
                    </div>

                    <div className="text-center">
                      <p className="text-lg font-bold">${signal.price}</p>
                      <p className="text-sm text-muted-foreground">Entry Price</p>
                    </div>

                    <div className="text-center">
                      <p className="text-lg font-bold text-green-500">${signal.targetPrice}</p>
                      <p className="text-sm text-muted-foreground">Target</p>
                    </div>

                    <div className="text-center">
                      <p className="text-lg font-bold text-red-500">${signal.stopLoss}</p>
                      <p className="text-sm text-muted-foreground">Stop Loss</p>
                    </div>

                    <div className="text-center">
                      <p className="text-lg font-bold">{signal.confidence}%</p>
                      <p className="text-sm text-muted-foreground">Confidence</p>
                    </div>

                    <div className="text-center">
                      <Badge variant={
                        signal.status === 'active' ? 'default' :
                        signal.status === 'executed' ? 'secondary' :
                        'outline'
                      }>
                        {signal.status}
                      </Badge>
                    </div>

                    {signal.status === 'active' && (
                      <Button 
                        onClick={() => executeSignal(signal.id)}
                        size="sm"
                      >
                        Execute
                      </Button>
                    )}

                    {signal.status === 'executed' && signal.pnl && (
                      <div className="text-center">
                        <p className={`text-lg font-bold ${signal.pnl > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {signal.pnl > 0 ? '+' : ''}${signal.pnl}
                        </p>
                        <p className="text-sm text-muted-foreground">P&L</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{signal.timeframe}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Target className="w-4 h-4" />
                    <span>Strategy: {signal.strategy}</span>
                  </div>
                  <span>Generated: {new Date(signal.createdAt).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Empty State */}
        {(!filteredSignals || filteredSignals.length === 0) && !isLoading && (
          <Card className="glass-card">
            <CardContent className="text-center py-12">
              <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Trading Signals</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "No signals match your search criteria" : "No active trading signals available"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}