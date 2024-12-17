import { PortMappingsTable } from "@/components/ports/table";
import { AddPortDialog } from "@/components/ports/add-port-dialog";

export default function PortsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Port Mappings</h1>
          <p className="text-muted-foreground">
            Manage your instance port mappings
          </p>
        </div>
        <AddPortDialog />
      </div>
      <PortMappingsTable />
    </div>
  );
}