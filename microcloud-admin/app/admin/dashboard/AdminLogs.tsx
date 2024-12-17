import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, ChevronDown } from 'lucide-react';

export default function AdminLogs() {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState("ascend");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        const token = sessionStorage.getItem("authToken");
        const fetchLogs = async () => {
            try {
                const response = await fetch("/api/audit-logs", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    throw new Error("Failed to fetch logs");
                }
                const data = await response.json();
                setLogs(data);
                setFilteredLogs(data);
            } catch (error) {
                console.error("Error fetching logs:", error);
            }
        };

        fetchLogs();
    }, []);

    const handleSearch = (event) => {
        const value = event.target.value;
        setSearchTerm(value);
        const filtered = logs.filter((log) =>
            log.log_event.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredLogs(filtered);
        setCurrentPage(1);
    };

    const handleSort = (value) => {
        setSortOrder(value);
        setIsDropdownOpen(false);
        const sorted = [...filteredLogs].sort((a, b) => {
            if (value === "ascend") {
                return new Date(a.log_timestamp) - new Date(b.log_timestamp);
            } else {
                return new Date(b.log_timestamp) - new Date(a.log_timestamp);
            }
        });
        setFilteredLogs(sorted);
    };

    const totalPages = Math.ceil(filteredLogs.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentLogs = filteredLogs.slice(startIndex, endIndex);

    return (
        <div className="p-6 bg-neutral-900 rounded-lg border border-neutral-800">
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                {/* Search Input */}
                <div className="relative w-full sm:w-1/3">
                    <input
                        type="text"
                        placeholder="Search by event"
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg
              text-white placeholder-neutral-400 focus:outline-none focus:ring-2
              focus:ring-red-500 focus:border-transparent"
                    />
                    <Search className="absolute right-3 top-2.5 h-5 w-5 text-neutral-400" />
                </div>

                {/* Sort Dropdown */}
                <div className="relative w-full sm:w-1/3">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg
              text-white flex items-center justify-between hover:bg-neutral-700
              focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        <span>
                            {sortOrder === "ascend"
                                ? "Sort by Timestamp (Ascending)"
                                : "Sort by Timestamp (Descending)"}
                        </span>
                        <ChevronDown className="h-5 w-5" />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute w-full mt-2 bg-neutral-800 border border-neutral-700
              rounded-lg shadow-lg z-10">
                            <button
                                onClick={() => handleSort("ascend")}
                                className="w-full px-4 py-2 text-left text-white hover:bg-neutral-700
                  first:rounded-t-lg"
                            >
                                Sort by Timestamp (Ascending)
                            </button>
                            <button
                                onClick={() => handleSort("descend")}
                                className="w-full px-4 py-2 text-left text-white hover:bg-neutral-700
                  last:rounded-b-lg"
                            >
                                Sort by Timestamp (Descending)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-neutral-800">
                            <th className="px-6 py-3 text-left text-sm font-medium text-neutral-400">Log ID</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-neutral-400">Log Event</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-neutral-400">Admin</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-neutral-400">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {currentLogs.map((log) => (
                            <tr key={log.log_id} className="hover:bg-neutral-800/50">
                                <td className="px-6 py-4 text-sm text-white">{log.log_id}</td>
                                <td className="px-6 py-4 text-sm text-white">{log.log_event}</td>
                                <td className="px-6 py-4 text-sm text-white">{log.log_who}</td>
                                <td className="px-6 py-4 text-sm text-white">
                                    {new Date(log.log_timestamp).toLocaleString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        second: "2-digit",
                                        hour12: true,
                                    })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-400">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} entries
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg text-white disabled:text-neutral-600
              hover:bg-neutral-800 disabled:hover:bg-transparent"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page =>
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                        )
                        .map((page, index, array) => (
                            <React.Fragment key={page}>
                                {index > 0 && array[index - 1] !== page - 1 && (
                                    <span className="text-neutral-400">...</span>
                                )}
                                <button
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium ${currentPage === page
                                        ? "bg-red-500 text-white"
                                        : "text-neutral-400 hover:bg-neutral-800"
                                        }`}
                                >
                                    {page}
                                </button>
                            </React.Fragment>
                        ))}

                    <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg text-white disabled:text-neutral-600
              hover:bg-neutral-800 disabled:hover:bg-transparent"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
