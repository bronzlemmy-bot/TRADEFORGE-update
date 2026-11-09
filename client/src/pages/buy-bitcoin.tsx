import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bitcoin, 
  ExternalLink, 
  Star, 
  Shield, 
  Clock,
  DollarSign,
  CreditCard,
  Smartphone,
  Building,
  Users,
  TrendingUp,
  CheckCircle
} from "lucide-react";

interface CryptoPlatform {
  id: string;
  name: string;
  logo: string;
  rating: number;
  fees: string;
  minPurchase: string;
  paymentMethods: string[];
  features: string[];
  verification: string;
  processingTime: string;
  description: string;
  popular: boolean;
}

const cryptoPlatforms: CryptoPlatform[] = [
  {
    id: "coinbase",
    name: "Coinbase",
    logo: "🟦",
    rating: 4.8,
    fees: "0.5-3.99%",
    minPurchase: "$2",
    paymentMethods: ["Credit Card", "Debit Card", "Bank Transfer", "PayPal"],
    features: ["Beginner Friendly", "Insurance Protected", "Mobile App", "Educational Resources"],
    verification: "Required",
    processingTime: "Instant-3 days",
    description: "One of the most popular and user-friendly platforms for buying Bitcoin.",
    popular: true
  },
  {
    id: "binance",
    name: "Binance",
    logo: "🟨",
    rating: 4.7,
    fees: "0.1-0.5%",
    minPurchase: "$15",
    paymentMethods: ["Credit Card", "Debit Card", "Bank Transfer", "P2P"],
    features: ["Low Fees", "High Liquidity", "Advanced Trading", "Wide Selection"],
    verification: "Required",
    processingTime: "Instant-1 day",
    description: "World's largest cryptocurrency exchange with competitive fees.",
    popular: true
  },
  {
    id: "kraken",
    name: "Kraken",
    logo: "🟪",
    rating: 4.6,
    fees: "0.16-0.26%",
    minPurchase: "$10",
    paymentMethods: ["Wire Transfer", "ACH", "Debit Card"],
    features: ["High Security", "Pro Trading", "Staking", "Regulatory Compliant"],
    verification: "Required",
    processingTime: "1-5 days",
    description: "Established exchange known for security and professional trading tools.",
    popular: false
  },
  {
    id: "cashapp",
    name: "Cash App",
    logo: "🟩",
    rating: 4.5,
    fees: "1.76-2.5%",
    minPurchase: "$1",
    paymentMethods: ["Debit Card", "Bank Account"],
    features: ["Simple Interface", "Lightning Network", "Direct Deposit", "Stock Trading"],
    verification: "Minimal",
    processingTime: "Instant",
    description: "Mobile-first platform that makes Bitcoin buying incredibly simple.",
    popular: true
  },
  {
    id: "gemini",
    name: "Gemini",
    logo: "🔷",
    rating: 4.4,
    fees: "0.35-1.49%",
    minPurchase: "$5",
    paymentMethods: ["Bank Transfer", "Wire Transfer", "Debit Card"],
    features: ["Regulated", "Security First", "Earn Program", "Active Trader"],
    verification: "Required",
    processingTime: "1-5 days",
    description: "Regulated exchange founded by the Winklevoss twins with strong security.",
    popular: false
  },
  {
    id: "strike",
    name: "Strike",
    logo: "⚡",
    rating: 4.3,
    fees: "0-1%",
    minPurchase: "$1",
    paymentMethods: ["Bank Account", "Debit Card"],
    features: ["Lightning Network", "No Trading Fees", "Dollar Cost Average", "Global Remittance"],
    verification: "Required",
    processingTime: "Instant",
    description: "Lightning-powered Bitcoin app with zero trading fees.",
    popular: false
  }
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function BuyBitcoin() {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPlatforms = cryptoPlatforms.filter(platform =>
    platform.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    platform.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const popularPlatforms = filteredPlatforms.filter(p => p.popular);
  const otherPlatforms = filteredPlatforms.filter(p => !p.popular);
  const platformUrls: Record<string, string> = {
    coinbase: "https://www.coinbase.com/",
    binance: "https://www.binance.com/en/buy",
    kraken: "https://www.kraken.com/",
    cashapp: "https://cash.app/",
    gemini: "https://www.gemini.com/",
    strike: "https://strike.me/",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div className="mb-8" {...fadeInUp}>
        <div className="flex items-center mb-4">
          <Bitcoin className="w-8 h-8 mr-3 text-orange-500" />
          <h1 className="text-3xl font-bold">Buy Bitcoin</h1>
        </div>
        <p className="text-muted-foreground mb-6">
          Choose from trusted platforms to purchase Bitcoin safely and securely.
        </p>
        
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search platforms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
              data-testid="platform-search"
            />
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="popular" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="popular" data-testid="tab-popular">Popular Platforms</TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">All Platforms</TabsTrigger>
        </TabsList>

        <TabsContent value="popular" className="space-y-6">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {popularPlatforms.map((platform, index) => (
              <motion.div
                key={platform.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card 
                  className={`glass-card cursor-pointer transition-all hover:shadow-lg ${
                    selectedPlatform === platform.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedPlatform(platform.id)}
                  data-testid={`platform-${platform.id}`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{platform.logo}</div>
                        <div>
                          <CardTitle className="text-lg">{platform.name}</CardTitle>
                          <div className="flex items-center mt-1">
                            <Star className="w-4 h-4 text-yellow-500 mr-1" />
                            <span className="text-sm text-muted-foreground">{platform.rating}</span>
                          </div>
                        </div>
                      </div>
                      {platform.popular && (
                        <Badge variant="default" className="text-xs">
                          Popular
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {platform.description}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fees:</span>
                        <span className="font-medium">{platform.fees}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Min Purchase:</span>
                        <span className="font-medium">{platform.minPurchase}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Processing:</span>
                        <span className="font-medium">{platform.processingTime}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm text-muted-foreground mb-2">Payment Methods:</div>
                      <div className="flex flex-wrap gap-1">
                        {platform.paymentMethods.slice(0, 2).map((method) => (
                          <Badge key={method} variant="secondary" className="text-xs">
                            {method}
                          </Badge>
                        ))}
                        {platform.paymentMethods.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{platform.paymentMethods.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm text-muted-foreground mb-2">Key Features:</div>
                      <div className="flex flex-wrap gap-1">
                        {platform.features.slice(0, 2).map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button 
                      className="w-full mt-4" 
                      onClick={() => window.open(platformUrls[platform.id], "_blank", "noopener,noreferrer")}
                      data-testid={`buy-on-${platform.id}`}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Buy on {platform.name}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="all" className="space-y-6">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {filteredPlatforms.map((platform, index) => (
              <motion.div
                key={platform.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card 
                  className={`glass-card cursor-pointer transition-all hover:shadow-lg ${
                    selectedPlatform === platform.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedPlatform(platform.id)}
                  data-testid={`platform-${platform.id}`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{platform.logo}</div>
                        <div>
                          <CardTitle className="text-lg">{platform.name}</CardTitle>
                          <div className="flex items-center mt-1">
                            <Star className="w-4 h-4 text-yellow-500 mr-1" />
                            <span className="text-sm text-muted-foreground">{platform.rating}</span>
                          </div>
                        </div>
                      </div>
                      {platform.popular && (
                        <Badge variant="default" className="text-xs">
                          Popular
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {platform.description}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fees:</span>
                        <span className="font-medium">{platform.fees}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Min Purchase:</span>
                        <span className="font-medium">{platform.minPurchase}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Processing:</span>
                        <span className="font-medium">{platform.processingTime}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm text-muted-foreground mb-2">Payment Methods:</div>
                      <div className="flex flex-wrap gap-1">
                        {platform.paymentMethods.slice(0, 2).map((method) => (
                          <Badge key={method} variant="secondary" className="text-xs">
                            {method}
                          </Badge>
                        ))}
                        {platform.paymentMethods.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{platform.paymentMethods.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm text-muted-foreground mb-2">Key Features:</div>
                      <div className="flex flex-wrap gap-1">
                        {platform.features.slice(0, 2).map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button 
                      className="w-full mt-4" 
                      onClick={() => window.open(platformUrls[platform.id], "_blank", "noopener,noreferrer")}
                      data-testid={`buy-on-${platform.id}`}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Buy on {platform.name}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Bitcoin Price Ticker */}
      <motion.div
        className="mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Bitcoin className="w-8 h-8 text-orange-500" />
                <div>
                  <h3 className="text-lg font-semibold">Bitcoin Price</h3>
                  <p className="text-sm text-muted-foreground">Live market price</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" data-testid="btc-price">$67,234.12</div>
                <div className="flex items-center text-accent">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">+2.34% (24h)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Notice */}
      <motion.div
        className="mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card className="glass-card border-amber-500/20">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Shield className="w-6 h-6 text-amber-500 mt-1" />
              <div>
                <h3 className="font-semibold text-amber-500 mb-2">Security Notice</h3>
                <p className="text-sm text-muted-foreground">
                  Always verify you're on the official website before entering personal information. 
                  Enable two-factor authentication and use hardware wallets for large amounts. 
                  Never share your private keys or seed phrases with anyone.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}