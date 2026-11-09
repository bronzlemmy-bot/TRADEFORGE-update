import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { authService } from "@/lib/auth";

interface ChartData {
  time: string;
  value: number;
}

interface ChartWidgetProps {
  data?: ChartData[];
  symbol?: string;
  range?: string;
  title?: string;
  height?: number;
}

export function ChartWidget({ data, symbol = "SPY", range = "1mo", title = "Portfolio Performance", height = 320 }: ChartWidgetProps) {
  const { data: liveData } = useQuery<ChartData[]>({
    queryKey: [`/api/market/chart/${symbol}?range=${range}`],
    enabled: !data && authService.isAuthenticated(),
    staleTime: 60_000,
  });

  const chartData = data || liveData || [];
  const firstValue = chartData[0]?.value || 0;
  const lastValue = chartData[chartData.length - 1]?.value || 0;
  const isGaining = lastValue >= firstValue;
  const changePercent = firstValue ? ((lastValue - firstValue) / firstValue * 100).toFixed(2) : "0.00";

  return (
    <div className="w-full" style={{ height }}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isGaining ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm text-muted-foreground">
            {title} · {isGaining ? 'Up' : 'Down'} {Math.abs(Number(changePercent))}% this period
          </span>
        </div>
      </div>
      {chartData.length === 0 ? (
        <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
          Loading live chart…
        </div>
      ) : (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop 
                offset="5%" 
                stopColor={isGaining ? "#10b981" : "#ef4444"} 
                stopOpacity={0.3}
              />
              <stop 
                offset="95%" 
                stopColor={isGaining ? "#10b981" : "#ef4444"} 
                stopOpacity={0.05}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="time" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            axisLine={false}
            tickLine={false}
            domain={["dataMin", "dataMax"]}
            tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              color: "hsl(var(--foreground))",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            }}
            formatter={(value: number) => [
              `$${value.toLocaleString()}`, 
              symbol
            ]}
            labelStyle={{ color: "hsl(var(--muted-foreground))" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={isGaining ? "#10b981" : "#ef4444"}
            strokeWidth={3}
            fill="url(#portfolioGradient)"
            dot={false}
            activeDot={{ 
              r: 6, 
              fill: isGaining ? "#10b981" : "#ef4444",
              strokeWidth: 2,
              stroke: "white"
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
      )}
    </div>
  );
}
