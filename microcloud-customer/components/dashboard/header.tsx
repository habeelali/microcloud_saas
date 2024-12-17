import { Button } from "@/components/ui/button";
import { PowerIcon } from "lucide-react";

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your VPS instance and monitor its performance
        </p>
      </div>
      <Button className="gap-2">
        <PowerIcon className="h-4 w-4" />
        Power On
      </Button>
    </div>
  );
}