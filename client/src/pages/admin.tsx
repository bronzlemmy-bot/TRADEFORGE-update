import { useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LogOut, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { authService } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AdminOverview = {
  users: Array<{ id: string; email: string; fullName: string; role?: string; createdAt?: string; lastLogin?: string }>;
  trades: Array<{ id: string; userEmail: string; symbol: string; action: string; price: number; quantity: number; timestamp: string }>;
  bots: Array<{ id: string; userEmail: string; name: string; strategy: string; status: string; createdAt: string }>;
  deposits: Array<{ id: string; userEmail: string; amount: number; status: string; network: string; createdAt: string }>;
  withdrawals: Array<{ id: string; userEmail: string; amount: number; currency: string; status: string; createdAt: string }>;
  market: Array<{ symbol: string; name: string; price: number; changePercent: number; marketCap: number; volume: number }>;
  stats: { users: number; trades: number; activeUsers: number; bots: number; deposits: number; withdrawals: number };
};

export default function AdminPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data, isLoading, isFetching, error, refetch } = useQuery<AdminOverview>({
    queryKey: ["/api/admin/overview"],
    enabled: authService.isAuthenticated(),
    refetchInterval: 15_000,
    retry: false,
  });
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => apiRequest("DELETE", `/api/admin/users/${encodeURIComponent(userId)}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/overview"] });
      toast({ title: "User deleted", description: "The account and associated data were removed." });
    },
    onError: (deleteError: Error) => {
      toast({ title: "Delete failed", description: deleteError.message, variant: "destructive" });
    },
  });

  useEffect(() => {
      if (!authService.isAuthenticated()) navigate("/admin/signin");
  }, [navigate]);

  if (isLoading) return <div className="container mx-auto p-6 pt-24">Loading administrator dashboard...</div>;
  if (error) return (
    <div className="container mx-auto p-6 pt-24 text-center">
      <p className="text-destructive">{(error as Error).message}</p>
      <Button className="mt-4" onClick={() => navigate("/admin/signin")}>
        Return to administrator sign in
      </Button>
    </div>
  );
  if (!data) return null;
  const bots = data.bots || [];
  const deposits = data.deposits || [];
  const withdrawals = data.withdrawals || [];

  return (
    <main className="container mx-auto p-6 pt-24 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administrator Dashboard</h1>
          <p className="text-muted-foreground">Live users, trades, and cryptocurrency markets.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="admin-refresh"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              authService.removeToken();
              navigate("/admin/signin");
            }}
            data-testid="admin-sign-out"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Card><CardHeader><CardTitle>Registered users</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data.stats.users}</CardContent></Card>
        <Card><CardHeader><CardTitle>Live trades</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data.stats.trades}</CardContent></Card>
        <Card><CardHeader><CardTitle>Active traders</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data.stats.activeUsers}</CardContent></Card>
        <Card><CardHeader><CardTitle>Active bots</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data.stats.bots ?? bots.filter((bot) => bot.status === "active").length}</CardContent></Card>
        <Card><CardHeader><CardTitle>Deposits</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data.stats.deposits ?? deposits.length}</CardContent></Card>
        <Card><CardHeader><CardTitle>Withdrawals</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data.stats.withdrawals ?? withdrawals.length}</CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Live crypto market</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.market.length === 0 ? (
            <p className="text-sm text-muted-foreground">Live market data is temporarily unavailable.</p>
          ) : data.market.map((coin) => (
            <div key={coin.symbol} className="rounded-lg border p-3">
              <div className="flex justify-between"><strong>{coin.symbol}</strong><Badge variant={coin.changePercent >= 0 ? "default" : "destructive"}>{coin.changePercent.toFixed(2)}%</Badge></div>
              <div className="text-lg font-semibold">${coin.price.toLocaleString(undefined, { maximumFractionDigits: 8 })}</div>
              <div className="text-xs text-muted-foreground">{coin.name}</div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Registered accounts</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="text-left"><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Role</th><th className="p-2">Last login</th><th className="p-2">Actions</th></tr></thead>
            <tbody>
              {data.users.length === 0 ? (
                <tr><td className="p-2 text-muted-foreground" colSpan={5}>No registered accounts yet.</td></tr>
              ) : data.users.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="p-2">{user.fullName}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">{user.role || "user"}</td>
                  <td className="p-2">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "—"}</td>
                  <td className="p-2">
                    {user.role === "admin" ? <Badge>Protected</Badge> : (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={deleteUserMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Delete ${user.email} and all associated data? This cannot be undone.`)) {
                            deleteUserMutation.mutate(user.id);
                          }
                        }}
                        data-testid={`admin-delete-user-${user.id}`}
                      >
                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Automation activity</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="text-left"><th className="p-2">Bot</th><th className="p-2">User</th><th className="p-2">Strategy</th><th className="p-2">Status</th></tr></thead>
            <tbody>{bots.length === 0 ? <tr><td className="p-2 text-muted-foreground" colSpan={4}>No bots configured.</td></tr> : bots.map((bot) => (
              <tr key={bot.id} className="border-t"><td className="p-2">{bot.name}</td><td className="p-2">{bot.userEmail}</td><td className="p-2">{bot.strategy}</td><td className="p-2"><Badge variant={bot.status === "active" ? "default" : "secondary"}>{bot.status}</Badge></td></tr>
            ))}</tbody>
          </table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Wallet activity</CardTitle></CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-x-auto"><h3 className="mb-2 font-semibold">Deposits</h3><table className="w-full text-sm"><tbody>{deposits.length === 0 ? <tr><td className="p-2 text-muted-foreground">No deposits.</td></tr> : deposits.map((deposit) => <tr key={deposit.id} className="border-t"><td className="p-2">{deposit.userEmail}</td><td className="p-2">${deposit.amount.toLocaleString()}</td><td className="p-2">{deposit.status}</td></tr>)}</tbody></table></div>
          <div className="overflow-x-auto"><h3 className="mb-2 font-semibold">Withdrawals</h3><table className="w-full text-sm"><tbody>{withdrawals.length === 0 ? <tr><td className="p-2 text-muted-foreground">No withdrawals.</td></tr> : withdrawals.map((withdrawal) => <tr key={withdrawal.id} className="border-t"><td className="p-2">{withdrawal.userEmail}</td><td className="p-2">${withdrawal.amount.toLocaleString()} {withdrawal.currency}</td><td className="p-2">{withdrawal.status}</td></tr>)}</tbody></table></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Live trade activity</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="text-left"><th className="p-2">Time</th><th className="p-2">User</th><th className="p-2">Symbol</th><th className="p-2">Action</th><th className="p-2">Price</th></tr></thead>
            <tbody>
              {data.trades.length === 0 ? (
                <tr><td className="p-2 text-muted-foreground" colSpan={5}>No trades recorded yet.</td></tr>
              ) : data.trades.map((trade) => (
                <tr key={trade.id} className="border-t">
                  <td className="p-2">{new Date(trade.timestamp).toLocaleString()}</td>
                  <td className="p-2">{trade.userEmail}</td>
                  <td className="p-2">{trade.symbol}</td>
                  <td className="p-2">{trade.action}</td>
                  <td className="p-2">${trade.price.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
