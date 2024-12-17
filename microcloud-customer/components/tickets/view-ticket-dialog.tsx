"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Send } from "lucide-react";

interface ViewTicketDialogProps {
  ticket: {
    id: string;
    title: string;
    status: string;
    messages: {
      sender: string;
      message: string;
      timestamp: string;
    }[];
  };
  onClose: () => void;
}

export function ViewTicketDialog({ ticket, onClose }: ViewTicketDialogProps) {
  const { toast } = useToast();
  const [reply, setReply] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;

    setIsLoading(true);
    // TODO: Implement actual reply submission
    setTimeout(() => {
      setIsLoading(false);
      setReply("");
      toast({
        title: "Success",
        description: "Your reply has been sent successfully.",
      });
    }, 1000);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{ticket.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {ticket.messages.map((message, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  message.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p>{message.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {ticket.status === "open" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                placeholder="Type your reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                disabled={isLoading}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading} className="gap-2">
                  <Send className="h-4 w-4" />
                  {isLoading ? "Sending..." : "Send Reply"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}