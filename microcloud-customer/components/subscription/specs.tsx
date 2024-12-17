import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const specs = [
  {
    name: "CPU Usage",
    current: 45,
    max: 100,
    unit: "%",
  },
  {
    name: "Memory Usage",
    current: 2.1,
    max: 4,
    unit: "GB",
  },
  {
    name: "Storage Usage",
    current: 35,
    max: 80,
    unit: "GB",
  },
  {
    name: "Network Usage",
    current: 150,
    max: 1000,
    unit: "Mbps",
  },
];

export function InstanceSpecs() {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Instance Specifications</h2>
      <div className="space-y-6">
        {specs.map((spec) => (
          <div key={spec.name}>
            <div className="flex justify-between mb-2">
              <span className="text-sm">{spec.name}</span>
              <span className="text-sm text-muted-foreground">
                {spec.current} / {spec.max} {spec.unit}
              </span>
            </div>
            <Progress value={(spec.current / spec.max) * 100} />
          </div>
        ))}
      </div>
    </Card>
  );
}