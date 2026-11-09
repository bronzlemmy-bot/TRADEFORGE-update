import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { authService } from "@/lib/auth";

export default function AdminSignin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const signinMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/signin", { email, password });
      return response.json();
    },
    onSuccess: async (data) => {
      authService.setToken(data.token);
      try {
        await apiRequest("GET", "/api/admin/overview");
        navigate("/admin");
      } catch {
        authService.removeToken();
        toast({
          title: "Administrator access denied",
          description: "This account is not configured as an administrator.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Admin sign in failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <main className="min-h-screen flex items-center justify-center px-4 pt-16">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent">
            <ShieldCheck className="text-white" />
          </div>
          <CardTitle className="text-2xl">Administrator sign in</CardTitle>
          <p className="text-sm text-muted-foreground">
            Use the administrator email and password configured for this app.
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              signinMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="admin-email">Administrator email</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Administrator password</Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button className="w-full" type="submit" disabled={signinMutation.isPending}>
              {signinMutation.isPending ? "Signing in..." : "Sign in as administrator"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
