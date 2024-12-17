import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardCards } from "@/components/dashboard/cards";
import { InstanceMetrics } from "@/components/dashboard/metrics";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <DashboardHeader />
      <DashboardCards />
      <InstanceMetrics />
    </div>
  );
}