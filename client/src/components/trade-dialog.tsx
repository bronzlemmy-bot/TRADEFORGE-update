import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function TradeDialog({
  open,
  onOpenChange,
  defaultSymbol = "AAPL",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSymbol?: string;
}) {
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [quantity, setQuantity] = useState("1");
  const { toast } = useToast();

  const buyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/assets/buy", {
        symbol: symbol.trim().toUpperCase(),
        quantity: Number(quantity),
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Order filled",
        description: `Bought ${data.quantity} ${data.quote?.symbol} at $${Number(data.quote?.price || 0).toLocaleString()}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Order failed",
        description: error.message || "Could not place order",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle>Place live market order</DialogTitle>
          <DialogDescription>Buy an asset at its current live market price.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="trade-symbol">Symbol</Label>
            <Input
              id="trade-symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="AAPL, BTC, MSFT"
            />
          </div>
          <div>
            <Label htmlFor="trade-qty">Quantity</Label>
            <Input
              id="trade-qty"
              type="number"
              min="0.0001"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={() => buyMutation.mutate()}
            disabled={buyMutation.isPending || !symbol || Number(quantity) <= 0}
          >
            {buyMutation.isPending ? "Buying..." : "Buy at live price"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
