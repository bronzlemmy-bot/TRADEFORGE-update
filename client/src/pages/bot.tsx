import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Bot, 
  Play, 
  Pause, 
  Settings, 
  TrendingUp, 
  DollarSign,
  Activity,
  Target,
  ArrowLeft
} from "lucide-react";

interface BotConfig {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'stopped';
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
}

export default function BotPage() {
  const [, navigate] = useLocation();
  const [newBotName, setNewBotName] = useState("");
  const [newBotStrategy, setNewBotStrategy] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate("/signin");
    }
  }, [navigate]);

  const { data: bots, isLoading } = useQuery<BotConfig[]>({
    queryKey: ["/api/bots"],
    enabled: authService.isAuthenticated(),
  });

  const createBotMutation = useMutation({
    mutationFn: async (botData: any) => {
      const response = await apiRequest("POST", "/api/bots", botData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      setNewBotName("");
      setNewBotStrategy("");
    },
  });

  const toggleBotMutation = useMutation({
    mutationFn: async ({ botId, action }: { botId: string; action: string }) => {
      const response = await apiRequest("POST", `/api/bots/${botId}/${action}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
    },
  });

  const handleCreateBot = () => {
    if (!newBotName || !newBotStrategy) return;
    
    createBotMutation.mutate({
      name: newBotName,
      strategy: newBotStrategy,
      capital: 10000,
      maxRisk: 2,
      profitTarget: 10,
      stopLoss: 5,
    });
  };

  const handleToggleBot = (botId: string, currentStatus: string) => {
    const action = currentStatus === 'active' ? 'pause' : 'start';
    toggleBotMutation.mutate({ botId, action });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
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
            <Bot className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Trading Bots</h1>
          </div>
        </div>
      </div>

      {/* Create New Bot */}
      <Card className="glass-card mb-8">
        <CardHeader>
          <CardTitle>Create New Trading Bot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="bot-name">Bot Name</Label>
              <Input
                id="bot-name"
                placeholder="Enter bot name"
                value={newBotName}
                onChange={(e) => setNewBotName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="strategy">Strategy</Label>
              <Select value={newBotStrategy} onValueChange={setNewBotStrategy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="momentum">Momentum Trading</SelectItem>
                  <SelectItem value="meanreversion">Mean Reversion</SelectItem>
                  <SelectItem value="arbitrage">Arbitrage</SelectItem>
                  <SelectItem value="scalping">Scalping</SelectItem>
                  <SelectItem value="grid">Grid Trading</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleCreateBot}
                disabled={!newBotName || !newBotStrategy || createBotMutation.isPending}
                className="w-full"
              >
                {createBotMutation.isPending ? "Creating..." : "Create Bot"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bots?.map((bot) => (
          <motion.div
            key={bot.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{bot.name}</CardTitle>
                  <Badge 
                    variant={bot.status === 'active' ? 'default' : 'secondary'}
                    className={bot.status === 'active' ? 'bg-green-500' : ''}
                  >
                    {bot.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{bot.strategy}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <span>Trades: {bot.performance.totalTrades}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-green-500" />
                      <span>Win Rate: {bot.performance.winRate}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-yellow-500" />
                      <span>P&L: ${bot.performance.totalPnL}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                      <span>Return: {bot.performance.monthlyReturn}%</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={bot.status === 'active'}
                        onCheckedChange={() => handleToggleBot(bot.id, bot.status)}
                        disabled={toggleBotMutation.isPending}
                      />
                      <span className="text-sm">
                        {bot.status === 'active' ? 'Running' : 'Stopped'}
                      </span>
                    </div>
                    <Button size="sm" variant="outline">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Empty State */}
        {(!bots || bots.length === 0) && !isLoading && (
          <Card className="glass-card col-span-full">
            <CardContent className="text-center py-12">
              <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Trading Bots Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first trading bot to start automated trading
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}