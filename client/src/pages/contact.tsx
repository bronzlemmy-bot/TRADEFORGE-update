import { motion } from "framer-motion";
import { Phone, MessageCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Contact() {
  return (
    <main className="pt-16">
      <section className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-4 text-5xl font-bold">Contact Us</h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            Our team is here to help with your account, platform access, and trading tools.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="glass-card">
            <CardHeader>
              <Phone className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Call us</CardTitle>
            </CardHeader>
            <CardContent>
              <a className="text-lg font-semibold text-primary hover:underline" href="tel:07038915140">
                07038915140
              </a>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader>
              <MessageCircle className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Support</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Contact us for help with your account or platform experience.
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader>
              <Clock className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Availability</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Support requests are handled during regular business hours.
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
