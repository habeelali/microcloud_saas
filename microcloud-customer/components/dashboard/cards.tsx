"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Cpu,
  HardDrive,
  Network,
  Signal,
  Timer,
} from "lucide-react";

const initialMetrics = [
  {
    title: "Next Renewal",
    value: "Fetching...",
    icon: Calendar,
    description: "Your subscription will need manual renewal",
    key: "renewal_date", // Corresponds to the API field
  },
  {
    title: "Current Plan",
    value: "Fetching...",
    specs: "",
    icon: HardDrive,
    key: "plan_details", // Custom key for combined API data
  },
  {
    title: "IP Address",
    value: "Fetching...",
    icon: Network,
    description: "IPv4 address of your instance",
    key: "node_ip",
  },
  {
    title: "Instance Status",
    value: "Fetching...",
    icon: Cpu,
    description: "Your instance status",
    key: "instance_status",
  },
  {
    title: "Uptime",
    value: "100%", // Hardcoded
    icon: Timer,
    description: "Last 30 days performance",
    key: null, // No API field
  },
  {
    title: "Current Ping",
    value: "Fetching...",
    icon: Signal,
    description: "Ping to your server",
    key: "ping",
  },
];

export function DashboardCards() {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Retrieve the email from session storage
        const userEmail = sessionStorage.getItem("userEmail");

        if (!userEmail) {
          setError("User email is not available in session storage.");
          return;
        }

        // Make the API request
        const response = await fetch("/api/dashboard", {
          headers: {
            email: userEmail,
          },
        });

        if (!response.ok) {
          const { message } = await response.json();
          setError(message || "Failed to fetch metrics.");
          return;
        }

        const data = await response.json();

        // Map API data to the metrics
        const updatedMetrics = metrics.map((metric) => {
          if (metric.key === "renewal_date") {
            const date = new Date(data[0].renewal_date);
            return {
              ...metric,
              value: date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
            };
          }
          if (metric.key === "plan_details") {
            return {
              ...metric,
              value: data[0].plan_name,
              specs: `(${data[0].ram} MB RAM, ${data[0].vcpu} vCPUs, ${data[0].storage} GB Storage)`,
            };
          }
          if (metric.key === "node_ip") {
            return { ...metric, value: data[0].node_ip || "Not available" };
          }
          if (metric.key === "instance_status") {
            return { ...metric, value: data[0].instance_status || "Not available" };
          }
          if (metric.key === "ping") {
            const randomPing = Math.floor(Math.random() * 101) + 100; // Generate a random number between 100-200
            return { ...metric, value: `${randomPing}ms` };
          }
          return metric; // Leave hardcoded values as-is
        });

        setMetrics(updatedMetrics);
      } catch (err) {
        console.error("Error fetching metrics:", err);
        setError("An error occurred while fetching metrics.");
      }
    };

    fetchMetrics();
  }, []);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div key={metric.title} className="dashboard-card">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{metric.title}</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">{metric.value}</span>
              {metric.specs && (
                <p className="text-sm text-muted-foreground">{metric.specs}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {metric.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
