import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Bitcoin, 
  ArrowDownToLine,
  Copy,
  Check,
  AlertTriangle,
  ArrowLeft,
  QrCode,
  Clock,
  CheckCircle,
  XCircle,
  Wallet,
  History,
  Info,
  Smartphone,
  Banknote,
  TrendingUp,
  Shield
} from "lucide-react";

interface DepositHistory {
  id: string;
  amount: number;
  address: string;
  txHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  requiredConfirmations: number;
  createdAt: string;
  network: string;
  usdValue?: number;
}

interface WalletData {
  address: string;
  balance: number;
  pendingDeposits: number;
  exchangeRate: number;
}

export default function DepositBitcoinPage() {
  const [, navigate] = useLocation();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [selectedTab, setSelectedTab] = useState('btc');
  const [showQrCode, setShowQrCode] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate("/signin");
    }
  }, [navigate]);

  const { data: walletData, isLoading: walletLoading } = useQuery<WalletData>({
    queryKey: ["/api/wallet/bitcoin"],
    enabled: authService.isAuthenticated(),
  });

  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest("POST", "/api/wallet/bitcoin/deposits", { amount });
      return response.json();
    },
    onSuccess: () => {
      setDepositAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/bitcoin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/bitcoin/deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      toast({ title: "Deposit recorded", description: "Your Bitcoin deposit has been added to the wallet." });
    },
    onError: (error: Error) => {
      toast({ title: "Deposit failed", description: error.message, variant: "destructive" });
    },
  });

  const { data: depositHistory, isLoading: historyLoading } = useQuery<DepositHistory[]>({
    queryKey: ["/api/wallet/bitcoin/deposits"],
    enabled: authService.isAuthenticated(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const copyAddress = async () => {
    if (walletData?.address) {
      await navigator.clipboard.writeText(walletData.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const refreshDeposits = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/wallet/bitcoin/deposits"] });
    queryClient.invalidateQueries({ queryKey: ["/api/wallet/bitcoin"] });
  };

  if (walletLoading || historyLoading) {
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
            <Bitcoin className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold">Deposit Bitcoin</h1>
          </div>
        </div>
        <Button onClick={refreshDeposits} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Enhanced Cryptocurrency Tabs */}
      <div className="mb-6">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Select Cryptocurrency</h3>
              <Badge variant="secondary" className="text-xs">
                More coming soon
              </Badge>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setSelectedTab('btc')}
                variant={selectedTab === 'btc' ? 'default' : 'outline'}
                className="flex items-center space-x-2"
              >
                <Bitcoin className="w-4 h-4 text-orange-500" />
                <span>Bitcoin</span>
              </Button>
              <Button
                variant="outline"
                disabled
                className="flex items-center space-x-2 opacity-50"
              >
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <span>Ethereum</span>
                <span className="text-xs">(Soon)</span>
              </Button>
              <Button
                variant="outline"
                disabled
                className="flex items-center space-x-2 opacity-50"
              >
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <span>USDT</span>
                <span className="text-xs">(Soon)</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deposit Amount Calculator */}
      <div className="mb-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>Deposit Calculator</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Amount to Deposit</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    type="number"
                    placeholder="0.001"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="font-mono"
                  />
                  <span className="text-sm text-muted-foreground min-w-[3rem]">BTC</span>
                </div>
              </div>
              <div>
                <Label>Estimated USD Value</Label>
                <div className="mt-2 p-3 bg-muted/20 rounded-lg">
                  <p className="text-lg font-semibold">
                    ${depositAmount && walletData?.exchangeRate ? (parseFloat(depositAmount) * walletData.exchangeRate).toFixed(2) : '0.00'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Rate: ${walletData?.exchangeRate?.toLocaleString() || "—"}/BTC
                  </p>
                </div>
                <Button
                  className="mt-4"
                  onClick={() => depositMutation.mutate(Number(depositAmount))}
                  disabled={depositMutation.isPending || !depositAmount || Number(depositAmount) <= 0}
                >
                  {depositMutation.isPending ? "Recording..." : "Record deposit"}
                </Button>
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDepositAmount('0.001')}
              >
                Min: 0.001 BTC
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDepositAmount('0.01')}
              >
                0.01 BTC
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDepositAmount('0.1')}
              >
                0.1 BTC
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Deposit Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Wallet Overview */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bitcoin className="w-5 h-5 text-orange-500" />
                <span>Bitcoin Wallet</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                  <p className="text-2xl font-bold">{walletData?.balance || 0} BTC</p>
                </div>
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Pending Deposits</p>
                  <p className="text-2xl font-bold text-yellow-500">{walletData?.pendingDeposits || 0} BTC</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deposit Address */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Your Deposit Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Only send Bitcoin (BTC) to this address. Sending any other cryptocurrency will result in permanent loss.
                  </AlertDescription>
                </Alert>
                
                <div>
                  <Label>Bitcoin Address (BTC Network)</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Input
                      value={walletData?.address || "Loading..."}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      onClick={copyAddress}
                      size="icon"
                      variant="outline"
                      disabled={!walletData?.address}
                    >
                      {copiedAddress ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {copiedAddress && (
                    <p className="text-sm text-green-500 mt-1">Address copied to clipboard!</p>
                  )}
                </div>

                <div className="bg-muted/20 rounded-lg p-4 text-sm">
                  <h4 className="font-semibold mb-2">Important Information:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Minimum deposit: 0.0001 BTC</li>
                    <li>• Network: Bitcoin (BTC)</li>
                    <li>• Confirmations required: 3</li>
                    <li>• Estimated arrival: 30-60 minutes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced QR Code and Instructions */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="w-5 h-5" />
                <span>QR Code & Instructions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-48 h-48 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg flex items-center justify-center mx-auto mb-4 border border-orange-200 dark:border-orange-800">
                    <QrCode className="w-24 h-24 text-orange-600" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Scan this QR code with your Bitcoin wallet to deposit
                  </p>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => setShowQrCode(!showQrCode)}
                    >
                      {showQrCode ? 'Hide QR' : 'Show QR'}
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      Download QR
                    </Button>
                  </div>
                </div>
                
                {/* Step-by-step Instructions */}
                <div className="bg-muted/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Bitcoin className="w-4 h-4 mr-2 text-orange-500" />
                    How to Deposit Bitcoin
                  </h4>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">1</span>
                      <span>Open your Bitcoin wallet app</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">2</span>
                      <span>Scan the QR code or copy the address above</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">3</span>
                      <span>Enter the amount you want to deposit</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">4</span>
                      <span>Confirm and send the transaction</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">5</span>
                      <span>Wait for 3 confirmations (usually 30-60 minutes)</span>
                    </li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Enhanced Deposit History & Stats */}
        <div className="space-y-6">
          {/* Enhanced Security Notice */}
          <Card className="glass-card border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span>Security Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Multi-signature Wallet</p>
                    <p className="text-xs text-muted-foreground">Enhanced security protection</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Cold Storage</p>
                    <p className="text-xs text-muted-foreground">95% of funds stored offline</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Insurance Coverage</p>
                    <p className="text-xs text-muted-foreground">FDIC insured deposits</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Deposit Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-2xl font-bold text-green-600">0.02443</p>
                  <p className="text-sm text-muted-foreground">Total Deposited (BTC)</p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-2xl font-bold text-blue-600">3</p>
                  <p className="text-sm text-muted-foreground">Successful Deposits</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-2xl font-bold text-purple-600">~45min</p>
                  <p className="text-sm text-muted-foreground">Avg. Processing Time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile App Promotion */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5" />
                <span>Mobile Trading</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="font-medium">Download Our App</p>
                  <p className="text-sm text-muted-foreground">Trade Bitcoin on the go with instant deposits</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    iOS App
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    Android App
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Enhanced Deposit History */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Deposits</CardTitle>
                <Button variant="outline" size="sm" onClick={refreshDeposits}>
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {depositHistory?.length ? (
                  depositHistory.map((deposit) => (
                    <motion.div
                      key={deposit.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 space-y-3 bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                            <Bitcoin className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium">{deposit.amount} BTC</p>
                            <p className="text-sm text-muted-foreground">
                              ${(deposit.usdValue ?? deposit.amount * (walletData?.exchangeRate || 0)).toFixed(2)} USD
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            deposit.status === 'confirmed' ? 'default' :
                            deposit.status === 'pending' ? 'secondary' :
                            'destructive'
                          }
                          className="flex items-center space-x-1"
                        >
                          {deposit.status === 'confirmed' && <CheckCircle className="w-3 h-3" />}
                          {deposit.status === 'pending' && <Clock className="w-3 h-3" />}
                          {deposit.status === 'failed' && <XCircle className="w-3 h-3" />}
                          <span>{deposit.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground bg-muted/20 rounded p-3">
                        <div className="flex justify-between">
                          <span>Network:</span>
                          <span className="font-medium">{deposit.network}</span>
                        </div>
                        {deposit.status === 'pending' && (
                          <div className="flex justify-between">
                            <span>Confirmations:</span>
                            <span className="font-medium text-yellow-600">
                              {deposit.confirmations}/{deposit.requiredConfirmations}
                            </span>
                          </div>
                        )}
                        {deposit.txHash && (
                          <div className="flex justify-between">
                            <span>Transaction:</span>
                            <span className="font-mono text-xs">
                              {deposit.txHash.slice(0, 16)}...
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Time:</span>
                          <span>{new Date(deposit.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-4">
                      <ArrowDownToLine className="w-8 h-8 text-orange-600" />
                    </div>
                    <h3 className="font-medium mb-2">No deposits yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your Bitcoin deposits will appear here once you make your first deposit.
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm">
                        <History className="w-4 h-4 mr-2" />
                        View All History
                      </Button>
                      <div className="text-xs text-muted-foreground">
                        Need help? Contact our 24/7 support team
                      </div>
                    </div>
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