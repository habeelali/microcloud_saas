import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

export function SubscriptionDetails() {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Instance Details</h2>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">IP Address</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono">192.168.1.1</span>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">SSH Port</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono">22</span>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">SSH Password</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono">••••••••</span>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Plan</p>
            <p className="mt-1">Pro 4GB</p>
          </div>
        </div>
      </div>
    </Card>
  );
}