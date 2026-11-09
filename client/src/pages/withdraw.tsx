import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  CreditCard, 
  ArrowLeft,
  Send,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Bitcoin,
  DollarSign
} from "lucide-react";

interface WithdrawHistory {
  id: string;
  amount: number;
  currency: string;
  address: string;
  fee: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  txHash?: string;
}

interface WalletBalance {
  btc: number;
  usd: number;
}

export default function WithdrawPage() {
  const [, navigate] = useLocation();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawCurrency, setWithdrawCurrency] = useState("btc");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate("/signin");
    }
  }, [navigate]);

  const { data: balance, isLoading: balanceLoading } = useQuery<WalletBalance>({
    queryKey: ["/api/wallet/balance"],
    enabled: authService.isAuthenticated(),
  });

  const { data: withdrawHistory, isLoading: historyLoading } = useQuery<WithdrawHistory[]>({
    queryKey: ["/api/wallet/withdrawals"],
    enabled: authService.isAuthenticated(),
    refetchInterval: 30000,
  });

  const withdrawMutation = useMutation({
    mutationFn: async (withdrawData: any) => {
      const response = await apiRequest("POST", "/api/wallet/withdraw", withdrawData);
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      setWithdrawAmount("");
      setWithdrawAddress("");
      setErrors({});
    },
    onError: (error: any) => {
      setErrors({ general: error.message });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!withdrawAmount || isNaN(parseFloat(withdrawAmount)) || parseFloat(withdrawAmount) <= 0) {
      newErrors.amount = "Please enter a valid amount greater than 0";
    }
    
    if (!withdrawAddress.trim()) {
      newErrors.address = "Please enter a withdrawal address";
    }
    
    const amount = parseFloat(withdrawAmount);
    const availableBalance = withdrawCurrency === 'btc' ? balance?.btc || 0 : balance?.usd || 0;
    const fee = withdrawCurrency === 'btc' ? 0.0005 : 5;
    
    // Minimum withdrawal limits
    if (withdrawCurrency === 'btc' && amount < 0.001) {
      newErrors.amount = "Minimum withdrawal: 0.001 BTC";
    } else if (withdrawCurrency === 'usd' && amount < 10) {
      newErrors.amount = "Minimum withdrawal: $10";
    }
    
    // Check if amount covers the fee
    if (amount <= fee) {
      newErrors.amount = `Amount must be greater than network fee of ${withdrawCurrency === 'btc' ? '0.0005 BTC' : '$5'}`;
    }
    
    if (amount > availableBalance) {
      newErrors.amount = `Insufficient balance. Available: ${availableBalance} ${withdrawCurrency.toUpperCase()}`;
    }
    
    // Enhanced address validation
    if (withdrawCurrency === 'btc' && withdrawAddress.trim()) {
      // Basic Bitcoin address validation
      if (!withdrawAddress.match(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/)) {
        newErrors.address = "Invalid Bitcoin address format. Please enter a valid Bitcoin address.";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleWithdraw = () => {
    if (!validateForm()) return;
    
    withdrawMutation.mutate({
      amount: parseFloat(withdrawAmount),
      currency: withdrawCurrency,
      address: withdrawAddress,
    });
  };

  const getWithdrawFee = () => {
    if (withdrawCurrency === 'btc') {
      return { amount: 0.0005, display: "0.0005 BTC" };
    } else {
      return { amount: 5, display: "$5" };
    }
  };

  const fee = getWithdrawFee();
  const netAmount = withdrawAmount ? parseFloat(withdrawAmount) - fee.amount : 0;

  if (balanceLoading || historyLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
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
            <CreditCard className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Withdraw Funds</h1>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Withdraw Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Balance Overview */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Available Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Bitcoin className="w-5 h-5 text-orange-500" />
                    <span className="font-medium">Bitcoin</span>
                  </div>
                  <p className="text-2xl font-bold">{balance?.btc || 0} BTC</p>
                </div>
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    <span className="font-medium">USD</span>
                  </div>
                  <p className="text-2xl font-bold">${balance?.usd || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Withdraw Form */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Create Withdrawal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {errors.general && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{errors.general}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={withdrawCurrency} onValueChange={setWithdrawCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="btc">Bitcoin (BTC)</SelectItem>
                      <SelectItem value="usd">US Dollar (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      step={withdrawCurrency === 'btc' ? '0.00000001' : '0.01'}
                      min={withdrawCurrency === 'btc' ? '0.001' : '10'}
                      max={withdrawCurrency === 'btc' ? balance?.btc || 0 : balance?.usd || 0}
                      placeholder={`Enter amount in ${withdrawCurrency.toUpperCase()}`}
                      value={withdrawAmount}
                      onChange={(e) => {
                        setWithdrawAmount(e.target.value);
                        // Clear errors when user starts typing
                        if (errors.amount) {
                          setErrors({ ...errors, amount: '' });
                        }
                      }}
                      className={errors.amount ? "border-red-500" : ""}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                      {withdrawCurrency.toUpperCase()}
                    </div>
                  </div>
                  {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>
                      Available: {withdrawCurrency === 'btc' ? `${balance?.btc || 0} BTC` : `$${(balance?.usd || 0).toLocaleString()}`}
                    </span>
                    <span>
                      Min: {withdrawCurrency === 'btc' ? '0.001 BTC' : '$10'} | Fee: {withdrawCurrency === 'btc' ? '0.0005 BTC' : '$5'}
                    </span>
                  </div>
                  {/* Quick amount buttons */}
                  <div className="flex space-x-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const maxAmount = withdrawCurrency === 'btc' ? balance?.btc || 0 : balance?.usd || 0;
                        const fee = withdrawCurrency === 'btc' ? 0.0005 : 5;
                        const netMax = Math.max(0, maxAmount - fee);
                        setWithdrawAmount(netMax.toString());
                      }}
                    >
                      Max
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const halfAmount = withdrawCurrency === 'btc' 
                          ? ((balance?.btc || 0) / 2).toFixed(8)
                          : ((balance?.usd || 0) / 2).toFixed(2);
                        setWithdrawAmount(halfAmount);
                      }}
                    >
                      50%
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const quarterAmount = withdrawCurrency === 'btc' 
                          ? ((balance?.btc || 0) / 4).toFixed(8)
                          : ((balance?.usd || 0) / 4).toFixed(2);
                        setWithdrawAmount(quarterAmount);
                      }}
                    >
                      25%
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">
                    {withdrawCurrency === 'btc' ? 'Bitcoin Address' : 'Bank Account / Wallet Address'}
                  </Label>
                  <div className="space-y-2">
                    <Input
                      id="address"
                      placeholder={
                        withdrawCurrency === 'btc' 
                          ? 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' 
                          : 'Enter bank account or wallet address'
                      }
                      value={withdrawAddress}
                      onChange={(e) => {
                        setWithdrawAddress(e.target.value);
                        // Clear errors when user starts typing
                        if (errors.address) {
                          setErrors({ ...errors, address: '' });
                        }
                      }}
                      className={`font-mono text-sm ${errors.address ? "border-red-500" : ""}`}
                    />
                    {withdrawCurrency === 'btc' && (
                      <p className="text-xs text-muted-foreground">
                        Supported formats: Legacy (1...), P2SH (3...), Bech32 (bc1...)
                      </p>
                    )}
                  </div>
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>

                {/* Enhanced Fee Summary */}
                {withdrawAmount && !isNaN(parseFloat(withdrawAmount)) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 space-y-3"
                  >
                    <h4 className="font-semibold flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-blue-500" />
                      Transaction Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Withdrawal Amount:</span>
                        <span className="font-medium">{parseFloat(withdrawAmount).toFixed(withdrawCurrency === 'btc' ? 8 : 2)} {withdrawCurrency.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Network Fee:</span>
                        <span className="text-orange-600 font-medium">{fee.display}</span>
                      </div>
                      <div className="flex justify-between items-center font-medium border-t pt-2 text-base">
                        <span>You'll Receive:</span>
                        <span className={`${netAmount < 0 ? 'text-red-500' : 'text-green-600'} font-bold`}>
                          {Math.max(0, netAmount).toFixed(withdrawCurrency === 'btc' ? 8 : 2)} {withdrawCurrency.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground pt-1">
                        Estimated arrival: {withdrawCurrency === 'btc' ? '30-60 minutes' : '1-3 business days'}
                      </div>
                    </div>
                  </motion.div>
                )}

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {withdrawCurrency === 'btc' 
                      ? "Double-check your Bitcoin address. Transactions cannot be reversed."
                      : "Ensure your bank account details are correct. Processing may take 1-3 business days."
                    }
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleWithdraw}
                  disabled={withdrawMutation.isPending || !withdrawAmount || !withdrawAddress || Object.values(errors).some(error => error)}
                  className="w-full"
                  size="lg"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {withdrawMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing Withdrawal...
                    </>
                  ) : (
                    `Withdraw ${withdrawAmount ? `${parseFloat(withdrawAmount).toFixed(withdrawCurrency === 'btc' ? 4 : 2)} ${withdrawCurrency.toUpperCase()}` : 'Funds'}`
                  )}
                </Button>
                
                {/* Success Message */}
                {withdrawMutation.isSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center space-x-3"
                  >
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">
                        Withdrawal Request Submitted Successfully!
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-300">
                        Your withdrawal is being processed and will arrive in {withdrawCurrency === 'btc' ? '30-60 minutes' : '1-3 business days'}.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Withdrawal History */}
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Recent Withdrawals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {withdrawHistory?.length ? (
                  withdrawHistory.map((withdrawal) => (
                    <motion.div
                      key={withdrawal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {withdrawal.amount} {withdrawal.currency.toUpperCase()}
                        </span>
                        <Badge
                          variant={
                            withdrawal.status === 'completed' ? 'default' :
                            withdrawal.status === 'processing' || withdrawal.status === 'pending' ? 'secondary' :
                            'destructive'
                          }
                        >
                          {withdrawal.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {(withdrawal.status === 'processing' || withdrawal.status === 'pending') && <Clock className="w-3 h-3 mr-1" />}
                          {withdrawal.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                          {withdrawal.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Fee: {withdrawal.fee} {withdrawal.currency.toUpperCase()}</p>
                        <p className="truncate">To: {withdrawal.address.slice(0, 20)}...</p>
                        {withdrawal.txHash && (
                          <p className="truncate">
                            Tx: {withdrawal.txHash.slice(0, 16)}...
                          </p>
                        )}
                        <p>{new Date(withdrawal.createdAt).toLocaleString()}</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Send className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No withdrawals yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}