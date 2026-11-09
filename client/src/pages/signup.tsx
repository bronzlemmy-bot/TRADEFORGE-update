import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { UserPlus, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { authService } from "@/lib/auth";
import { insertUserSchema } from "@shared/schema";
import type { InsertUser } from "@shared/schema";

const signupFormSchema = insertUserSchema.extend({
  confirmPassword: insertUserSchema.shape.password,
  terms: insertUserSchema.shape.password.optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = InsertUser & {
  confirmPassword: string;
  terms?: string;
};

export default function Signup() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const { toast } = useToast();

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const response = await apiRequest("POST", "/api/auth/signup", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (!data.requiresVerification && data.token) {
        authService.setToken(data.token);
        toast({ title: "Account created", description: "Welcome to SOG TradePro!" });
        navigate("/dashboard");
        return;
      }
      setVerificationEmail(data.email);
      toast({
        title: "Check your email",
        description: "Enter the six-digit code. It expires in 3 minutes.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Signup failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const verificationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/verify-email", {
        email: verificationEmail,
        code: verificationCode,
      });
      return response.json();
    },
    onSuccess: (data) => {
      authService.setToken(data.token);
      toast({ title: "Email verified", description: "Welcome to SOG TradePro!" });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/resend-verification", {
        email: verificationEmail,
      });
      return response.json();
    },
    onSuccess: () => {
      setVerificationCode("");
      toast({ title: "New code sent", description: "The new code expires in 3 minutes." });
    },
    onError: (error: Error) => {
      toast({ title: "Could not resend code", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: SignupFormData) => {
    const { confirmPassword, terms, ...signupData } = data;
    signupMutation.mutate(signupData);
  };

  return (
    <div className="pt-16 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-md w-full space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center">
          <motion.div
            className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-xl mx-auto mb-6 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <UserPlus className="text-white text-2xl" />
          </motion.div>
          <h2 className="text-3xl font-bold mb-2">Create Account</h2>
          <p className="text-muted-foreground">Join thousands of successful traders</p>
        </div>

        <Card className="glass-card">
          <CardContent className="p-8">
            {verificationEmail ? (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  We sent a six-digit code to <strong>{verificationEmail}</strong>.
                </p>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))}
                />
                <Button
                  className="w-full"
                  disabled={verificationMutation.isPending || verificationCode.length !== 6}
                  onClick={() => verificationMutation.mutate()}
                >
                  {verificationMutation.isPending ? "Verifying..." : "Verify email"}
                </Button>
                <Button
                  variant="link"
                  className="w-full"
                  onClick={() => resendMutation.mutate()}
                  disabled={resendMutation.isPending}
                >
                  {resendMutation.isPending ? "Sending..." : "Resend code"}
                </Button>
              </div>
            ) : <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" autoComplete="on">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoComplete="name"
                          placeholder="Enter your full name"
                          className="bg-input border-border"
                          data-testid="input-fullname"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          autoComplete="email"
                          placeholder="Enter your email"
                          className="bg-input border-border"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Create a password"
                            className="bg-input border-border pr-10"
                            data-testid="input-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="toggle-password-visibility"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Confirm your password"
                            className="bg-input border-border pr-10"
                            data-testid="input-confirm-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            data-testid="toggle-confirm-password-visibility"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-start space-x-2">
                  <Checkbox id="terms" data-testid="checkbox-terms" />
                  <label htmlFor="terms" className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    I agree to the{" "}
                    <a href="#" className="text-primary hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={signupMutation.isPending}
                  data-testid="button-submit"
                >
                  {signupMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </Form>}

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-medium text-primary"
                  onClick={() => navigate("/signin")}
                  data-testid="link-signin"
                >
                  Sign in
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
