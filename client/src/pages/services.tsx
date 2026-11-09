import { motion } from "framer-motion";
import { BarChart3, Bot, ShieldCheck, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const services = [
  { icon: BarChart3, title: "Live market data", text: "Track live stocks, indexes, ETFs, and cryptocurrency prices." },
  { icon: Bot, title: "Trading tools", text: "Use bots, signals, charts, and market analysis to support your decisions." },
  { icon: Wallet, title: "Portfolio management", text: "Manage holdings, trades, deposits, withdrawals, and wallet balances." },
  { icon: ShieldCheck, title: "Protected accounts", text: "Secure authentication protects your personal trading activity." },
];

export default function Services() {
  return (
    <main className="pt-16">
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        <motion.div
          className="mb-14 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-4 text-5xl font-bold">Our Services</h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            Practical tools and live data for a clearer trading experience.
          </p>
        </motion.div>
        <div className="grid gap-6 sm:grid-cols-2">
          {services.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="glass-card">
              <CardHeader>
                <Icon className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">{text}</CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
