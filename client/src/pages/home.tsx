import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Bot, Shield, Smartphone, Clock, Users } from "lucide-react";
import { Testimonials } from "@/components/testimonials";
import { FooterTop, FooterBottom } from "@/components/footer";

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

const features = [
  {
    icon: TrendingUp,
    title: "Real-time Analytics",
    description: "Advanced charting tools with real-time market data and technical indicators.",
    gradient: "from-primary to-accent"
  },
  {
    icon: Bot,
    title: "AI-Powered Insights", 
    description: "Machine learning algorithms provide intelligent trading recommendations.",
    gradient: "from-accent to-primary"
  },
  {
    icon: Shield,
    title: "Bank-level Security",
    description: "Enterprise-grade security with multi-factor authentication and encryption.",
    gradient: "from-primary to-accent"
  },
  {
    icon: Smartphone,
    title: "Mobile Trading",
    description: "Trade on the go with our responsive mobile-first platform design.",
    gradient: "from-accent to-primary"
  },
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Round-the-clock customer support and market monitoring.",
    gradient: "from-primary to-accent"
  },
  {
    icon: Users,
    title: "Community",
    description: "Connect with traders worldwide and share insights and strategies.",
    gradient: "from-accent to-primary"
  }
];

export default function Home() {
  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background gradient with floating elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
        <motion.div 
          className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeInUp}>
            <motion.h1 
              className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: "200% 200%" }}
            >
              Trade Smarter,<br />Not Harder
            </motion.h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Advanced trading platform with real-time analytics, AI-powered insights, and professional-grade tools for modern traders.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4 hover:scale-105 transition-transform duration-200"
                  data-testid="hero-signup-button"
                >
                  Start Trading Now
                </Button>
              </Link>
              <Link href="/about">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-4 glass-card hover:bg-white/5 hover:scale-105 transition-all duration-200"
                  data-testid="hero-learn-more-button"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-4">Why Choose SOG TradePro?</h2>
          <p className="text-xl text-muted-foreground">Professional tools connected to live market data</p>
        </motion.div>
        
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={fadeInUp}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="glass-card p-8 h-full hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
                <CardContent className="p-0">
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-lg flex items-center justify-center mb-6`}>
                    <feature.icon className="text-white text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>
      
      {/* Testimonials Section */}
      <Testimonials />
      
      {/* Footer */}
      <FooterTop />
      <FooterBottom />
    </div>
  );
}
