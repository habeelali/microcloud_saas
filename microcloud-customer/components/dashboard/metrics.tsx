"use client";

import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { time: "00:00", cpu: 45, memory: 60, network: 30 },
  { time: "04:00", cpu: 55, memory: 65, network: 40 },
  { time: "08:00", cpu: 75, memory: 80, network: 65 },
  { time: "12:00", cpu: 85, memory: 85, network: 80 },
  { time: "16:00", cpu: 70, memory: 75, network: 60 },
  { time: "20:00", cpu: 50, memory: 70, network: 45 },
  { time: "24:00", cpu: 40, memory: 65, network: 35 },
];

export function InstanceMetrics() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Instance Metrics</h2>
          <p className="text-sm text-muted-foreground">
            Last 24 hours performance metrics
          </p>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="time" 
                stroke="#666"
                tick={{ fill: "#666" }}
                tickLine={{ stroke: "#666" }}
              />
              <YAxis 
                stroke="#666"
                tick={{ fill: "#666" }}
                tickLine={{ stroke: "#666" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                }}
              />
              <Line
                type="monotone"
                dataKey="cpu"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="memory"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="network"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}