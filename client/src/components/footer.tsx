import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  Mail, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Instagram,
  Bitcoin,
  Shield,
  Zap,
  Users,
  BarChart3,
  Bot
} from "lucide-react";

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

export function FooterTop() {
  return (
    <section className="py-20 bg-gradient-to-b from-muted/10 to-muted/30">
      <div className="container mx-auto px-6">
        <motion.div
          className="grid lg:grid-cols-4 md:grid-cols-2 gap-12"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {/* Company Info */}
          <motion.div variants={fadeInUp} className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                <TrendingUp className="text-white text-lg" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                SOG TradePro
              </span>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Advanced trading platform empowering traders with AI-powered bots, expert signals, 
              and comprehensive market analysis tools.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-primary" />
                <span>Use the in-app support channel</span>
              </div>
            </div>
          </motion.div>

          {/* Trading Features */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-lg font-bold mb-6">Trading Features</h3>
            <ul className="space-y-4">
              <li className="flex items-center space-x-3 group cursor-pointer">
                <Bot className="w-4 h-4 text-primary group-hover:text-accent transition-colors" />
                <span className="group-hover:text-primary transition-colors">AI Trading Bots</span>
              </li>
              <li className="flex items-center space-x-3 group cursor-pointer">
                <Zap className="w-4 h-4 text-primary group-hover:text-accent transition-colors" />
                <span className="group-hover:text-primary transition-colors">Live Trading Signals</span>
              </li>
              <li className="flex items-center space-x-3 group cursor-pointer">
                <Users className="w-4 h-4 text-primary group-hover:text-accent transition-colors" />
                <span className="group-hover:text-primary transition-colors">Copy Expert Traders</span>
              </li>
              <li className="flex items-center space-x-3 group cursor-pointer">
                <BarChart3 className="w-4 h-4 text-primary group-hover:text-accent transition-colors" />
                <span className="group-hover:text-primary transition-colors">Market Analysis</span>
              </li>
              <li className="flex items-center space-x-3 group cursor-pointer">
                <Bitcoin className="w-4 h-4 text-primary group-hover:text-accent transition-colors" />
                <span className="group-hover:text-primary transition-colors">Crypto Deposits</span>
              </li>
              <li className="flex items-center space-x-3 group cursor-pointer">
                <Shield className="w-4 h-4 text-primary group-hover:text-accent transition-colors" />
                <span className="group-hover:text-primary transition-colors">Secure Withdrawals</span>
              </li>
            </ul>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-lg font-bold mb-6">Quick Links</h3>
            <ul className="space-y-4">
              {[
                'Getting Started',
                'Trading Guide',
                'API Documentation',
                'Security Features',
                'Fees & Pricing',
                'Mobile App',
                'Help Center',
                'Contact Support'
              ].map((link) => (
                <li key={link}>
                  <a 
                    href={link === 'Privacy Policy' ? '/privacy' : '#'}
                    className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Newsletter */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-lg font-bold mb-6">Stay Updated</h3>
            <p className="text-muted-foreground mb-6">
              Get the latest market insights and trading tips delivered to your inbox.
            </p>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input 
                  placeholder="Your email address" 
                  className="flex-1"
                />
                <Button>
                  Subscribe
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                By subscribing, you agree to our Privacy Policy and Terms of Service.
              </p>
            </div>

            {/* Social Links */}
            <div className="mt-8">
              <p className="text-sm font-medium mb-4">Follow Us</p>
              <div className="flex space-x-4">
                {[
                  { icon: Twitter, label: 'Twitter' },
                  { icon: Facebook, label: 'Facebook' },
                  { icon: Linkedin, label: 'LinkedIn' },
                  { icon: Instagram, label: 'Instagram' }
                ].map(({ icon: Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    className="w-10 h-10 bg-muted/20 hover:bg-primary/10 rounded-lg flex items-center justify-center transition-colors group"
                    aria-label={label}
                  >
                    <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          className="mt-16 pt-12 border-t"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm font-medium">Bank-Level Security</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm font-medium">100K+ Active Users</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-sm font-medium">Real-Time Analytics</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bitcoin className="w-8 h-8 text-orange-600" />
              </div>
              <p className="text-sm font-medium">Multi-Asset Support</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function FooterBottom() {
  return (
    <footer className="py-8 bg-muted/50 border-t">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>© 2026 SOG TradePro. All rights reserved.</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Licensed & Regulated</span>
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
            {[
              'Privacy Policy',
              'Terms of Service', 
              'Cookie Policy',
              'Disclaimer',
              'Risk Warning'
            ].map((link) => (
              <a
                key={link}
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
        
        <Separator className="my-6" />
        
        <div className="text-center">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-4xl mx-auto">
            <strong>Risk Warning:</strong> Trading cryptocurrencies and financial instruments involves substantial risk and may result in the loss of your invested capital. 
            You should not invest more than you can afford to lose and should ensure that you fully understand the risks involved. 
            Past performance is not indicative of future results. This platform is for educational and informational purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
}