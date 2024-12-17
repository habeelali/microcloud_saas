"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { ViewTicketDialog } from "./view-ticket-dialog";

const tickets = [
  {
    id: "1",
    title: "Cannot access SSH",
    status: "open",
    priority: "high",
    created: "2024-02-28 10:30:00",
    messages: [
      {
        sender: "user",
        message: "I'm unable to connect via SSH. Connection times out.",
        timestamp: "2024-02-28 10:30:00",
      },
      {
        sender: "support",
        message: "Have you checked if port 22 is open in your firewall?",
        timestamp: "2024-02-28 10:35:00",
      },
    ],
  },
  {
    id: "2",
    title: "Billing inquiry",
    status: "closed",
    priority: "medium",
    created: "2024-02-27 15:20:00",
    messages: [
      {
        sender: "user",
        message: "I have a question about my last invoice.",
        timestamp: "2024-02-27 15:20:00",
      },
      {
        sender: "support",
        message: "I'll be happy to help. What's your question?",
        timestamp: "2024-02-27 15:25:00",
      },
    ],
  },
];

export function TicketsList() {
  const [selectedTicket, setSelectedTicket] = useState<typeof tickets[0] | null>(
    null
  );

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <Card key={ticket.id} className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{ticket.title}</h3>
                <Badge
                  variant={ticket.status === "open" ? "default" : "secondary"}
                >
                  {ticket.status}
                </Badge>
                <Badge
                  variant={
                    ticket.priority === "high"
                      ? "destructive"
                      : ticket.priority === "medium"
                      ? "default"
                      : "secondary"
                  }
                >
                  {ticket.priority}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Created on {ticket.created}
              </p>
            </div>
            <Button
              variant="ghost"
              className="gap-2"
              onClick={() => setSelectedTicket(ticket)}
            >
              <MessageSquare className="h-4 w-4" />
              View Conversation
            </Button>
          </div>
        </Card>
      ))}
      {selectedTicket && (
        <ViewTicketDialog
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}