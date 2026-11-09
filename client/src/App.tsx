import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/navbar";
import { FooterBottom } from "@/components/footer";
import Home from "@/pages/home";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Services from "@/pages/services";
import FAQ from "@/pages/faq";
import Privacy from "@/pages/privacy";
import Signup from "@/pages/signup";
import Signin from "@/pages/signin";
import ForgotPassword from "@/pages/forgot-password";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import BuyBitcoin from "@/pages/buy-bitcoin";
import Bot from "@/pages/bot";
import Signal from "@/pages/signal";
import CopyExpert from "@/pages/copy-expert";
import DepositBitcoin from "@/pages/deposit-bitcoin";
import Withdraw from "@/pages/withdraw";
import MarketAnalysis from "@/pages/market-analysis";
import Assets from "@/pages/assets";
import NotFound from "@/pages/not-found";
import Admin from "@/pages/admin";
import AdminSignin from "@/pages/admin-signin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/services" component={Services} />
      <Route path="/faq" component={FAQ} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/signup" component={Signup} />
      <Route path="/signin" component={Signin} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/profile" component={Profile} />
      <Route path="/dashboard/buy-bitcoin" component={BuyBitcoin} />
      <Route path="/dashboard/bot" component={Bot} />
      <Route path="/dashboard/signal" component={Signal} />
      <Route path="/dashboard/copyexpert" component={CopyExpert} />
      <Route path="/dashboard/deposit-bitcoin" component={DepositBitcoin} />
      <Route path="/dashboard/withdraw" component={Withdraw} />
      <Route path="/market-analysis" component={MarketAnalysis} />
      <Route path="/dashboard/assets" component={Assets} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/signin" component={AdminSignin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Navbar />
          <Router />
          <FooterBottom />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
