import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Radio, ShieldCheck } from "lucide-react";

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

export default function About() {
  return (
    <div className="pt-16">
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            About SOG TradePro
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Empowering traders with cutting-edge technology and professional-grade tools
          </p>
        </motion.div>

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Card className="glass-card p-12 mb-16">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
                  <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                    At SOG TradePro, we believe everyone deserves access to clear, live market information and professional-grade trading tools.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    We connect the interface to live market providers so prices and charts reflect current market conditions.
                  </p>
                </div>
                <div className="relative">
                  <div className="chart-placeholder h-80 rounded-xl flex items-center justify-center bg-gradient-to-r from-primary/10 to-accent/10">
                    <BarChart3 className="text-primary text-6xl opacity-50" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Connected platform services</h2>
            <p className="text-muted-foreground">
              These services use live backend data instead of placeholder market values.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Radio, title: "Live market feeds", text: "Current crypto and Yahoo Finance quotes." },
              { icon: BarChart3, title: "Live charts", text: "Provider-backed price history for supported symbols." },
              { icon: ShieldCheck, title: "Protected activity", text: "Authenticated wallet, trade, and admin data." },
            ].map(({ icon: Icon, title, text }) => (
              <Card key={title} className="glass-card p-8 text-center">
                <CardContent className="p-0">
                  <Icon className="mx-auto mb-4 h-10 w-10 text-primary" />
                  <h3 className="text-xl font-semibold mb-2">{title}</h3>
                  <p className="text-muted-foreground text-sm">{text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
