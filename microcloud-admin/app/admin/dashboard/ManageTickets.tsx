import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, SendHorizontal, MessageSquare, X } from 'lucide-react';

export default function ManageTickets() {
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [isTicketResolved, setIsTicketResolved] = useState(false);
    const [isConversationOpen, setIsConversationOpen] = useState(false);

    useEffect(() => {
        const token = sessionStorage.getItem("authToken");
        const fetchTickets = async () => {
            try {
                const response = await fetch("/api/tickets", {
                    headers: {
                        Authorization: `Bearer ${token}`,
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

    const handleSearch = (event) => {
        const value = event.target.value;
        setSearchTerm(value);
        const filtered = tickets.filter((ticket) =>
            ticket.customer_id.toString().includes(value) ||
            ticket.create_date.includes(value)
        );
        setFilteredTickets(filtered);
        setCurrentPage(1);
    };

    const handleViewTicket = async (ticket_id) => {
        try {
            const response = await fetch(`/api/ticket-messages?ticket_id=${ticket_id}`);
            if (!response.ok) {
                throw new Error("Failed to fetch ticket messages");
            }
            const data = await response.json();
            setSelectedTicket({
                ticket_id,
                messages: data,
            });
            setIsConversationOpen(true);
        } catch (error) {
            console.error("Error fetching ticket messages:", error);
        }
    };

    const handleReplyToTicket = async () => {
        const token = sessionStorage.getItem("authToken");
        const message = {
            ticket_id: selectedTicket.ticket_id,
            message_content: newMessage,
            admin_reply: true,
        };

        try {
            const response = await fetch(`/api/tickets`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(message),
            });

            if (!response.ok) {
                throw new Error("Failed to send reply");
            }

            const updatedTicket = await response.json();
            setSelectedTicket(updatedTicket);
            setNewMessage("");

        } catch (error) {
            console.error("Error replying to ticket:", error);
        }
    };

    const handleResolveTicket = async () => {
        const token = sessionStorage.getItem("authToken");
        try {
            const response = await fetch(`/api/tickets?ticket_id=${selectedTicket.ticket_id}&resolved=1`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
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

    const renderTicketMessages = () => {
        if (!selectedTicket || !selectedTicket.messages) return null;
        return (
            <div className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm
                flex items-center justify-center
                ${isConversationOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
                transition-all duration-300`}>
                <div className={`w-full max-w-2xl bg-neutral-900 rounded-lg border border-neutral-800 shadow-2xl
                    transform transition-all duration-300
                    ${isConversationOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
                    <div className="flex justify-between items-center p-4 border-b border-neutral-800">
                        <h2 className="text-xl font-semibold text-white flex items-center">
                            <MessageSquare className="mr-2 text-neutral-400" />
                            Ticket #{selectedTicket.ticket_id} Conversation
                        </h2>
                        <button
                            onClick={() => setIsConversationOpen(false)}
                            className="text-neutral-400 hover:text-white transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                        {selectedTicket.messages.map((message) => (
                            <div
                                key={message.message_id}
                                className={`p-4 rounded-lg ${message.admin_reply
                                    ? 'bg-blue-900/30 border border-blue-800'
                                    : 'bg-neutral-800 border border-neutral-700'
                                    }`}
                            >
                                <p className="text-white">{message.message_content}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs text-neutral-400">
                                        {message.admin_reply ? "Admin Reply" : "Customer Message"}
                                    </span>
                                    <span className="text-xs text-neutral-500">
                                        {/* {new Date(message.create_date).toLocaleString()} */}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 border-t border-neutral-800">
                        <div className="relative">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your reply..."
                                className="w-full p-4 bg-neutral-800 text-white border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                            />
                            <div className="flex justify-between items-center mt-4">
                                <button
                                    onClick={handleReplyToTicket}
                                    disabled={!newMessage.trim()}
                                    className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:bg-neutral-700 disabled:cursor-not-allowed transition-colors"
                                >
                                    <SendHorizontal className="mr-2 h-4 w-4" />
                                    Send Reply
                                </button>
                                {!isTicketResolved && (
                                    <button
                                        onClick={handleResolveTicket}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Mark as Resolved
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Rest of the component remains the same
    const totalPages = Math.ceil(filteredTickets.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentTickets = filteredTickets.slice(startIndex, endIndex);

    return (
        <div className="p-6 bg-neutral-900 rounded-lg border border-neutral-800">
            {/* Ticket Search */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <div className="relative w-full sm:w-1/3">
                    <input
                        type="text"
                        placeholder="Search by customer ID or date"
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <Search className="absolute right-3 top-2.5 h-5 w-5 text-neutral-400" />
                </div>
            </div>

            {/* Ticket List */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-neutral-800">
                            <th className="px-6 py-3 text-left text-sm font-medium text-neutral-400">Ticket ID</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-neutral-400">Customer ID</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-neutral-400">Create Date</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-neutral-400">Resolved</th>
                            <th className="px-0 py-3 text-left text-sm font-medium text-neutral-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {currentTickets.map((ticket) => (
                            <tr key={ticket.ticket_id} className="hover:bg-neutral-800/50">
                                <td className="px-6 py-4 text-sm text-white">{ticket.ticket_id}</td>
                                <td className="px-6 py-4 text-sm text-white">{ticket.customer_id}</td>
                                <td className="px-6 py-4 text-sm text-white">{new Date(ticket.create_date).toLocaleString()}</td>
                                <td className="px-6 py-4 text-sm text-white">{ticket.resolved ? "Yes" : "No"}</td>
                                <td className="px-0 py-4 text-sm text-white">
                                    <button
                                        onClick={() => handleViewTicket(ticket.ticket_id)}
                                        className="px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded-lg"
                                    >
                                        View Conversation
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Ticket Conversation Modal */}
            {selectedTicket && renderTicketMessages()}

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
                <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-white disabled:text-neutral-600 bg-neutral-800"
                >
                    <ChevronLeft />
                </button>
                <span className="text-white">{`Page ${currentPage} of ${totalPages}`}</span>
                <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg text-white disabled:text-neutral-600 bg-neutral-800"
                >
                    <ChevronRight />
                </button>
            </div>
        </div>
    );
}
