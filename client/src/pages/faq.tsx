import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const questions = [
  ["Is the market data live?", "Yes. Market prices and charts are loaded from live provider APIs and refreshed with short server-side caching."],
  ["Do I need an account to view public pages?", "No. Contact, Services, FAQ, Home, and About are public. An account is required for protected trading features."],
  ["How do I create an account?", "Choose Get Started, complete the signup form, and verify your email with the code sent to you."],
  ["How can I contact support?", "Call our support number at 07038915140."],
];

export default function FAQ() {
  return (
    <main className="pt-16">
      <section className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-4 text-5xl font-bold">Frequently Asked Questions</h1>
          <p className="text-xl text-muted-foreground">Quick answers about SOG TradePro.</p>
        </motion.div>
        <Accordion type="single" collapsible className="rounded-xl border px-6">
          {questions.map(([question, answer], index) => (
            <AccordionItem key={question} value={`question-${index}`}>
              <AccordionTrigger>{question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </main>
  );
}
