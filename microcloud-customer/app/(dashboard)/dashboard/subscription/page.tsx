import { SubscriptionDetails } from "@/components/subscription/details";
import { InstanceSpecs } from "@/components/subscription/specs";
import { InstanceLogs } from "@/components/subscription/logs";

export default function SubscriptionPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground">
          View and manage your VPS instance details
        </p>
      </div>
      <div className="grid gap-8">
        <SubscriptionDetails />
        <InstanceSpecs />
        <InstanceLogs />
      </div>
    </div>
  );
}