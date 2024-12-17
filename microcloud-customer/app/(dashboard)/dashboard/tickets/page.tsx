"use client";
import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function TicketsPage() {
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [isTicketResolved, setIsTicketResolved] = useState(false);

    useEffect(() => {
        const userEmail = sessionStorage.getItem("userEmail");
        const fetchTickets = async () => {
            try {
                const response = await fetch("/api/ticket", {
                    headers: {
                        userEmail,
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch tickets");
                }
                const data = await response.json();
                setTickets(data);
                setFilteredTickets(data);
            } catch (error) {
                console.error("Error fetching tickets:", error);
            }
        };

        fetchTickets();
    }, []);

    const handleViewTicket = async (ticket_id) => {
        try {
            const response = await fetch(`/api/ticket-messages?ticket_id=${ticket_id}`);
            if (!response.ok) {
                throw new Error("Failed to fetch ticket messages");
            }
            const data = await response.json();
            setSelectedTicket({
                ticket_id,
                messages: data || [], // Ensure messages is always an array
            });
            setIsTicketResolved(false);
        } catch (error) {
            console.error("Error fetching ticket messages:", error);
            // Set an empty array for messages in case of error
            setSelectedTicket({
                ticket_id,
                messages: [],
            });
        }
    };

    const handleReplyToTicket = async () => {
        const userEmail = sessionStorage.getItem("userEmail");
        const message = {
            ticket_id: selectedTicket.ticket_id,
            message_content: newMessage,
            admin_reply: false,
        };

        try {
            const response = await fetch("/api/ticket", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    userEmail,
                },
                body: JSON.stringify(message),
            });

            if (!response.ok) {
                throw new Error("Failed to send reply");
            }

            const updatedTicket = await response.json();
            setSelectedTicket(prev => ({
                ...prev,
                messages: updatedTicket.messages || []
            }));
            setNewMessage("");
        } catch (error) {
            console.error("Error replying to ticket:", error);
        }
    };

    const handleSendMessage = async () => {
        // After successful API call
        setSelectedTicket(prev => ({
            ...prev,
            messages: [...prev.messages, newMessageObject]
        }));
    };

    const handleResolveTicket = async () => {
        const userEmail = sessionStorage.getItem("userEmail");
        try {
            const response = await fetch(`/api/ticket?ticket_id=${selectedTicket.ticket_id}&resolved=1`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    userEmail,
                },
            });
            if (!response.ok) {
                throw new Error("Failed to resolve ticket");
            }
            setIsTicketResolved(true);
        } catch (error) {
            console.error("Error resolving ticket:", error);
        }
    };

    const handleCreateTicket = async () => {
        const userEmail = sessionStorage.getItem("userEmail");
        try {
            const response = await fetch("/api/create-ticket", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userEmail }),
            });

            if (!response.ok) {
                throw new Error("Failed to create ticket");
            }

            const newTicket = await response.json();
            setTickets((prevTickets) => [...prevTickets, newTicket]);
            alert("Ticket created.");
        } catch (error) {
            console.error("Error creating ticket:", error);
        }
    };

    const totalPages = Math.ceil(filteredTickets.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentTickets = filteredTickets.slice(startIndex, endIndex);

    return (
        <div className="p-6 bg-neutral-900 rounded-lg border border-neutral-800">
            <div className="flex flex-row justify-between items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
                <Button
                    onClick={handleCreateTicket}
                    className="bg-green-500 hover:bg-green-600 text-white"
                >
                    Create Ticket
                </Button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-neutral-800">
                            <th className="px-6 py-3 text-left text-sm font-medium text-neutral-400">Ticket ID</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-neutral-400">Create Date</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-neutral-400">Resolved</th>
                            <th className="px-0 py-3 text-left text-sm font-medium text-neutral-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {currentTickets.map((ticket) => (
                            <tr key={ticket.ticket_id} className="hover:bg-neutral-800/50">
                                <td className="px-6 py-4 text-sm text-white">{ticket.ticket_id}</td>
                                <td className="px-6 py-4 text-sm text-white">
                                    {new Date(ticket.create_date).toLocaleString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </td>
                                <td className="px-6 py-4 text-sm text-white">
                                    {ticket.resolved ? "Yes" : "No"}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <Button
                                        onClick={() => handleViewTicket(ticket.ticket_id)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white"
                                    >
                                        View
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <div className="flex items-center space-x-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                        className="text-neutral-400 hover:text-white"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <span className="text-neutral-400">{currentPage} of {totalPages}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="text-neutral-400 hover:text-white"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Ticket Detail Modal */}
            <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
                <DialogContent className="max-w-2xl bg-neutral-900 border-neutral-800">
                    {selectedTicket && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-white">
                                    Ticket #{selectedTicket.ticket_id}
                                </DialogTitle>
                                <DialogDescription className="text-neutral-400">
                                    View and manage ticket conversation
                                </DialogDescription>
                            </DialogHeader>

                            {/* Conversation Scroll Area */}
                            {/* Conversation Scroll Area */}
                            <div className="max-h-[400px] overflow-y-auto pr-4 border-b border-neutral-800">
                                <div className="space-y-4 pb-4">
                                    {selectedTicket?.messages && selectedTicket.messages.length > 0 ? (
                                        selectedTicket.messages.map((message) => (
                                            <div
                                                key={message.message_id}
                                                className={`p-3 rounded-lg max-w-[80%] ${message.admin_reply
                                                    ? "bg-blue-900/50 ml-auto"
                                                    : "bg-neutral-800 mr-auto"
                                                    }`}
                                            >
                                                <p className="text-white">{message.message_content}</p>
                                                <p className="text-xs text-neutral-400 mt-1">
                                                    {message.admin_reply
                                                        ? "Admin Reply"
                                                        : "Customer Message"
                                                    }
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-neutral-400 text-center py-4">No messages yet</p>
                                    )}
                                </div>
                            </div>

                            {/* Reply Section */}
                            <div className="mt-4 space-y-2">
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your reply..."
                                    className="w-full p-3 bg-neutral-800 text-white border border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                                <div className="flex justify-between">
                                    <Button
                                        onClick={handleReplyToTicket}
                                        disabled={!newMessage.trim()}
                                        className="bg-blue-500 hover:bg-blue-600 text-white"
                                    >
                                        Send Reply
                                    </Button>
                                    {!isTicketResolved && (
                                        <Button
                                            onClick={handleResolveTicket}
                                            className="bg-green-500 hover:bg-green-600 text-white"
                                        >
                                            Mark as Resolved
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
