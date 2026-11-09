import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [requested, setRequested] = useState(false);

  const requestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", { email });
      return response.json();
    },
    onSuccess: (data) => {
      setRequested(true);
      toast({ title: "Reset code requested", description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: "Could not request reset code", description: error.message, variant: "destructive" });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/reset-password", { email, code, password });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Password reset", description: "You can now sign in with your new password." });
      navigate("/signin");
    },
    onError: (error: Error) => {
      toast({ title: "Password reset failed", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="pt-16 min-h-screen flex items-center justify-center py-12 px-4">
      <Card className="glass-card w-full max-w-md">
        <CardContent className="space-y-6 p-8">
          <div className="text-center">
            <KeyRound className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h1 className="text-3xl font-bold">Forgot Password</h1>
            <p className="mt-2 text-muted-foreground">Request a code to create a new password.</p>
          </div>
          <Input type="email" autoComplete="email" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Button className="w-full" onClick={() => requestMutation.mutate()} disabled={!email || requestMutation.isPending}>
            {requestMutation.isPending ? "Sending..." : "Send reset code"}
          </Button>
          {requested && (
            <div className="space-y-4 border-t pt-6">
              <Input inputMode="numeric" maxLength={6} placeholder="Six-digit reset code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} />
              <Input type="password" autoComplete="new-password" placeholder="New password (8+ characters)" value={password} onChange={(event) => setPassword(event.target.value)} />
              <Button className="w-full" onClick={() => resetMutation.mutate()} disabled={code.length !== 6 || password.length < 8 || resetMutation.isPending}>
                {resetMutation.isPending ? "Updating..." : "Reset password"}
              </Button>
              <Button variant="link" className="w-full" onClick={() => requestMutation.mutate()} disabled={requestMutation.isPending}>
                Resend reset code
              </Button>
            </div>
          )}
          <Button variant="link" className="w-full" onClick={() => navigate("/signin")}>Back to sign in</Button>
        </CardContent>
      </Card>
    </div>
  );
}
