import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  TrendingUp, 
  Star,
  DollarSign,
  Activity,
  ArrowLeft,
  Search,
  UserPlus,
  Copy
} from "lucide-react";

interface ExpertTrader {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  rating: number;
  followers: number;
  following: boolean;
  performance: {
    totalReturn: number;
    monthlyReturn: number;
    winRate: number;
    totalTrades: number;
    riskScore: number;
  };
  strategies: string[];
  description: string;
  copyFee: number;
  minCopyAmount: number;
}

export default function CopyExpertPage() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate("/signin");
    }
  }, [navigate]);

  const { data: experts, isLoading } = useQuery<ExpertTrader[]>({
    queryKey: ["/api/copy-experts"],
    enabled: authService.isAuthenticated(),
  });

  const followMutation = useMutation({
    mutationFn: async (expertId: string) => {
      const response = await apiRequest("POST", `/api/copy-experts/${expertId}/follow`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/copy-experts"] });
    },
  });

  const copyTradeMutation = useMutation({
    mutationFn: async ({ expertId, amount }: { expertId: string; amount: number }) => {
      const response = await apiRequest("POST", `/api/copy-experts/${expertId}/copy`, { amount });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/copy-experts"] });
    },
  });

  const filteredExperts = experts?.filter(expert =>
    expert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expert.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expert.strategies.some(strategy => strategy.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleFollow = (expertId: string) => {
    followMutation.mutate(expertId);
  };

  const handleCopyTrade = (expertId: string) => {
    // In a real app, this would open a dialog to set copy amount
    copyTradeMutation.mutate({ expertId, amount: 1000 });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
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
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Copy Expert Traders</h1>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="glass-card mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search expert traders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Experts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredExperts?.map((expert) => (
          <motion.div
            key={expert.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={expert.avatar} />
                      <AvatarFallback>{expert.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold">{expert.name}</h3>
                      <p className="text-sm text-muted-foreground">@{expert.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-medium">{expert.rating}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span>Return: {expert.performance.totalReturn}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <span>Trades: {expert.performance.totalTrades}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-yellow-500" />
                      <span>Win Rate: {expert.performance.winRate}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span>{expert.followers} followers</span>
                    </div>
                  </div>

                  {/* Strategies */}
                  <div>
                    <p className="text-sm font-medium mb-2">Strategies:</p>
                    <div className="flex flex-wrap gap-1">
                      {expert.strategies.map((strategy, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {strategy}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground">{expert.description}</p>

                  {/* Copy Details */}
                  <div className="bg-muted/20 rounded-lg p-3 text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span>Copy Fee:</span>
                      <span className="font-medium">{expert.copyFee}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Min Amount:</span>
                      <span className="font-medium">${expert.minCopyAmount}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-4">
                    <Button
                      variant={expert.following ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleFollow(expert.id)}
                      disabled={followMutation.isPending}
                      className="flex-1"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      {expert.following ? "Following" : "Follow"}
                    </Button>
                    <Button
                      onClick={() => handleCopyTrade(expert.id)}
                      disabled={copyTradeMutation.isPending}
                      size="sm"
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Trade
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Empty State */}
        {(!filteredExperts || filteredExperts.length === 0) && !isLoading && (
          <Card className="glass-card col-span-full">
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Expert Traders Found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "No experts match your search criteria" : "Check back later for expert traders to follow"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}