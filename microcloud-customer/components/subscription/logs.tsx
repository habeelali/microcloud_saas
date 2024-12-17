import { Card } from "@/components/ui/card";

const logs = [
  {
    timestamp: "2024-02-28 15:30:45",
    event: "Instance started",
    status: "success",
  },
  {
    timestamp: "2024-02-28 15:30:40",
    event: "System update completed",
    status: "success",
  },
  {
    timestamp: "2024-02-28 15:25:12",
    event: "Backup created",
    status: "success",
  },
  {
    timestamp: "2024-02-28 15:20:00",
    event: "Configuration updated",
    status: "info",
  },
  {
    timestamp: "2024-02-28 15:15:30",
    event: "Instance stopped",
    status: "warning",
  },
];

export function InstanceLogs() {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Instance Logs</h2>
      <div className="space-y-4">
        {logs.map((log, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-2 border-b last:border-0"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-2 h-2 rounded-full ${
                  log.status === "success"
                    ? "bg-green-500"
                    : log.status === "warning"
                    ? "bg-yellow-500"
                    : "bg-blue-500"
                }`}
              />
              <span>{log.event}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {log.timestamp}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}